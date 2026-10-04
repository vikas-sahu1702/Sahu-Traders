import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import Loader from '../components/common/Loader';
import { CreditCard, Plus, Search, Trash2, Calendar, FileText } from 'lucide-react';

const Payments = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Modal controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState('');

  const [formData, setFormData] = useState({
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    referenceNumber: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchPayments();

    // Check if query parameter asks to open new payment form
    if (searchParams.get('action') === 'add') {
      triggerNewPayment();
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/payments');
      if (res.data.success) {
        setPayments(res.data.payments);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to load payments history', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const triggerNewPayment = async () => {
    setSelectedCustomer('');
    setSelectedInvoice('');
    setCustomerInvoices([]);
    setFormData({
      amountPaid: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      referenceNumber: '',
      notes: '',
    });
    setFormErrors({});

    try {
      // Load active customers
      const res = await api.get('/api/customers?status=Active');
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
      setIsFormOpen(true);
    } catch (error) {
      setToastMsg({ text: 'Failed to load customer details', type: 'error' });
    }
  };

  const handleCustomerChange = async (e) => {
    const custId = e.target.value;
    setSelectedCustomer(custId);
    setSelectedInvoice('');
    setCustomerInvoices([]);
    setFormData({ ...formData, amountPaid: '' });

    if (!custId) return;

    try {
      // Load customer invoices that are unpaid or partially paid
      const res = await api.get(`/api/invoices?customerId=${custId}`);
      if (res.data.success) {
        const unpaid = res.data.invoices.filter(
          (inv) => inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'Partially Paid'
        );
        setCustomerInvoices(unpaid);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to retrieve customer invoices', type: 'error' });
    }
  };

  const handleInvoiceChange = (e) => {
    const invId = e.target.value;
    setSelectedInvoice(invId);

    const inv = customerInvoices.find((i) => i._id === invId);
    if (inv) {
      setFormData({ ...formData, amountPaid: inv.outstandingAmount.toFixed(2) });
    } else {
      setFormData({ ...formData, amountPaid: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedCustomer) errors.customer = 'Please select a customer';
    if (!selectedInvoice) errors.invoice = 'Please select an invoice';

    const amt = Number(formData.amountPaid);
    const targetInv = customerInvoices.find((i) => i._id === selectedInvoice);

    if (!formData.amountPaid || isNaN(amt) || amt <= 0) {
      errors.amountPaid = 'Payment amount must be greater than 0';
    } else if (targetInv && amt > targetInv.outstandingAmount) {
      errors.amountPaid = `Amount exceeds invoice due (Max: ₹${targetInv.outstandingAmount.toFixed(2)})`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        invoiceId: selectedInvoice,
        amountPaid: Number(formData.amountPaid),
        paymentDate: formData.paymentDate,
        paymentMode: formData.paymentMode,
        referenceNumber: formData.referenceNumber,
        notes: formData.notes,
      };

      const res = await api.post('/api/payments', payload);
      if (res.data.success) {
        setToastMsg({ text: 'Payment receipt logged successfully', type: 'success' });
        setIsFormOpen(false);
        fetchPayments();
      }
    } catch (error) {
      setToastMsg({
        text: error.response?.data?.message || 'Error occurred while saving payment',
        type: 'error',
      });
    }
  };

  const handleDeletePayment = async (paymentId, payNum) => {
    if (!window.confirm(`Are you sure you want to void payment ${payNum}? This will increase the invoice outstanding balance.`)) {
      return;
    }

    try {
      const res = await api.delete(`/api/payments/${paymentId}`);
      if (res.data.success) {
        setToastMsg({ text: 'Payment entry removed successfully', type: 'success' });
        fetchPayments();
      }
    } catch (error) {
      setToastMsg({
        text: error.response?.data?.message || 'Unauthorized: Admin privileges required',
        type: 'error',
      });
    }
  };

  const tableHeaders = [
    { label: 'Receipt No' },
    { label: 'Invoice No' },
    { label: 'Customer' },
    { label: 'Payment Date' },
    { label: 'Payment Mode' },
    { label: 'Reference No' },
    { label: 'Amount Paid', className: 'text-right' },
    { label: 'Actions', className: 'text-center' },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            Payments Ledger
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-1">
            Browse payment receipts and settle customer outstanding accounts
          </p>
        </div>
        <button
          onClick={triggerNewPayment}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
        >
          <CreditCard className="h-4.5 w-4.5" />
          <span>Record Receipt</span>
        </button>
      </div>

      {/* Grid Table */}
      {loading && payments.length === 0 ? (
        <Loader size="md" />
      ) : (
        <Table
          headers={tableHeaders}
          data={payments}
          loading={loading}
          emptyMessage="No payments received yet"
          renderRow={(p) => (
            <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
              <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-350">
                {p.paymentNumber}
              </td>
              <td className="px-6 py-4 font-bold text-primary-500">
                {p.invoice ? (
                  <Link to={`/invoices/${p.invoice._id}`}>{p.invoice.invoiceNumber}</Link>
                ) : (
                  'N/A'
                )}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">
                {p.customer?.name}
              </td>
              <td className="px-6 py-4 font-medium text-slate-650 dark:text-slate-350">
                {formatDate(p.paymentDate)}
              </td>
              <td className="px-6 py-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
                {p.paymentMode}
              </td>
              <td className="px-6 py-4 font-mono font-medium text-xs text-slate-500">
                {p.referenceNumber || '-'}
              </td>
              <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-450">
                {formatCurrency(p.amountPaid)}
              </td>
              <td className="px-6 py-4 text-center">
                {user?.role === 'Admin' ? (
                  <button
                    onClick={() => handleDeletePayment(p._id, p.paymentNumber)}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg transition-colors"
                    title="Void Payment"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <span className="text-slate-400 text-xs">-</span>
                )}
              </td>
            </tr>
          )}
        />
      )}

      {/* Record Payment Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Record Received Payment"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Dropdown */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select Customer *
              </label>
              <select
                value={selectedCustomer}
                onChange={handleCustomerChange}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                  formErrors.customer ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.mobile ? `(${c.mobile})` : ''} - Bal: ₹{c.outstandingAmount.toFixed(2)}
                  </option>
                ))}
              </select>
              {formErrors.customer && (
                <p className="text-rose-500 text-xs font-semibold">{formErrors.customer}</p>
              )}
            </div>

            {/* Invoice Dropdown */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select Unpaid/Partially Paid Invoice *
              </label>
              <select
                value={selectedInvoice}
                onChange={handleInvoiceChange}
                disabled={!selectedCustomer}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                  !selectedCustomer ? 'bg-slate-100 cursor-not-allowed opacity-50' : ''
                } ${formErrors.invoice ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                required
              >
                <option value="">-- Choose Outstanding Invoice --</option>
                {customerInvoices.map((inv) => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoiceNumber} (Date: {formatDate(inv.invoiceDate)}) - Total: ₹{inv.grandTotal.toFixed(2)} | Due: ₹{inv.outstandingAmount.toFixed(2)}
                  </option>
                ))}
              </select>
              {formErrors.invoice && (
                <p className="text-rose-500 text-xs font-semibold">{formErrors.invoice}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Amount Received (INR) *
              </label>
              <input
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                disabled={!selectedInvoice}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-bold ${
                  !selectedInvoice ? 'bg-slate-100 cursor-not-allowed opacity-50' : ''
                } ${formErrors.amountPaid ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'}`}
                placeholder="0.00"
                step="0.01"
                required
              />
              {formErrors.amountPaid && (
                <p className="text-rose-500 text-xs font-semibold">{formErrors.amountPaid}</p>
              )}
            </div>

            {/* Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Payment Mode *
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none"
                required
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Payment Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Payment Date *</span>
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-semibold"
                required
              />
            </div>

            {/* Ref Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <FileText className="h-4 w-4 text-slate-400" />
                <span>Reference / Transaction ID</span>
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
                placeholder="UTR / Check Number / UPI Reference"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
              placeholder="e.g. Settle advance billing"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-250 font-bold rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg shadow-sm text-sm"
            >
              Save Receipt
            </button>
          </div>
        </form>
      </Modal>

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

export default Payments;
