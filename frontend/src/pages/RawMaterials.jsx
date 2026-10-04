import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Package, Loader2 } from 'lucide-react';
import Loader from '../components/common/Loader';
import Toast from '../components/common/Toast';

const RawMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Form State
  const [materialName, setMaterialName] = useState('');
  const [size, setSize] = useState('');
  const [colourType, setColourType] = useState('NA');
  const [unit, setUnit] = useState('KG');
  const [defaultRate, setDefaultRate] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/raw-materials');
      if (res.data.success) {
        setMaterials(res.data.materials);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to fetch raw materials', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!materialName) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/raw-materials', {
        materialName,
        size,
        colourType,
        unit,
        defaultRate: Number(defaultRate) || 0,
      });
      if (res.data.success) {
        setMaterials([...materials, res.data.material]);
        setShowModal(false);
        setToastMsg({ text: 'Item added successfully', type: 'success' });
        // Reset form
        setMaterialName('');
        setSize('');
        setColourType('NA');
        setUnit('KG');
        setDefaultRate('');
      }
    } catch (error) {
      setToastMsg({ text: error.response?.data?.message || 'Failed to add item', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            Raw Materials (Items)
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-1">
            Manage your raw material catalogue and stock
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-bold shadow-sm shadow-primary-500/30 transition-all active:scale-95 text-sm"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-slate-200/60 dark:border-slate-700/30 overflow-hidden">
        {loading ? (
          <Loader size="md" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-850/50 text-slate-750 dark:text-slate-300 font-bold border-b border-slate-200/60 dark:border-slate-700/50">
                <tr>
                  <th className="py-4 px-6">Material Name</th>
                  <th className="py-4 px-6">Size</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6 text-right">Default Rate (₹)</th>
                  <th className="py-4 px-6 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {materials.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-850 dark:text-slate-100">{m.materialName}</td>
                    <td className="py-4 px-6">{m.size || '-'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        m.colourType === 'Silver' ? 'bg-slate-100 text-slate-600' :
                        m.colourType === 'Colour' ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-primary-50 text-primary-600'
                      }`}>
                        {m.colourType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium">₹{m.defaultRate}</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-850 dark:text-white">
                      {m.currentStockQty.toFixed(2)} {m.unit}
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">No raw materials found. Add an item!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-850 dark:text-white">Add New Raw Material</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Material Name *</label>
                <input required type="text" placeholder="e.g. Silver Roll, Colour Roll" value={materialName} onChange={e=>setMaterialName(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Size</label>
                  <input type="text" placeholder="e.g. 6 Inch" value={size} onChange={e=>setSize(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                  <select value={colourType} onChange={e=>setColourType(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                    <option value="NA">NA (No Colour)</option>
                    <option value="Silver">Silver</option>
                    <option value="Colour">Colour</option>
                    <option value="Printed">Printed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Unit</label>
                  <select value={unit} onChange={e=>setUnit(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                    <option value="KG">KG</option>
                    <option value="Roll">Roll</option>
                    <option value="Packet">Packet</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Default Rate (₹)</label>
                  <input type="number" step="0.01" value={defaultRate} onChange={e=>setDefaultRate(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold rounded-lg shadow flex items-center">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg.text} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
    </div>
  );
};

export default RawMaterials;
