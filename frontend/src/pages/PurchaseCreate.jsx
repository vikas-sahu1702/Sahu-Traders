import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Toast from '../components/common/Toast';
import { ArrowLeft, Save, Loader2, Plus } from 'lucide-react';

const PurchaseCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false);

  // Purchase Form
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // New Material Form
  const [newMatName, setNewMatName] = useState('');
  const [newMatSize, setNewMatSize] = useState('');
  const [newMatColour, setNewMatColour] = useState('NA');
  const [newMatUnit, setNewMatUnit] = useState('KG');
  const [newMatDefaultRate, setNewMatDefaultRate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resMat, resSup] = await Promise.all([
        api.get('/api/raw-materials'),
        api.get('/api/suppliers')
      ]);
      if (resMat.data.success) setMaterials(resMat.data.materials);
      if (resSup.data.success) setSuppliers(resSup.data.suppliers);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMaterialChange = (e) => {
    const selectedId = e.target.value;
    setMaterialId(selectedId);
    
    // Auto populate rate
    if (selectedId) {
      const selectedMaterial = materials.find(m => m._id === selectedId);
      if (selectedMaterial && selectedMaterial.defaultRate) {
        setRatePerUnit(selectedMaterial.defaultRate);
      }
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/raw-materials', {
        materialName: newMatName,
        size: newMatSize,
        colourType: newMatColour,
        unit: newMatUnit,
        defaultRate: Number(newMatDefaultRate) || 0
      });
      if (res.data.success) {
        setMaterials([...materials, res.data.material]);
        setMaterialId(res.data.material._id);
        setRatePerUnit(res.data.material.defaultRate || '');
        setShowNewMaterialForm(false);
        setToastMsg({ text: 'New material added to catalogue', type: 'success' });
      }
    } catch (error) {
      setToastMsg({ text: error.response?.data?.message || 'Failed to add material', type: 'error' });
    }
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!materialId || !quantity || !ratePerUnit || !supplierId) {
      setToastMsg({ text: 'Please fill all required fields', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/api/purchases', {
        supplierId,
        purchaseDate,
        materialId,
        quantity: Number(quantity),
        ratePerUnit: Number(ratePerUnit),
        invoiceNumber,
        notes
      });
      if (res.data.success) {
        setToastMsg({ text: 'Purchase logged successfully!', type: 'success' });
        setTimeout(() => navigate('/purchases'), 1000);
      }
    } catch (error) {
      setToastMsg({ text: error.response?.data?.message || 'Failed to log purchase', type: 'error' });
      setSubmitting(false);
    }
  };

  const totalAmount = (Number(quantity) || 0) * (Number(ratePerUnit) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/purchases')}
          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            Log Material Purchase
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30">
          <form onSubmit={handleSavePurchase} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-primary-500/50 outline-none"
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Raw Material Item *</label>
                  <button type="button" onClick={() => setShowNewMaterialForm(!showNewMaterialForm)} className="text-xs font-bold text-primary-500 flex items-center">
                    <Plus className="h-3 w-3 mr-1"/> Add New Item
                  </button>
                </div>
                <select
                  value={materialId}
                  onChange={handleMaterialChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-primary-500/50 outline-none"
                  required
                >
                  <option value="">-- Choose Material Item --</option>
                  {materials.map((m) => (
                    <option key={m._id} value={m._id}>{m.materialName} | Size: {m.size} | {m.colourType} (₹{m.defaultRate})</option>
                  ))}
                </select>
              </div>

              {showNewMaterialForm && (
                <div className="md:col-span-2 p-4 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-primary-700 dark:text-primary-400">Add New Material to Catalogue</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Material Name (e.g. Silver Roll)" value={newMatName} onChange={e=>setNewMatName(e.target.value)} className="p-2 text-sm rounded-md border dark:bg-slate-800 dark:border-slate-700"/>
                    <input type="text" placeholder="Size (e.g. 6 Inch)" value={newMatSize} onChange={e=>setNewMatSize(e.target.value)} className="p-2 text-sm rounded-md border dark:bg-slate-800 dark:border-slate-700"/>
                    <select value={newMatColour} onChange={e=>setNewMatColour(e.target.value)} className="p-2 text-sm rounded-md border dark:bg-slate-800 dark:border-slate-700">
                      <option value="NA">NA (No Colour)</option>
                      <option value="Silver">Silver</option>
                      <option value="Colour">Colour</option>
                      <option value="Printed">Printed</option>
                    </select>
                    <select value={newMatUnit} onChange={e=>setNewMatUnit(e.target.value)} className="p-2 text-sm rounded-md border dark:bg-slate-800 dark:border-slate-700">
                      <option value="KG">KG</option>
                      <option value="Roll">Roll</option>
                      <option value="Packet">Packet</option>
                    </select>
                    <input type="number" step="0.01" placeholder="Default Rate" value={newMatDefaultRate} onChange={e=>setNewMatDefaultRate(e.target.value)} className="p-2 text-sm rounded-md border dark:bg-slate-800 dark:border-slate-700"/>
                  </div>
                  <button type="button" onClick={handleCreateMaterial} className="bg-primary-500 text-white px-4 py-1.5 text-xs font-bold rounded-lg hover:bg-primary-600">Save Item</button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchase Date *</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-primary-500/50 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice / Bill No</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-primary-500/50 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-primary-500/50 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate Per Unit (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={ratePerUnit}
                  onChange={(e) => setRatePerUnit(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-primary-500/50 outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
                <span>Log Purchase</span>
              </button>
            </div>
          </form>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30 space-y-4">
          <h3 className="font-bold text-slate-850 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-700">
            Purchase Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Quantity:</span>
              <span className="font-semibold">{quantity || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Rate:</span>
              <span className="font-semibold">₹{ratePerUnit || 0}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-3 border-t border-slate-100 dark:border-slate-700 text-slate-850 dark:text-white">
              <span>Total Value:</span>
              <span className="text-primary-500">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && <Toast message={toastMsg.text} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
    </div>
  );
};

export default PurchaseCreate;
