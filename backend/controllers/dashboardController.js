const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Today's Sales Aggregation
    const todaySalesData = await Invoice.aggregate([
      {
        $match: {
          invoiceDate: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' },
        },
      },
    ]);
    const todaySales = todaySalesData.length > 0 ? todaySalesData[0].total : 0;

    // 2. Monthly Sales Aggregation
    const monthlySalesData = await Invoice.aggregate([
      {
        $match: {
          invoiceDate: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' },
        },
      },
    ]);
    const monthlySales = monthlySalesData.length > 0 ? monthlySalesData[0].total : 0;

    // 3. Outstanding Balance Aggregation from active customers
    const outstandingData = await Customer.aggregate([
      {
        $match: { status: 'Active' },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$outstandingAmount' },
        },
      },
    ]);
    const totalOutstanding = outstandingData.length > 0 ? outstandingData[0].total : 0;

    // 4. Quick Counters
    const totalCustomers = await Customer.countDocuments({ status: 'Active' });
    const totalProducts = await Product.countDocuments({ status: 'Active' });
    const totalInvoices = await Invoice.countDocuments();

    // 5. Recent Invoices (Limit 5)
    const recentInvoices = await Invoice.find({})
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Recent Logs (Limit 7)
    const recentActivities = await ActivityLog.find({})
      .populate('user', 'name')
      .sort({ timestamp: -1 })
      .limit(7);

    // 7. Graph Data: Monthly Sales Trend (Last 6 Months)
    const monthsData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      const salesAggr = await Invoice.aggregate([
        {
          $match: {
            invoiceDate: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$grandTotal' },
          },
        },
      ]);

      monthsData.push({
        month: date.toLocaleString('default', { month: 'short' }),
        sales: salesAggr.length > 0 ? salesAggr[0].total : 0,
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        todaySales,
        monthlySales,
        totalOutstanding,
        totalCustomers,
        totalProducts,
        totalInvoices,
      },
      recentInvoices,
      recentActivities,
      salesChart: monthsData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
