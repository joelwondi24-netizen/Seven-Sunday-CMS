import React, { useState } from 'react';
import { AlertCircle, Car, Plus, ShieldAlert, Shirt } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { UniformAssetIssue, VehicleLog, VehicleRecord } from '../../types/erp';

interface AssetsFleetViewProps {
  initialTab?: 'assets' | 'fleet';
}

export const AssetsFleetView: React.FC<AssetsFleetViewProps> = ({ initialTab = 'assets' }) => {
  const { state, mutate } = useErp();
  const [tab, setTab] = useState<'assets' | 'fleet'>(initialTab);

  const [assetForm, setAssetForm] = useState({
    itemCode: '',
    itemName: '',
    category: 'Office Uniform' as UniformAssetIssue['category'],
    employeeId: '',
    quantity: 1,
    condition: 'New' as UniformAssetIssue['condition'],
    expectedReturnDate: '',
  });

  const [vehForm, setVehForm] = useState({
    plateNumber: '',
    model: '',
    type: 'Truck' as VehicleRecord['type'],
    assignedDriver: '',
    department: 'Security & Fleet Operations',
    mileageKm: 0,
    insuranceExpiry: '',
    inspectionDate: '',
    nextServiceDate: '',
  });

  const [logForm, setLogForm] = useState({
    vehicleId: '',
    logType: 'Maintenance' as VehicleLog['logType'],
    costEtb: 0,
    odometerKm: 0,
    vendorOrWorkshop: '',
    description: '',
  });

  if (!state) return null;

  const handleIssueAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = state.employees.find((x) => x.id === assetForm.employeeId) ?? state.employees[0];
    const id = `ua_${Date.now()}`;
    const rec: UniformAssetIssue = {
      id,
      itemCode: assetForm.itemCode || `AST-${String(state.uniformAssets.length + 101)}`,
      itemName: assetForm.itemName,
      category: assetForm.category,
      employeeId: emp?.id || 'staff',
      employeeName: emp?.fullName || 'Assigned Staff',
      department: emp?.department || 'Operations',
      quantity: Number(assetForm.quantity),
      condition: assetForm.condition,
      dateIssued: new Date().toISOString().slice(0, 10),
      expectedReturnDate: assetForm.expectedReturnDate,
      status: 'Issued',
      approvalStatus: 'Approved',
      version: 1,
    };
    await mutate('uniformAssets', 'create', id, rec);
    setAssetForm({ ...assetForm, itemCode: '', itemName: '' });
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `veh_${Date.now()}`;
    const rec: VehicleRecord = {
      id,
      ...vehForm,
      mileageKm: Number(vehForm.mileageKm),
      status: 'Operational',
      version: 1,
    };
    await mutate('vehicles', 'create', id, rec);
    setVehForm({ ...vehForm, plateNumber: '', model: '', assignedDriver: '' });
  };

  const handleAddVehicleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const veh = state.vehicles.find((v) => v.id === logForm.vehicleId) ?? state.vehicles[0];
    if (!veh) return;
    const id = `vlog_${Date.now()}`;
    const rec: VehicleLog = {
      id,
      vehicleId: veh.id,
      plateNumber: veh.plateNumber,
      logType: logForm.logType,
      date: new Date().toISOString().slice(0, 10),
      costEtb: Number(logForm.costEtb),
      odometerKm: Number(logForm.odometerKm || veh.mileageKm),
      vendorOrWorkshop: logForm.vendorOrWorkshop,
      description: logForm.description,
      version: 1,
    };
    await mutate('vehicleLogs', 'create', id, rec);
    if (logForm.odometerKm > veh.mileageKm) {
      await mutate('vehicles', 'update', veh.id, { mileageKm: Number(logForm.odometerKm) }, veh.version);
    }
    setLogForm({ ...logForm, costEtb: 0, vendorOrWorkshop: '', description: '' });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Staff Uniforms, Assets, Vehicles & Equipment
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track PPE, uniforms, laptops, company vehicles, fuel, maintenance forms, and expiry alerts
          </p>
        </div>

        <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
          <button type="button" onClick={() => setTab('assets')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'assets' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
            Uniforms & Assets
          </button>
          <button type="button" onClick={() => setTab('fleet')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'fleet' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
            Vehicles & Maintenance
          </button>
        </div>
      </div>

      {tab === 'assets' && (
        <div className="space-y-5">
          <form onSubmit={handleIssueAsset} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <select value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value as UniformAssetIssue['category'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Office Uniform">Office Uniform</option>
              <option value="Security Uniform">Security Uniform</option>
              <option value="Cleaner Uniform">Cleaner Uniform</option>
              <option value="Labor Uniform">Construction / Labor Uniform</option>
              <option value="Safety Helmet">Safety Helmet</option>
              <option value="Safety Boots">Safety Boots</option>
              <option value="Reflective Jacket">Reflective Jacket</option>
              <option value="Gloves">Gloves / PPE</option>
              <option value="Staff ID Card">Staff ID Card</option>
              <option value="Company Bag">Company Bag</option>
              <option value="Laptop">Laptop</option>
              <option value="Phone">Phone</option>
              <option value="Office Equipment">Office Equipment</option>
            </select>
            <input type="text" required placeholder="Item Name / Spec *" value={assetForm.itemName} onChange={(e) => setAssetForm({ ...assetForm, itemName: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <select value={assetForm.employeeId} onChange={(e) => setAssetForm({ ...assetForm, employeeId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="">Assign Employee...</option>
              {state.employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>)}
            </select>
            <button type="submit" className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-[#1178B9] text-white font-medium cursor-pointer">
              <Shirt className="w-3.5 h-3.5" /> Issue Property / Uniform
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item Code</th>
                  <th className="px-4 py-3 font-semibold">Property / Uniform</th>
                  <th className="px-4 py-3 font-semibold">Issued To</th>
                  <th className="px-4 py-3 font-semibold">Date Issued</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.uniformAssets.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{a.itemCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{a.itemName}</div>
                      <div className="text-slate-500">{a.category} · Qty {a.quantity}</div>
                    </td>
                    <td className="px-4 py-3">{a.employeeName} ({a.department})</td>
                    <td className="px-4 py-3 font-mono">{a.dateIssued}</td>
                    <td className="px-4 py-3 font-medium">{a.status}</td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={a.status}
                        onChange={(e) =>
                          void mutate(
                            'uniformAssets',
                            'update',
                            a.id,
                            {
                              status: e.target.value,
                              actualReturnDate: e.target.value === 'Returned' ? today : a.actualReturnDate,
                            },
                            a.version
                          )
                        }
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                      >
                        <option value="Issued">Issued</option>
                        <option value="Returned">Returned</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'fleet' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form onSubmit={handleRegisterVehicle} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm"><Car className="w-4 h-4 text-[#087CEB]" /> Register Vehicle / Equipment</div>
              <div className="grid grid-cols-2 gap-2.5">
                <input type="text" required placeholder="Plate No. (ET-3-B...) *" value={vehForm.plateNumber} onChange={(e) => setVehForm({ ...vehForm, plateNumber: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <input type="text" required placeholder="Model / Equipment Name *" value={vehForm.model} onChange={(e) => setVehForm({ ...vehForm, model: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="text" placeholder="Assigned Driver" value={vehForm.assignedDriver} onChange={(e) => setVehForm({ ...vehForm, assignedDriver: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="number" placeholder="Current Odometer (km)" value={vehForm.mileageKm} onChange={(e) => setVehForm({ ...vehForm, mileageKm: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <input type="date" title="Insurance Expiry" value={vehForm.insuranceExpiry} onChange={(e) => setVehForm({ ...vehForm, insuranceExpiry: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <button type="submit" className="px-3 py-2 rounded-lg bg-[#082B59] text-white font-medium cursor-pointer">Save Vehicle</button>
              </div>
            </form>

            <form onSubmit={handleAddVehicleLog} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm"><Plus className="w-4 h-4 text-[#087CEB]" /> Log Fuel, Maintenance or Repair</div>
              <div className="grid grid-cols-2 gap-2.5">
                <select value={logForm.vehicleId} onChange={(e) => setLogForm({ ...logForm, vehicleId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="">Select Vehicle...</option>
                  {state.vehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber} · {v.model}</option>)}
                </select>
                <select value={logForm.logType} onChange={(e) => setLogForm({ ...logForm, logType: e.target.value as VehicleLog['logType'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="Maintenance">Maintenance Service</option>
                  <option value="Fuel">Fuel Refill</option>
                  <option value="Repair">Repair Expense</option>
                  <option value="Trip">Trip Log</option>
                </select>
                <input type="number" placeholder="Cost (ETB)" value={logForm.costEtb || ''} onChange={(e) => setLogForm({ ...logForm, costEtb: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <input type="text" placeholder="Workshop / Station" value={logForm.vendorOrWorkshop} onChange={(e) => setLogForm({ ...logForm, vendorOrWorkshop: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="text" required placeholder="Service / Fuel Details *" value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <button type="submit" disabled={state.vehicles.length === 0} className="col-span-2 px-3 py-2 rounded-lg bg-[#1178B9] disabled:opacity-50 text-white font-medium cursor-pointer">
                  Record Fleet Log
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Plate & Model</th>
                  <th className="px-4 py-3 font-semibold">Driver</th>
                  <th className="px-4 py-3 font-semibold text-right">Mileage</th>
                  <th className="px-4 py-3 font-semibold">Insurance / Service</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.vehicles.map((v) => {
                  const expSoon = v.insuranceExpiry && v.insuranceExpiry <= today;
                  return (
                    <tr key={v.id}>
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{v.plateNumber}</div>
                        <div className="text-slate-500">{v.model} ({v.type})</div>
                      </td>
                      <td className="px-4 py-3">{v.assignedDriver}</td>
                      <td className="px-4 py-3 text-right font-mono">{v.mileageKm.toLocaleString()} km</td>
                      <td className="px-4 py-3 font-mono">
                        <span className={expSoon ? 'text-red-600 font-semibold inline-flex items-center gap-1' : ''}>
                          {expSoon && <ShieldAlert className="w-3.5 h-3.5" />}
                          Ins: {v.insuranceExpiry || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{v.status}</td>
                    </tr>
                  );
                })}
                {state.vehicles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-50" />
                      No vehicles or heavy equipment registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
