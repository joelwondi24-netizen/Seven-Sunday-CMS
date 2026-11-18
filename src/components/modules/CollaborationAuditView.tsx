import React, { useState } from 'react';
import {
  Check,
  Download,
  FileUp,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { ChatMessage } from '../../types/erp';
import { downloadCsv, downloadJson } from '../../utils/exportUtils';
import { WindowsDesktopSetupPanel } from '../common/WindowsDesktopSetup';

interface CollaborationAuditViewProps {
  section: 'chat' | 'approvals' | 'audit' | 'sync' | 'reports';
}

export const CollaborationAuditView: React.FC<CollaborationAuditViewProps> = ({ section }) => {
  const {
    state,
    currentUser,
    currentRole,
    authToken,
    isOnline,
    wsConnected,
    onlineUsers,
    syncQueue,
    conflicts,
    lastSyncAt,
    isSyncing,
    mutate,
    syncNow,
    resolveConflict,
    refreshFromServer,
  } = useErp();

  const [activeChannelId, setActiveChannelId] = useState('ch_general');
  const [msgText, setMsgText] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');

  if (!state) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !currentUser) return;
    const id = `msg_${Date.now()}`;
    const rec: ChatMessage = {
      id,
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: currentUser.roleName,
      content: msgText.trim(),
      attachmentName: attachmentName || undefined,
      readBy: [currentUser.id],
      createdAt: new Date().toISOString(),
    };
    await mutate('chatMessages', 'create', id, rec);
    setMsgText('');
    setAttachmentName('');
  };

  const handleDownloadBackup = async () => {
    if (authToken && navigator.onLine) {
      const resp = await fetch('/api/backup/export', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        downloadJson(`seven-sunday-backup-${new Date().toISOString().slice(0, 10)}`, data);
        return;
      }
    }
    downloadJson(`seven-sunday-offline-snapshot-${new Date().toISOString().slice(0, 10)}`, {
      exportedAt: new Date().toISOString(),
      data: state,
    });
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;
    try {
      const parsed = JSON.parse(await file.text());
      const resp = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ data: parsed.data || parsed }),
      });
      if (resp.ok) {
        await refreshFromServer();
        setRestoreMsg('Backup archive restored successfully.');
      } else {
        const err = await resp.json();
        setRestoreMsg(err.error || 'Restore failed.');
      }
    } catch {
      setRestoreMsg('Invalid JSON backup file.');
    }
  };

  if (section === 'chat') {
    const channelMessages = state.chatMessages
      .filter((m) => m.channelId === activeChannelId)
      .filter((m) => !chatSearch || m.content.toLowerCase().includes(chatSearch.toLowerCase()))
      .slice()
      .reverse();

    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">Internal Corporate Chat</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time WebSocket channels, manager announcements, and document sharing ({onlineUsers.length} active online)
            </p>
          </div>
          <input
            type="text"
            placeholder="Search messages..."
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[560px]">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">Channels</div>
              {state.chatChannels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-2 ${
                    activeChannelId === ch.id
                      ? 'bg-[#082B59] text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5">Online Staff</div>
              <div className="space-y-1 max-h-36 overflow-y-auto px-2 text-xs">
                {onlineUsers.map((u, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{u.fullName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {channelMessages.map((m) => {
                const mine = m.senderId === currentUser?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div className="text-[11px] text-slate-500 mb-1">
                      {m.senderName} · {m.senderRole} · <span className="font-mono">{m.createdAt.slice(11, 16)}</span>
                    </div>
                    <div
                      className={`max-w-lg rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        mine
                          ? 'bg-[#1178B9] text-white'
                          : 'bg-[#F5F8FC] dark:bg-slate-800 text-[#15243A] dark:text-slate-100'
                      }`}
                    >
                      {m.content}
                      {m.attachmentName && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/20 text-[11px] font-mono">
                          Attachment: {m.attachmentName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {channelMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No messages in this channel yet. Start a conversation.
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <label className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" title="Attach file name">
                <FileUp className="w-4 h-4 text-slate-500" />
                <input type="file" className="hidden" onChange={(e) => setAttachmentName(e.target.files?.[0]?.name || '')} />
              </label>
              <input
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder={attachmentName ? `Attached: ${attachmentName} — Type message...` : 'Write message to team...'}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
              <button type="submit" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#1178B9] text-white text-xs font-medium cursor-pointer">
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'approvals') {
    const pendingLeaves = state.leaves.filter((l) => l.status === 'Pending');
    const pendingPOs = state.purchaseOrders.filter((p) => p.status === 'Pending Approval');
    const pendingMatReqs = state.materialRequests.filter((m) => m.status === 'Pending');
    const pendingCorrs = state.attendanceCorrections.filter((c) => c.status === 'Pending');

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">Centralized Approvals Queue</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            RBAC-verified approvals for Leave Requests, Purchase Orders, Material Requests, and Attendance Corrections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="font-semibold text-sm">Pending Leave Requests ({pendingLeaves.length})</h3>
            {pendingLeaves.map((l) => (
              <div key={l.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{l.employeeName} ({l.category})</div>
                  <div className="text-slate-500">{l.startDate} → {l.endDate} · {l.reason}</div>
                </div>
                {currentRole?.canApprove && (
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => void mutate('leaves', 'update', l.id, { status: 'Approved', approvedBy: currentUser?.fullName }, l.version)} className="p-1.5 rounded bg-emerald-600 text-white cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => void mutate('leaves', 'update', l.id, { status: 'Rejected', approvedBy: currentUser?.fullName }, l.version)} className="p-1.5 rounded bg-red-600 text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
            {pendingLeaves.length === 0 && <p className="text-slate-400">No pending leave approvals.</p>}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="font-semibold text-sm">Pending Purchase Orders ({pendingPOs.length})</h3>
            {pendingPOs.map((po) => (
              <div key={po.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold font-mono">{po.poNumber} · {po.supplierName}</div>
                  <div className="text-slate-500">Total: {po.totalAmount.toLocaleString()} ETB</div>
                </div>
                {currentRole?.canApprove && (
                  <button type="button" onClick={() => void mutate('purchaseOrders', 'update', po.id, { status: 'Approved', approvedBy: currentUser?.fullName }, po.version)} className="px-3 py-1.5 rounded bg-emerald-600 text-white cursor-pointer">
                    Approve PO
                  </button>
                )}
              </div>
            ))}
            {pendingPOs.length === 0 && <p className="text-slate-400">No pending purchase orders.</p>}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="font-semibold text-sm">Pending Material Requests ({pendingMatReqs.length})</h3>
            {pendingMatReqs.map((mr) => (
              <div key={mr.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{mr.requestNumber} · {mr.productName}</div>
                  <div className="text-slate-500">{mr.quantity} {mr.unit} · {mr.requestedBy} ({mr.department})</div>
                </div>
                {currentRole?.canApprove && (
                  <button type="button" onClick={() => void mutate('materialRequests', 'update', mr.id, { status: 'Approved', approvedBy: currentUser?.fullName }, mr.version)} className="px-3 py-1.5 rounded bg-emerald-600 text-white cursor-pointer">
                    Approve
                  </button>
                )}
              </div>
            ))}
            {pendingMatReqs.length === 0 && <p className="text-slate-400">No pending material requests.</p>}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="font-semibold text-sm">Attendance Correction Requests ({pendingCorrs.length})</h3>
            {pendingCorrs.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{c.employeeName} ({c.date})</div>
                  <div className="text-slate-500">Req: {c.requestedCheckIn} → {c.requestedCheckOut} · {c.reason}</div>
                </div>
                {currentRole?.canApprove && (
                  <button type="button" onClick={() => void mutate('attendanceCorrections', 'update', c.id, { status: 'Approved', reviewedBy: currentUser?.fullName }, c.version)} className="px-3 py-1.5 rounded bg-emerald-600 text-white cursor-pointer">
                    Approve
                  </button>
                )}
              </div>
            ))}
            {pendingCorrs.length === 0 && <p className="text-slate-400">No pending attendance corrections.</p>}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'audit') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">Immutable Security & Audit Trail</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Append-only audit records cannot be edited or deleted by any user
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                'seven-sunday-audit-logs',
                ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Entity', 'Device'],
                state.auditLogs.map((a) => [a.timestamp, a.username, a.roleName, a.module, a.action, a.entityId, a.deviceInfo])
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit Log
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">User & Role</th>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.auditLogs.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2.5 font-mono text-[11px]">{a.timestamp.slice(0, 19).replace('T', ' ')}</td>
                  <td className="px-4 py-2.5">{a.username} ({a.roleName})</td>
                  <td className="px-4 py-2.5 font-mono">{a.module}</td>
                  <td className="px-4 py-2.5 font-medium">{a.action}</td>
                  <td className="px-4 py-2.5 text-slate-500">{a.deviceInfo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section === 'sync') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
              Offline Synchronization, Local DB & Backup Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time IndexedDB + localStorage persistence, WebSocket sync queue, conflict resolution, and full JSON backup
            </p>
          </div>
          <button
            type="button"
            disabled={!isOnline || isSyncing}
            onClick={() => void syncNow()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronizing...' : 'Manual Sync Now'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-slate-500">Connectivity</div>
            <div className="mt-1.5 flex items-center gap-1.5 text-sm font-bold">
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-600" />}
              <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-slate-500">Real-Time WebSocket</div>
            <div className="mt-1.5 text-sm font-bold">{wsConnected ? 'Connected' : 'Disconnected'}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-slate-500">Pending Offline Queue</div>
            <div className="mt-1.5 text-sm font-bold font-mono">{syncQueue.length} mutations</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-slate-500">Last Synchronized</div>
            <div className="mt-1.5 text-xs font-mono font-semibold">{lastSyncAt ? lastSyncAt.slice(0, 19).replace('T', ' ') : 'Not synced'}</div>
          </div>
        </div>

        {/* Conflict Resolution Panel */}
        {conflicts.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 p-5 space-y-3 text-xs">
            <div className="font-bold text-amber-800 dark:text-amber-300">
              Synchronization Conflicts Requiring Explicit Approval ({conflicts.length})
            </div>
            {conflicts.map((c) => (
              <div key={c.id} className="bg-white dark:bg-slate-900 rounded-lg border p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{c.collection} · {c.recordId}</div>
                  <div className="text-slate-500">{c.reason}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void resolveConflict(c.id, 'local')} className="px-3 py-1.5 rounded bg-[#1178B9] text-white cursor-pointer">
                    Keep Offline Version
                  </button>
                  <button type="button" onClick={() => void resolveConflict(c.id, 'server')} className="px-3 py-1.5 rounded border border-slate-300 cursor-pointer">
                    Keep Server Version
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Queue List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
          <h3 className="font-semibold text-sm">Pending IndexedDB Transaction Queue</h3>
          {syncQueue.length === 0 ? (
            <p className="text-slate-400">All local IndexedDB transactions are synchronized with the central server.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {syncQueue.map((m) => (
                <div key={m.txId} className="py-2 flex justify-between font-mono">
                  <span>{m.operation.toUpperCase()} {m.collection} ({m.recordId})</span>
                  <span className="text-slate-500">{m.createdAt.slice(11, 19)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backup & Restore */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#087CEB]" />
            <span>Database Backup & Restore</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void handleDownloadBackup()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#082B59] text-white font-medium cursor-pointer">
              <Download className="w-3.5 h-3.5" /> Export Full JSON Backup
            </button>
            {currentRole?.canManageUsers && (
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <Upload className="w-3.5 h-3.5 text-[#087CEB]" />
                <span>Restore Backup Archive (.json)</span>
                <input type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
              </label>
            )}
          </div>
          {restoreMsg && <p className="text-emerald-600 font-medium">{restoreMsg}</p>}
        </div>

        {/* Windows Desktop (.exe) Setup */}
        <WindowsDesktopSetupPanel />
      </div>
    );
  }

  // Reports Center
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">Corporate Reports & Data Exports</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Generate live Excel/CSV and printable reports directly from current database records
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {[
          {
            title: 'Employee Master Directory',
            count: `${state.employees.length} records`,
            onExport: () =>
              downloadCsv(
                'report-employees',
                ['Code', 'Name', 'Department', 'Title', 'Status', 'Start Date'],
                state.employees.map((e) => [e.employeeCode, e.fullName, e.department, e.jobTitle, e.status, e.startDate])
              ),
          },
          {
            title: 'Inventory Valuation Report',
            count: `${state.products.length} items`,
            onExport: () =>
              downloadCsv(
                'report-inventory',
                ['Code', 'Name', 'Category', 'Warehouse', 'Qty', 'Unit Cost', 'Total Value'],
                state.products.map((p) => [p.itemCode, p.name, p.category, p.warehouseName, p.quantity, p.purchasePrice, p.quantity * p.purchasePrice])
              ),
          },
          {
            title: 'Sales & Receivables Report',
            count: `${state.salesInvoices.length} invoices`,
            onExport: () =>
              downloadCsv(
                'report-sales',
                ['Invoice #', 'Customer', 'Date', 'Total', 'Paid', 'Status'],
                state.salesInvoices.map((i) => [i.invoiceNumber, i.customerName, i.date, i.totalAmount, i.paidAmount, i.status])
              ),
          },
          {
            title: 'Attendance & Overtime Summary',
            count: `${state.attendance.length} logs`,
            onExport: () =>
              downloadCsv(
                'report-attendance',
                ['Code', 'Name', 'Date', 'In', 'Out', 'Late (min)', 'OT (hrs)'],
                state.attendance.map((a) => [a.employeeCode, a.employeeName, a.date, a.checkIn, a.checkOut, a.lateMinutes, a.overtimeHours])
              ),
          },
          {
            title: 'Finance Vouchers & Cash Flow',
            count: `${state.paymentVouchers.length} vouchers`,
            onExport: () =>
              downloadCsv(
                'report-finance-vouchers',
                ['Voucher #', 'Type', 'Party', 'Method', 'Amount', 'Date'],
                state.paymentVouchers.map((v) => [v.voucherNumber, v.type, v.partyName, v.paymentMethod, v.amount, v.date])
              ),
          },
          {
            title: 'Vehicle Fuel & Maintenance',
            count: `${state.vehicleLogs.length} logs`,
            onExport: () =>
              downloadCsv(
                'report-fleet',
                ['Plate', 'Type', 'Date', 'Cost (ETB)', 'Vendor', 'Description'],
                state.vehicleLogs.map((l) => [l.plateNumber, l.logType, l.date, l.costEtb, l.vendorOrWorkshop, l.description])
              ),
          },
        ].map((rep) => (
          <div key={rep.title} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#15243A] dark:text-white">{rep.title}</h3>
              <p className="text-slate-500 mt-1 font-mono">{rep.count}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={rep.onExport} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1178B9] text-white font-medium cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
              <button type="button" onClick={() => window.print()} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                Print
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
