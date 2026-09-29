import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { useToast } from '../common/Toast';
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  Boxes
} from 'lucide-react';

interface InventoryViewProps {
  items: InventoryItem[];
  onSaveItems: (items: InventoryItem[]) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ items, onSaveItems }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New item form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Restorative');
  const [brand, setBrand] = useState('3M Oral Care');
  const [currentStock, setCurrentStock] = useState(15);
  const [minThreshold, setMinThreshold] = useState(8);
  const [unit, setUnit] = useState('box');
  const [supplier, setSupplier] = useState('DentalDepot India Ltd.');
  const [costPerUnit, setCostPerUnit] = useState(1200);

  const filteredItems = items.filter(it => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      it.category.toLowerCase().includes(q) ||
      (it.brand && it.brand.toLowerCase().includes(q))
    );
  });

  const handleRestock = (id: string, amount: number) => {
    const updated = items.map(it => {
      if (it.id === id) {
        const stock = (it.currentStock ?? it.quantity ?? 0) + amount;
        return {
          ...it,
          currentStock: stock,
          quantity: stock,
          status: (stock <= it.minThreshold ? 'low_stock' : 'in_stock') as 'low_stock' | 'in_stock'
        };
      }
      return it;
    });
    onSaveItems(updated);
    showToast(`Restocked item (+${amount})`, 'success');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = Number(currentStock);
    const threshold = Number(minThreshold);
    const newItem: InventoryItem = {
      id: `inv-item-${Date.now()}`,
      name,
      category,
      brand,
      sku: `DF-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      currentStock: stock,
      quantity: stock,
      minThreshold: threshold,
      unit,
      costPerUnit: Number(costPerUnit),
      supplier,
      expiryDate: '2028-12-31',
      location: 'Central Storage Cabinet A',
      status: stock <= threshold ? 'low_stock' : 'in_stock',
      lastRestocked: new Date().toISOString().split('T')[0]
    };

    onSaveItems([newItem, ...items]);
    setIsAddModalOpen(false);
    showToast(`Added ${newItem.name} to clinic stock`, 'success');
  };

  const lowStockCount = items.filter(
    i => (i.currentStock ?? i.quantity ?? 0) <= i.minThreshold
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8B58D]">
            CLINIC SUPPLY &bull; STERILIZATION
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#252525]">
            Inventory &amp; Supplies
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Monitor clinical consumables, rotary files, anesthesia carpules, and dental materials.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Total Tracked SKUs</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">{items.length}</p>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">In Healthy Stock</div>
          <p className="text-2xl font-bold text-[#3B4D3A] mt-1">
            {items.length - lowStockCount}
          </p>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Low Stock Reorders</div>
          <p className="text-2xl font-bold text-[#594723] mt-1">{lowStockCount}</p>
        </div>
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-[#6F6D69]">Active Suppliers</div>
          <p className="text-2xl font-bold text-[#252525] mt-1">4</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search materials, supplier, category..."
          className="w-full text-xs bg-transparent focus:outline-none text-gray-800"
        />
      </div>

      {/* Items Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Item Name &amp; Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map(it => {
                const stock = it.currentStock ?? it.quantity ?? 0;
                const isLow = stock <= it.minThreshold;
                return (
                  <tr key={it.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-900 block">{it.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {it.brand || 'DentiFlow Supply'} &bull; SKU: {it.sku}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-600">{it.category}</td>

                    <td className="py-3 px-4 font-bold text-gray-900">
                      {stock} {it.unit}
                    </td>

                    <td className="py-3 px-4 text-gray-500">
                      Min {it.minThreshold} {it.unit}
                    </td>

                    <td className="py-3 px-4 text-gray-600">{it.supplier}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          !isLow
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {!isLow ? 'IN STOCK' : 'LOW STOCK'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRestock(it.id, 10)}
                          className="px-2 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+10</span>
                        </button>
                        <button
                          onClick={() => handleRestock(it.id, 50)}
                          className="px-2 py-1 text-[11px] font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition cursor-pointer"
                        >
                          +50
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Add Stock Item</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Item Description / Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sodium Hypochlorite 3% Endodontic Irrigant"
                  required
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Restorative">Restorative</option>
                    <option value="Anesthesia">Anesthesia</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Personal Protective">PPE &amp; Sterilization</option>
                    <option value="Impression">Impression &amp; Prosthetics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Packaging Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="e.g. bottles, boxes, carpules"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={e => setCurrentStock(Number(e.target.value))}
                    required
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Minimum Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={minThreshold}
                    onChange={e => setMinThreshold(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Supplier / Distributor
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder="e.g. DentalDepot India Ltd."
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-2xs cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
