import React, { useMemo, useState } from 'react';
import { Download, Package, Plus, QrCode, Search, Trash2, Warehouse as WhIcon, X } from 'lucide-react';
import { useErp } from '../../context/ErpContext';
import type { Product, Warehouse } from '../../types/erp';
import { QrCodeCanvas } from '../common/QrCodeCanvas';
import { downloadCsv } from '../../utils/exportUtils';

export const InventoryWarehouseView: React.FC = () => {
  const { state, currentRole, mutate } = useErp();
  const [search, setSearch] = useState('');
  const [whFilter, setWhFilter] = useState('All');
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [showProdForm, setShowProdForm] = useState(false);

  const [prodForm, setProdForm] = useState({
    itemCode: '',
    barcode: '',
    name: '',
    category: 'Finished Product' as Product['category'],
    unit: 'Pcs',
    purchasePrice: 0,
    sellingPrice: 0,
    quantity: 0,
    minStockLevel: 20,
    warehouseId: 'wh_main',
  });

  const [whForm, setWhForm] = useState({ name: '', code: '', location: '', managerName: '' });

  const filtered = useMemo(() => {
    if (!state) return [];
    const q = search.toLowerCase();
    return state.products.filter((p) => {
      if (whFilter !== 'All' && p.warehouseId !== whFilter) return false;
      return p.name.toLowerCase().includes(q) || p.itemCode.toLowerCase().includes(q) || p.barcode.includes(q);
    });
  }, [search, state, whFilter]);

  if (!state) return null;

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const wh = state.warehouses.find((w) => w.id === prodForm.warehouseId) ?? state.warehouses[0];
    const id = `prod_${Date.now()}`;
    const code = prodForm.itemCode || `SS-${String(state.products.length + 101)}`;
    const barcode = prodForm.barcode || `629104${Date.now().toString().slice(-7)}`;
    const qty = Number(prodForm.quantity);
    const min = Number(prodForm.minStockLevel);
    const rec: Product = {
      id,
      itemCode: code,
      barcode,
      name: prodForm.name,
      category: prodForm.category,
      unit: prodForm.unit,
      purchasePrice: Number(prodForm.purchasePrice),
      sellingPrice: Number(prodForm.sellingPrice),
      quantity: qty,
      minStockLevel: min,
      warehouseId: wh?.id || 'wh_main',
      warehouseName: wh?.name || 'Central Warehouse',
      status: qty <= 0 ? 'Out of Stock' : qty <= min ? 'Low Stock' : 'Active',
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    await mutate('products', 'create', id, rec);
    setShowProdForm(false);
    setProdForm({ ...prodForm, itemCode: '', barcode: '', name: '', quantity: 0 });
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.name) return;
    const id = `wh_${Date.now()}`;
    const rec: Warehouse = { id, ...whForm, capacityNote: 'Active storage facility' };
    await mutate('warehouses', 'create', id, rec);
    setWhForm({ name: '', code: '', location: '', managerName: '' });
  };

  const totalStockValue = filtered.reduce((s, p) => s + p.quantity * p.purchasePrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#15243A] dark:text-white">
            Inventory Pro, Products & Warehouses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Product catalog, barcode & QR labels, multi-warehouse valuation, and RBAC-protected stock control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                'seven-sunday-inventory',
                ['Item Code', 'Barcode', 'Name', 'Category', 'Warehouse', 'Qty', 'Unit', 'Cost', 'Selling', 'Valuation'],
                filtered.map((p) => [p.itemCode, p.barcode, p.name, p.category, p.warehouseName, p.quantity, p.unit, p.purchasePrice, p.sellingPrice, p.quantity * p.purchasePrice])
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Stock
          </button>
          <button
            type="button"
            onClick={() => setShowProdForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1178B9] hover:bg-[#0D6096] text-white text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Register Product
          </button>
        </div>
      </div>

      {showProdForm && (
        <form onSubmit={handleAddProduct} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <input type="text" required placeholder="Product / Material Name *" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
          <input type="text" placeholder="Item Code (auto if empty)" value={prodForm.itemCode} onChange={(e) => setProdForm({ ...prodForm, itemCode: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
          <input type="text" placeholder="Barcode (auto if empty)" value={prodForm.barcode} onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
          <select value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as Product['category'] })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
            <option value="Finished Product">Finished Product</option>
            <option value="Raw Material">Raw Material</option>
            <option value="Construction Material">Construction Material</option>
            <option value="Office Supply">Office Supply</option>
            <option value="Production Material">Production Material</option>
            <option value="Spare Part">Spare Part</option>
          </select>
          <select value={prodForm.warehouseId} onChange={(e) => setProdForm({ ...prodForm, warehouseId: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
            {state.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input type="text" placeholder="Unit (Pcs, Kg, Box)" value={prodForm.unit} onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
          <input type="number" placeholder="Initial Qty" value={prodForm.quantity} onChange={(e) => setProdForm({ ...prodForm, quantity: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
          <input type="number" placeholder="Purchase Price (ETB)" value={prodForm.purchasePrice} onChange={(e) => setProdForm({ ...prodForm, purchasePrice: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
          <input type="number" placeholder="Selling Price (ETB)" value={prodForm.sellingPrice} onChange={(e) => setProdForm({ ...prodForm, sellingPrice: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
          <input type="number" placeholder="Min Stock Alert" value={prodForm.minStockLevel} onChange={(e) => setProdForm({ ...prodForm, minStockLevel: Number(e.target.value) })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#1178B9] text-white font-medium cursor-pointer">
            Save Product
          </button>
        </form>
      )}

      {/* Search & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by item code, barcode, or name..." className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
          <select value={whFilter} onChange={(e) => setWhFilter(e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <option value="All">All Warehouses</option>
            {state.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="text-xs font-mono font-semibold text-[#082B59] dark:text-[#087CEB]">
          Filtered Stock Value: {totalStockValue.toLocaleString()} {state.companySettings.defaultCurrency}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F8FC] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Item Code / Barcode</th>
              <th className="px-4 py-3 font-semibold">Product Name</th>
              <th className="px-4 py-3 font-semibold">Warehouse</th>
              <th className="px-4 py-3 font-semibold text-right">Stock</th>
              <th className="px-4 py-3 font-semibold text-right">Cost / Sell</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-mono">
                  <div className="font-semibold text-[#082B59] dark:text-[#087CEB]">{p.itemCode}</div>
                  <div className="text-[11px] text-slate-500">{p.barcode}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#15243A] dark:text-white">{p.name}</div>
                  <div className="text-slate-500">{p.category}</div>
                </td>
                <td className="px-4 py-3">{p.warehouseName}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">
                  {p.quantity} {p.unit}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {p.purchasePrice.toLocaleString()} / {p.sellingPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={p.status === 'Active' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button type="button" onClick={() => setQrProduct(p)} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <QrCode className="w-3 h-3 text-[#087CEB]" /> Label
                  </button>
                  {currentRole?.canAdjustStock && (
                    <button type="button" onClick={() => void mutate('products', 'delete', p.id, {})} className="p-1 text-slate-400 hover:text-red-600 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  <Package className="w-5 h-5 mx-auto mb-1 opacity-50" />
                  No inventory products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Warehouses Management */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <WhIcon className="w-4 h-4 text-[#087CEB]" />
          <span>Storage Locations & Warehouses ({state.warehouses.length})</span>
        </div>
        <form onSubmit={handleAddWarehouse} className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
          <input type="text" required placeholder="Warehouse Name" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
          <input type="text" required placeholder="Code (WH-03)" value={whForm.code} onChange={(e) => setWhForm({ ...whForm, code: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono" />
          <input type="text" placeholder="Location" value={whForm.location} onChange={(e) => setWhForm({ ...whForm, location: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
          <input type="text" placeholder="Manager" value={whForm.managerName} onChange={(e) => setWhForm({ ...whForm, managerName: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
          <button type="submit" className="px-3 py-2 rounded-lg bg-[#082B59] text-white font-medium cursor-pointer">Add Warehouse</button>
        </form>
      </div>

      {/* Barcode & QR Label Modal */}
      {qrProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white text-[#15243A] rounded-2xl p-6 max-w-sm w-full space-y-4 text-center print-surface">
            <div className="flex justify-between items-center no-print">
              <span className="text-xs font-semibold">Inventory Barcode & QR Label</span>
              <button type="button" onClick={() => setQrProduct(null)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="border-2 border-[#082B59] rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-[#082B59]">{state.companySettings.brandName}</div>
              <div className="text-sm font-semibold">{qrProduct.name}</div>
              <div className="flex justify-center py-2">
                <QrCodeCanvas value={`SSE-ITEM|${qrProduct.itemCode}|${qrProduct.barcode}|${qrProduct.name}`} size={110} />
              </div>
              <div className="font-mono text-xs tracking-widest border-t pt-2">
                SKU: {qrProduct.itemCode} · BAR: {qrProduct.barcode}
              </div>
            </div>
            <button type="button" onClick={() => window.print()} className="w-full py-2 rounded-lg bg-[#1178B9] text-white text-xs font-medium no-print cursor-pointer">
              Print Item Label
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
