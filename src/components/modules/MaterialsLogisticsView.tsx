import React, { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, ClipboardList, Printer, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { MaterialRequest, StockTransaction } from '../../types/erp';
import { SevenSundayLogo } from '../common/SevenSundayLogo';
import { QrCodeCanvas } from '../common/QrCodeCanvas';

export const MaterialsLogisticsView: React.FC = () => {
  const { state, currentUser, currentRole, mutate } = useErp();
  const [tab, setTab] = useState<'grn_gin' | 'requests' | 'history'>('grn_gin');
  const [printTx, setPrintTx] = useState<StockTransaction | null>(null);

  const [txForm, setTxForm] = useState({
    type: 'GRN' as StockTransaction['type'],
    productId: '',
    quantity: 1,
    warehouseId: 'wh_main',
    targetWarehouseName: '',
    department: 'Manufacturing & Production',
    destination: '',
    supplierName: '',
    senderName: '',
    receivedPerson: '',
    driverName: '',
    vehiclePlate: '',
    condition: 'Good' as StockTransaction['condition'],
    signatureText: '',
    notes: '',
  });

  const [reqForm, setReqForm] = useState({
    productId: '',
    quantity: 1,
    department: 'Manufacturing & Production',
    purpose: '',
    urgency: 'Normal' as MaterialRequest['urgency'],
  });

  if (!state) return null;

  const handleSubmitStockTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = state.products.find((p) => p.id === txForm.productId) ?? state.products[0];
    if (!prod) return;
    if (txForm.type === 'Adjustment' && !currentRole?.canAdjustStock) return;

    const wh = state.warehouses.find((w) => w.id === txForm.warehouseId) ?? state.warehouses[0];
    const id = `stx_${Date.now()}`;
    const prefix = txForm.type === 'GRN' ? 'GRN' : txForm.type === 'GIN' ? 'GIN' : txForm.type.slice(0, 3).toUpperCase();
    const docNumber = `${prefix}-2026-${String(state.stockTransactions.length + 1).padStart(4, '0')}`;

    const rec: StockTransaction = {
      id,
      docNumber,
      type: txForm.type,
      productId: prod.id,
      itemCode: prod.itemCode,
      productName: prod.name,
      quantity: Number(txForm.quantity),
      unit: prod.unit,
      unitCost: prod.purchasePrice,
      warehouseId: wh?.id || 'wh_main',
      warehouseName: wh?.name || 'Central Warehouse',
      targetWarehouseName: txForm.targetWarehouseName,
      department: txForm.department,
      destination: txForm.destination,
      supplierName: txForm.supplierName,
      senderName: txForm.senderName,
      receivedPerson: txForm.receivedPerson || currentUser?.fullName,
      driverName: txForm.driverName,
      vehiclePlate: txForm.vehiclePlate,
      condition: txForm.condition,
      approvedBy: currentUser?.fullName,
      issuedBy: currentUser?.fullName,
      signatureText: txForm.signatureText || currentUser?.fullName,
      notes: txForm.notes,
      date: new Date().toISOString().slice(0, 10),
      status: 'Completed',
      version: 1,
    };

    await mutate('stockTransactions', 'create', id, rec);
    setPrintTx(rec);
  };

  const handleCreateMaterialRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = state.products.find((p) => p.id === reqForm.productId) ?? state.products[0];
    if (!prod) return;
    const id = `mr_${Date.now()}`;
    const rec: MaterialRequest = {
      id,
      requestNumber: `MR-2026-${String(state.materialRequests.length + 1).padStart(4, '0')}`,
      requestedBy: currentUser?.fullName || 'Staff',
      department: reqForm.department,
      productId: prod.id,
      productName: prod.name,
      quantity: Number(reqForm.quantity),
      unit: prod.unit,
      purpose: reqForm.purpose,
      urgency: reqForm.urgency,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      version: 1,
    };
    await mutate('materialRequests', 'create', id, rec);
    setReqForm({ ...reqForm, purpose: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Materials, Goods Receiving (GRN), Issuing (GIN) & Audit
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capture GRN/GIN vehicle & driver logs, stock transfers, physical audits, and material request workflows
          </p>
        </div>

        <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
          <button type="button" onClick={() => setTab('grn_gin')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'grn_gin' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
            GRN / GIN / Transfer
          </button>
          <button type="button" onClick={() => setTab('requests')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'requests' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
            Material Requests
          </button>
          <button type="button" onClick={() => setTab('history')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${tab === 'history' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
            Audit Ledger ({state.stockTransactions.length})
          </button>
        </div>
      </div>

      {tab === 'grn_gin' && (
        <form onSubmit={handleSubmitStockTx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs no-print">
          <div className="flex flex-wrap gap-2">
            {(['GRN', 'GIN', 'Transfer', 'Return', 'Damage', 'Audit', ...(currentRole?.canAdjustStock ? ['Adjustment'] : [])] as StockTransaction['type'][]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxForm({ ...txForm, type: t })}
                className={`px-3 py-1.5 rounded-lg font-medium border cursor-pointer ${
                  txForm.type === t
                    ? 'bg-[#082B59] text-white border-[#082B59]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t === 'GRN' ? 'Goods Receiving (GRN)' : t === 'GIN' ? 'Goods Issuing (GIN)' : t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <select value={txForm.productId} onChange={(e) => setTxForm({ ...txForm, productId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="">Select Product / Material *</option>
              {state.products.map((p) => <option key={p.id} value={p.id}>{p.itemCode} · {p.name} ({p.quantity} {p.unit})</option>)}
            </select>
            <input type="number" min={1} required placeholder="Quantity" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <select value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              {state.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={txForm.condition} onChange={(e) => setTxForm({ ...txForm, condition: e.target.value as StockTransaction['condition'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="Good">Condition: Good</option>
              <option value="Partial Damage">Partial Damage</option>
              <option value="Damaged">Damaged</option>
              <option value="Expired">Expired</option>
            </select>

            <input type="text" placeholder="Sender / Supplier Name" value={txForm.senderName} onChange={(e) => setTxForm({ ...txForm, senderName: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="Received / Receiving Person" value={txForm.receivedPerson} onChange={(e) => setTxForm({ ...txForm, receivedPerson: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="Driver Full Name" value={txForm.driverName} onChange={(e) => setTxForm({ ...txForm, driverName: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="Vehicle Plate No." value={txForm.vehiclePlate} onChange={(e) => setTxForm({ ...txForm, vehiclePlate: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <select value={txForm.department} onChange={(e) => setTxForm({ ...txForm, department: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              {state.departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <input type="text" placeholder="Destination / Target Warehouse" value={txForm.destination} onChange={(e) => setTxForm({ ...txForm, destination: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="Digital Signature Name" value={txForm.signatureText} onChange={(e) => setTxForm({ ...txForm, signatureText: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <input type="text" placeholder="Notes / Waybill #" value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
          </div>

          <button type="submit" disabled={state.products.length === 0} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] disabled:opacity-50 text-white font-medium cursor-pointer">
            {txForm.type === 'GRN' ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
            Submit {txForm.type} & Update Stock Balance
          </button>
        </form>
      )}

      {tab === 'requests' && (
        <div className="space-y-5 no-print">
          <form onSubmit={handleCreateMaterialRequest} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            <select value={reqForm.productId} onChange={(e) => setReqForm({ ...reqForm, productId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="">Material / Item...</option>
              {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" min={1} value={reqForm.quantity} onChange={(e) => setReqForm({ ...reqForm, quantity: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
            <select value={reqForm.department} onChange={(e) => setReqForm({ ...reqForm, department: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              {state.departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <input type="text" required placeholder="Purpose / Batch *" value={reqForm.purpose} onChange={(e) => setReqForm({ ...reqForm, purpose: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            <button type="submit" disabled={state.products.length === 0} className="px-4 py-2 rounded-lg bg-[#1178B9] text-white font-medium cursor-pointer">
              Submit Request
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Request #</th>
                  <th className="px-4 py-3 font-semibold">Material & Qty</th>
                  <th className="px-4 py-3 font-semibold">Requester & Dept</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.materialRequests.map((mr) => (
                  <tr key={mr.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{mr.requestNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{mr.productName}</div>
                      <div className="font-mono text-slate-500">{mr.quantity} {mr.unit} · {mr.purpose}</div>
                    </td>
                    <td className="px-4 py-3">{mr.requestedBy} · {mr.department}</td>
                    <td className="px-4 py-3 font-medium">{mr.status}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {currentRole?.canApprove && mr.status === 'Pending' && (
                        <button type="button" onClick={() => void mutate('materialRequests', 'update', mr.id, { status: 'Approved', approvedBy: currentUser?.fullName }, mr.version)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white cursor-pointer">
                          <Check className="w-3 h-3" /> Approve
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

      {/* Transaction History Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-print">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold">
          <ClipboardList className="w-4 h-4 text-[#087CEB]" />
          <span>Material & Warehouse Transaction Ledger</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Doc #</th>
              <th className="px-4 py-3 font-semibold">Type & Item</th>
              <th className="px-4 py-3 font-semibold text-right">Qty</th>
              <th className="px-4 py-3 font-semibold">Driver / Vehicle</th>
              <th className="px-4 py-3 font-semibold">Condition</th>
              <th className="px-4 py-3 font-semibold text-right">Voucher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.stockTransactions.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{t.docNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{t.type}: {t.productName}</div>
                  <div className="text-slate-500">{t.warehouseName} · {t.date}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{t.quantity} {t.unit}</td>
                <td className="px-4 py-3 font-mono">{t.driverName || '—'} {t.vehiclePlate ? `(${t.vehiclePlate})` : ''}</td>
                <td className="px-4 py-3">{t.condition}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => setPrintTx(t)} className="inline-flex items-center gap-1 text-[#087CEB] hover:underline cursor-pointer">
                    <Printer className="w-3 h-3" /> Print Voucher
                  </button>
                </td>
              </tr>
            ))}
            {state.stockTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No GRN / GIN or material transactions recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Printable GRN / GIN Voucher Modal */}
      {printTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white text-[#15243A] rounded-2xl p-6 max-w-xl w-full space-y-4 print-surface">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-3">
                <SevenSundayLogo customLogoUrl={state.companySettings.customLogoDataUrl} size="sm" />
                <div>
                  <div className="font-bold text-sm text-[#082B59]">{state.companySettings.companyName}</div>
                  <div className="text-xs text-slate-500">Official {printTx.type} Voucher — {printTx.docNumber}</div>
                </div>
              </div>
              <QrCodeCanvas value={`SSE-STX|${printTx.docNumber}|${printTx.itemCode}|${printTx.quantity}`} size={64} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs bg-[#F5F8FC] p-3 rounded-lg">
              <div>Item: <strong>{printTx.productName}</strong> ({printTx.itemCode})</div>
              <div className="font-mono">Quantity: <strong>{printTx.quantity} {printTx.unit}</strong></div>
              <div>Warehouse: {printTx.warehouseName}</div>
              <div>Date: {printTx.date}</div>
              <div>Sender / Supplier: {printTx.senderName || printTx.supplierName || 'Internal'}</div>
              <div>Receiver: {printTx.receivedPerson || '—'}</div>
              <div>Driver: {printTx.driverName || '—'}</div>
              <div className="font-mono">Vehicle Plate: {printTx.vehiclePlate || '—'}</div>
              <div>Condition: {printTx.condition}</div>
              <div>Signed By: {printTx.signatureText || printTx.issuedBy}</div>
            </div>
            <div className="flex justify-end gap-2 no-print">
              <button type="button" onClick={() => setPrintTx(null)} className="px-3 py-1.5 rounded-lg border text-xs cursor-pointer flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Close
              </button>
              <button type="button" onClick={() => window.print()} className="px-4 py-1.5 rounded-lg bg-[#1178B9] text-white text-xs cursor-pointer flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
