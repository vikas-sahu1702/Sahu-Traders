import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { Trash2, Plus, Calendar, Save, ArrowLeft, Loader2 } from 'lucide-react';
import Toast from '../components/common/Toast';
import Loader from '../components/common/Loader';

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Form states
  const [customer, setCustomer] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(18); // Default to 18% GST
  const [paymentMode, setPaymentMode] = useState('Credit');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { product: '', itemName: '', size: '', colour: '', gsm: 0, packing: '', quantity: 1, rate: 0, amount: 0 },
  ]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoading(true);
        // Load active customers
        const customerRes = await api.get('/api/customers?status=Active');
        if (customerRes.data.success) {
          setCustomers(customerRes.data.customers);
        }

        // Load active products
        const productRes = await api.get('/api/products?status=Active');
        if (productRes.data.success) {
          setProducts(productRes.data.products);
        }

        if (id) {
          // Edit mode
          const invRes = await api.get(`/api/invoices/${id}`);
          if (invRes.data.success) {
            const inv = invRes.data.invoice;
            setCustomer(inv.customer?._id || inv.customer);
            setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
            setDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '');
            setTaxRate(inv.taxRate);
            setPaymentMode(inv.paymentMode);
            setNotes(inv.notes || '');
            setNextInvoiceNumber(inv.invoiceNumber);
            if (inv.items && inv.items.length > 0) {
              setItems(inv.items.map(item => ({
                product: item.product,
                itemName: item.itemName,
                size: item.size || '',
                colour: item.colour || '',
                gsm: item.gsm || 0,
                packing: item.packing || '',
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount
              })));
            }
          }
        } else {
          // Add mode
          const numberRes = await api.get('/api/invoices/next-number');
          if (numberRes.data.success) {
            setNextInvoiceNumber(numberRes.data.nextNumber);
          }

          const settingsRes = await api.get('/api/settings');
          if (settingsRes.data.success && settingsRes.data.settings) {
            setTaxRate(settingsRes.data.settings.defaultTaxRate);
          }
        }
      } catch (error) {
        setToastMsg({ text: 'Failed to initialize invoice metadata', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [id]);

  const handleAddRow = () => {
    setItems([
      ...items,
      { product: '', itemName: '', size: '', colour: '', gsm: 0, packing: '', quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  const handleRemoveRow = (idx) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
  };

  const handleItemChange = (idx, field, value) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;

      let newItem = { ...item, [field]: value };

      // If they changed the selected product reference, auto-populate details
      if (field === 'product') {
        const prod = products.find((p) => p._id === value);
        if (prod) {
          newItem.itemName = prod.itemName;
          newItem.size = prod.size || '';
          newItem.colour = prod.colour || '';
          newItem.gsm = prod.gsm || 0;
          newItem.packing = prod.packing || '';
          newItem.rate = prod.basePrice || 0;
        } else {
          newItem.itemName = '';
          newItem.size = '';
          newItem.colour = '';
          newItem.gsm = 0;
          newItem.packing = '';
          newItem.rate = 0;
        }
      }

      // Recompute inline amounts
      const quantity = field === 'quantity' ? Number(value) : Number(newItem.quantity);
      const rate = field === 'rate' ? Number(value) : Number(newItem.rate);
      newItem.amount = Number((quantity * rate).toFixed(2));

      return newItem;
    });

    setItems(updated);
  };

  // Computations
  const subTotal = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
  const taxAmount = Number(((subTotal * taxRate) / 100).toFixed(2));
  const grandTotal = Number((subTotal + taxAmount).toFixed(2));

  const handleSaveInvoice = async (e) => {
    e.preventDefault();

    if (!customer) {
      setToastMsg({ text: 'Please select a customer', type: 'error' });
      return;
    }

    const invalidItems = items.some((item) => !item.product || item.quantity <= 0 || item.rate < 0);
    if (invalidItems) {
      setToastMsg({ text: 'Please configure all billing rows correctly (Quantity must be > 0)', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer,
        invoiceDate,
        dueDate: dueDate || undefined,
        items,
        taxRate,
        paymentMode,
        notes,
      };

      let res;
      if (id) {
        res = await api.put(`/api/invoices/${id}`, payload);
      } else {
        res = await api.post('/api/invoices', payload);
      }

      if (res.data.success) {
        setToastMsg({ text: `Invoice ${id ? 'updated' : 'created'} successfully!`, type: 'success' });
        setTimeout(() => {
          navigate(`/invoices/${res.data.invoice._id}`);
        }, 1000);
      }
    } catch (error) {
      setToastMsg({
        text: error.response?.data?.message || 'Failed to save invoice record',
        type: 'error',
      });
      setSubmitting(false);
    }
  };

  if (loading) return <Loader size="lg" />;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/invoices')}
          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            {id ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-0.5">
            Add transaction details and items list to create a sales ledger entry
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveInvoice} className="space-y-6">
        {/* Main fields row */}
        <div className="glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Select Customer *
            </label>
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.mobile ? `(${c.mobile})` : ''} - Bal: ₹{c.outstandingAmount.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Invoice Number (Auto)
            </label>
            <input
              type="text"
              value={nextInvoiceNumber}
              disabled
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-600 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="Credit">Credit (Outstanding Update)</option>
              <option value="Cash">Cash (Immediate Receipt)</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Billing Date *</span>
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-semibold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Due Date</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              GST Tax Rate (%)
            </label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              placeholder="18"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              min="0"
              max="100"
            />
          </div>
        </div>

        {/* Dynamic Billing Items Table */}
        <div className="glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-850 dark:text-white">
              Invoice Items / Billing Rows
            </h3>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center justify-center space-x-1 py-1.5 px-3 bg-primary-50 text-primary-500 hover:bg-primary-100 font-bold rounded-lg text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-750 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 min-w-[200px]">Product Selection *</th>
                  <th className="p-3 min-w-[120px]">Specs (Size/Color/GSM)</th>
                  <th className="p-3 min-w-[100px]">Packing</th>
                  <th className="p-3 w-20 text-right">Qty *</th>
                  <th className="p-3 w-28 text-right">Rate *</th>
                  <th className="p-3 w-28 text-right">Amount</th>
                  <th className="p-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    {/* Product Selection */}
                    <td className="p-2">
                      <select
                        value={item.product}
                        onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                        required
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.itemName} {p.colour ? `| Colour: ${p.colour}` : ''} {p.packing ? `| Packing: ${p.packing}` : ''} {p.basePrice != null ? `| Rate: ₹${p.basePrice}` : ''}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Specifications read-only output */}
                    <td className="p-2 text-slate-450 dark:text-slate-500 leading-normal">
                      <div className="font-semibold text-slate-800 dark:text-slate-350">
                        {item.size ? `Size: ${item.size}` : ''} {item.colour ? `| Color: ${item.colour}` : ''}
                      </div>
                      <div className="mt-0.5">
                        {item.gsm ? `${item.gsm} GSM` : ''}
                      </div>
                    </td>

                    {/* Packing */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.packing}
                        onChange={(e) => handleItemChange(idx, 'packing', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                        placeholder="Packing details"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-18 p-2 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-bold"
                        min="1"
                        required
                      />
                    </td>

                    {/* Rate */}
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        value={item.rate === 0 ? '' : item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-24 p-2 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-bold"
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>

                    {/* Inline Amount */}
                    <td className="p-2 text-right font-bold text-slate-850 dark:text-slate-100">
                      ₹{item.amount.toFixed(2)}
                    </td>

                    {/* Delete Action */}
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={items.length === 1}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg disabled:opacity-30 transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Summary Block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Notes Card */}
          <div className="md:col-span-2 glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30 space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Invoice Terms / Public Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Payment terms, manufacturing timelines, account details, etc."
            />
          </div>

          {/* Aggregated Totals Card */}
          <div className="glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30 space-y-4 font-semibold">
            <h3 className="font-bold text-slate-850 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-700">
              Billing Ledger Summary
            </h3>
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Subtotal:</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>GST Tax ({taxRate}%):</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-850 dark:text-white border-t pt-3 border-slate-100 dark:border-slate-700">
              <span>Grand Total:</span>
              <span className="text-primary-500">₹{grandTotal.toFixed(2)}</span>
            </div>

            {/* Save Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    <span>Saving invoice records...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4.5 w-4.5" />
                    <span>Save & Generate Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Floating Notifications */}
      {toastMsg && (
        <Toast
          message={toastMsg.text}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}
    </div>
  );
};

export default InvoiceCreate;
