import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Users, Loader2 } from 'lucide-react';
import Loader from '../components/common/Loader';
import Toast from '../components/common/Toast';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.suppliers);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to fetch suppliers', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/suppliers', {
        name,
        contactNumber,
        email,
        address,
        gstin,
      });
      if (res.data.success) {
        setSuppliers([...suppliers, res.data.supplier]);
        setShowModal(false);
        setToastMsg({ text: 'Supplier added successfully', type: 'success' });
        // Reset form
        setName('');
        setContactNumber('');
        setEmail('');
        setAddress('');
        setGstin('');
      }
    } catch (error) {
      setToastMsg({ text: error.response?.data?.message || 'Failed to add supplier', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            Suppliers
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-1">
            Manage your raw material suppliers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-bold shadow-sm shadow-primary-500/30 transition-all active:scale-95 text-sm"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Supplier</span>
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
                  <th className="py-4 px-6">Supplier Name</th>
                  <th className="py-4 px-6">Contact Number</th>
                  <th className="py-4 px-6">GSTIN</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {suppliers.map((sup) => (
                  <tr key={sup._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-850 dark:text-slate-100">{sup.name}</td>
                    <td className="py-4 px-6">{sup.contactNumber || 'N/A'}</td>
                    <td className="py-4 px-6">{sup.gstin || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        sup.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {sup.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">No suppliers found. Add your first supplier!</td>
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
              <h3 className="text-lg font-bold text-slate-850 dark:text-white">Add New Supplier</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Supplier Name *</label>
                <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Contact Number</label>
                  <input type="text" value={contactNumber} onChange={e=>setContactNumber(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">GSTIN</label>
                  <input type="text" value={gstin} onChange={e=>setGstin(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
                <textarea rows={2} value={address} onChange={e=>setAddress(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm resize-none"></textarea>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold rounded-lg shadow flex items-center">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Supplier
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

export default Suppliers;
