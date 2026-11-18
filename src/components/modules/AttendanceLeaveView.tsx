import React, { useState } from 'react';
import { Calendar, Check, Clock, Download, Plus, Printer, Upload, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { AttendanceCorrection, AttendanceRecord, LeaveRequest } from '../../types/erp';
import { downloadCsv } from '../../utils/exportUtils';

interface AttendanceLeaveViewProps {
  initialTab?: 'attendance' | 'leave';
}

export const AttendanceLeaveView: React.FC<AttendanceLeaveViewProps> = ({ initialTab = 'attendance' }) => {
  const { state, authToken, currentUser, currentRole, mutate, refreshFromServer } = useErp();
  const [tab, setTab] = useState<'attendance' | 'leave'>(initialTab);
  const [deviceType, setDeviceType] = useState<'Hikvision' | 'ZKTeco' | 'CSV Import'>('Hikvision');
  const [importStatus, setImportStatus] = useState('');

  // Manual Attendance Form
  const [attForm, setAttForm] = useState({
    employeeId: '',
    date: new Date().toISOString().slice(0, 10),
    shift: 'Day Shift (08:00 - 17:00)',
    checkIn: '08:00',
    checkOut: '17:00',
    overtimeHours: 0,
  });

  // Correction Form
  const [corrTarget, setCorrTarget] = useState<AttendanceRecord | null>(null);
  const [corrForm, setCorrForm] = useState({ requestedCheckIn: '08:00', requestedCheckOut: '17:00', reason: '' });

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    category: 'Annual' as LeaveRequest['category'],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    days: 1,
    reason: '',
  });

  if (!state) return null;

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = state.employees.find((x) => x.id === attForm.employeeId) ?? state.employees[0];
    if (!emp) return;
    const [inH, inM] = attForm.checkIn.split(':').map(Number);
    const lateMins = Math.max(0, inH * 60 + inM - (8 * 60 + 15));
    const id = `att_${Date.now()}`;
    const rec: AttendanceRecord = {
      id,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.fullName,
      department: emp.department,
      date: attForm.date,
      shift: attForm.shift,
      checkIn: attForm.checkIn,
      checkOut: attForm.checkOut,
      status: lateMins > 0 ? 'Late' : 'Present',
      lateMinutes: lateMins,
      earlyDepartureMinutes: 0,
      overtimeHours: Number(attForm.overtimeHours || 0),
      source: navigator.onLine ? 'Manual' : 'Offline Register',
      approved: true,
      version: 1,
    };
    await mutate('attendance', 'create', id, rec);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;
    const text = await file.text();
    const resp = await fetch('/api/attendance/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ csvText: text, deviceType }),
    });
    const data = await resp.json();
    if (resp.ok) {
      setImportStatus(`Imported ${data.importedCount} ${deviceType} attendance log rows.`);
      await refreshFromServer();
    } else {
      setImportStatus(data.error || 'Import failed.');
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrTarget) return;
    const id = `corr_${Date.now()}`;
    const rec: AttendanceCorrection = {
      id,
      attendanceId: corrTarget.id,
      employeeId: corrTarget.employeeId,
      employeeName: corrTarget.employeeName,
      date: corrTarget.date,
      requestedCheckIn: corrForm.requestedCheckIn,
      requestedCheckOut: corrForm.requestedCheckOut,
      reason: corrForm.reason,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      version: 1,
    };
    await mutate('attendanceCorrections', 'create', id, rec);
    setCorrTarget(null);
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = state.employees.find((x) => x.id === leaveForm.employeeId) ?? state.employees[0];
    const id = `lv_${Date.now()}`;
    const rec: LeaveRequest = {
      id,
      employeeId: emp?.id || currentUser?.id || 'staff',
      employeeName: emp?.fullName || currentUser?.fullName || 'Employee',
      department: emp?.department || currentUser?.department || 'General',
      category: leaveForm.category,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days: Number(leaveForm.days || 1),
      reason: leaveForm.reason,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      version: 1,
    };
    await mutate('leaves', 'create', id, rec);
    setLeaveForm({ ...leaveForm, reason: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Attendance, Time Tracking & Leave Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Daily check-in/out, Hikvision & ZKTeco device CSV import, overtime, corrections, and leave approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTab('attendance')}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                tab === 'attendance' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Attendance & Devices
            </button>
            <button
              type="button"
              onClick={() => setTab('leave')}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                tab === 'leave' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Leave Management
            </button>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Time Form
          </button>
        </div>
      </div>

      {tab === 'attendance' && (
        <div className="space-y-5">
          {/* Manual Entry & Device Import */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 no-print">
            <form onSubmit={handleRecordAttendance} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm text-[#15243A] dark:text-white">
                <Clock className="w-4 h-4 text-[#087CEB]" />
                <span>Register Daily Attendance</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <select value={attForm.employeeId} onChange={(e) => setAttForm({ ...attForm, employeeId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="">Select Employee...</option>
                  {state.employees.map((e) => <option key={e.id} value={e.id}>{e.employeeCode} · {e.fullName}</option>)}
                </select>
                <input type="date" value={attForm.date} onChange={(e) => setAttForm({ ...attForm, date: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <select value={attForm.shift} onChange={(e) => setAttForm({ ...attForm, shift: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option>Day Shift (08:00 - 17:00)</option>
                  <option>Production Shift A (06:00 - 14:00)</option>
                  <option>Production Shift B (14:00 - 22:00)</option>
                  <option>Security Night Shift (22:00 - 06:00)</option>
                </select>
                <input type="time" value={attForm.checkIn} onChange={(e) => setAttForm({ ...attForm, checkIn: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <input type="time" value={attForm.checkOut} onChange={(e) => setAttForm({ ...attForm, checkOut: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <input type="number" step="0.5" placeholder="Overtime Hours" value={attForm.overtimeHours} onChange={(e) => setAttForm({ ...attForm, overtimeHours: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
              </div>
              <button type="submit" disabled={state.employees.length === 0} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] disabled:opacity-50 text-white font-medium cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Record Check-In / Out
              </button>
            </form>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <div className="font-semibold text-sm text-[#15243A] dark:text-white">Hikvision & ZKTeco Device Sync</div>
              <p className="text-slate-500">
                Import exported device CSV logs (`EmployeeCode,Date,CheckIn,CheckOut`).
              </p>
              <select value={deviceType} onChange={(e) => setDeviceType(e.target.value as typeof deviceType)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                <option value="Hikvision">Hikvision Terminal Export</option>
                <option value="ZKTeco">ZKTeco BioTime Export</option>
                <option value="CSV Import">Standard CSV Sheet</option>
              </select>
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#087CEB] bg-[#EAF4FF]/50 dark:bg-slate-800 text-[#082B59] dark:text-white font-medium cursor-pointer">
                <Upload className="w-4 h-4 text-[#087CEB]" />
                <span>Upload Device CSV Log</span>
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} />
              </label>
              {importStatus && <p className="text-emerald-600 font-medium">{importStatus}</p>}
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold">Time Tracking Attendance Sheet</span>
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    'seven-sunday-attendance',
                    ['Code', 'Name', 'Department', 'Date', 'Shift', 'Check In', 'Check Out', 'Late Min', 'OT Hours', 'Source'],
                    state.attendance.map((a) => [a.employeeCode, a.employeeName, a.department, a.date, a.shift, a.checkIn, a.checkOut, a.lateMinutes, a.overtimeHours, a.source])
                  )
                }
                className="inline-flex items-center gap-1 text-xs text-[#087CEB] hover:underline no-print cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Staff</th>
                  <th className="px-4 py-3 font-semibold">Date & Shift</th>
                  <th className="px-4 py-3 font-semibold">In / Out</th>
                  <th className="px-4 py-3 font-semibold">Late / OT</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold text-right no-print">Correction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.attendance.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#15243A] dark:text-white">{a.employeeName}</div>
                      <div className="font-mono text-slate-500">{a.employeeCode} · {a.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono">{a.date}</div>
                      <div className="text-slate-500">{a.shift}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">{a.checkIn} → {a.checkOut}</td>
                    <td className="px-4 py-3 font-mono">
                      <span className={a.lateMinutes > 0 ? 'text-amber-600' : 'text-emerald-600'}>{a.lateMinutes}m late</span> · {a.overtimeHours}h OT
                    </td>
                    <td className="px-4 py-3">{a.source}</td>
                    <td className="px-4 py-3 text-right no-print">
                      <button type="button" onClick={() => setCorrTarget(a)} className="text-[#087CEB] hover:underline cursor-pointer">
                        Request Correction
                      </button>
                    </td>
                  </tr>
                ))}
                {state.attendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No attendance logs yet. Register attendance above or import Hikvision/ZKTeco CSV logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'leave' && (
        <div className="space-y-5">
          <form onSubmit={handleApplyLeave} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs no-print">
            <select value={leaveForm.employeeId} onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="">Employee (Default Current User)</option>
              {state.employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} ({e.department})</option>)}
            </select>
            <select value={leaveForm.category} onChange={(e) => setLeaveForm({ ...leaveForm, category: e.target.value as LeaveRequest['category'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Annual">Annual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Emergency">Emergency Leave</option>
              <option value="Maternity">Maternity Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
              <option value="Other">Other Leave</option>
            </select>
            <input type="number" min={1} placeholder="Days" value={leaveForm.days} onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" required placeholder="Reason for leave *" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <button type="submit" className="md:col-span-3 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white font-medium cursor-pointer">
              Submit Leave Application
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Category & Dates</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right no-print">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.leaves.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#15243A] dark:text-white">{l.employeeName}</div>
                      <div className="text-slate-500">{l.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{l.category} ({l.days} days)</div>
                      <div className="font-mono text-slate-500">{l.startDate} → {l.endDate}</div>
                    </td>
                    <td className="px-4 py-3">{l.reason}</td>
                    <td className="px-4 py-3">
                      <span className={l.status === 'Approved' ? 'text-emerald-600 font-medium' : l.status === 'Rejected' ? 'text-red-600 font-medium' : 'text-amber-600 font-medium'}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 no-print">
                      {currentRole?.canApprove && l.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => void mutate('leaves', 'update', l.id, { status: 'Approved', approvedBy: currentUser?.fullName }, l.version)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void mutate('leaves', 'update', l.id, { status: 'Rejected', approvedBy: currentUser?.fullName }, l.version)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {state.leaves.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      <Calendar className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      No leave requests submitted.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {corrTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmitCorrection} className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full space-y-3 text-xs">
            <h3 className="text-sm font-bold">Request Attendance Correction — {corrTarget.employeeName}</h3>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={corrForm.requestedCheckIn} onChange={(e) => setCorrForm({ ...corrForm, requestedCheckIn: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
              <input type="time" value={corrForm.requestedCheckOut} onChange={(e) => setCorrForm({ ...corrForm, requestedCheckOut: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <input type="text" required placeholder="Reason for correction..." value={corrForm.reason} onChange={(e) => setCorrForm({ ...corrForm, reason: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCorrTarget(null)} className="px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#1178B9] text-white cursor-pointer">Submit Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
