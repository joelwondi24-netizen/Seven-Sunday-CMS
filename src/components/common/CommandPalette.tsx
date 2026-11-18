import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Command,
  CornerDownLeft,
  CreditCard,
  FileText,
  Globe,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  MonitorDown,
  Moon,
  Package,
  RefreshCw,
  Search,
  Shield,
  Shirt,
  ShoppingCart,
  Sun,
  Truck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { LanguageCode, ModuleKey } from '../../types/erp';
import { LANGUAGE_LABELS, tUi } from '../../utils/i18n';

export interface CommandPaletteTarget {
  module: ModuleKey;
  employeeId?: string;
  docId?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (target: CommandPaletteTarget) => void;
  onOpenWindowsSetup: () => void;
}

type CategoryFilter = 'all' | 'modules' | 'documents' | 'employees' | 'operations' | 'actions';

interface PaletteItem {
  id: string;
  category: Exclude<CategoryFilter, 'all'>;
  title: string;
  subtitle: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

const MODULE_META: Array<{
  key: ModuleKey;
  englishName: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'dashboard', englishName: 'Executive Dashboard', keywords: 'overview kpi charts home summary', icon: LayoutDashboard },
  { key: 'admin', englishName: 'Company Administration', keywords: 'settings branding users roles branches departments smtp', icon: Building2 },
  { key: 'hr', englishName: 'Human Resources & Staff', keywords: 'employees staff id card qr profile directory', icon: Users },
  { key: 'secretary', englishName: 'Secretary Department', keywords: 'correspondence memos minutes registry incoming outgoing', icon: Briefcase },
  { key: 'documents', englishName: 'Official Documents & Templates', keywords: 'letters contracts invoices vouchers amharic oromiffa chinese print', icon: FileText },
  { key: 'attendance', englishName: 'Attendance & Time Tracking', keywords: 'hikvision zkteco csv biometric shift overtime late', icon: Clock },
  { key: 'leave', englishName: 'Leave Management', keywords: 'annual sick holiday vacation request balance', icon: CalendarDays },
  { key: 'payroll', englishName: 'Payroll & Ethiopian Tax', keywords: 'salary payslip pension income tax bonus overtime', icon: CreditCard },
  { key: 'inventory', englishName: 'Inventory & Warehouses', keywords: 'stock sku product barcode warehouse store', icon: Package },
  { key: 'materials', englishName: 'Materials, Issues & Audits', keywords: 'grn gin material request transfer damage audit', icon: ClipboardCheck },
  { key: 'purchasing', englishName: 'Procurement & Suppliers', keywords: 'purchase order po vendor supplier quotation', icon: ShoppingCart },
  { key: 'sales', englishName: 'Sales, Invoices & CRM', keywords: 'customer invoice quotation delivery note revenue', icon: Truck },
  { key: 'finance', englishName: 'Finance & Double-Entry Accounting', keywords: 'ledger journal payment voucher receipt cash bank budget', icon: Landmark },
  { key: 'assets', englishName: 'Uniforms, PPE & Staff Assets', keywords: 'uniform boots helmet laptop phone equipment issue', icon: Shirt },
  { key: 'fleet', englishName: 'Vehicles, Fuel & Maintenance', keywords: 'fleet car truck fuel odometer service insurance', icon: Car },
  { key: 'chat', englishName: 'Internal Staff Chat', keywords: 'messaging channels announcements direct chat', icon: MessageSquare },
  { key: 'approvals', englishName: 'Approvals Queue', keywords: 'pending approve reject workflow', icon: CheckSquare },
  { key: 'audit', englishName: 'Security & Audit Trail', keywords: 'logs compliance security immutable history', icon: Shield },
  { key: 'sync', englishName: 'Sync, Local DB & Windows Setup', keywords: 'offline indexeddb backup restore json windows exe desktop', icon: RefreshCw },
  { key: 'reports', englishName: 'Corporate Analytics & Reports', keywords: 'export csv pdf analytics executive reports', icon: LayoutDashboard },
];

