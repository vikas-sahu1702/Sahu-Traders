import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import Badge from '../components/common/Badge';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  Users,
  Package,
  FileText,
  Plus,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/api/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentInvoices(res.data.recentInvoices);
          setRecentActivities(res.data.recentActivities);
          setChartData(res.data.salesChart);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Loader size="lg" />;

  const quickActions = [
    { label: 'Create Invoice', path: '/invoices/create', color: 'bg-primary-500 hover:bg-primary-600', icon: <Plus className="h-5 w-5" /> },
    { label: 'Add Customer', path: '/customers?action=add', color: 'bg-indigo-500 hover:bg-indigo-600', icon: <Plus className="h-5 w-5" /> },
    { label: 'Add Product', path: '/products?action=add', color: 'bg-emerald-500 hover:bg-emerald-600', icon: <Plus className="h-5 w-5" /> },
    { label: 'Record Payment', path: '/payments?action=add', color: 'bg-amber-500 hover:bg-amber-600', icon: <Plus className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Title Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-450 dark:text-slate-400 text-sm font-medium mt-1">
            Real-time operations summary for Sahu Traders
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          title="Today's Sales"
          value={formatCurrency(stats?.todaySales)}
          icon={<TrendingUp className="h-6 w-6" />}
          className="bg-sky-500/5"
        />
        <Card
          title="Monthly Sales"
          value={formatCurrency(stats?.monthlySales)}
          icon={<DollarSign className="h-6 w-6" />}
          className="bg-indigo-500/5"
        />
        <Card
          title="Monthly Purchases"
          value={formatCurrency(stats?.monthlyPurchases)}
          icon={<Package className="h-6 w-6" />}
          className="bg-emerald-500/5"
          onClick={() => navigate('/purchases')}
        />
        <Card
          title="Outstanding Amount"
          value={formatCurrency(stats?.totalOutstanding)}
          icon={<AlertCircle className="h-6 w-6" />}
          className="bg-rose-500/5 font-semibold"
        />
        <Card
          title="Total Customers"
          value={stats?.totalCustomers}
          icon={<Users className="h-6 w-6" />}
          onClick={() => navigate('/customers')}
        />
        <Card
          title="Total Products"
          value={stats?.totalProducts}
          icon={<Package className="h-6 w-6" />}
          onClick={() => navigate('/products')}
        />
        <Card
          title="Total Invoices"
          value={stats?.totalInvoices}
          icon={<FileText className="h-6 w-6" />}
          onClick={() => navigate('/invoices')}
        />
      </div>

      {/* Charts & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Area Chart (Sales curves) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30">
          <h3 className="font-bold text-slate-850 dark:text-white mb-4">
            Sales Trend (Last 6 Months)
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`₹${val.toFixed(2)}`, 'Sales']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-850 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.path)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl text-white font-bold transition-all shadow-sm active:scale-95 text-xs text-center space-y-2 ${action.color}`}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-150 dark:border-slate-700/50">
            <Link
              to="/reports"
              className="flex items-center justify-between text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
            >
              <span>View Business Analytics</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices & Logs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices table */}
        <div className="glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-850 dark:text-white">
              Recent Invoices
            </h3>
            <Link
              to="/invoices"
              className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Inv No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {recentInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10">
                    <td className="py-3 px-3 font-semibold text-primary-500">
                      <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {inv.customer?.name}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-850 dark:text-slate-100">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge text={inv.paymentStatus} />
                    </td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No invoices recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit trail Logs */}
        <div className="glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/30 overflow-hidden flex flex-col">
          <h3 className="font-bold text-slate-850 dark:text-white mb-4">
            Recent System Activity
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[220px]">
            {recentActivities.map((log) => (
              <div key={log._id} className="flex items-start space-x-3 text-xs leading-normal">
                <span className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">
                    {log.description}
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    By {log.user?.name} | {formatDate(log.timestamp)} at {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-center text-slate-400 py-8">
                No system activity logged.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
