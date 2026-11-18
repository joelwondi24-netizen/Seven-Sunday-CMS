import React, { useState } from 'react';
import { Lock, ShieldCheck, User, Wifi, WifiOff } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import { SevenSundayLogo } from './SevenSundayLogo';
import { PWAInstallButton } from './PWAInstallButton';

const QUICK_ACCOUNTS = [
  { label: 'Super Admin', username: 'admin', role: 'Full Control & Settings' },
  { label: 'HR Manager', username: 'hr.manager', role: 'Staff, Attendance & Payroll' },
  { label: 'Finance Manager', username: 'finance.mgr', role: 'Accounting, Vouchers & Pay' },
  { label: 'Secretary Dept', username: 'secretary', role: 'Letters & 4-Lang Docs' },
  { label: 'Warehouse Mgr', username: 'warehouse', role: 'GRN, GIN & Inventory' },
  { label: 'Employee', username: 'employee', role: 'Attendance, Leave & Chat' },
];

export const LoginScreen: React.FC = () => {
  const { login, isOnline, state } = useErp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('SevenSunday@2026');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(username, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F8FC] dark:bg-[#0B1320]">
      {/* Brand Panel */}
      <div className="lg:w-[46%] bg-[#082B59] text-white p-8 lg:p-14 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <SevenSundayLogo customLogoUrl={state?.companySettings.customLogoDataUrl} size="lg" onDark />
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">
                  {state?.companySettings.brandName || 'Seven Sunday Ethiopia'}
                </h1>
                <p className="text-xs text-[#EAF4FF]/80">
                  {state?.companySettings.companyName || 'Seven Sunday Manufacturing & Trading PLC'}
                </p>
              </div>
            </div>
            <PWAInstallButton />
          </div>

          <div className="mt-14 max-w-lg">
            <p className="text-xs font-medium tracking-wide text-[#087CEB] uppercase">
              Unified Corporate ERP Platform
            </p>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold leading-tight text-white">
              {state?.companySettings.slogan || 'The Home of quality product'}
            </h2>
            <p className="mt-4 text-base text-[#EAF4FF]/80 leading-relaxed">
              {state?.companySettings.secondarySlogan || 'Together for a Stronger and Better Tomorrow'}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 gap-6 text-xs text-[#EAF4FF]/80">
          <div>
            <p className="font-semibold text-white">Real-Time & Offline-First</p>
            <p className="mt-1 leading-relaxed">
              IndexedDB local storage with instant WebSocket sync and conflict-safe offline queuing.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Enterprise RBAC & Audit</p>
            <p className="mt-1 leading-relaxed">
              16 role profiles, 4-language document exchange, Ethiopian calendar, and double-entry finance.
            </p>
          </div>
        </div>
      </div>

      {/* Sign-In Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-[#15243A] dark:text-white">Corporate Sign In</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Sign in with your Seven Sunday employee account
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#293858] dark:text-slate-300 mb-1.5">
                Username or Corporate Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-[#15243A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#087CEB]"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#293858] dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-[#15243A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#087CEB]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2.5 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? 'Authenticating...' : isOnline ? 'Sign In to Workspace' : 'Sign In Offline'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#087CEB]" />
              <span>Quick Role Access (Default Password: SevenSunday@2026)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => {
                    setUsername(acc.username);
                    setPassword('SevenSunday@2026');
                  }}
                  className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                    username === acc.username
                      ? 'border-[#087CEB] bg-[#EAF4FF] dark:bg-[#082B59]/50 text-[#082B59] dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold truncate">{acc.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{acc.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