const CATEGORY_TABS: Array<{ key: CategoryFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'modules', label: 'Modules' },
  { key: 'documents', label: 'Documents' },
  { key: 'employees', label: 'Employees' },
  { key: 'operations', label: 'Operations' },
  { key: 'actions', label: 'Actions' },
];

const CATEGORY_LABELS: Record<Exclude<CategoryFilter, 'all'>, string> = {
  modules: 'Modules',
  documents: 'Documents & Correspondence',
  employees: 'Employee Records',
  operations: 'Invoices, Orders & Inventory',
  actions: 'Quick Actions & Desktop Setup',
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenWindowsSetup,
}) => {
  const {
    state,
    isOnline,
    language,
    darkMode,
    canAccessModule,
    setLanguage,
    toggleDarkMode,
    syncNow,
  } = useErp();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCategory('all');
      setActiveIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const allItems = useMemo<PaletteItem[]>(() => {
    if (!state) return [];
    const items: PaletteItem[] = [];

    // 1. Permitted Modules
    for (const mod of MODULE_META) {
      if (!canAccessModule(mod.key)) continue;
      const localized = tUi(language, mod.key);
      items.push({
        id: `mod:${mod.key}`,
        category: 'modules',
        title: localized !== mod.key ? localized : mod.englishName,
        subtitle: `Module · ${mod.englishName}`,
        keywords: `${mod.key} ${mod.englishName} ${localized} ${mod.keywords}`,
        icon: mod.icon,
        onSelect: () => {
          onNavigate({ module: mod.key });
          onClose();
        },
      });
    }

    // 2. Official Documents (opens preview directly)
    if (canAccessModule('documents')) {
      for (const doc of state.officialDocuments) {
        items.push({
          id: `doc:${doc.id}`,
          category: 'documents',
          title: `${doc.docNumber} · ${doc.title || doc.templateType}`,
          subtitle: `${doc.templateType} · ${doc.recipientName} · ${doc.department} · ${doc.date}`,
          keywords: `${doc.docNumber} ${doc.templateType} ${doc.title} ${doc.recipientName} ${doc.department} ${doc.subject} ${doc.language}`,
          icon: FileText,
          onSelect: () => {
            onNavigate({ module: 'documents', docId: doc.id });
            onClose();
          },
        });
      }
    }

    // 3. Secretary Correspondence Entries
    if (canAccessModule('secretary')) {
      for (const entry of state.secretaryEntries) {
        items.push({
          id: `sec:${entry.id}`,
          category: 'documents',
          title: `${entry.refNumber} · ${entry.subject}`,
          subtitle: `${entry.direction} · ${entry.counterparty || 'Internal'} · ${entry.status} · ${entry.date}`,
          keywords: `${entry.refNumber} ${entry.subject} ${entry.counterparty} ${entry.department} ${entry.direction} ${entry.summary}`,
          icon: Briefcase,
          onSelect: () => {
            onNavigate({ module: 'secretary' });
            onClose();
          },
        });
      }
    }

    // 4. Employee Records (navigates and focuses employee)
    if (canAccessModule('hr')) {
      for (const emp of state.employees) {
        items.push({
          id: `emp:${emp.id}`,
          category: 'employees',
          title: emp.fullName,
          subtitle: `${emp.employeeCode} · ${emp.jobTitle} · ${emp.department} · ${emp.status}`,
          keywords: `${emp.fullName} ${emp.employeeCode} ${emp.jobTitle} ${emp.department} ${emp.phone} ${emp.email} ${emp.status}`,
          icon: UserCheck,
          onSelect: () => {
            onNavigate({ module: 'hr', employeeId: emp.id });
            onClose();
          },
        });
      }
    }

    // 5. Operations: Sales Invoices, Purchase Orders, Products, Vouchers
    if (canAccessModule('sales')) {
      for (const inv of state.salesInvoices) {
        items.push({
          id: `inv:${inv.id}`,
          category: 'operations',
          title: `${inv.invoiceNumber} · ${inv.customerName}`,
          subtitle: `${inv.type} · ${inv.totalAmount.toLocaleString()} ${state.companySettings.defaultCurrency} · ${inv.status}`,
          keywords: `${inv.invoiceNumber} ${inv.customerName} ${inv.type} ${inv.status}`,
          icon: Truck,
          onSelect: () => {
            onNavigate({ module: 'sales' });
            onClose();
          },
        });
      }
    }

    if (canAccessModule('purchasing')) {
      for (const po of state.purchaseOrders) {
        items.push({
          id: `po:${po.id}`,
          category: 'operations',
          title: `${po.poNumber} · ${po.supplierName}`,
          subtitle: `Purchase Order · ${po.totalAmount.toLocaleString()} ${state.companySettings.defaultCurrency} · ${po.status}`,
          keywords: `${po.poNumber} ${po.supplierName} purchase order ${po.status}`,
          icon: ShoppingCart,
          onSelect: () => {
            onNavigate({ module: 'purchasing' });
            onClose();
          },
        });
      }
    }

    if (canAccessModule('inventory')) {
      for (const prod of state.products) {
        items.push({
          id: `prod:${prod.id}`,
          category: 'operations',
          title: `${prod.name} (${prod.itemCode})`,
          subtitle: `${prod.category} · ${prod.quantity} ${prod.unit} · ${prod.warehouseName}`,
          keywords: `${prod.name} ${prod.itemCode} ${prod.barcode} ${prod.category} ${prod.warehouseName}`,
          icon: Package,
          onSelect: () => {
            onNavigate({ module: 'inventory' });
            onClose();
          },
        });
      }
    }

    if (canAccessModule('finance')) {
      for (const v of state.paymentVouchers) {
        items.push({
          id: `pv:${v.id}`,
          category: 'operations',
          title: `${v.voucherNumber} · ${v.partyName}`,
          subtitle: `${v.type} · ${v.amount.toLocaleString()} ${v.currency} · ${v.status}`,
          keywords: `${v.voucherNumber} ${v.partyName} ${v.type} ${v.description}`,
          icon: Landmark,
          onSelect: () => {
            onNavigate({ module: 'finance' });
            onClose();
          },
        });
      }
    }

    // 6. Quick Actions
    items.push({
      id: 'act:windows-exe',
      category: 'actions',
      title: 'Windows Desktop App (.exe) & Setup Kit',
      subtitle: 'Download Windows Electron NSIS .exe setup project & install desktop app',
      keywords: 'windows exe setup installer electron desktop download app',
      icon: MonitorDown,
      onSelect: () => {
        onClose();
        onOpenWindowsSetup();
      },
    });

    items.push({
      id: 'act:sync',
      category: 'actions',
      title: isOnline ? 'Synchronize Offline Queue Now' : 'Open Offline Sync & Backup Center',
      subtitle: 'Push pending IndexedDB mutations and check real-time WebSocket status',
      keywords: 'sync synchronize offline localdb backup export',
      icon: RefreshCw,
      onSelect: () => {
        if (isOnline) {
          void syncNow();
        } else {
          onNavigate({ module: 'sync' });
        }
        onClose();
      },
    });

    items.push({
      id: 'act:theme',
      category: 'actions',
      title: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle workspace visual theme immediately',
      keywords: 'theme dark light mode appearance',
      icon: darkMode ? Sun : Moon,
      onSelect: () => {
        toggleDarkMode();
        onClose();
      },
    });

    for (const [code, label] of Object.entries(LANGUAGE_LABELS)) {
      items.push({
        id: `act:lang:${code}`,
        category: 'actions',
        title: `Switch Language to ${label}`,
        subtitle: 'Change interface & document composer language',
        keywords: `language translate ${label} ${code}`,
        icon: Globe,
        onSelect: () => {
          setLanguage(code as LanguageCode);
          onClose();
        },
      });
    }

    return items;
  }, [
    canAccessModule,
    darkMode,
    isOnline,
    language,
    onClose,
    onNavigate,
    onOpenWindowsSetup,
    setLanguage,
    state,
    syncNow,
    toggleDarkMode,
  ]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = category === 'all' ? allItems : allItems.filter((i) => i.category === category);

    if (!q) {
      if (category !== 'all') return scoped.slice(0, 24);
      // Balanced initial discovery across categories
      const mods = scoped.filter((i) => i.category === 'modules').slice(0, 6);
      const docs = scoped.filter((i) => i.category === 'documents').slice(0, 5);
      const emps = scoped.filter((i) => i.category === 'employees').slice(0, 5);
      const ops = scoped.filter((i) => i.category === 'operations').slice(0, 3);
      const acts = scoped.filter((i) => i.category === 'actions').slice(0, 4);
      return [...mods, ...docs, ...emps, ...ops, ...acts];
    }

    const terms = q.split(/\s+/).filter(Boolean);
    const scored: Array<{ item: PaletteItem; score: number }> = [];

    for (const item of scoped) {
      const titleLower = item.title.toLowerCase();
      const subLower = item.subtitle.toLowerCase();
      const hay = `${titleLower} ${subLower} ${item.keywords.toLowerCase()}`;
      if (!terms.every((t) => hay.includes(t))) continue;

      let score = 0;
      if (titleLower === q) score += 100;
      else if (titleLower.startsWith(q)) score += 60;
      else if (titleLower.includes(q)) score += 35;
      else if (subLower.includes(q)) score += 20;
      else score += 10;

      if (item.category === 'modules') score += 5;
      scored.push({ item, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 30).map((s) => s.item);
  }, [allItems, category, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, category]);

  useEffect(() => {
    if (!isOpen) return;
    const activeEl = listRef.current?.querySelector<HTMLElement>(`[data-palette-idx="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredItems[activeIndex];
      if (target) target.onSelect();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Group filteredItems cleanly preserving flat index order for keyboard navigation
  const groupedOrder: Array<Exclude<CategoryFilter, 'all'>> = [
    'modules',
    'documents',
    'employees',
    'operations',
    'actions',
  ];

  let flatCounter = 0;
  const sections = groupedOrder
    .map((cat) => {
      const catItems = filteredItems.filter((i) => i.category === cat);
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        items: catItems.map((item) => ({ item, idx: flatCounter++ })),
      };
    })
    .filter((sec) => sec.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#082B59]/45 dark:bg-black/70 backdrop-blur-[2px] p-4 pt-[10vh] no-print"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[76vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-[#087CEB] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, documents, employee records, invoices, or actions..."
            className="flex-1 bg-transparent text-sm text-[#15243A] dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1.5 py-0.5 cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 bg-[#F5F8FC] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCategory(tab.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                category === tab.key
                  ? 'bg-[#082B59] text-white dark:bg-[#087CEB]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
          {sections.length === 0 ? (
            <div className="py-14 px-6 text-center space-y-2">
              <div className="text-sm font-semibold text-[#15243A] dark:text-white">
                No matching records found
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try searching by module name, SSE-EMP employee ID, official document number, or customer/supplier name.
              </p>
            </div>
          ) : (
            sections.map((sec) => (
              <div key={sec.category} className="py-1.5">
                <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>{sec.label}</span>
                  <span className="font-mono tabular-nums text-[10px]">{sec.items.length}</span>
                </div>
                {sec.items.map(({ item, idx }) => {
                  const Icon = item.icon;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-palette-idx={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={item.onSelect}
                      className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#EAF4FF] dark:bg-[#087CEB]/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            isActive
                              ? 'bg-[#082B59] text-white border-[#082B59] dark:bg-[#087CEB] dark:border-[#087CEB]'
                              : 'bg-[#F5F8FC] dark:bg-slate-800 text-[#082B59] dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#15243A] dark:text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                          isActive ? 'text-[#087CEB] opacity-100' : 'text-slate-400 opacity-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Keyboard Footer */}
        <div className="px-4 py-2.5 bg-[#F5F8FC] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px]">
                <CornerDownLeft className="w-2.5 h-2.5 inline" />
              </kbd>
              Open
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px]">Esc</kbd>
              Close
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
            <Command className="w-3 h-3" />
            <span>{filteredItems.length} results</span>
          </div>
        </div>
      </div>
    </div>
  );
};
