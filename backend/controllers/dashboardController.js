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

    const [
      todaySalesData,
      monthlySalesData,
      outstandingData,
      totalCustomers,
      totalProducts,
      totalInvoices,
      recentInvoices,
      recentActivities
    ] = await Promise.all([
      // 1. Today's Sales
      Invoice.aggregate([{ $match: { invoiceDate: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      // 2. Monthly Sales
      Invoice.aggregate([{ $match: { invoiceDate: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      // 3. Outstanding Balance
      Customer.aggregate([{ $match: { status: 'Active' } }, { $group: { _id: null, total: { $sum: '$outstandingAmount' } } }]),
      // 4. Counters
      Customer.countDocuments({ status: 'Active' }),
      Product.countDocuments({ status: 'Active' }),
      Invoice.countDocuments(),
      // 5. Recent Invoices
      Invoice.find({}).populate('customer', 'name').sort({ createdAt: -1 }).limit(5),
      // 6. Recent Logs
      ActivityLog.find({}).populate('user', 'name').sort({ timestamp: -1 }).limit(7)
    ]);

    const todaySales = todaySalesData.length > 0 ? todaySalesData[0].total : 0;
    const monthlySales = monthlySalesData.length > 0 ? monthlySalesData[0].total : 0;
    const totalOutstanding = outstandingData.length > 0 ? outstandingData[0].total : 0;

    // 7. Graph Data: Monthly Sales Trend (Last 6 Months) in parallel
    const monthsPromises = [];
    const monthsLabels = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      monthsLabels.push(date.toLocaleString('default', { month: 'short' }));

      monthsPromises.push(
        Invoice.aggregate([
          { $match: { invoiceDate: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$grandTotal' } } }
        ])
      );
    }
    
    const monthsResults = await Promise.all(monthsPromises);
    const monthsData = monthsResults.map((salesAggr, index) => ({
      month: monthsLabels[index],
      sales: salesAggr.length > 0 ? salesAggr[0].total : 0,
    }));

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
