import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';
import { Plus } from 'lucide-react';

const Purchases = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/purchases');
      if (res.data.success) {
        setPurchases(res.data.purchases);
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
            Purchase History
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-1">
            View all your raw material purchases
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

      <div className="glass-panel rounded-xl border border-slate-200/60 dark:border-slate-700/30 overflow-hidden">
        {loading ? (
          <Loader size="md" />
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
                    <td className="py-4 px-6 font-bold text-slate-850 dark:text-slate-100">{p.supplier?.name || '-'}</td>
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
