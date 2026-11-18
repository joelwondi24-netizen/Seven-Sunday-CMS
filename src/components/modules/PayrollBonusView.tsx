import React, { useState } from 'react';
import { CheckCircle2, Download, Plus, Printer, Settings, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { BonusRecord, PayrollConfig, PayrollRun, PayslipItem } from '../../types/erp';
import { calculateEmployeePayslip } from '../../utils/payrollCalc';
import { downloadCsv } from '../../utils/exportUtils';
import { SevenSundayLogo } from '../common/SevenSundayLogo';

export const PayrollBonusView: React.FC = () => {
  const { state, currentUser, currentRole, mutate } = useErp();
  const [tab, setTab] = useState<'payroll' | 'bonuses' | 'rules'>('payroll');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipItem | null>(null);

  const [bonusForm, setBonusForm] = useState({
    employeeId: '',
    type: 'Performance' as BonusRecord['type'],
    amount: 2500,
    reason: '',
  });

  const [configForm, setConfigForm] = useState<PayrollConfig | undefined>(() => state?.payrollConfig);

  if (!state) return null;

  const handleGeneratePayrollRun = async () => {
    const activeEmps = state.employees.filter((e) => e.status === 'Active');
    if (activeEmps.length === 0) return;

    const items: PayslipItem[] = activeEmps.map((emp) => {
      const otHours = state.attendance
        .filter((a) => a.employeeId === emp.id && a.date.startsWith(month))
        .reduce((s, a) => s + a.overtimeHours, 0);
      const bonusSum = state.bonuses
        .filter((b) => b.employeeId === emp.id && b.month === month && b.status !== 'Pending')
        .reduce((s, b) => s + b.amount, 0);
      return calculateEmployeePayslip(emp, state.payrollConfig, {
        overtimeHours: otHours,
        bonus: bonusSum,
      });
    });

    const id = `pay_${Date.now()}`;
    const run: PayrollRun = {
      id,
      month,
      status: 'Draft',
      totalGross: items.reduce((s, i) => s + i.grossPay, 0),
      totalTax: items.reduce((s, i) => s + i.incomeTax, 0),
      totalPension: items.reduce((s, i) => s + i.employeePension + i.employerPension, 0),
      totalNet: items.reduce((s, i) => s + i.netPay, 0),
      items,
      createdAt: new Date().toISOString(),
      version: 1,
    };

    await mutate('payrollRuns', 'create', id, run);
    setSelectedRun(run);
  };

  const advanceRunStatus = async (run: PayrollRun, nextStatus: PayrollRun['status']) => {
    const patch: Partial<PayrollRun> = { status: nextStatus };
    if (nextStatus === 'HR Verified') patch.hrVerifiedBy = currentUser?.fullName;
    if (nextStatus === 'Finance Reviewed') patch.financeReviewedBy = currentUser?.fullName;
    if (nextStatus === 'Approved') patch.approvedBy = currentUser?.fullName;
    if (nextStatus === 'Paid') patch.paidAt = new Date().toISOString();
    await mutate('payrollRuns', 'update', run.id, patch, run.version);
    setSelectedRun({ ...run, ...patch });
  };

  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = state.employees.find((x) => x.id === bonusForm.employeeId) ?? state.employees[0];
    if (!emp) return;
    const id = `bon_${Date.now()}`;
    const rec: BonusRecord = {
      id,
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      month,
      type: bonusForm.type,
      amount: Number(bonusForm.amount),
      reason: bonusForm.reason,
      status: 'Approved',
      version: 1,
    };
    await mutate('bonuses', 'create', id, rec);
    setBonusForm({ ...bonusForm, reason: '' });
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configForm) return;
    await mutate('payrollConfig', 'update', 'payroll_config', configForm, state.payrollConfig.version);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Payroll, Tax, Pension & Bonus Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configurable Ethiopian tax & pension rules, multi-step approval workflow, and printable payslips
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <button type="button" onClick={() => setTab('payroll')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'payroll' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
              Payroll Runs
            </button>
            <button type="button" onClick={() => setTab('bonuses')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'bonuses' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
              Bonuses & Incentives
            </button>
            <button type="button" onClick={() => setTab('rules')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'rules' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
              Tax & Pension Rules
            </button>
          </div>
        </div>
      </div>

      {tab === 'payroll' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Payroll Month:</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
              <button
                type="button"
                disabled={state.employees.length === 0}
                onClick={() => void handleGeneratePayrollRun()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Calculate Monthly Payroll
              </button>
            </div>
            {selectedRun && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      `payroll-${selectedRun.month}`,
                      ['Code', 'Name', 'Department', 'Basic', 'Allowances', 'OT', 'Bonus', 'Gross', 'Tax', 'Emp Pension', 'Net Pay'],
                      selectedRun.items.map((i) => [i.employeeCode, i.employeeName, i.department, i.basicSalary, i.allowances, i.overtimePay, i.bonus, i.grossPay, i.incomeTax, i.employeePension, i.netPay])
                    )
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Excel/CSV
                </button>
                <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#082B59] text-white text-xs cursor-pointer">
                  <Printer className="w-3.5 h-3.5" /> Print Bulk Payroll
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 no-print">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Archived & Active Runs</h3>
              {state.payrollRuns.map((run) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRun?.id === run.id
                      ? 'border-[#087CEB] bg-[#EAF4FF] dark:bg-[#082B59]/40'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="font-mono">{run.month}</span>
                    <span className="text-[#087CEB]">{run.status}</span>
                  </div>
                  <div className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-300">
                    Net: {run.totalNet.toLocaleString()} ETB · {run.items.length} staff
                  </div>
                </div>
              ))}
              {state.payrollRuns.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">No payroll runs calculated yet.</p>
              )}
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              {selectedRun ? (
                <div>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 no-print">
                    <div className="text-xs">
                      <span className="font-bold text-sm">{selectedRun.month} Payroll</span> · Status: <strong>{selectedRun.status}</strong>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {selectedRun.status === 'Draft' && (
                        <button type="button" onClick={() => void advanceRunStatus(selectedRun, 'HR Verified')} className="px-3 py-1 rounded bg-[#1178B9] text-white cursor-pointer">
                          1. HR Verify
                        </button>
                      )}
                      {selectedRun.status === 'HR Verified' && (
                        <button type="button" onClick={() => void advanceRunStatus(selectedRun, 'Finance Reviewed')} className="px-3 py-1 rounded bg-[#1178B9] text-white cursor-pointer">
                          2. Finance Review
                        </button>
                      )}
                      {selectedRun.status === 'Finance Reviewed' && currentRole?.canApprove && (
                        <button type="button" onClick={() => void advanceRunStatus(selectedRun, 'Approved')} className="px-3 py-1 rounded bg-emerald-600 text-white cursor-pointer">
                          3. Management Approve
                        </button>
                      )}
                      {selectedRun.status === 'Approved' && (
                        <button type="button" onClick={() => void advanceRunStatus(selectedRun, 'Paid')} className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#082B59] text-white cursor-pointer">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 4. Mark Paid & Post Ledger
                        </button>
                      )}
                    </div>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Employee</th>
                        <th className="px-4 py-2.5 font-semibold text-right">Gross</th>
                        <th className="px-4 py-2.5 font-semibold text-right">Tax</th>
                        <th className="px-4 py-2.5 font-semibold text-right">Pension (7%)</th>
                        <th className="px-4 py-2.5 font-semibold text-right">Net Pay</th>
                        <th className="px-4 py-2.5 font-semibold text-right no-print">Payslip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {selectedRun.items.map((item) => (
                        <tr key={item.employeeId}>
                          <td className="px-4 py-2.5 font-sans">
                            <div className="font-semibold">{item.employeeName}</div>
                            <div className="text-slate-500">{item.employeeCode} · {item.department}</div>
                          </td>
                          <td className="px-4 py-2.5 text-right">{item.grossPay.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right text-red-600">{item.incomeTax.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right">{item.employeePension.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{item.netPay.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-sans no-print">
                            <button type="button" onClick={() => setSelectedPayslip(item)} className="text-[#087CEB] hover:underline cursor-pointer">
                              Payslip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-xs text-slate-400">
                  Select a payroll run or click "Calculate Monthly Payroll" to generate salaries from live employee & attendance data.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'bonuses' && (
        <div className="space-y-5">
          <form onSubmit={handleCreateBonus} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <select value={bonusForm.employeeId} onChange={(e) => setBonusForm({ ...bonusForm, employeeId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="">Select Employee...</option>
              {state.employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
            <select value={bonusForm.type} onChange={(e) => setBonusForm({ ...bonusForm, type: e.target.value as BonusRecord['type'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Performance">Performance Bonus</option>
              <option value="Production">Production Target Bonus</option>
              <option value="Annual">Annual Bonus</option>
              <option value="Incentive">Special Incentive</option>
            </select>
            <input type="number" required placeholder="Amount (ETB)" value={bonusForm.amount} onChange={(e) => setBonusForm({ ...bonusForm, amount: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <input type="text" required placeholder="Reason / KPI met" value={bonusForm.reason} onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <button type="submit" disabled={state.employees.length === 0} className="md:col-span-4 py-2 rounded-lg bg-[#1178B9] text-white font-medium cursor-pointer">
              Approve & Queue Bonus for {month}
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Month & Type</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.bonuses.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-semibold">{b.employeeName}</td>
                    <td className="px-4 py-3">{b.month} · {b.type}</td>
                    <td className="px-4 py-3">{b.reason}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{b.amount.toLocaleString()}</td>
                  </tr>
                ))}
                {state.bonuses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No bonus allocations recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'rules' && configForm && (
        <form onSubmit={handleSaveRules} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Settings className="w-4 h-4 text-[#087CEB]" />
            <span>Configurable Ethiopian Income Tax & Pension Rules</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-500 mb-1">Effective Date</label>
              <input type="date" value={configForm.effectiveDate} onChange={(e) => setConfigForm({ ...configForm, effectiveDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Employee Pension (%)</label>
              <input type="number" step="0.1" value={configForm.employeePensionPercent} onChange={(e) => setConfigForm({ ...configForm, employeePensionPercent: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Employer Pension (%)</label>
              <input type="number" step="0.1" value={configForm.employerPensionPercent} onChange={(e) => setConfigForm({ ...configForm, employerPensionPercent: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">OT Weekday Multiplier</label>
              <input type="number" step="0.1" value={configForm.overtimeWeekdayMultiplier} onChange={(e) => setConfigForm({ ...configForm, overtimeWeekdayMultiplier: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold">Progressive Income Tax Brackets (ETB)</div>
            {configForm.brackets.map((br, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 font-mono">
                <input type="number" value={br.min} onChange={(e) => {
                  const next = [...configForm.brackets];
                  next[idx] = { ...br, min: Number(e.target.value) };
                  setConfigForm({ ...configForm, brackets: next });
                }} className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="number" value={br.max ?? ''} placeholder="Max (∞)" onChange={(e) => {
                  const next = [...configForm.brackets];
                  next[idx] = { ...br, max: e.target.value === '' ? null : Number(e.target.value) };
                  setConfigForm({ ...configForm, brackets: next });
                }} className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="number" value={br.ratePercent} onChange={(e) => {
                  const next = [...configForm.brackets];
                  next[idx] = { ...br, ratePercent: Number(e.target.value) };
                  setConfigForm({ ...configForm, brackets: next });
                }} className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="number" step="0.5" value={br.deduction} onChange={(e) => {
                  const next = [...configForm.brackets];
                  next[idx] = { ...br, deduction: Number(e.target.value) };
                  setConfigForm({ ...configForm, brackets: next });
                }} className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
              </div>
            ))}
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#1178B9] text-white font-medium cursor-pointer">
            Save Payroll Configuration
          </button>
        </form>
      )}

      {/* Individual Payslip Modal */}
      {selectedPayslip && selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white text-[#15243A] rounded-2xl p-6 max-w-lg w-full space-y-4 print-surface">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <SevenSundayLogo customLogoUrl={state.companySettings.customLogoDataUrl} size="sm" />
                <div>
                  <div className="text-sm font-bold text-[#082B59]">{state.companySettings.companyName}</div>
                  <div className="text-[11px] text-slate-500">Official Employee Payslip · {selectedRun.month}</div>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedPayslip(null)} className="text-slate-400 no-print cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs bg-[#F5F8FC] p-3 rounded-lg">
              <div>Employee: <strong>{selectedPayslip.employeeName}</strong></div>
              <div className="font-mono">Code: {selectedPayslip.employeeCode}</div>
              <div>Department: {selectedPayslip.department}</div>
              <div>Title: {selectedPayslip.jobTitle}</div>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between"><span>Basic Salary</span><span>{selectedPayslip.basicSalary.toLocaleString()} ETB</span></div>
              <div className="flex justify-between"><span>Allowances (Transport + Housing)</span><span>{selectedPayslip.allowances.toLocaleString()} ETB</span></div>
              <div className="flex justify-between"><span>Overtime & Bonus</span><span>{(selectedPayslip.overtimePay + selectedPayslip.bonus).toLocaleString()} ETB</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Gross Earnings</span><span>{selectedPayslip.grossPay.toLocaleString()} ETB</span></div>
              <div className="flex justify-between text-red-600"><span>Income Tax</span><span>-{selectedPayslip.incomeTax.toLocaleString()} ETB</span></div>
              <div className="flex justify-between text-red-600"><span>Employee Pension ({state.payrollConfig.employeePensionPercent}%)</span><span>-{selectedPayslip.employeePension.toLocaleString()} ETB</span></div>
              <div className="flex justify-between text-base font-bold text-[#082B59] border-t-2 border-[#082B59] pt-2">
                <span>NET PAY</span><span>{selectedPayslip.netPay.toLocaleString()} ETB</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 no-print">
              <button type="button" onClick={() => setSelectedPayslip(null)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs cursor-pointer">Close</button>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#1178B9] text-white text-xs cursor-pointer">
                <Printer className="w-3.5 h-3.5" /> Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
