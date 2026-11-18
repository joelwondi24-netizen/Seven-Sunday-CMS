import React, { useState } from 'react';
import { Check, Plus, Printer, ShoppingBag, Truck, Users, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { Customer, PurchaseOrder, SalesInvoice, Supplier } from '../../types/erp';
import { SevenSundayLogo } from '../common/SevenSundayLogo';

interface ProcurementSalesViewProps {
  initialMode?: 'purchasing' | 'sales';
}

export const ProcurementSalesView: React.FC<ProcurementSalesViewProps> = ({ initialMode = 'purchasing' }) => {
  const { state, currentUser, currentRole, mutate } = useErp();
  const [mode, setMode] = useState<'purchasing' | 'sales'>(initialMode);
  const [printInvoice, setPrintInvoice] = useState<SalesInvoice | null>(null);

  const [supForm, setSupForm] = useState({ name: '', contactPerson: '', phone: '', email: '', tinNumber: '', category: 'Raw Materials' });
  const [poForm, setPoForm] = useState({ supplierId: '', productId: '', quantity: 10, unitPrice: 100, quotationRef: '' });

  const [custForm, setCustForm] = useState({ name: '', contactPerson: '', phone: '', email: '', tinNumber: '', creditLimit: 250000 });
  const [invForm, setInvForm] = useState({ customerId: '', productId: '', quantity: 5, discount: 0, type: 'Invoice' as SalesInvoice['type'] });

  if (!state) return null;

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `sup_${Date.now()}`;
    const rec: Supplier = {
      id,
      code: `SUP-${String(state.suppliers.length + 1).padStart(3, '0')}`,
      ...supForm,
      address: 'Addis Ababa, Ethiopia',
      balancePayable: 0,
      rating: 5,
      version: 1,
    };
    await mutate('suppliers', 'create', id, rec);
    setSupForm({ name: '', contactPerson: '', phone: '', email: '', tinNumber: '', category: 'Raw Materials' });
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = state.suppliers.find((s) => s.id === poForm.supplierId) ?? state.suppliers[0];
    const prod = state.products.find((p) => p.id === poForm.productId) ?? state.products[0];
    if (!sup || !prod) return;
    const subtotal = Number(poForm.quantity) * Number(poForm.unitPrice || prod.purchasePrice);
    const vatAmount = Number(((subtotal * state.companySettings.vatRatePercent) / 100).toFixed(2));
    const id = `po_${Date.now()}`;
    const rec: PurchaseOrder = {
      id,
      poNumber: `PO-2026-${String(state.purchaseOrders.length + 1).padStart(4, '0')}`,
      supplierId: sup.id,
      supplierName: sup.name,
      items: [{ productId: prod.id, itemCode: prod.itemCode, name: prod.name, quantity: Number(poForm.quantity), unitPrice: Number(poForm.unitPrice || prod.purchasePrice), total: subtotal }],
      subtotal,
      vatAmount,
      totalAmount: subtotal + vatAmount,
      expectedDate: new Date().toISOString().slice(0, 10),
      status: 'Pending Approval',
      quotationRef: poForm.quotationRef,
      createdAt: new Date().toISOString(),
      version: 1,
    };
    await mutate('purchaseOrders', 'create', id, rec);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `cust_${Date.now()}`;
    const rec: Customer = {
      id,
      code: `CUST-${String(state.customers.length + 1).padStart(3, '0')}`,
      ...custForm,
      address: 'Addis Ababa, Ethiopia',
      balanceReceivable: 0,
      version: 1,
    };
    await mutate('customers', 'create', id, rec);
    setCustForm({ name: '', contactPerson: '', phone: '', email: '', tinNumber: '', creditLimit: 250000 });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = state.customers.find((c) => c.id === invForm.customerId) ?? state.customers[0];
    const prod = state.products.find((p) => p.id === invForm.productId) ?? state.products[0];
    if (!cust || !prod) return;
    const lineTotal = Number(invForm.quantity) * prod.sellingPrice;
    const subtotal = Math.max(0, lineTotal - Number(invForm.discount || 0));
    const vatAmount = Number(((subtotal * state.companySettings.vatRatePercent) / 100).toFixed(2));
    const id = `inv_${Date.now()}`;
    const rec: SalesInvoice = {
      id,
      invoiceNumber: `${invForm.type === 'Quotation' ? 'QTN' : 'INV'}-2026-${String(state.salesInvoices.length + 1).padStart(4, '0')}`,
      type: invForm.type,
      customerId: cust.id,
      customerName: cust.name,
      items: [{ productId: prod.id, itemCode: prod.itemCode, name: prod.name, quantity: Number(invForm.quantity), unitPrice: prod.sellingPrice, total: lineTotal }],
      discount: Number(invForm.discount || 0),
      subtotal,
      vatAmount,
      totalAmount: subtotal + vatAmount,
      paidAmount: 0,
      status: 'Confirmed',
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      version: 1,
    };
    await mutate('salesInvoices', 'create', id, rec);
    setPrintInvoice(rec);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Procurement, Purchasing, Sales & CRM
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Integrated supplier POs, customer invoices, automatic inventory updates, and finance posting
          </p>
        </div>

        <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
          <button type="button" onClick={() => setMode('purchasing')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${mode === 'purchasing' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
            Purchasing & Suppliers
          </button>
          <button type="button" onClick={() => setMode('sales')} className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${mode === 'sales' ? 'bg-white dark:bg-slate-900 text-[#082B59] dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
            Sales & Customers
          </button>
        </div>
      </div>

      {mode === 'purchasing' && (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form onSubmit={handleAddSupplier} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm"><Truck className="w-4 h-4 text-[#087CEB]" /> Register Supplier</div>
              <div className="grid grid-cols-2 gap-2.5">
                <input type="text" required placeholder="Supplier Company Name *" value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="text" placeholder="Contact Person" value={supForm.contactPerson} onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="text" placeholder="Phone" value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="text" placeholder="TIN Number" value={supForm.tinNumber} onChange={(e) => setSupForm({ ...supForm, tinNumber: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <button type="submit" className="px-3 py-2 rounded-lg bg-[#082B59] text-white font-medium cursor-pointer">Save Supplier</button>
              </div>
            </form>

            <form onSubmit={handleCreatePO} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm"><ShoppingBag className="w-4 h-4 text-[#087CEB]" /> Create Purchase Order</div>
              <div className="grid grid-cols-2 gap-2.5">
                <select value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="">Select Supplier...</option>
                  {state.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={poForm.productId} onChange={(e) => setPoForm({ ...poForm, productId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="">Select Product...</option>
                  {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min={1} placeholder="Quantity" value={poForm.quantity} onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <input type="number" placeholder="Unit Price (ETB)" value={poForm.unitPrice} onChange={(e) => setPoForm({ ...poForm, unitPrice: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <input type="text" placeholder="Supplier Quotation Ref" value={poForm.quotationRef} onChange={(e) => setPoForm({ ...poForm, quotationRef: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <button type="submit" disabled={state.suppliers.length === 0 || state.products.length === 0} className="px-3 py-2 rounded-lg bg-[#1178B9] disabled:opacity-50 text-white font-medium cursor-pointer">
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">PO #</th>
                  <th className="px-4 py-3 font-semibold">Supplier & Items</th>
                  <th className="px-4 py-3 font-semibold text-right">Total (incl. VAT)</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.purchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{po.poNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{po.supplierName}</div>
                      <div className="text-slate-500">{po.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{po.totalAmount.toLocaleString()} ETB</td>
                    <td className="px-4 py-3">{po.status}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {currentRole?.canApprove && po.status === 'Pending Approval' && (
                        <button type="button" onClick={() => void mutate('purchaseOrders', 'update', po.id, { status: 'Approved', approvedBy: currentUser?.fullName }, po.version)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white cursor-pointer">
                          <Check className="w-3 h-3" /> Approve PO
                        </button>
                      )}
                      {po.status === 'Approved' && (
                        <button type="button" onClick={() => void mutate('purchaseOrders', 'update', po.id, { status: 'Received' }, po.version)} className="px-2.5 py-1 rounded bg-[#1178B9] text-white cursor-pointer">
                          Mark Received
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

      {mode === 'sales' && (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form onSubmit={handleAddCustomer} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm"><Users className="w-4 h-4 text-[#087CEB]" /> Register Customer</div>
              <div className="grid grid-cols-2 gap-2.5">
                <input type="text" required placeholder="Customer / Company Name *" value={custForm.name} onChange={(e) => setCustForm({ ...custForm, name: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="text" placeholder="Contact Person" value={custForm.contactPerson} onChange={(e) => setCustForm({ ...custForm, contactPerson: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="text" placeholder="Phone" value={custForm.phone} onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
                <input type="text" placeholder="TIN Number" value={custForm.tinNumber} onChange={(e) => setCustForm({ ...custForm, tinNumber: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <button type="submit" className="px-3 py-2 rounded-lg bg-[#082B59] text-white font-medium cursor-pointer">Save Customer</button>
              </div>
            </form>

            <form onSubmit={handleCreateInvoice} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm"><Plus className="w-4 h-4 text-[#087CEB]" /> Create Sales Document (Auto Stock & Finance)</div>
              <div className="grid grid-cols-2 gap-2.5">
                <select value={invForm.type} onChange={(e) => setInvForm({ ...invForm, type: e.target.value as SalesInvoice['type'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="Invoice">Sales Invoice</option>
                  <option value="Quotation">Quotation</option>
                  <option value="Sales Order">Sales Order</option>
                  <option value="Delivery Note">Delivery Note</option>
                </select>
                <select value={invForm.customerId} onChange={(e) => setInvForm({ ...invForm, customerId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="">Select Customer...</option>
                  {state.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={invForm.productId} onChange={(e) => setInvForm({ ...invForm, productId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <option value="">Select Product...</option>
                  {state.products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sellingPrice} ETB)</option>)}
                </select>
                <input type="number" min={1} placeholder="Quantity" value={invForm.quantity} onChange={(e) => setInvForm({ ...invForm, quantity: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <input type="number" min={0} placeholder="Discount (ETB)" value={invForm.discount} onChange={(e) => setInvForm({ ...invForm, discount: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
                <button type="submit" disabled={state.customers.length === 0 || state.products.length === 0} className="px-3 py-2 rounded-lg bg-[#1178B9] disabled:opacity-50 text-white font-medium cursor-pointer">
                  Issue {invForm.type}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Doc #</th>
                  <th className="px-4 py-3 font-semibold">Customer & Items</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-right">Paid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.salesInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{inv.customerName}</div>
                      <div className="text-slate-500">{inv.type} · {inv.date}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{inv.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{inv.paidAmount.toLocaleString()}</td>
                    <td className="px-4 py-3">{inv.status}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {inv.paidAmount < inv.totalAmount && (
                        <button type="button" onClick={() => void mutate('salesInvoices', 'update', inv.id, { paidAmount: inv.totalAmount, status: 'Paid' }, inv.version)} className="px-2.5 py-1 rounded bg-emerald-600 text-white cursor-pointer">
                          Mark Paid
                        </button>
                      )}
                      <button type="button" onClick={() => setPrintInvoice(inv)} className="inline-flex items-center gap-1 text-[#087CEB] hover:underline cursor-pointer">
                        <Printer className="w-3 h-3" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {printInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white text-[#15243A] rounded-2xl p-6 max-w-xl w-full space-y-4 print-surface">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-3">
                <SevenSundayLogo customLogoUrl={state.companySettings.customLogoDataUrl} size="sm" />
                <div>
                  <div className="font-bold text-sm text-[#082B59]">{state.companySettings.companyName}</div>
                  <div className="text-xs text-slate-500">{printInvoice.type} — {printInvoice.invoiceNumber}</div>
                </div>
              </div>
              <button type="button" onClick={() => setPrintInvoice(null)} className="no-print text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-xs space-y-1">
              <div>Customer: <strong>{printInvoice.customerName}</strong></div>
              <div>Date: {printInvoice.date} · TIN: {state.companySettings.tinNumber}</div>
            </div>
            <table className="w-full text-xs border-t border-b">
              <thead><tr className="text-left"><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Total</th></tr></thead>
              <tbody>
                {printInvoice.items.map((l, idx) => (
                  <tr key={idx} className="border-t font-mono">
                    <td className="py-2 font-sans">{l.name}</td>
                    <td className="py-2 text-right">{l.quantity}</td>
                    <td className="py-2 text-right">{l.unitPrice.toLocaleString()}</td>
                    <td className="py-2 text-right">{l.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right font-mono text-xs space-y-1">
              <div>Subtotal: {printInvoice.subtotal.toLocaleString()} ETB</div>
              <div>VAT ({state.companySettings.vatRatePercent}%): {printInvoice.vatAmount.toLocaleString()} ETB</div>
              <div className="text-sm font-bold text-[#082B59]">Total: {printInvoice.totalAmount.toLocaleString()} ETB</div>
            </div>
            <div className="flex justify-end gap-2 no-print">
              <button type="button" onClick={() => window.print()} className="px-4 py-1.5 rounded-lg bg-[#1178B9] text-white text-xs cursor-pointer">Print Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
