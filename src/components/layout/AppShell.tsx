import React, { useState } from 'react';
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  CheckSquare,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
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
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { LanguageCode, ModuleKey } from '../../types/erp';
import { LANGUAGE_LABELS, tUi } from '../../utils/i18n';
import { SevenSundayLogo } from '../common/SevenSundayLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface AppShellProps {
  activeModule: ModuleKey;
  onSelectModule: (mod: ModuleKey) => void;
  onOpenCommandPalette?: () => void;
  onOpenWindowsSetup?: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{ key: ModuleKey; labelKey: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { key: 'admin', labelKey: 'admin', icon: Building2 },
  { key: 'hr', labelKey: 'hr', icon: Users },
  { key: 'secretary', labelKey: 'secretary', icon: Briefcase },
  { key: 'attendance', labelKey: 'attendance', icon: Clock },
  { key: 'leave', labelKey: 'leave', icon: CalendarDays },
  { key: 'payroll', labelKey: 'payroll', icon: CreditCard },
  { key: 'inventory', labelKey: 'inventory', icon: Package },
  { key: 'materials', labelKey: 'materials', icon: ClipboardCheck },
  { key: 'purchasing', labelKey: 'purchasing', icon: ShoppingCart },
  { key: 'sales', labelKey: 'sales', icon: Truck },
  { key: 'finance', labelKey: 'finance', icon: Landmark },
  { key: 'assets', labelKey: 'assets', icon: Shirt },
  { key: 'fleet', labelKey: 'fleet', icon: Car },
  { key: 'documents', labelKey: 'documents', icon: FileText },
  { key: 'chat', labelKey: 'chat', icon: MessageSquare },
  { key: 'approvals', labelKey: 'approvals', icon: CheckSquare },
  { key: 'audit', labelKey: 'audit', icon: Shield },
  { key: 'sync', labelKey: 'sync', icon: RefreshCw },
  { key: 'reports', labelKey: 'reports', icon: BarChart3 },
];

export const AppShell: React.FC<AppShellProps> = ({
  activeModule,
  onSelectModule,
  onOpenCommandPalette,
  onOpenWindowsSetup,
  children,
}) => {
  const {
    state,
    currentUser,
    isOnline,
    wsConnected,
    syncQueue,
    isSyncing,
    language,
    darkMode,
    setLanguage,
    toggleDarkMode,
    canAccessModule,
    logout,
    syncNow,
    mutate,
  } = useErp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  if (!state || !currentUser) return null;

  const permittedNav = NAV_ITEMS.filter((n) => canAccessModule(n.key));
  const unreadNotifs = state.notifications.filter((n) => !n.readBy.includes(currentUser.id));

  return (
    <div className="min-h-screen flex bg-[#F5F8FC] dark:bg-[#0B1320] text-[#15243A] dark:text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Corporate Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#082B59] text-white flex flex-col transition-transform duration-200 lg:translate-x-0 no-print ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <SevenSundayLogo customLogoUrl={state.companySettings.customLogoDataUrl} size="sm" onDark className="w-full" />
            <div className="text-[10px] text-[#EAF4FF]/75 truncate text-center">
              {state.companySettings.slogan}
            </div>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-white/70">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
          {permittedNav.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelectModule(item.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#087CEB] text-white'
                    : 'text-[#EAF4FF]/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tUi(language, item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-[#087CEB] shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold truncate">{currentUser.fullName}</div>
              <div className="text-[11px] text-[#EAF4FF]/70 truncate">{currentUser.roleName}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{tUi(language, 'logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 h-14 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="flex-1 max-w-md flex items-center justify-between gap-2 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F5F8FC] dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:border-[#087CEB] hover:text-[#15243A] dark:hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{tUi(language, 'searchPlaceholder')}</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[10px] text-slate-500 dark:text-slate-300 shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Connectivity & Sync Status */}
            <button
              type="button"
              onClick={() => (syncQueue.length > 0 && isOnline ? void syncNow() : onSelectModule('sync'))}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              {isOnline ? (
                <Wifi className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-600' : 'text-[#087CEB]'}`} />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{isOnline ? tUi(language, 'online') : tUi(language, 'offline')}</span>
              {syncQueue.length > 0 && (
                <span className="font-mono text-[#087CEB]">({syncQueue.length})</span>
              )}
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-[#087CEB]" />}
            </button>

            {onOpenWindowsSetup && (
              <button
                type="button"
                onClick={onOpenWindowsSetup}
                title="Windows Desktop (.exe) Setup Kit"
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#082B59] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MonitorDown className="w-3.5 h-3.5 text-[#087CEB]" />
                <span>Windows .exe</span>
              </button>
            )}

            <PWAInstallButton />

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              aria-label="Interface language"
              className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
            >
              {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.split(' ')[0]}
                </option>
              ))}
            </select>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifs((v) => !v)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-[#087CEB] text-white text-[10px] font-mono flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 space-y-2 z-50">
                  <div className="flex items-center justify-between text-xs font-semibold pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span>Notifications</span>
                    <button type="button" onClick={() => setShowNotifs(false)} className="text-slate-400 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
                    {state.notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.readBy.includes(currentUser.id)) {
                            void mutate('notifications', 'update', n.id, { readBy: [...n.readBy, currentUser.id] });
                          }
                          onSelectModule(n.module);
                          setShowNotifs(false);
                        }}
                        className="p-2 rounded-lg bg-[#F5F8FC] dark:bg-slate-800/50 hover:bg-[#EAF4FF] cursor-pointer"
                      >
                        <div className="font-semibold">{n.title}</div>
                        <div className="text-slate-500 mt-0.5">{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>

        <footer className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 no-print">
          <span>{state.companySettings.letterheadFooter}</span>
          <span>{state.companySettings.secondarySlogan}</span>
        </footer>
      </div>
    </div>
  );
};
