import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Table from '../components/common/Table';
import Toast from '../components/common/Toast';
import Loader from '../components/common/Loader';
import Badge from '../components/common/Badge';
import { BarChart3, Download, Printer, Calendar, RefreshCw } from 'lucide-react';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales'); // sales, customer, product, outstanding, payments
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const reportTabs = [
    { key: 'sales', label: 'Monthly Sales' },
    { key: 'customer', label: 'Customer Outstandings' },
    { key: 'product', label: 'Product Sales Volume' },
    { key: 'outstanding', label: 'Outstanding Balance Ledger' },
    { key: 'payments', label: 'Payments Received Logs' },
    { key: 'purchases', label: 'Material Purchases' },
  ];

  useEffect(() => {
    fetchReportData();
  }, [activeReport]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      const params = `?startDate=${startDate}&endDate=${endDate}`;

      switch (activeReport) {
        case 'sales':
          endpoint = `/api/reports/sales${params}`;
          break;
        case 'customer':
          endpoint = `/api/reports/customer-wise`;
          break;
        case 'product':
          endpoint = `/api/reports/product-wise`;
          break;
        case 'outstanding':
          endpoint = `/api/reports/outstanding`;
          break;
        case 'payments':
          endpoint = `/api/reports/payments${params}`;
          break;
        case 'purchases':
          endpoint = `/api/reports/purchases${params}`;
          break;
        default:
          endpoint = `/api/reports/sales`;
      }

      const res = await api.get(endpoint);
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (error) {
      setToastMsg({ text: 'Failed to generate report data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setToastMsg({ text: 'Generating CSV...', type: 'info' });
      const res = await api.get(`/api/reports/export-csv?type=${activeReport}`, {
        responseType: 'blob', // Important for downloading files
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeReport}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToastMsg({ text: 'CSV downloaded successfully!', type: 'success' });
    } catch (error) {
      setToastMsg({ text: 'Failed to download CSV', type: 'error' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Dynamic table headers based on active report
  const getTableHeaders = () => {
    switch (activeReport) {
      case 'sales':
        return [
          { label: 'Inv Number' },
          { label: 'Customer' },
          { label: 'Billing Date' },
          { label: 'Tax Rate (%)' },
          { label: 'Grand Total', className: 'text-right' },
          { label: 'Outstanding', className: 'text-right' },
          { label: 'Status', className: 'text-center' },
        ];
      case 'customer':
        return [
          { label: 'Customer Name' },
          { label: 'Mobile' },
          { label: 'Total Invoices', className: 'text-center' },
          { label: 'Total Billed Amount', className: 'text-right' },
          { label: 'Outstanding Balances', className: 'text-right' },
        ];
      case 'product':
        return [
          { label: 'Product / Item Name' },
          { label: 'Specs (Size/Color/GSM/Packing)' },
          { label: 'Total Quantity Sold', className: 'text-right' },
          { label: 'Total Revenue Generated', className: 'text-right' },
        ];
      case 'outstanding':
        return [
          { label: 'Customer Name' },
          { label: 'Mobile' },
          { label: 'GSTIN' },
          { label: 'Outstanding Amount Due', className: 'text-right' },
        ];
      case 'payments':
        return [
          { label: 'Receipt No' },
          { label: 'Invoice No' },
          { label: 'Customer' },
          { label: 'Payment Date' },
          { label: 'Payment Mode' },
          { label: 'Reference Number' },
          { label: 'Amount Received', className: 'text-right' },
        ];
      case 'purchases':
        return [
          { label: 'Purchase Date' },
          { label: 'Inv Number' },
          { label: 'Supplier' },
          { label: 'Raw Material' },
          { label: 'Quantity', className: 'text-right' },
          { label: 'Rate', className: 'text-right' },
          { label: 'Total Amount', className: 'text-right' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800 no-print">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
              Reports & Ledger
            </h1>
            <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-0.5">
              Access real-time analytical statements and export spreadsheet files
            </p>
          </div>
        </div>

        {/* Buttons list */}
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-200 font-bold rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary-500/10 active:scale-95 transition-all text-xs"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filters Row */}
      {['sales', 'payments', 'purchases'].includes(activeReport) && (
        <div className="glass-panel p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/30 flex flex-wrap items-end gap-4 no-print">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Start Date</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>End Date</span>
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
            />
          </div>

          <button
            onClick={fetchReportData}
            className="py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Filter</span>
          </button>
        </div>
      )}

      {/* Report Selection Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex overflow-x-auto no-print">
        {reportTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            className={`py-3.5 px-5 font-bold text-sm border-b-2 tracking-wide whitespace-nowrap transition-colors ${
              activeReport === tab.key
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Table Data */}
      <div className="space-y-4">
        {loading && reportData.length === 0 ? (
          <Loader size="md" />
        ) : (
          <Table
            headers={getTableHeaders()}
            data={reportData}
            loading={loading}
            emptyMessage="No ledger details found for this selection"
            renderRow={(row, idx) => {
              if (activeReport === 'sales') {
                return (
                  <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                    <td className="px-6 py-4 font-bold text-primary-500">{row.invoiceNumber}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{row.customer?.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{formatDate(row.invoiceDate)}</td>
                    <td className="px-6 py-4">{row.taxRate}%</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-850 dark:text-white">{formatCurrency(row.grandTotal)}</td>
                    <td className="px-6 py-4 text-right text-rose-500">{formatCurrency(row.outstandingAmount)}</td>
                    <td className="px-6 py-4 text-center"><Badge text={row.paymentStatus} /></td>
                  </tr>
                );
              }
              if (activeReport === 'customer') {
                return (
                  <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                    <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200">{row.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-650">{row.mobile}</td>
                    <td className="px-6 py-4 text-center">{row.totalInvoices}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">{formatCurrency(row.totalSales)}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-500">{formatCurrency(row.outstandingAmount)}</td>
                  </tr>
                );
              }
              if (activeReport === 'product') {
                const specs = [row.size, row.colour, row.gsm ? `${row.gsm} GSM` : '', row.packing].filter(Boolean).join(' | ');
                return (
                  <tr key={row._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                    <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200">{row.itemName}</td>
                    <td className="px-6 py-4 text-slate-450 italic">{specs || '-'}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800 dark:text-slate-350">{row.totalQty}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-450">{formatCurrency(row.totalRevenue)}</td>
                  </tr>
                );
              }
              if (activeReport === 'outstanding') {
                return (
                  <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                    <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200">{row.name}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{row.mobile}</td>
                    <td className="px-6 py-4 font-mono text-slate-550">{row.gstin || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-500">{formatCurrency(row.outstandingAmount)}</td>
                  </tr>
                );
              }
              if (activeReport === 'payments') {
                return (
                  <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                    <td className="px-6 py-4 font-semibold text-slate-800">{row.paymentNumber}</td>
                    <td className="px-6 py-4 font-bold text-primary-500">{row.invoice?.invoiceNumber}</td>
                    <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">{row.customer?.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{formatDate(row.paymentDate)}</td>
                    <td className="px-6 py-4">{row.paymentMode}</td>
                    <td className="px-6 py-4 font-mono">{row.referenceNumber || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.amountPaid)}</td>
                  </tr>
                );
              }
              if (activeReport === 'purchases') {
                return (
                  <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                    <td className="px-6 py-4 font-medium text-slate-600">{formatDate(row.purchaseDate)}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{row.invoiceNumber || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-200">{row.supplier?.name}</td>
                    <td className="px-6 py-4 font-bold text-primary-500">{row.material?.materialName}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800 dark:text-slate-350">{row.quantity}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(row.ratePerUnit)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-450">{formatCurrency(row.totalAmount)}</td>
                  </tr>
                );
              }
              return null;
            }}
          />
        )}
      </div>

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

export default Reports;
