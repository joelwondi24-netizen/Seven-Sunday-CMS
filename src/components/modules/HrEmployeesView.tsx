import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Download, Plus, Printer, Search, Trash2, Upload, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { Employee, EmployeeEvent } from '../../types/erp';
import { QrCodeCanvas } from '../common/QrCodeCanvas';
import { SevenSundayLogo } from '../common/SevenSundayLogo';
import { downloadCsv } from '../../utils/exportUtils';

interface HrEmployeesViewProps {
  focusedEmployeeId?: string;
  onClearFocus?: () => void;
}

export const HrEmployeesView: React.FC<HrEmployeesViewProps> = ({ focusedEmployeeId, onClearFocus }) => {
  const { state, currentRole, currentUser, mutate } = useErp();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [selectedForIdCard, setSelectedForIdCard] = useState<Employee | null>(null);
  const [selectedForEvents, setSelectedForEvents] = useState<Employee | null>(null);

  useEffect(() => {
    if (!focusedEmployeeId || !state) return;
    const match = state.employees.find((e) => e.id === focusedEmployeeId);
    if (match) {
      setDeptFilter('All');
      setSearch(match.employeeCode || match.fullName);
    }
    onClearFocus?.();
  }, [focusedEmployeeId, onClearFocus, state]);

  const [form, setForm] = useState<Partial<Employee>>({
    fullName: '',
    gender: 'Male',
    dateOfBirth: '1994-01-01',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    department: 'Manufacturing & Production',
    jobTitle: '',
    employmentType: 'Permanent',
    startDate: new Date().toISOString().slice(0, 10),
    contractExpiryDate: '',
    basicSalary: 12000,
    transportAllowance: 1000,
    housingAllowance: 1500,
    bankName: 'Commercial Bank of Ethiopia',
    bankAccountNumber: '',
    tinNumber: '',
    education: '',
    workExperience: '',
    idDocumentNumber: '',
    status: 'Active',
    photoDataUrl: '',
  });

  const [eventForm, setEventForm] = useState({
    type: 'Evaluation' as EmployeeEvent['type'],
    title: '',
    details: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  const filtered = useMemo(() => {
    if (!state) return [];
    const q = search.toLowerCase();
    return state.employees.filter((e) => {
      if (deptFilter !== 'All' && e.department !== deptFilter) return false;
      return (
        e.fullName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q)
      );
    });
  }, [deptFilter, search, state]);

  if (!state) return null;

  const generateNextCode = () => {
    const num = state.employees.length + 1;
    return `SSE-EMP-${String(num).padStart(4, '0')}`;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoDataUrl: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.jobTitle) return;
    const id = `emp_${Date.now()}`;
    const record: Employee = {
      id,
      employeeCode: generateNextCode(),
      fullName: form.fullName,
      gender: (form.gender as 'Male' | 'Female') || 'Male',
      dateOfBirth: form.dateOfBirth || '1995-01-01',
      phone: form.phone || '',
      email: form.email || '',
      address: form.address || '',
      emergencyContactName: form.emergencyContactName || '',
      emergencyContactPhone: form.emergencyContactPhone || '',
      department: form.department || 'Executive Management',
      jobTitle: form.jobTitle || '',
      employmentType: (form.employmentType as Employee['employmentType']) || 'Permanent',
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      contractExpiryDate: form.contractExpiryDate,
      basicSalary: Number(form.basicSalary || 0),
      transportAllowance: Number(form.transportAllowance || 0),
      housingAllowance: Number(form.housingAllowance || 0),
      bankName: form.bankName,
      bankAccountNumber: form.bankAccountNumber,
      tinNumber: form.tinNumber,
      education: form.education || '',
      workExperience: form.workExperience || '',
      idDocumentNumber: form.idDocumentNumber || '',
      photoDataUrl: form.photoDataUrl,
      status: (form.status as Employee['status']) || 'Active',
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    await mutate('employees', 'create', id, record);
    setShowForm(false);
    setForm((prev) => ({ ...prev, fullName: '', phone: '', email: '', jobTitle: '', bankAccountNumber: '', photoDataUrl: '' }));
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForEvents || !eventForm.title) return;
    const rec: EmployeeEvent = {
      id: `ee_${Date.now()}`,
      employeeId: selectedForEvents.id,
      employeeName: selectedForEvents.fullName,
      type: eventForm.type,
      effectiveDate: eventForm.effectiveDate,
      title: eventForm.title,
      details: eventForm.details,
      recordedBy: currentUser?.fullName || 'HR',
      version: 1,
    };
    await mutate('employeeEvents', 'create', rec.id, rec);
    if (eventForm.type === 'Termination') {
      await mutate('employees', 'update', selectedForEvents.id, { status: 'Terminated' }, selectedForEvents.version);
    } else if (eventForm.type === 'Resignation') {
      await mutate('employees', 'update', selectedForEvents.id, { status: 'Resigned' }, selectedForEvents.version);
    }
    setEventForm({ type: 'Evaluation', title: '', details: '', effectiveDate: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Human Resources & Employee Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Staff profiles, auto-generated IDs, QR ID cards, evaluations, contracts, and restricted banking data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                'seven-sunday-employees',
                ['Employee ID', 'Full Name', 'Department', 'Job Title', 'Type', 'Phone', 'Email', 'Status'],
                filtered.map((e) => [e.employeeCode, e.fullName, e.department, e.jobTitle, e.employmentType, e.phone, e.email, e.status])
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Directory
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Directory
          </button>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Register Employee
          </button>
        </div>
      </div>

      {/* Registration Form */}
      {showForm && (
        <form onSubmit={handleSaveEmployee} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 no-print">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-[#15243A] dark:text-white">
              New Employee Registration (Auto ID: <span className="font-mono text-[#087CEB]">{generateNextCode()}</span>)
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            <input type="text" required placeholder="Full Name *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'Male' | 'Female' })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" title="Date of Birth" />
            <input type="text" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="Residential Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              {state.departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <input type="text" required placeholder="Job Title *" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as Employee['employmentType'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Probation">Probation</option>
              <option value="Daily Labor">Daily Labor</option>
            </select>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" title="Start Date" />
            <input type="date" value={form.contractExpiryDate} onChange={(e) => setForm({ ...form, contractExpiryDate: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" title="Contract Expiry (optional)" />
            <input type="number" placeholder="Basic Salary (ETB)" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <input type="number" placeholder="Transport Allowance" value={form.transportAllowance} onChange={(e) => setForm({ ...form, transportAllowance: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <input type="text" placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="Bank Account No." value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <input type="text" placeholder="Emergency Contact Name" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="Emergency Contact Phone" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="National ID / Passport No." value={form.idDocumentNumber} onChange={(e) => setForm({ ...form, idDocumentNumber: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="Education Qualification" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#087CEB]" />
              <span>{form.photoDataUrl ? 'Photo Attached' : 'Upload Staff Photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white text-xs font-medium cursor-pointer">
              Save Employee Record
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3 no-print">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SSE-EMP ID, or job title..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="All">All Departments</option>
          {state.departments.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Employee Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Employee ID</th>
              <th className="px-4 py-3 font-semibold">Full Name & Title</th>
              <th className="px-4 py-3 font-semibold">Department</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Salary / Bank (RBAC)</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">
                  {emp.employeeCode}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#15243A] dark:text-white">{emp.fullName}</div>
                  <div className="text-slate-500">{emp.jobTitle} · {emp.employmentType}</div>
                </td>
                <td className="px-4 py-3">{emp.department}</td>
                <td className="px-4 py-3">
                  <div>{emp.phone || '—'}</div>
                  <div className="text-slate-500">{emp.email || '—'}</div>
                </td>
                <td className="px-4 py-3 font-mono">
                  {currentRole?.canViewSalaryBank ? (
                    <>
                      <div>{emp.basicSalary.toLocaleString()} ETB</div>
                      <div className="text-[11px] text-slate-500">{emp.bankName} {emp.bankAccountNumber}</div>
                    </>
                  ) : (
                    <span className="text-slate-400">Restricted</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={emp.status === 'Active' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-1.5 no-print">
                  <button
                    type="button"
                    onClick={() => setSelectedForIdCard(emp)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <BadgeCheck className="w-3 h-3 text-[#087CEB]" /> ID Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedForEvents(emp)}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    History
                  </button>
                  <button
                    type="button"
                    onClick={() => void mutate('employees', 'delete', emp.id, {})}
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  No employees found. Click "Register Employee" to add staff records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Staff QR ID Card Modal */}
      {selectedForIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between no-print">
              <h3 className="text-sm font-bold text-[#15243A] dark:text-white">Official Staff QR Identification Card</h3>
              <button type="button" onClick={() => setSelectedForIdCard(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="print-surface rounded-xl border-2 border-[#082B59] overflow-hidden bg-white text-[#15243A]">
              <div className="bg-[#082B59] text-white px-4 py-3 flex items-center gap-3">
                <SevenSundayLogo customLogoUrl={state.companySettings.customLogoDataUrl} size="sm" onDark />
                <div>
                  <div className="text-xs font-bold">{state.companySettings.brandName}</div>
                  <div className="text-[10px] text-[#EAF4FF]/80">{state.companySettings.slogan}</div>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="w-20 h-24 rounded-lg bg-[#EAF4FF] border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedForIdCard.photoDataUrl ? (
                    <img src={selectedForIdCard.photoDataUrl} alt={selectedForIdCard.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-[#082B59]">
                      {selectedForIdCard.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-xs space-y-1">
                  <div className="font-bold text-sm text-[#082B59] truncate">{selectedForIdCard.fullName}</div>
                  <div className="font-medium text-[#1178B9]">{selectedForIdCard.jobTitle}</div>
                  <div className="text-slate-600">{selectedForIdCard.department}</div>
                  <div className="font-mono font-semibold text-[#15243A]">ID: {selectedForIdCard.employeeCode}</div>
                  <div className="text-[10px] text-slate-500">Emergency: {selectedForIdCard.emergencyContactPhone || state.companySettings.phone}</div>
                </div>
                <QrCodeCanvas
                  value={`SSE|${selectedForIdCard.employeeCode}|${selectedForIdCard.fullName}|${selectedForIdCard.department}`}
                  size={74}
                />
              </div>
              <div className="bg-[#F5F8FC] px-4 py-1.5 text-[10px] text-slate-600 flex justify-between border-t border-slate-200">
                <span>Status: {selectedForIdCard.status}</span>
                <span>Issued: {selectedForIdCard.startDate}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 no-print">
              <button type="button" onClick={() => setSelectedForIdCard(null)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs cursor-pointer">
                Close
              </button>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1178B9] text-white text-xs font-medium cursor-pointer">
                <Printer className="w-3.5 h-3.5" /> Print ID Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Lifecycle History Modal */}
      {selectedForEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#15243A] dark:text-white">
                HR History & Evaluations — {selectedForEvents.fullName}
              </h3>
              <button type="button" onClick={() => setSelectedForEvents(null)} className="text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="grid grid-cols-2 gap-2.5 text-xs">
              <select value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as EmployeeEvent['type'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                <option value="Evaluation">Performance Evaluation</option>
                <option value="Promotion">Promotion</option>
                <option value="Transfer">Department Transfer</option>
                <option value="Disciplinary">Disciplinary Record</option>
                <option value="Contract Renewal">Contract Renewal</option>
                <option value="Termination">Termination</option>
                <option value="Resignation">Resignation</option>
              </select>
              <input type="date" value={eventForm.effectiveDate} onChange={(e) => setEventForm({ ...eventForm, effectiveDate: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
              <input type="text" required placeholder="Summary Title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
              <textarea placeholder="Detailed remarks..." value={eventForm.details} onChange={(e) => setEventForm({ ...eventForm, details: e.target.value })} rows={2} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
              <button type="submit" className="col-span-2 py-2 rounded-lg bg-[#1178B9] text-white font-medium cursor-pointer">
                Record HR Event
              </button>
            </form>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto text-xs">
              {state.employeeEvents
                .filter((ev) => ev.employeeId === selectedForEvents.id)
                .map((ev) => (
                  <div key={ev.id} className="py-2">
                    <div className="flex justify-between font-semibold">
                      <span>{ev.type}: {ev.title}</span>
                      <span className="font-mono text-slate-400">{ev.effectiveDate}</span>
                    </div>
                    <p className="text-slate-500 mt-0.5">{ev.details}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
