import React, { useCallback, useEffect, useState } from 'react';
import { ErpProvider, useErp } from './context/ErpContext';
import type { ModuleKey } from './types/erp';
import { LoginScreen } from './components/common/LoginScreen';
import { CommandPalette, type CommandPaletteTarget } from './components/common/CommandPalette';
import { WindowsDesktopModal } from './components/common/WindowsDesktopSetup';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './components/modules/DashboardView';
import { AdminView } from './components/modules/AdminView';
import { HrEmployeesView } from './components/modules/HrEmployeesView';
import { SecretaryDocsView } from './components/modules/SecretaryDocsView';
import { AttendanceLeaveView } from './components/modules/AttendanceLeaveView';
import { PayrollBonusView } from './components/modules/PayrollBonusView';
import { InventoryWarehouseView } from './components/modules/InventoryWarehouseView';
import { MaterialsLogisticsView } from './components/modules/MaterialsLogisticsView';
import { ProcurementSalesView } from './components/modules/ProcurementSalesView';
import { FinanceAccountingView } from './components/modules/FinanceAccountingView';
import { AssetsFleetView } from './components/modules/AssetsFleetView';
import { CollaborationAuditView } from './components/modules/CollaborationAuditView';

const WorkspaceRouter: React.FC = () => {
  const { currentUser, state, canAccessModule } = useErp();
  const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [windowsSetupOpen, setWindowsSetupOpen] = useState(false);
  const [focusedEmployeeId, setFocusedEmployeeId] = useState<string | undefined>(undefined);
  const [focusedDocId, setFocusedDocId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (currentUser && state && !canAccessModule(activeModule)) {
      setActiveModule('dashboard');
    }
  }, [activeModule, canAccessModule, currentUser, state]);

  useEffect(() => {
    if (!currentUser) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentUser]);

  const handlePaletteNavigate = useCallback((target: CommandPaletteTarget) => {
    setActiveModule(target.module);
    setFocusedEmployeeId(target.employeeId);
    setFocusedDocId(target.docId);
  }, []);

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8FC] dark:bg-[#0B1320] text-sm text-[#082B59] dark:text-white">
        Loading Seven Sunday Ethiopia ERP workspace...
      </div>
    );
  }

  const renderModule = () => {
    if (!canAccessModule(activeModule)) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
          Access to this module is restricted for your assigned role ({currentUser.roleName}).
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveModule} />;
      case 'admin':
        return <AdminView />;
      case 'hr':
        return (
          <HrEmployeesView
            focusedEmployeeId={focusedEmployeeId}
            onClearFocus={() => setFocusedEmployeeId(undefined)}
          />
        );
      case 'secretary':
        return <SecretaryDocsView initialView="secretary" />;
      case 'documents':
        return (
          <SecretaryDocsView
            initialView="documents"
            focusedDocId={focusedDocId}
            onClearFocus={() => setFocusedDocId(undefined)}
          />
        );
      case 'attendance':
        return <AttendanceLeaveView initialTab="attendance" />;
      case 'leave':
        return <AttendanceLeaveView initialTab="leave" />;
      case 'payroll':
        return <PayrollBonusView />;
      case 'inventory':
        return <InventoryWarehouseView />;
      case 'materials':
        return <MaterialsLogisticsView />;
      case 'purchasing':
        return <ProcurementSalesView initialMode="purchasing" />;
      case 'sales':
        return <ProcurementSalesView initialMode="sales" />;
      case 'finance':
        return <FinanceAccountingView />;
      case 'assets':
        return <AssetsFleetView initialTab="assets" />;
      case 'fleet':
        return <AssetsFleetView initialTab="fleet" />;
      case 'chat':
        return <CollaborationAuditView section="chat" />;
      case 'approvals':
        return <CollaborationAuditView section="approvals" />;
      case 'audit':
        return <CollaborationAuditView section="audit" />;
      case 'sync':
        return <CollaborationAuditView section="sync" />;
      case 'reports':
        return <CollaborationAuditView section="reports" />;
      default:
        return <DashboardView onNavigate={setActiveModule} />;
    }
  };

  return (
    <>
      <AppShell
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenWindowsSetup={() => setWindowsSetupOpen(true)}
      >
        {renderModule()}
      </AppShell>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handlePaletteNavigate}
        onOpenWindowsSetup={() => setWindowsSetupOpen(true)}
      />

      <WindowsDesktopModal
        isOpen={windowsSetupOpen}
        onClose={() => setWindowsSetupOpen(false)}
      />
    </>
  );
};

export default function App() {
  return (
    <ErpProvider>
      <WorkspaceRouter />
    </ErpProvider>
  );
}
