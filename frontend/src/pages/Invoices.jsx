import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import Table from '../components/common/Table';
import Toast from '../components/common/Toast';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { Search, Plus, Trash2, FileSpreadsheet, Eye, Edit2 } from 'lucide-react';

const Invoices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async (searchVal = '') => {
    try {
      setLoading(true);
      const url = `/api/invoices?search=${searchVal}&paymentStatus=${statusFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setInvoices(res.data.invoices);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to load invoices list', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchInvoices(e.target.value);
  };

  const handleDeleteInvoice = async (invoiceId, invNum) => {
    if (!window.confirm(`Are you absolutely sure you want to delete invoice ${invNum}? This will recalculate the customer outstanding balance.`)) {
      return;
    }

    try {
      const res = await api.delete(`/api/invoices/${invoiceId}`);
      if (res.data.success) {
        setToastMsg({ text: `Invoice ${invNum} deleted successfully`, type: 'success' });
        fetchInvoices(search);
      }
    } catch (error) {
      setToastMsg({
        text: error.response?.data?.message || 'Unauthorized: Only administrator can delete invoices.',
        type: 'error',
      });
    }
  };

  const tableHeaders = [
    { label: 'Invoice No' },
    { label: 'Customer' },
    { label: 'Billing Date' },
    { label: 'Grand Total', className: 'text-right' },
    { label: 'Paid Amount', className: 'text-right' },
    { label: 'Outstanding Balance', className: 'text-right' },
    { label: 'Payment Mode' },
    { label: 'Status', className: 'text-center' },
    { label: 'Actions', className: 'text-center' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            Sales Invoices
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-1">
            Track customer billing transactions, outstanding amounts, and payment states
          </p>
        </div>
        <button
          onClick={() => navigate('/invoices/create')}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full glass-panel border border-slate-200/60 rounded-xl">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by invoice number or customer name..."
            className="w-full bg-transparent pl-11 pr-4 py-2.5 focus:outline-none text-sm placeholder-slate-400 dark:text-white"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="">All Statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoice Data Grid */}
      {loading && invoices.length === 0 ? (
        <Loader size="md" />
      ) : (
        <Table
          headers={tableHeaders}
          data={invoices}
          loading={loading}
          emptyMessage="No invoices matches your filter criteria"
          renderRow={(inv) => (
            <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
              <td className="px-6 py-4 font-semibold text-primary-500">
                <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
              </td>
              <td className="px-6 py-4">
                <div className="font-semibold text-slate-850 dark:text-slate-200">
                  {inv.customer?.name}
                </div>
                {inv.customer?.mobile && (
                  <div className="text-xs text-slate-450 mt-0.5">{inv.customer.mobile}</div>
                )}
              </td>
              <td className="px-6 py-4 font-medium text-slate-650 dark:text-slate-350">
                {formatDate(inv.invoiceDate)}
              </td>
              <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-slate-100">
                {formatCurrency(inv.grandTotal)}
              </td>
              <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-450">
                {formatCurrency(inv.paidAmount)}
              </td>
              <td className="px-6 py-4 text-right font-bold text-rose-500">
                {formatCurrency(inv.outstandingAmount)}
              </td>
              <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
                {inv.paymentMode}
              </td>
              <td className="px-6 py-4 text-center">
                <Badge text={inv.paymentStatus} />
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => navigate(`/invoices/${inv._id}`)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-450 rounded-lg transition-colors"
                    title="View Invoice"
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/invoices/edit/${inv._id}`)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-450 rounded-lg transition-colors"
                    title="Edit Invoice"
                  >
                    <Edit2 className="h-4.5 w-4.5" />
                  </button>
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => handleDeleteInvoice(inv._id, inv.invoiceNumber)}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg transition-colors"
                      title="Delete Invoice"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      )}

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

export default Invoices;
