import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  Download,
  FileText,
  Package,
  Printer,
  Users,
  Wallet,
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { ModuleKey } from '../../types/erp';
import { formatCorporateDate } from '../../utils/ethiopianCalendar';
import { downloadCsv } from '../../utils/exportUtils';

interface DashboardViewProps {
  onNavigate: (mod: ModuleKey) => void;
}

const CHART_COLORS = ['#082B59', '#087CEB', '#1178B9', '#16A34A', '#D97706', '#64748B'];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { state, currentUser, currentRole, language, loadDemoData } = useErp();
  const [deptFilter, setDeptFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const metrics = useMemo(() => {
    if (!state) return null;

    const employees =
      deptFilter === 'All'
        ? state.employees
        : state.employees.filter((e) => e.department === deptFilter);

    const activeEmployees = employees.filter((e) => e.status === 'Active').length;
    const onLeaveEmployees = employees.filter((e) => e.status === 'On Leave').length;

    const today = new Date().toISOString().slice(0, 10);
    const attToday = state.attendance.filter(
      (a) => a.date === today && (deptFilter === 'All' || a.department === deptFilter)
    );
    const presentToday = attToday.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const absentToday = Math.max(0, activeEmployees - presentToday);

    const inRange = (d: string) => {
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    };

    const totalRevenue =
      state.salesInvoices
        .filter((i) => i.type === 'Invoice' && inRange(i.date))
        .reduce((sum, i) => sum + i.totalAmount, 0) +
      state.paymentVouchers
        .filter((v) => v.type === 'Receipt Voucher' && v.status === 'Posted' && inRange(v.date))
        .reduce((sum, v) => sum + v.amount, 0);

    const totalExpenses =
      state.paymentVouchers
        .filter((v) => (v.type === 'Payment Voucher' || v.type === 'Petty Cash') && v.status === 'Posted' && inRange(v.date))
        .reduce((sum, v) => sum + v.amount, 0) +
      state.vehicleLogs.filter((l) => inRange(l.date)).reduce((sum, l) => sum + l.costEtb, 0);

    const latestPayroll = state.payrollRuns[0];
    const monthlyPayroll = latestPayroll
      ? latestPayroll.totalGross
      : employees.reduce((sum, e) => sum + (e.basicSalary || 0) + (e.transportAllowance || 0) + (e.housingAllowance || 0), 0);

    const totalInventoryValue = state.products.reduce((sum, p) => sum + p.quantity * p.purchasePrice, 0);
    const lowStockProducts = state.products.filter((p) => p.quantity <= p.minStockLevel);
    const pendingPOs = state.purchaseOrders.filter((p) => p.status === 'Pending Approval' || p.status === 'Draft').length;
    const materialsReceived = state.stockTransactions.filter((t) => t.type === 'GRN').reduce((s, t) => s + t.quantity, 0);
    const materialsIssued = state.stockTransactions.filter((t) => t.type === 'GIN').reduce((s, t) => s + t.quantity, 0);
    const outstandingPayments = state.salesInvoices.reduce((sum, i) => sum + Math.max(0, i.totalAmount - i.paidAmount), 0);

    const pendingApprovals =
      state.leaves.filter((l) => l.status === 'Pending').length +
      state.materialRequests.filter((m) => m.status === 'Pending').length +
      state.purchaseOrders.filter((p) => p.status === 'Pending Approval').length +
      state.attendanceCorrections.filter((c) => c.status === 'Pending').length;

    const unreadMessages = state.chatMessages.filter(
      (m) => currentUser && !m.readBy.includes(currentUser.id)
    ).length;

    const deptChartData = state.departments.map((d) => {
      const deptEmps = state.employees.filter((e) => e.department === d.name);
      const deptAtt = attToday.filter((a) => a.department === d.name && (a.status === 'Present' || a.status === 'Late')).length;
      return {
        name: d.code,
        fullName: d.name,
        employees: deptEmps.length,
        present: deptAtt,
        budgetK: Math.round(d.budgetEtb / 1000),
      };
    });

    const financeChartData = [
      { label: 'Sales & Receipts', revenue: totalRevenue, expense: 0 },
      { label: 'Operating & Fleet', revenue: 0, expense: totalExpenses },
      { label: 'Est. Payroll', revenue: 0, expense: monthlyPayroll },
      { label: 'Net Position', revenue: Math.max(0, totalRevenue - totalExpenses), expense: Math.max(0, totalExpenses - totalRevenue) },
    ];

    const stockByCategory = ['Finished Product', 'Raw Material', 'Construction Material', 'Office Supply', 'Production Material'].map(
      (cat) => ({
        name: cat.replace(' Material', '').replace(' Product', ''),
        value: state.products
          .filter((p) => p.category === cat)
          .reduce((s, p) => s + p.quantity * p.purchasePrice, 0),
      })
    ).filter((x) => x.value > 0);

    return {
      totalEmployees: employees.length,
      activeEmployees,
      onLeaveEmployees,
      presentToday,
      absentToday,
      monthlyPayroll,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalInventoryValue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      pendingPOs,
      materialsReceived,
      materialsIssued,
      salesInvoicesCount: state.salesInvoices.length,
      outstandingPayments,
      pendingApprovals,
      unreadMessages,
      deptChartData,
      financeChartData,
      stockByCategory,
    };
  }, [currentUser, dateFrom, dateTo, deptFilter, state]);

  if (!state || !metrics) return null;

  const currency = state.companySettings.defaultCurrency || 'ETB';
  const hasAnyOperationalRecords =
    state.employees.length > 0 || state.products.length > 0 || state.salesInvoices.length > 0;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white tracking-tight">
            Corporate Operations Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {state.companySettings.companyName} · {formatCorporateDate(new Date(), state.companySettings.calendarSystem, language)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#15243A] dark:text-slate-200"
          >
            <option value="All">All Departments</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#15243A] dark:text-slate-200"
            aria-label="Filter from date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#15243A] dark:text-slate-200"
            aria-label="Filter to date"
          />
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                `seven-sunday-dashboard-${new Date().toISOString().slice(0, 10)}`,
                ['Metric', 'Value', 'Unit'],
                [
                  ['Total Employees', metrics.totalEmployees, 'Staff'],
                  ['Active Employees', metrics.activeEmployees, 'Staff'],
                  ['Present Today', metrics.presentToday, 'Staff'],
                  ['Monthly Payroll', metrics.monthlyPayroll, currency],
                  ['Total Revenue', metrics.totalRevenue, currency],
                  ['Total Expenses', metrics.totalExpenses, currency],
                  ['Net Profit', metrics.netProfit, currency],
                  ['Inventory Value', metrics.totalInventoryValue, currency],
                  ['Outstanding Receivables', metrics.outstandingPayments, currency],
                ]
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#15243A] dark:text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Summary
          </button>
        </div>
      </div>

      {/* Onboarding Empty State Prompt if DB has no sample/real operational records yet */}
      {!hasAnyOperationalRecords && (
        <div className="rounded-xl border border-[#087CEB]/30 bg-[#EAF4FF] dark:bg-[#082B59]/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#082B59] dark:text-white">
              Clean Production Database Active
            </h2>
            <p className="text-xs text-[#293858] dark:text-slate-300 mt-1">
              No demonstration records are loaded by default. Register real company employees, products, and transactions directly, or load clearly marked optional sample data to test workflows.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentRole?.canManageUsers && (
              <button
                type="button"
                onClick={() => void loadDemoData()}
                className="px-3.5 py-2 rounded-lg bg-[#082B59] hover:bg-[#087CEB] text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Load Optional Sample Data
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('hr')}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#15243A] dark:text-white hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              Add First Employee
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Workforce & Attendance</span>
            <Users className="w-4 h-4 text-[#087CEB]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#15243A] dark:text-white font-mono tabular-nums">
            {metrics.activeEmployees} <span className="text-sm font-normal text-slate-500">/ {metrics.totalEmployees}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Present: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{metrics.presentToday}</strong></span>
            <span>·</span>
            <span>Absent: <strong className="font-mono">{metrics.absentToday}</strong></span>
            <span>·</span>
            <span>Leave: <strong className="font-mono">{metrics.onLeaveEmployees}</strong></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Revenue & Profit ({currency})</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#15243A] dark:text-white font-mono tabular-nums">
            {metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Exp: <strong className="font-mono">{metrics.totalExpenses.toLocaleString()}</strong></span>
            <span>·</span>
            <span>Profit: <strong className={`font-mono ${metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{metrics.netProfit.toLocaleString()}</strong></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Inventory Valuation ({currency})</span>
            <Package className="w-4 h-4 text-[#1178B9]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#15243A] dark:text-white font-mono tabular-nums">
            {metrics.totalInventoryValue.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Low Stock: <strong className="text-amber-600 font-mono">{metrics.lowStockCount}</strong></span>
            <span>·</span>
            <span>In: <strong className="font-mono">{metrics.materialsReceived}</strong></span>
            <span>·</span>
            <span>Out: <strong className="font-mono">{metrics.materialsIssued}</strong></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Payroll & Pending Actions</span>
            <FileText className="w-4 h-4 text-[#082B59] dark:text-[#087CEB]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#15243A] dark:text-white font-mono tabular-nums">
            {currentRole?.canViewSalaryBank ? metrics.monthlyPayroll.toLocaleString() : 'Protected'}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Approvals: <strong className="text-[#087CEB] font-mono">{metrics.pendingApprovals}</strong></span>
            <span>·</span>
            <span>POs: <strong className="font-mono">{metrics.pendingPOs}</strong></span>
            <span>·</span>
            <span>Msgs: <strong className="font-mono">{metrics.unreadMessages}</strong></span>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="text-xs font-semibold text-[#293858] dark:text-slate-200">
          Quick Corporate Workflows
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Register Attendance', mod: 'attendance' as ModuleKey },
            { label: 'Goods Receiving (GRN)', mod: 'materials' as ModuleKey },
            { label: 'Create Sales Invoice', mod: 'sales' as ModuleKey },
            { label: 'Generate Official Letter', mod: 'documents' as ModuleKey },
            { label: 'Process Payroll', mod: 'payroll' as ModuleKey },
            { label: 'Review Approvals', mod: 'approvals' as ModuleKey },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => onNavigate(btn.mod)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F5F8FC] dark:bg-slate-800 hover:bg-[#EAF4FF] dark:hover:bg-slate-700 text-xs font-medium text-[#082B59] dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <span>{btn.label}</span>
              <ArrowUpRight className="w-3 h-3 text-[#087CEB]" />
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#15243A] dark:text-white">
                Financial Performance Overview ({currency})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Computed directly from Invoices, Posted Vouchers, Fleet Logs, and Payroll Runs
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.financeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="Inflow / Revenue" fill="#087CEB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Outflow / Expense" fill="#082B59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-[#15243A] dark:text-white">
            Inventory Value by Category
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Active stock valuation breakdown
          </p>
          <div className="h-64">
            {metrics.stockByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.stockByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {metrics.stockByCategory.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Add inventory items to visualize stock distribution
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Attendance & Low Stock / Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-[#15243A] dark:text-white mb-1">
            Department Staffing & Today Attendance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Headcount vs checked-in staff across corporate departments
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.deptChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="employees" name="Registered Staff" stroke="#082B59" strokeWidth={2} />
                <Line type="monotone" dataKey="present" name="Present Today" stroke="#087CEB" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#15243A] dark:text-white">
              Operational Alerts & Outstanding Receivables
            </h3>
            <span className="text-xs font-mono text-slate-500">
              AR: {metrics.outstandingPayments.toLocaleString()} {currency}
            </span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {metrics.lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-[#15243A] dark:text-white">{p.name}</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {p.itemCode} · {p.warehouseName}
                    </p>
                  </div>
                </div>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                  {p.quantity} / {p.minStockLevel} {p.unit}
                </span>
              </div>
            ))}

            {state.notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-[#F5F8FC] dark:bg-slate-800/40 text-xs"
              >
                <div className="flex items-center justify-between font-medium text-[#15243A] dark:text-white">
                  <span>{n.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{n.createdAt.slice(0, 10)}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
