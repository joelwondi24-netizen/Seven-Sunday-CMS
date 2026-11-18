import fs from 'node:fs';
import path from 'node:path';
import type {
  CollectionName,
  ErpDatabaseState,
  RoleDefinition,
  SyncConflict,
  SyncMutation,
  UserAccount,
} from '../src/types/erp.ts';
import { buildDemoDataset, createInitialDatabaseState } from './seed.ts';

const DATA_DIR = process.env.SSE_DATA_DIR
  ? path.resolve(process.env.SSE_DATA_DIR)
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'erp-db.json');

interface InternalStore {
  state: ErpDatabaseState;
  processedTxIds: string[];
}

export class ErpStore {
  private data: InternalStore;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as InternalStore;
        if (parsed && parsed.state) {
          this.data = parsed;
          return;
        }
      } catch {
        // Fallback to initial baseline if corrupt
      }
    }
    this.data = {
      state: createInitialDatabaseState(),
      processedTxIds: [],
    };
    this.persist();
  }

  private persist(): void {
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  }

  public getRawState(): ErpDatabaseState {
    return this.data.state;
  }

  public getUserRole(user: UserAccount): RoleDefinition | undefined {
    return this.data.state.roles.find((r) => r.id === user.roleId) ?? this.data.state.roles.find((r) => r.name === user.roleName);
  }

  public getSanitizedStateForUser(user: UserAccount): ErpDatabaseState {
    const role = this.getUserRole(user);
    const canViewSalaryBank = role?.canViewSalaryBank ?? false;
    const canViewAudit = role?.modules.includes('audit') ?? false;
    const canViewPayroll = role?.modules.includes('payroll') ?? false;

    const cloned: ErpDatabaseState = JSON.parse(JSON.stringify(this.data.state));

    // Never expose password hashes to clients
    cloned.users = cloned.users.map((u) => {
      const copy = { ...u };
      delete copy.passwordHash;
      return copy;
    });

    // Enforce RBAC field-level protection for restricted bank & salary data
    if (!canViewSalaryBank) {
      cloned.employees = cloned.employees.map((emp) => ({
        ...emp,
        basicSalary: 0,
        transportAllowance: 0,
        housingAllowance: 0,
        bankName: 'Restricted',
        bankAccountNumber: 'Restricted',
      }));
    }

    if (!canViewPayroll) {
      cloned.payrollRuns = [];
      cloned.bonuses = [];
    }

    if (!canViewAudit) {
      cloned.auditLogs = [];
    }

    return cloned;
  }

  public applyMutation(mutation: SyncMutation): {
    status: 'applied' | 'duplicate' | 'conflict' | 'rejected';
    conflict?: SyncConflict;
    reason?: string;
  } {
    if (this.data.processedTxIds.includes(mutation.txId)) {
      return { status: 'duplicate' };
    }

    const actor = this.data.state.users.find((u) => u.id === mutation.actorId);
    const actorRole = actor ? this.getUserRole(actor) : undefined;

    // Immutable audit logs protection: never edit or delete audit logs
    if (mutation.collection === 'auditLogs' && mutation.operation !== 'create') {
      return { status: 'rejected', reason: 'Audit logs are immutable and cannot be edited or deleted.' };
    }

    // RBAC checks on sensitive operations
    if (mutation.collection === 'stockTransactions' && mutation.operation === 'create') {
      const tx = mutation.payload as { type?: string };
      if (tx?.type === 'Adjustment' && actorRole && !actorRole.canAdjustStock) {
        return { status: 'rejected', reason: 'Unauthorized stock adjustment blocked by RBAC.' };
      }
    }

    const now = new Date().toISOString();

    if (mutation.collection === 'companySettings') {
      const incoming = mutation.payload as ErpDatabaseState['companySettings'];
      const current = this.data.state.companySettings;
      if (
        typeof mutation.baseVersion === 'number' &&
        current.version > mutation.baseVersion
      ) {
        return {
          status: 'conflict',
          conflict: {
            id: `conf_${mutation.txId}`,
            txId: mutation.txId,
            collection: 'companySettings',
            recordId: 'company_settings',
            localPayload: incoming,
            serverPayload: current,
            detectedAt: now,
            reason: `Server version (${current.version}) is newer than offline base version (${mutation.baseVersion}).`,
          },
        };
      }
      this.data.state.companySettings = {
        ...current,
        ...incoming,
        version: current.version + 1,
        updatedAt: now,
      };
    } else if (mutation.collection === 'payrollConfig') {
      const incoming = mutation.payload as ErpDatabaseState['payrollConfig'];
      const current = this.data.state.payrollConfig;
      this.data.state.payrollConfig = {
        ...current,
        ...incoming,
        version: current.version + 1,
      };
    } else {
      const colName = mutation.collection as CollectionName;
      const list = this.data.state[colName] as Array<{ id: string; version?: number }> | undefined;
      if (!Array.isArray(list)) {
        return { status: 'rejected', reason: `Unknown collection: ${mutation.collection}` };
      }

      if (mutation.operation === 'create') {
        const record = { ...(mutation.payload as Record<string, unknown>), id: mutation.recordId } as {
          id: string;
          version?: number;
        };
        if (typeof record.version !== 'number') record.version = 1;

        // If user record created with plain password field, hash it server-side (handled in server route or fallback here)
        const existingIdx = list.findIndex((item) => item.id === mutation.recordId);
        if (existingIdx === -1) {
          list.unshift(record);
          this.handleSideEffects(colName, 'create', record, mutation.actorName, now);
        }
      } else if (mutation.operation === 'update') {
        const idx = list.findIndex((item) => item.id === mutation.recordId);
        if (idx === -1) {
          const record = { ...(mutation.payload as Record<string, unknown>), id: mutation.recordId, version: 1 };
          list.unshift(record);
        } else {
          const current = list[idx];
          const currentVer = typeof current.version === 'number' ? current.version : 1;
          if (typeof mutation.baseVersion === 'number' && currentVer > mutation.baseVersion) {
            return {
              status: 'conflict',
              conflict: {
                id: `conf_${mutation.txId}`,
                txId: mutation.txId,
                collection: colName,
                recordId: mutation.recordId,
                localPayload: mutation.payload,
                serverPayload: current,
                detectedAt: now,
                reason: `Record updated on server (v${currentVer}) since offline edit (v${mutation.baseVersion}).`,
              },
            };
          }
          const updated = {
            ...current,
            ...(mutation.payload as Record<string, unknown>),
            version: currentVer + 1,
          };
          list[idx] = updated;
          this.handleSideEffects(colName, 'update', updated, mutation.actorName, now);
        }
      } else if (mutation.operation === 'delete') {
        const idx = list.findIndex((item) => item.id === mutation.recordId);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
      }
    }

    // Record immutable audit trail
    if (mutation.collection !== 'chatMessages' && mutation.collection !== 'notifications') {
      this.data.state.auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: mutation.actorId,
        username: mutation.actorName,
        roleName: mutation.actorRole,
        module: mutation.collection,
        action: `${mutation.operation.toUpperCase()} ${mutation.recordId}`,
        entityId: mutation.recordId,
        newValue: JSON.stringify(mutation.payload).slice(0, 240),
        deviceInfo: mutation.deviceInfo,
        timestamp: now,
      });
      if (this.data.state.auditLogs.length > 1000) {
        this.data.state.auditLogs = this.data.state.auditLogs.slice(0, 1000);
      }
    }

    this.data.processedTxIds.push(mutation.txId);
    if (this.data.processedTxIds.length > 5000) {
      this.data.processedTxIds = this.data.processedTxIds.slice(-3000);
    }
    this.data.state.lastUpdatedAt = now;
    this.persist();

    return { status: 'applied' };
  }

  private handleSideEffects(
    colName: CollectionName,
    op: 'create' | 'update',
    record: Record<string, unknown>,
    actorName: string,
    now: string
  ): void {
    // 1. Stock transaction updates product stock automatically
    if (colName === 'stockTransactions' && op === 'create') {
      const tx = record as {
        type?: string;
        productId?: string;
        quantity?: number;
        docNumber?: string;
        productName?: string;
      };
      const prod = this.data.state.products.find((p) => p.id === tx.productId);
      if (prod && typeof tx.quantity === 'number') {
        if (tx.type === 'GRN' || tx.type === 'Return') {
          prod.quantity += tx.quantity;
        } else if (tx.type === 'GIN' || tx.type === 'Damage') {
          prod.quantity = Math.max(0, prod.quantity - tx.quantity);
        } else if (tx.type === 'Audit' || tx.type === 'Adjustment') {
          prod.quantity = Math.max(0, tx.quantity);
        }
        prod.status =
          prod.quantity <= 0 ? 'Out of Stock' : prod.quantity <= prod.minStockLevel ? 'Low Stock' : 'Active';
        prod.version += 1;
        prod.updatedAt = now;

        if (prod.quantity <= prod.minStockLevel) {
          this.data.state.notifications.unshift({
            id: `notif_low_${Date.now()}`,
            title: 'Low Stock Alert',
            message: `${prod.name} (${prod.itemCode}) is at ${prod.quantity} ${prod.unit}.`,
            module: 'inventory',
            severity: 'warning',
            readBy: [],
            createdAt: now,
          });
        }
      }
    }

    // 2. Sales invoice deducts stock & creates double-entry AR/Revenue journal on Confirmed/Paid
    if (colName === 'salesInvoices' && op === 'create') {
      const inv = record as {
        type?: string;
        invoiceNumber?: string;
        customerName?: string;
        totalAmount?: number;
        status?: string;
        items?: Array<{ productId: string; quantity: number }>;
      };
      if (inv.type === 'Invoice' && Array.isArray(inv.items)) {
        for (const line of inv.items) {
          const prod = this.data.state.products.find((p) => p.id === line.productId);
          if (prod) {
            prod.quantity = Math.max(0, prod.quantity - line.quantity);
            prod.status =
              prod.quantity <= 0 ? 'Out of Stock' : prod.quantity <= prod.minStockLevel ? 'Low Stock' : 'Active';
            prod.version += 1;
          }
        }
        if (typeof inv.totalAmount === 'number' && inv.totalAmount > 0) {
          this.data.state.journalEntries.unshift({
            id: `je_inv_${Date.now()}`,
            entryNumber: `JE-${Date.now().toString().slice(-6)}`,
            date: now.slice(0, 10),
            description: `Sales Invoice ${inv.invoiceNumber} — ${inv.customerName}`,
            referenceDoc: inv.invoiceNumber,
            lines: [
              { accountId: 'acc_1200', accountCode: '1200', accountName: 'Accounts Receivable', debit: inv.totalAmount, credit: 0 },
              { accountId: 'acc_4000', accountCode: '4000', accountName: 'Manufacturing & Trading Revenue', debit: 0, credit: inv.totalAmount },
            ],
            totalDebit: inv.totalAmount,
            totalCredit: inv.totalAmount,
            createdBy: actorName,
            version: 1,
          });
        }
      }
    }

    // 3. Payment / Receipt Vouchers post double-entry journal when Posted
    if (colName === 'paymentVouchers' && (op === 'create' || op === 'update')) {
      const pv = record as {
        id: string;
        voucherNumber?: string;
        type?: string;
        partyName?: string;
        accountId?: string;
        accountName?: string;
        amount?: number;
        status?: string;
      };
      const alreadyPosted = this.data.state.journalEntries.some((j) => j.referenceDoc === pv.voucherNumber);
      if (pv.status === 'Posted' && !alreadyPosted && typeof pv.amount === 'number' && pv.amount > 0) {
        const isReceipt = pv.type === 'Receipt Voucher';
        this.data.state.journalEntries.unshift({
          id: `je_pv_${Date.now()}`,
          entryNumber: `JE-${Date.now().toString().slice(-6)}`,
          date: now.slice(0, 10),
          description: `${pv.type} ${pv.voucherNumber} (${pv.partyName})`,
          referenceDoc: pv.voucherNumber,
          lines: isReceipt
            ? [
                { accountId: pv.accountId || 'acc_1020', accountCode: '1020', accountName: pv.accountName || 'Bank', debit: pv.amount, credit: 0 },
                { accountId: 'acc_4000', accountCode: '4000', accountName: 'Manufacturing & Trading Revenue', debit: 0, credit: pv.amount },
              ]
            : [
                { accountId: 'acc_5300', accountCode: '5300', accountName: 'Administrative & Office Expense', debit: pv.amount, credit: 0 },
                { accountId: pv.accountId || 'acc_1020', accountCode: '1020', accountName: pv.accountName || 'Bank', debit: 0, credit: pv.amount },
              ],
          totalDebit: pv.amount,
          totalCredit: pv.amount,
          createdBy: actorName,
          version: 1,
        });
      }
    }

    // 4. Payroll Paid creates Payroll Expense Journal Entry
    if (colName === 'payrollRuns' && op === 'update') {
      const pr = record as { id: string; month?: string; status?: string; totalGross?: number };
      const ref = `PAY-${pr.month}`;
      const alreadyPosted = this.data.state.journalEntries.some((j) => j.referenceDoc === ref);
      if (pr.status === 'Paid' && !alreadyPosted && typeof pr.totalGross === 'number' && pr.totalGross > 0) {
        this.data.state.journalEntries.unshift({
          id: `je_pay_${Date.now()}`,
          entryNumber: `JE-${Date.now().toString().slice(-6)}`,
          date: now.slice(0, 10),
          description: `Monthly Payroll Settlement (${pr.month})`,
          referenceDoc: ref,
          lines: [
            { accountId: 'acc_5100', accountCode: '5100', accountName: 'Salaries & Payroll Expense', debit: pr.totalGross, credit: 0 },
            { accountId: 'acc_1020', accountCode: '1020', accountName: 'Commercial Bank of Ethiopia - Operating', debit: 0, credit: pr.totalGross },
          ],
          totalDebit: pr.totalGross,
          totalCredit: pr.totalGross,
          createdBy: actorName,
          version: 1,
        });
      }
    }
  }

  public loadDemoData(): ErpDatabaseState {
    const now = new Date().toISOString();
    const demo = buildDemoDataset(now);
    const mergeUnique = <T extends { id: string }>(existing: T[], incoming?: T[]): T[] => {
      if (!incoming) return existing;
      const ids = new Set(existing.map((x) => x.id));
      return [...existing, ...incoming.filter((x) => !ids.has(x.id))];
    };

    this.data.state.employees = mergeUnique(this.data.state.employees, demo.employees);
    this.data.state.products = mergeUnique(this.data.state.products, demo.products);
    this.data.state.attendance = mergeUnique(this.data.state.attendance, demo.attendance);
    this.data.state.suppliers = mergeUnique(this.data.state.suppliers, demo.suppliers);
    this.data.state.customers = mergeUnique(this.data.state.customers, demo.customers);
    this.data.state.salesInvoices = mergeUnique(this.data.state.salesInvoices, demo.salesInvoices);
    this.data.state.purchaseOrders = mergeUnique(this.data.state.purchaseOrders, demo.purchaseOrders);
    this.data.state.paymentVouchers = mergeUnique(this.data.state.paymentVouchers, demo.paymentVouchers);
    this.data.state.vehicles = mergeUnique(this.data.state.vehicles, demo.vehicles);
    this.data.state.uniformAssets = mergeUnique(this.data.state.uniformAssets, demo.uniformAssets);
    this.data.state.secretaryEntries = mergeUnique(this.data.state.secretaryEntries, demo.secretaryEntries);
    this.data.state.leaves = mergeUnique(this.data.state.leaves, demo.leaves);
    this.data.state.materialRequests = mergeUnique(this.data.state.materialRequests, demo.materialRequests);
    this.data.state.lastUpdatedAt = now;
    this.persist();
    return this.data.state;
  }

  public clearDemoData(): ErpDatabaseState {
    const filterDemo = <T extends { isDemo?: boolean }>(arr: T[]): T[] => arr.filter((x) => !x.isDemo);
    this.data.state.employees = filterDemo(this.data.state.employees);
    this.data.state.employeeEvents = filterDemo(this.data.state.employeeEvents);
    this.data.state.attendance = filterDemo(this.data.state.attendance);
    this.data.state.leaves = filterDemo(this.data.state.leaves);
    this.data.state.payrollRuns = filterDemo(this.data.state.payrollRuns);
    this.data.state.bonuses = filterDemo(this.data.state.bonuses);
    this.data.state.products = filterDemo(this.data.state.products);
    this.data.state.stockTransactions = filterDemo(this.data.state.stockTransactions);
    this.data.state.materialRequests = filterDemo(this.data.state.materialRequests);
    this.data.state.suppliers = filterDemo(this.data.state.suppliers);
    this.data.state.purchaseOrders = filterDemo(this.data.state.purchaseOrders);
    this.data.state.customers = filterDemo(this.data.state.customers);
    this.data.state.salesInvoices = filterDemo(this.data.state.salesInvoices);
    this.data.state.journalEntries = filterDemo(this.data.state.journalEntries);
    this.data.state.paymentVouchers = filterDemo(this.data.state.paymentVouchers);
    this.data.state.uniformAssets = filterDemo(this.data.state.uniformAssets);
    this.data.state.vehicles = filterDemo(this.data.state.vehicles);
    this.data.state.vehicleLogs = filterDemo(this.data.state.vehicleLogs);
    this.data.state.secretaryEntries = filterDemo(this.data.state.secretaryEntries);
    this.data.state.officialDocuments = filterDemo(this.data.state.officialDocuments);
    this.data.state.lastUpdatedAt = new Date().toISOString();
    this.persist();
    return this.data.state;
  }

  public restoreBackup(backupState: ErpDatabaseState): void {
    this.data.state = {
      ...backupState,
      lastUpdatedAt: new Date().toISOString(),
    };
    this.persist();
  }

  public saveRaw(): void {
    this.persist();
  }
}
