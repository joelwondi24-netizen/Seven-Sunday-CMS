import React, { useMemo, useState } from 'react';
import { BookOpen, Download, Plus, Printer, Wallet } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { JournalEntry, PaymentVoucher } from '../../types/erp';
import { downloadCsv } from '../../utils/exportUtils';

export const FinanceAccountingView: React.FC = () => {
  const { state, currentUser, mutate } = useErp();
  const [tab, setTab] = useState<'vouchers' | 'ledger' | 'statements' | 'budgets'>('vouchers');

  const [vForm, setVForm] = useState({
    type: 'Payment Voucher' as PaymentVoucher['type'],
    partyName: '',
    accountId: 'acc_1020',
    category: 'Operations',
    amount: 0,
    paymentMethod: 'Bank Transfer' as PaymentVoucher['paymentMethod'],
    referenceNo: '',
    description: '',
  });

  const [jeForm, setJeForm] = useState({
    description: '',
    debitAccountId: 'acc_5300',
    creditAccountId: 'acc_1020',
    amount: 0,
  });

  const ledgerSummary = useMemo(() => {
    if (!state) return null;
    const totals = new Map<string, { debit: number; credit: number }>();
    for (const acc of state.financeAccounts) {
      totals.set(acc.id, { debit: 0, credit: 0 });
    }
    for (const je of state.journalEntries) {
      for (const line of je.lines) {
        const cur = totals.get(line.accountId) || { debit: 0, credit: 0 };
        cur.debit += line.debit;
        cur.credit += line.credit;
        totals.set(line.accountId, cur);
      }
    }

    const trialBalance = state.financeAccounts.map((acc) => {
      const t = totals.get(acc.id) || { debit: 0, credit: 0 };
      return { ...acc, debit: t.debit, credit: t.credit, net: t.debit - t.credit };
    });

    const totalRevenue = trialBalance.filter((a) => a.type === 'Revenue').reduce((s, a) => s + (a.credit - a.debit), 0);
    const totalExpense = trialBalance.filter((a) => a.type === 'Expense').reduce((s, a) => s + (a.debit - a.credit), 0);
    const totalAssets = trialBalance.filter((a) => a.type === 'Asset').reduce((s, a) => s + (a.debit - a.credit), 0);
    const totalLiabilities = trialBalance.filter((a) => a.type === 'Liability').reduce((s, a) => s + (a.credit - a.debit), 0);

    return { trialBalance, totalRevenue, totalExpense, netIncome: totalRevenue - totalExpense, totalAssets, totalLiabilities };
  }, [state]);

  if (!state || !ledgerSummary) return null;

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const acc = state.financeAccounts.find((a) => a.id === vForm.accountId) ?? state.financeAccounts[0];
    const id = `pv_${Date.now()}`;
    const prefix = vForm.type === 'Receipt Voucher' ? 'RV' : vForm.type === 'Petty Cash' ? 'PC' : 'PV';
    const rec: PaymentVoucher = {
      id,
      voucherNumber: `${prefix}-2026-${String(state.paymentVouchers.length + 1).padStart(4, '0')}`,
      type: vForm.type,
      partyName: vForm.partyName,
      accountId: acc.id,
      accountName: acc.name,
      category: vForm.category,
      amount: Number(vForm.amount),
      currency: state.companySettings.defaultCurrency,
      paymentMethod: vForm.paymentMethod,
      referenceNo: vForm.referenceNo,
      description: vForm.description,
      date: new Date().toISOString().slice(0, 10),
      status: 'Posted',
      approvedBy: currentUser?.fullName,
      version: 1,
    };
    await mutate('paymentVouchers', 'create', id, rec);
    setVForm({ ...vForm, partyName: '', amount: 0, referenceNo: '', description: '' });
  };

  const handleManualJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const dr = state.financeAccounts.find((a) => a.id === jeForm.debitAccountId);
    const cr = state.financeAccounts.find((a) => a.id === jeForm.creditAccountId);
    if (!dr || !cr || jeForm.amount <= 0) return;
    const id = `je_${Date.now()}`;
    const rec: JournalEntry = {
      id,
      entryNumber: `JE-2026-${String(state.journalEntries.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      description: jeForm.description,
      lines: [
        { accountId: dr.id, accountCode: dr.code, accountName: dr.name, debit: Number(jeForm.amount), credit: 0 },
        { accountId: cr.id, accountCode: cr.code, accountName: cr.name, debit: 0, credit: Number(jeForm.amount) },
      ],
      totalDebit: Number(jeForm.amount),
      totalCredit: Number(jeForm.amount),
      createdBy: currentUser?.fullName || 'Accountant',
      version: 1,
    };
    await mutate('journalEntries', 'create', id, rec);
    setJeForm({ ...jeForm, description: '', amount: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Finance & Double-Entry Accounting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cash & Bank vouchers, automated double-entry journal ledger, Trial Balance, P&L, and Balance Sheet ({state.companySettings.defaultCurrency})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <button type="button" onClick={() => setTab('vouchers')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'vouchers' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Vouchers</button>
            <button type="button" onClick={() => setTab('ledger')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'ledger' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Journal Ledger</button>
            <button type="button" onClick={() => setTab('statements')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'statements' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Financial Statements</button>
            <button type="button" onClick={() => setTab('budgets')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'budgets' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Budgets</button>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs cursor-pointer">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {tab === 'vouchers' && (
        <div className="space-y-5">
          <form onSubmit={handleCreateVoucher} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs no-print">
            <select value={vForm.type} onChange={(e) => setVForm({ ...vForm, type: e.target.value as PaymentVoucher['type'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Payment Voucher">Payment Voucher (Expense)</option>
              <option value="Receipt Voucher">Receipt Voucher (Income)</option>
              <option value="Petty Cash">Petty Cash Disbursement</option>
            </select>
            <input type="text" required placeholder="Payee / Payer Name *" value={vForm.partyName} onChange={(e) => setVForm({ ...vForm, partyName: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <select value={vForm.accountId} onChange={(e) => setVForm({ ...vForm, accountId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              {state.financeAccounts.filter((a) => a.isBankOrCash).map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
            </select>
            <input type="number" min={1} required placeholder="Amount (ETB)" value={vForm.amount || ''} onChange={(e) => setVForm({ ...vForm, amount: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <select value={vForm.paymentMethod} onChange={(e) => setVForm({ ...vForm, paymentMethod: e.target.value as PaymentVoucher['paymentMethod'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Telebirr / Mobile">Telebirr / Mobile</option>
            </select>
            <input type="text" placeholder="Bank / Cheque Ref #" value={vForm.referenceNo} onChange={(e) => setVForm({ ...vForm, referenceNo: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <input type="text" required placeholder="Description *" value={vForm.description} onChange={(e) => setVForm({ ...vForm, description: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <button type="submit" className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-[#1178B9] text-white font-medium cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Post Voucher & Ledger
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Voucher #</th>
                  <th className="px-4 py-3 font-semibold">Type & Party</th>
                  <th className="px-4 py-3 font-semibold">Account & Method</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.paymentVouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{v.voucherNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{v.type}: {v.partyName}</div>
                      <div className="text-slate-500">{v.description}</div>
                    </td>
                    <td className="px-4 py-3">{v.accountName} ({v.paymentMethod})</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${v.type === 'Receipt Voucher' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {v.type === 'Receipt Voucher' ? '+' : '-'}{v.amount.toLocaleString()} {v.currency}
                    </td>
                    <td className="px-4 py-3 font-mono">{v.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="space-y-5">
          <form onSubmit={handleManualJournal} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs no-print">
            <input type="text" required placeholder="Journal Description *" value={jeForm.description} onChange={(e) => setJeForm({ ...jeForm, description: e.target.value })} className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <select value={jeForm.debitAccountId} onChange={(e) => setJeForm({ ...jeForm, debitAccountId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              {state.financeAccounts.map((a) => <option key={a.id} value={a.id}>DR: {a.code} {a.name}</option>)}
            </select>
            <select value={jeForm.creditAccountId} onChange={(e) => setJeForm({ ...jeForm, creditAccountId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              {state.financeAccounts.map((a) => <option key={a.id} value={a.id}>CR: {a.code} {a.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="number" min={1} required placeholder="Amount" value={jeForm.amount || ''} onChange={(e) => setJeForm({ ...jeForm, amount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
              <button type="submit" className="px-3 py-2 rounded-lg bg-[#082B59] text-white font-medium whitespace-nowrap cursor-pointer">Post JE</button>
            </div>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Entry #</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Double-Entry Lines</th>
                  <th className="px-4 py-3 font-semibold text-right">Balanced Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.journalEntries.map((je) => (
                  <tr key={je.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{je.entryNumber}<div className="text-[11px] text-slate-400">{je.date}</div></td>
                    <td className="px-4 py-3">{je.description}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {je.lines.map((l, idx) => (
                        <div key={idx}>
                          {l.accountCode} {l.accountName}: {l.debit > 0 ? `DR ${l.debit.toLocaleString()}` : `CR ${l.credit.toLocaleString()}`}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{je.totalDebit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'statements' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs text-slate-500">Total P&L Revenue</div>
              <div className="mt-1 text-xl font-bold font-mono text-emerald-600">{ledgerSummary.totalRevenue.toLocaleString()} ETB</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs text-slate-500">Total P&L Expenses</div>
              <div className="mt-1 text-xl font-bold font-mono text-red-600">{ledgerSummary.totalExpense.toLocaleString()} ETB</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs text-slate-500">Net Income</div>
              <div className="mt-1 text-xl font-bold font-mono text-[#082B59] dark:text-[#087CEB]">{ledgerSummary.netIncome.toLocaleString()} ETB</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-xs text-slate-500">Net Assets (Balance Sheet)</div>
              <div className="mt-1 text-xl font-bold font-mono">{(ledgerSummary.totalAssets - ledgerSummary.totalLiabilities).toLocaleString()} ETB</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#087CEB]" /> Trial Balance</span>
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    'seven-sunday-trial-balance',
                    ['Code', 'Account', 'Type', 'Debit', 'Credit'],
                    ledgerSummary.trialBalance.map((a) => [a.code, a.name, a.type, a.debit, a.credit])
                  )
                }
                className="inline-flex items-center gap-1 text-xs text-[#087CEB] hover:underline no-print cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Trial Balance
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Code</th>
                  <th className="px-4 py-2.5 font-semibold">Account Title</th>
                  <th className="px-4 py-2.5 font-semibold">Class</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Debit</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {ledgerSummary.trialBalance.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2.5">{a.code}</td>
                    <td className="px-4 py-2.5 font-sans font-medium">{a.name}</td>
                    <td className="px-4 py-2.5 font-sans">{a.type}</td>
                    <td className="px-4 py-2.5 text-right">{a.debit.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">{a.credit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'budgets' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold">
            <Wallet className="w-4 h-4 text-[#087CEB]" /> Departmental Operating Budgets (2026)
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold text-right">Allocated (ETB)</th>
                <th className="px-4 py-3 font-semibold text-right">Spent (ETB)</th>
                <th className="px-4 py-3 font-semibold text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.budgets.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-semibold">{b.department}</td>
                  <td className="px-4 py-3 text-right font-mono">{b.allocatedAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{b.spentAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600">{(b.allocatedAmount - b.spentAmount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
