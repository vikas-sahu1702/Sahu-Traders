import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';
import { Package, Plus, History } from 'lucide-react';

const Purchases = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'history'
  
  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'stock') {
        const res = await api.get('/api/raw-materials');
        if (res.data.success) {
          setMaterials(res.data.materials);
        }
      } else {
        const res = await api.get('/api/purchases');
        if (res.data.success) {
          setPurchases(res.data.purchases);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            Raw Materials & Purchases
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-1">
            Manage factory raw material stock and purchase history
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/purchases/create')}
            className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-bold shadow-sm shadow-primary-500/30 transition-all active:scale-95 text-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Purchase</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'stock'
              ? 'bg-white dark:bg-slate-800 text-primary-500 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Current Stock</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-800 text-primary-500 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Purchase History</span>
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-slate-200/60 dark:border-slate-700/30 overflow-hidden">
        {loading ? (
          <Loader size="md" />
        ) : activeTab === 'stock' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-850/50 text-slate-750 dark:text-slate-300 font-bold border-b border-slate-200/60 dark:border-slate-700/50">
                <tr>
                  <th className="py-4 px-6">Material Name</th>
                  <th className="py-4 px-6">Size</th>
                  <th className="py-4 px-6">Type (Colour/Silver)</th>
                  <th className="py-4 px-6 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {materials.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-850 dark:text-slate-100">{m.materialName}</td>
                    <td className="py-4 px-6">{m.size}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        m.colourType === 'Silver' ? 'bg-slate-100 text-slate-600' :
                        m.colourType === 'Colour' ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-primary-50 text-primary-600'
                      }`}>
                        {m.colourType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-850 dark:text-white">
                      {m.currentStockQty.toFixed(2)} {m.unit}
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">No raw materials found. Add a purchase to create stock.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-850/50 text-slate-750 dark:text-slate-300 font-bold border-b border-slate-200/60 dark:border-slate-700/50">
                <tr>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Supplier</th>
                  <th className="py-4 px-6">Material</th>
                  <th className="py-4 px-6 text-right">Quantity</th>
                  <th className="py-4 px-6 text-right">Rate</th>
                  <th className="py-4 px-6 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6 font-medium">{formatDate(p.purchaseDate)}</td>
                    <td className="py-4 px-6 font-bold text-slate-850 dark:text-slate-100">{p.supplierName}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold">{p.material?.materialName}</div>
                      <div className="text-xs text-slate-400">{p.material?.size} | {p.material?.colourType}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold">
                      {p.quantity} {p.material?.unit}
                    </td>
                    <td className="py-4 px-6 text-right">{formatCurrency(p.ratePerUnit)}</td>
                    <td className="py-4 px-6 text-right font-bold text-primary-500">{formatCurrency(p.totalAmount)}</td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">No purchases found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchases;
