import React, { useState } from 'react';
import {
  Building2,
  Database,
  Mail,
  Plus,
  Shield,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { Branch, Department, ModuleKey, RoleDefinition } from '../../types/erp';
import { LANGUAGE_LABELS } from '../../utils/i18n';

const ALL_MODULE_OPTIONS: Array<{ key: ModuleKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'admin', label: 'Company Admin' },
  { key: 'hr', label: 'Human Resources' },
  { key: 'secretary', label: 'Secretary Dept' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leave', label: 'Leave Mgmt' },
  { key: 'payroll', label: 'Payroll & Bonus' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'materials', label: 'Materials & Audit' },
  { key: 'purchasing', label: 'Procurement' },
  { key: 'sales', label: 'Sales & CRM' },
  { key: 'finance', label: 'Finance & Acct' },
  { key: 'assets', label: 'Uniforms & Assets' },
  { key: 'fleet', label: 'Vehicles & Equip' },
  { key: 'documents', label: 'Official Docs' },
  { key: 'chat', label: 'Internal Chat' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'audit', label: 'Audit Logs' },
  { key: 'sync', label: 'Sync & Backup' },
  { key: 'reports', label: 'Reports' },
];

export const AdminView: React.FC = () => {
  const { state, authToken, currentRole, mutate, loadDemoData, clearDemoData, refreshFromServer } = useErp();
  const [tab, setTab] = useState<'company' | 'structure' | 'users' | 'roles' | 'devices' | 'demo'>('company');
  const [statusMsg, setStatusMsg] = useState('');

  // Company Settings Form State
  const [companyForm, setCompanyForm] = useState(() => state?.companySettings);

  // Branch & Dept Forms
  const [newBranch, setNewBranch] = useState({ name: '', city: '', address: '', phone: '', managerName: '' });
  const [newDept, setNewDept] = useState({ name: '', code: '', headName: '', budgetEtb: 500000 });

  // New User Form
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    roleId: 'role_employee',
    department: 'Manufacturing & Production',
    jobTitle: '',
    offlineEnabled: true,
  });

  // Custom Role Form
  const [newRole, setNewRole] = useState<{
    name: string;
    modules: ModuleKey[];
    canApprove: boolean;
    canViewSalaryBank: boolean;
    canAdjustStock: boolean;
    canExportData: boolean;
  }>({
    name: '',
    modules: ['dashboard', 'documents', 'chat'],
    canApprove: false,
    canViewSalaryBank: false,
    canAdjustStock: false,
    canExportData: false,
  });

  if (!state || !companyForm) return null;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'customLogoDataUrl' | 'companyStampDataUrl' | 'authorizedSignatureDataUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCompanyForm((prev) => (prev ? { ...prev, [field]: String(reader.result || '') } : prev));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await mutate('companySettings', 'update', 'company_settings', companyForm, state.companySettings.version);
    setStatusMsg(res.ok ? 'Company branding & settings saved.' : res.error || 'Failed to save.');
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name) return;
    const rec: Branch = { id: `br_${Date.now()}`, ...newBranch };
    await mutate('branches', 'create', rec.id, rec);
    setNewBranch({ name: '', city: '', address: '', phone: '', managerName: '' });
    setStatusMsg('Branch added.');
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name || !newDept.code) return;
    const rec: Department = { id: `dept_${Date.now()}`, ...newDept };
    await mutate('departments', 'create', rec.id, rec);
    setNewDept({ name: '', code: '', headName: '', budgetEtb: 500000 });
    setStatusMsg('Department added.');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    const resp = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(newUser),
    });
    const data = await resp.json();
    if (resp.ok) {
      setNewUser({
        username: '',
        fullName: '',
        email: '',
        password: '',
        roleId: 'role_employee',
        department: 'Manufacturing & Production',
        jobTitle: '',
        offlineEnabled: true,
      });
      await refreshFromServer();
      setStatusMsg(`User account "${data.user.username}" created.`);
    } else {
      setStatusMsg(data.error || 'Could not create user.');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) return;
    const rec: RoleDefinition = {
      id: `role_${Date.now()}`,
      name: newRole.name.trim(),
      isSystem: false,
      modules: newRole.modules,
      canApprove: newRole.canApprove,
      canViewSalaryBank: newRole.canViewSalaryBank,
      canAdjustStock: newRole.canAdjustStock,
      canManageUsers: false,
      canExportData: newRole.canExportData,
      canAccessOfflinePayroll: false,
    };
    await mutate('roles', 'create', rec.id, rec);
    setNewRole({
      name: '',
      modules: ['dashboard', 'documents', 'chat'],
      canApprove: false,
      canViewSalaryBank: false,
      canAdjustStock: false,
      canExportData: false,
    });
    setStatusMsg('Custom role created.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Master Administration & Control Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure verified company registration, branding, departments, RBAC roles, SMTP, and sample data
          </p>
        </div>

        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {[
            { id: 'company', label: 'Company & Branding' },
            { id: 'structure', label: 'Branches & Depts' },
            { id: 'users', label: 'User Accounts' },
            { id: 'roles', label: 'RBAC Roles' },
            { id: 'devices', label: 'Logins & Devices' },
            { id: 'demo', label: 'Demo Data & SMTP' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                tab === t.id
                  ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#15243A]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-lg border border-[#087CEB]/30 bg-[#EAF4FF] dark:bg-[#082B59]/40 px-4 py-2.5 text-xs font-medium text-[#082B59] dark:text-white flex items-center justify-between">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg('')} className="underline text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {tab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Registered Company Name</label>
              <input
                type="text"
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                value={companyForm.brandName}
                onChange={(e) => setCompanyForm({ ...companyForm, brandName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Primary Slogan</label>
              <input
                type="text"
                value={companyForm.slogan}
                onChange={(e) => setCompanyForm({ ...companyForm, slogan: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Verified TIN Number</label>
              <input
                type="text"
                value={companyForm.tinNumber}
                onChange={(e) => setCompanyForm({ ...companyForm, tinNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Registration / License No.</label>
              <input
                type="text"
                value={companyForm.registrationNumber}
                onChange={(e) => setCompanyForm({ ...companyForm, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">VAT Registration No.</label>
              <input
                type="text"
                value={companyForm.vatNumber}
                onChange={(e) => setCompanyForm({ ...companyForm, vatNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Telephone</label>
              <input
                type="text"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Corporate Email</label>
              <input
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Website</label>
              <input
                type="text"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Headquarters Street Address</label>
              <input
                type="text"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Default Calendar System</label>
              <select
                value={companyForm.calendarSystem}
                onChange={(e) => setCompanyForm({ ...companyForm, calendarSystem: e.target.value as 'ethiopian' | 'gregorian' | 'dual' })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option value="dual">Dual (Gregorian + Ethiopian)</option>
                <option value="ethiopian">Ethiopian Calendar Only</option>
                <option value="gregorian">Gregorian Calendar Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Default Currency & VAT (%)</label>
              <div className="flex gap-2">
                <select
                  value={companyForm.defaultCurrency}
                  onChange={(e) => setCompanyForm({ ...companyForm, defaultCurrency: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                >
                  <option value="ETB">ETB (Ethiopian Birr)</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CNY">CNY</option>
                </select>
                <input
                  type="number"
                  value={companyForm.vatRatePercent}
                  onChange={(e) => setCompanyForm({ ...companyForm, vatRatePercent: Number(e.target.value) })}
                  className="w-20 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Default Language</label>
              <select
                value={companyForm.defaultLanguage}
                onChange={(e) => setCompanyForm({ ...companyForm, defaultLanguage: e.target.value as 'en' | 'am' | 'om' | 'zh' })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Upload Official Company Logo</label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <Upload className="w-4 h-4 text-[#087CEB]" />
                <span>{companyForm.customLogoDataUrl ? 'Logo Uploaded (Replace)' : 'Choose Logo PNG/SVG'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'customLogoDataUrl')} />
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Official Company Stamp</label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <Upload className="w-4 h-4 text-[#087CEB]" />
                <span>{companyForm.companyStampDataUrl ? 'Stamp Uploaded (Replace)' : 'Upload Stamp Image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'companyStampDataUrl')} />
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Authorized Signature</label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <Upload className="w-4 h-4 text-[#087CEB]" />
                <span>{companyForm.authorizedSignatureDataUrl ? 'Signature Uploaded (Replace)' : 'Upload Signature PNG'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'authorizedSignatureDataUrl')} />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white text-sm font-medium cursor-pointer"
            >
              Save Company Branding & Configuration
            </button>
          </div>
        </form>
      )}

      {tab === 'structure' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#15243A] dark:text-white">
              <Building2 className="w-4 h-4 text-[#087CEB]" />
              <span>Company Branches ({state.branches.length})</span>
            </div>
            <form onSubmit={handleAddBranch} className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="Branch Name"
                value={newBranch.name}
                onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <input
                type="text"
                placeholder="City"
                value={newBranch.city}
                onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <input
                type="text"
                placeholder="Address"
                value={newBranch.address}
                onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <button type="submit" className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#1178B9] text-white text-xs font-medium cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Add Branch
              </button>
            </form>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.branches.map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#15243A] dark:text-white">{b.name}</div>
                    <div className="text-slate-500">{b.city} · {b.address}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void mutate('branches', 'delete', b.id, {})}
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#15243A] dark:text-white">
              <Users className="w-4 h-4 text-[#087CEB]" />
              <span>Departments ({state.departments.length})</span>
            </div>
            <form onSubmit={handleAddDept} className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="Department Name"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <input
                type="text"
                required
                placeholder="Code (e.g. SEC)"
                value={newDept.code}
                onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
              <input
                type="text"
                placeholder="Department Head"
                value={newDept.headName}
                onChange={(e) => setNewDept({ ...newDept, headName: e.target.value })}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <button type="submit" className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#1178B9] text-white text-xs font-medium cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Add Department
              </button>
            </form>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {state.departments.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#15243A] dark:text-white">
                      <span className="font-mono text-[#087CEB] mr-1.5">{d.code}</span>
                      {d.name}
                    </div>
                    <div className="text-slate-500">Head: {d.headName} · Budget: {d.budgetEtb.toLocaleString()} ETB</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void mutate('departments', 'delete', d.id, {})}
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateUser} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#15243A] dark:text-white mb-4">
              <UserPlus className="w-4 h-4 text-[#087CEB]" />
              <span>Create Employee Account</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <input
                type="email"
                placeholder="Corporate Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <input
                type="password"
                required
                placeholder="Initial Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <select
                value={newUser.roleId}
                onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                {state.roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <select
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                {state.departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Job Title"
                value={newUser.jobTitle}
                onChange={(e) => setNewUser({ ...newUser, jobTitle: e.target.value })}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white text-xs font-medium cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Offline Access</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#15243A] dark:text-white">{u.fullName}</div>
                      <div className="text-slate-500 font-mono">{u.username} · {u.email}</div>
                    </td>
                    <td className="px-4 py-3">{u.roleName}</td>
                    <td className="px-4 py-3">{u.department}</td>
                    <td className="px-4 py-3">{u.offlineEnabled ? 'Enabled' : 'Online Only'}</td>
                    <td className="px-4 py-3">
                      <span className={u.status === 'active' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                        {u.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          void mutate(
                            'users',
                            'update',
                            u.id,
                            { status: u.status === 'active' ? 'suspended' : 'active' },
                            u.version
                          )
                        }
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => void mutate('users', 'delete', u.id, {})}
                          className="px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateRole} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#15243A] dark:text-white">
              <Shield className="w-4 h-4 text-[#087CEB]" />
              <span>Create Custom Role</span>
            </div>
            <input
              type="text"
              required
              placeholder="Custom Role Name"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">Permitted Modules</div>
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
              {ALL_MODULE_OPTIONS.map((m) => {
                const checked = newRole.modules.includes(m.key);
                return (
                  <label key={m.key} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setNewRole((prev) => ({
                          ...prev,
                          modules: checked ? prev.modules.filter((x) => x !== m.key) : [...prev.modules, m.key],
                        }))
                      }
                    />
                    <span>{m.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={newRole.canApprove} onChange={(e) => setNewRole({ ...newRole, canApprove: e.target.checked })} />
                <span>Can Approve Requests</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={newRole.canViewSalaryBank} onChange={(e) => setNewRole({ ...newRole, canViewSalaryBank: e.target.checked })} />
                <span>Can View Salary & Bank Details</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={newRole.canAdjustStock} onChange={(e) => setNewRole({ ...newRole, canAdjustStock: e.target.checked })} />
                <span>Can Adjust Stock Balances</span>
              </label>
            </div>
            <button type="submit" className="w-full py-2 rounded-lg bg-[#1178B9] text-white text-xs font-medium cursor-pointer">
              Save Custom Role
            </button>
          </form>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Modules</th>
                  <th className="px-4 py-3 font-semibold">Approve</th>
                  <th className="px-4 py-3 font-semibold">Salary/Bank</th>
                  <th className="px-4 py-3 font-semibold">Stock Adj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.roles.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-semibold text-[#15243A] dark:text-white">{r.name}</td>
                    <td className="px-4 py-3 text-slate-500">{r.modules.length} modules</td>
                    <td className="px-4 py-3">{r.canApprove ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">{r.canViewSalaryBank ? 'Yes' : 'Restricted'}</td>
                    <td className="px-4 py-3">{r.canAdjustStock ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'devices' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-[#15243A] dark:text-white mb-3">Login History</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto text-xs">
              {state.loginHistory.map((h) => (
                <div key={h.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#15243A] dark:text-white">{h.fullName} ({h.username})</div>
                    <div className="text-slate-500">{h.deviceLabel} · {h.mode}</div>
                  </div>
                  <div className="text-right">
                    <div className={h.status === 'success' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                      {h.status}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">{h.timestamp.slice(0, 19).replace('T', ' ')}</div>
                  </div>
                </div>
              ))}
              {state.loginHistory.length === 0 && <p className="text-slate-400 py-4">No login events recorded yet.</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-[#15243A] dark:text-white mb-3">Registered Devices</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto text-xs">
              {state.activeDevices.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#15243A] dark:text-white">{d.deviceName}</div>
                    <div className="text-slate-500">User: {d.username} · {d.platform}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void mutate('activeDevices', 'delete', d.id, {})}
                    className="px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              ))}
              {state.activeDevices.length === 0 && <p className="text-slate-400 py-4">No registered devices yet.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'demo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#15243A] dark:text-white">
              <Database className="w-4 h-4 text-[#087CEB]" />
              <span>Optional Sample / Demonstration Data Control</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sample data records are strictly flagged with <code className="font-mono">isDemo: true</code>. You can safely load them for staff training or wipe all sample records without affecting your real company transactions or configuration.
            </p>
            <div className="flex flex-wrap gap-3">
              {currentRole?.canManageUsers && (
                <>
                  <button
                    type="button"
                    onClick={() => void loadDemoData().then(() => setStatusMsg('Sample demonstration records loaded.'))}
                    className="px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white text-xs font-medium cursor-pointer"
                  >
                    Load Sample Dataset
                  </button>
                  <button
                    type="button"
                    onClick={() => void clearDemoData().then(() => setStatusMsg('All sample demonstration records safely removed.'))}
                    className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-xs font-medium cursor-pointer"
                  >
                    Remove All Demo Data
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#15243A] dark:text-white">
              <Mail className="w-4 h-4 text-[#087CEB]" />
              <span>SMTP Email Notification Gateway</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="SMTP Host (e.g. smtp.office365.com)"
                value={companyForm.smtp.host}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, smtp: { ...companyForm.smtp, host: e.target.value, configured: Boolean(e.target.value) } })
                }
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <input
                type="number"
                placeholder="Port (587)"
                value={companyForm.smtp.port}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, smtp: { ...companyForm.smtp, port: Number(e.target.value) } })
                }
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
              />
              <input
                type="email"
                placeholder="Sender Email"
                value={companyForm.smtp.senderEmail}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, smtp: { ...companyForm.smtp, senderEmail: e.target.value } })
                }
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={handleSaveCompany}
                className="px-3 py-2 rounded-lg bg-[#082B59] text-white text-xs font-medium cursor-pointer"
              >
                Save SMTP Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
