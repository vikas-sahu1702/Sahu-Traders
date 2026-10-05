import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { Search, Plus, UserPlus, Eye, Edit2, Phone, Building2, Receipt, CreditCard, AlertCircle } from 'lucide-react';

const Customers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Modal controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyData, setHistoryData] = useState({ invoices: [], payments: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    mobile: '',
    address: '',
    gstin: '',
    status: 'Active',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
    
    // Check if redirect query asks to open new customer modal
    if (searchParams.get('action') === 'add') {
      triggerNewForm();
      // Remove query to prevent looping
      setSearchParams({});
    }
  }, [searchParams]);

  const fetchCustomers = async (searchVal = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/api/customers?search=${searchVal}`);
      if (res.data.success) {
        setCustomers(res.data.customers);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to load customers', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchCustomers(e.target.value);
  };

  const triggerNewForm = () => {
    setSelectedCustomer(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      mobile: '',
      address: '',
      gstin: '',
      status: 'Active',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const triggerEditForm = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      mobile: customer.mobile,
      address: customer.address || '',
      gstin: customer.gstin || '',
      status: customer.status,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Customer Name is required';
    if (formData.mobile && formData.mobile.trim() !== '' && !/^\+?[0-9]{10,12}$/.test(formData.mobile.replace(/\s+/g, ''))) {
      errors.mobile = 'Invalid mobile format (needs 10 digits)';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let res;
      if (selectedCustomer) {
        // Edit Mode
        res = await api.put(`/api/customers/${selectedCustomer._id}`, formData);
        if (res.data.success) {
          setToastMsg({ text: 'Customer updated successfully', type: 'success' });
        }
      } else {
        // Add Mode
        res = await api.post('/api/customers', formData);
        if (res.data.success) {
          setToastMsg({ text: 'Customer created successfully', type: 'success' });
        }
      }
      setIsFormOpen(false);
      fetchCustomers(search);
    } catch (error) {
      setToastMsg({
        text: error.response?.data?.message || 'Error occurred while saving customer',
        type: 'error',
      });
    }
  };

  const viewCustomerHistory = async (customer) => {
    setSelectedCustomer(customer);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/api/customers/${customer._id}/history`);
      if (res.data.success) {
        setHistoryData({
          invoices: res.data.invoices,
          payments: res.data.payments,
        });
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to load transaction history', type: 'error' });
    } finally {
      setHistoryLoading(false);
    }
  };

  const tableHeaders = [
    { label: 'Customer Name' },
    { label: 'Contact Person' },
    { label: 'Mobile' },
    { label: 'GSTIN' },
    { label: 'Outstanding Balance', className: 'text-right' },
    { label: 'Status', className: 'text-center' },
    { label: 'Actions', className: 'text-center' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            Customers
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-1">
            Maintain accounts profiles, GST details, and outstanding balances
          </p>
        </div>
        <button
          onClick={triggerNewForm}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md w-full glass-panel border border-slate-200/60 rounded-xl">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
          <Search className="h-4.5 w-4.5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name, contact, phone..."
          className="w-full bg-transparent pl-11 pr-4 py-2.5 focus:outline-none text-sm placeholder-slate-400 dark:text-white"
        />
      </div>

      {/* Main Grid Table */}
      {loading && customers.length === 0 ? (
        <Loader size="md" />
      ) : (
        <Table
          headers={tableHeaders}
          data={customers}
          loading={loading}
          emptyMessage="No customer records found"
          renderRow={(customer) => (
            <tr key={customer._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
              <td className="px-6 py-4">
                <div className="font-semibold text-slate-850 dark:text-slate-200">
                  {customer.name}
                </div>
                {customer.email && (
                  <div className="text-xs text-slate-400 mt-0.5">{customer.email}</div>
                )}
              </td>
              <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                {customer.contactPerson || '-'}
              </td>
              <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                {customer.mobile}
              </td>
              <td className="px-6 py-4 font-mono font-medium text-xs text-slate-600 dark:text-slate-350">
                {customer.gstin || '-'}
              </td>
              <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-slate-100">
                {formatCurrency(customer.outstandingAmount)}
              </td>
              <td className="px-6 py-4 text-center">
                <Badge text={customer.status} />
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => viewCustomerHistory(customer)}
                    className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-primary-500 rounded-lg transition-colors"
                    title="View History"
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => triggerEditForm(customer)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition-colors"
                    title="Edit Customer"
                  >
                    <Edit2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      {/* 1. Add/Edit Customer Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedCustomer ? 'Edit Customer Details' : 'Create New Customer'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Customer Name / Enterprise *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                  formErrors.name ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="e.g. Sahu Packagers"
              />
              {formErrors.name && (
                <p className="text-rose-500 text-xs font-semibold">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="Name of contact"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mobile Number
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                  formErrors.mobile ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="e.g. 9876543210"
              />
              {formErrors.mobile && (
                <p className="text-rose-500 text-xs font-semibold">{formErrors.mobile}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="client@gmail.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                GSTIN
              </label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-mono uppercase"
                placeholder="15-character GST Number"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Account Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Postal Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={2}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Enter building, street, city..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg shadow-sm text-sm"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Customer Ledger History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`${selectedCustomer?.name} - Ledger & History`}
        size="lg"
      >
        {historyLoading ? (
          <Loader size="md" />
        ) : (
          <div className="space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedCustomer?.mobile}</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GSTIN</p>
                  <p className="text-sm font-semibold font-mono text-slate-800 dark:text-white uppercase">{selectedCustomer?.gstin || 'None'}</p>
                </div>
              </div>
              <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-200/30 dark:border-rose-900/10 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Outstanding Balance</p>
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(selectedCustomer?.outstandingAmount)}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            {selectedCustomer?.address && (
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 text-xs font-semibold">
                <span className="text-slate-450 uppercase tracking-wider block mb-1">Billing Address:</span>
                <span className="text-slate-650 dark:text-slate-300">{selectedCustomer.address}</span>
              </div>
            )}

            {/* Invoices list */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                <Receipt className="h-4 w-4 text-primary-500" />
                <span>Recorded Invoices</span>
              </h4>
              <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-150 dark:border-slate-700">
                <table className="w-full text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 sticky top-0 border-b border-slate-150">
                    <tr>
                      <th className="p-3">Inv Number</th>
                      <th className="p-3">Invoice Date</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-right">Outstanding</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {historyData.invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                        <td className="p-3 font-bold text-primary-500">{inv.invoiceNumber}</td>
                        <td className="p-3">{formatDate(inv.invoiceDate)}</td>
                        <td className="p-3 text-right text-slate-850 dark:text-white">{formatCurrency(inv.grandTotal)}</td>
                        <td className="p-3 text-right text-rose-500">{formatCurrency(inv.outstandingAmount)}</td>
                        <td className="p-3 text-center"><Badge text={inv.paymentStatus} /></td>
                      </tr>
                    ))}
                    {historyData.invoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">No invoice statements created yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments List */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                <span>Payments Received</span>
              </h4>
              <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-150 dark:border-slate-700">
                <table className="w-full text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 sticky top-0 border-b border-slate-150">
                    <tr>
                      <th className="p-3">Receipt No</th>
                      <th className="p-3">Inv Number</th>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3">Payment Mode</th>
                      <th className="p-3 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {historyData.payments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                        <td className="p-3 text-slate-700 dark:text-slate-300">{p.paymentNumber}</td>
                        <td className="p-3 text-primary-500 font-bold">{p.invoice?.invoiceNumber}</td>
                        <td className="p-3">{formatDate(p.paymentDate)}</td>
                        <td className="p-3">{p.paymentMode}</td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amountPaid)}</td>
                      </tr>
                    ))}
                    {historyData.payments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">No payment receipts logged yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-150 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-250 font-bold rounded-lg text-sm"
              >
                Close Ledger
              </button>
            </div>
          </div>
        )}
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

export default Customers;
