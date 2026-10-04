import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { ArrowLeft, Printer, Download, CreditCard, Calendar, CheckSquare, Save } from 'lucide-react';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Payment modal control
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    referenceNumber: '',
    notes: '',
  });

  const [paymentErrors, setPaymentErrors] = useState({});

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/invoices/${id}`);
      if (res.data.success) {
        setInvoice(res.data.invoice);
      }

      const settingsRes = await api.get('/api/settings');
      if (settingsRes.data.success) {
        setCompany(settingsRes.data.settings);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to retrieve invoice details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Points directly to the download API route
    const token = localStorage.getItem('token');
    const downloadUrl = `/api/invoices/${invoice._id}/pdf?token=${token}`;
    
    // We can use a standard file download approach
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `Invoice_${invoice.invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPaymentModal = () => {
    setPaymentData({
      amountPaid: invoice.outstandingAmount.toFixed(2),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      referenceNumber: '',
      notes: '',
    });
    setPaymentErrors({});
    setIsPaymentOpen(true);
  };

  const validatePayment = () => {
    const errors = {};
    const amt = Number(paymentData.amountPaid);
    if (!paymentData.amountPaid || isNaN(amt) || amt <= 0) {
      errors.amountPaid = 'Payment amount must be greater than 0';
    } else if (amt > invoice.outstandingAmount) {
      errors.amountPaid = `Amount cannot exceed balance due (Max: ₹${invoice.outstandingAmount.toFixed(2)})`;
    }
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!validatePayment()) return;

    try {
      const payload = {
        invoiceId: invoice._id,
        amountPaid: Number(paymentData.amountPaid),
        paymentDate: paymentData.paymentDate,
        paymentMode: paymentData.paymentMode,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
      };

      const res = await api.post('/api/payments', payload);
      if (res.data.success) {
        setToastMsg({ text: 'Payment logged successfully', type: 'success' });
        setIsPaymentOpen(false);
        fetchInvoiceDetails(); // Refresh details page state
      }
    } catch (error) {
      setToastMsg({
        text: error.response?.data?.message || 'Error occurred while saving payment',
        type: 'error',
      });
    }
  };

  if (loading) return <Loader size="lg" />;
  if (!invoice) return <div className="text-center py-10 font-bold text-slate-500">Invoice not found.</div>;

  return (
    <div className="space-y-6">
      {/* 1. Detail Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800 no-print">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
              Invoice details
            </h1>
            <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-0.5">
              Review transaction and item details
            </p>
          </div>
        </div>

        {/* Buttons list */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-200 font-bold rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center space-x-2 py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-200 font-bold rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-xs"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
          {invoice.outstandingAmount > 0 && (
            <button
              onClick={triggerPaymentModal}
              className="flex items-center justify-center space-x-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-md shadow-emerald-500/10 active:scale-95 transition-all text-xs"
            >
              <CreditCard className="h-4 w-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Invoice Document Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-md p-8 md:p-12 print-container max-w-4xl mx-auto transition-colors">
        {/* Company and Invoice ID row */}
        <div className="flex flex-col md:flex-row justify-between gap-6 border-b pb-8 border-slate-200/60 dark:border-slate-850">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-850 dark:text-white tracking-wider">
              {company?.companyName || 'SAHU TRADERS'}
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2">
              {company?.address || 'No Address Provided'}
            </p>
            <p className="text-xs font-medium text-slate-450 dark:text-slate-500 mt-1">
              Mobile: {company?.mobile || ''} | Email: {company?.email || ''}
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono">
              GSTIN: {company?.gstin || 'N/A'}
            </p>
          </div>

          <div className="md:text-right font-medium">
            <h3 className="text-xl font-bold text-slate-850 dark:text-white uppercase tracking-wider">
              INVOICE
            </h3>
            <p className="text-sm font-bold text-primary-500 mt-1.5 font-mono">
              {invoice.invoiceNumber}
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 space-y-1">
              <p>Billing Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(invoice.invoiceDate)}</span></p>
              <p>Due Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{invoice.dueDate ? formatDate(invoice.dueDate) : 'On Receipt'}</span></p>
              <p className="flex items-center md:justify-end gap-1.5 mt-2">
                Status: <Badge text={invoice.paymentStatus} />
              </p>
            </div>
          </div>
        </div>

        {/* Client Address panel */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-200/60 dark:border-slate-850 text-xs font-medium">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill To:</p>
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">{invoice.customer.name}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[280px]">
              {invoice.customer.address || 'No Address Provided'}
            </p>
            <p className="text-slate-450 dark:text-slate-500 pt-1.5">Mobile: {invoice.customer.mobile}</p>
            <p className="font-mono text-slate-500 dark:text-slate-400 uppercase">GSTIN: {invoice.customer.gstin || 'N/A'}</p>
          </div>
          
          <div className="space-y-1.5 md:text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ledger Terms:</p>
            <p className="text-slate-650 dark:text-slate-300">Payment Terms: Net Due</p>
            <p className="text-slate-650 dark:text-slate-300">Mode: {invoice.paymentMode}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-500 dark:text-slate-450">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-750">
              <tr>
                <th className="py-3 px-2">Description</th>
                <th className="py-3 px-2">Specs (Size/Color/GSM)</th>
                <th className="py-3 px-2">Packing</th>
                <th className="py-3 px-2 w-16 text-right">Qty</th>
                <th className="py-3 px-2 w-24 text-right">Rate</th>
                <th className="py-3 px-2 w-28 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
              {invoice.items.map((item, idx) => {
                const specs = [item.size, item.colour, item.gsm ? `${item.gsm} GSM` : '', item.packing].filter(Boolean).join(' | ');
                return (
                  <tr key={item._id || idx} className="text-slate-650 dark:text-slate-350">
                    <td className="py-4 px-2 font-bold text-slate-850 dark:text-slate-100">
                      {item.itemName}
                    </td>
                    <td className="py-4 px-2 italic text-slate-450 dark:text-slate-500">
                      {specs || '-'}
                    </td>
                    <td className="py-4 px-2">
                      {item.packing || '-'}
                    </td>
                    <td className="py-4 px-2 text-right">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-2 text-right">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-4 px-2 text-right font-bold text-slate-850 dark:text-slate-150">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes and summary aggregate */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/60 dark:border-slate-850">
          {/* Notes */}
          <div className="space-y-1 text-xs">
            {invoice.notes && (
              <>
                <p className="font-bold text-slate-450 uppercase tracking-wider">Declaration Notes:</p>
                <p className="text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
                  {invoice.notes}
                </p>
              </>
            )}
          </div>

          {/* Balance Summary block */}
          <div className="space-y-2.5 font-semibold text-xs leading-normal">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subTotal)}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>GST Tax ({invoice.taxRate}%):</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-850 dark:text-white border-t pt-2 border-slate-100 dark:border-slate-800">
              <span>Grand Total:</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Paid Amount:</span>
              <span className="text-emerald-600 dark:text-emerald-450 font-bold">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-primary-500 border-t pt-2 border-slate-100 dark:border-slate-800">
              <span>Balance Due:</span>
              <span>{formatCurrency(invoice.outstandingAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Form Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={`Record Payment for Invoice: ${invoice.invoiceNumber}`}
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Outstanding Balance
              </label>
              <input
                type="text"
                value={formatCurrency(invoice.outstandingAmount)}
                disabled
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Amount Paid (INR) *
              </label>
              <input
                type="number"
                value={paymentData.amountPaid}
                onChange={(e) => setPaymentData({ ...paymentData, amountPaid: e.target.value })}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-bold ${
                  paymentErrors.amountPaid ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="0.00"
                step="0.01"
                required
              />
              {paymentErrors.amountPaid && (
                <p className="text-rose-500 text-xs font-semibold">{paymentErrors.amountPaid}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Payment Date *</span>
              </label>
              <input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Payment Mode *
              </label>
              <select
                value={paymentData.paymentMode}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                required
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <CheckSquare className="h-4 w-4 text-slate-400" />
                <span>Reference / UTR / Cheque Number</span>
              </label>
              <input
                type="text"
                value={paymentData.referenceNumber}
                onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="Transaction ID / Check number"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Notes / Memo
            </label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              rows={2}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none"
              placeholder="e.g. Received parts balance via GPay"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setIsPaymentOpen(false)}
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-750 dark:text-slate-250 font-bold rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-sm text-sm flex items-center space-x-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Record Payment</span>
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

export default InvoiceDetail;
