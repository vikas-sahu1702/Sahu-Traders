const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Product = require('../models/Product');

// @desc    Get Sales Report (Monthly aggregates)
// @route   GET /api/reports/sales
// @access  Private
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let match = {};

    if (startDate || endDate) {
      match.invoiceDate = {};
      if (startDate) match.invoiceDate.$gte = new Date(startDate);
      if (endDate) match.invoiceDate.$lte = new Date(endDate);
    }

    const sales = await Invoice.find(match)
      .populate('customer', 'name mobile')
      .sort({ invoiceDate: -1 });

    res.status(200).json({ success: true, data: sales });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Customer-wise Sales and Outstanding report
// @route   GET /api/reports/customer-wise
// @access  Private
const getCustomerWiseReport = async (req, res, next) => {
  try {
    const report = await Customer.aggregate([
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'customer',
          as: 'invoices',
        },
      },
      {
        $project: {
          name: 1,
          mobile: 1,
          outstandingAmount: 1,
          totalInvoices: { $size: '$invoices' },
          totalSales: { $sum: '$invoices.grandTotal' },
        },
      },
      {
        $sort: { totalSales: -1 },
      },
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Product-wise quantities and revenues sold
// @route   GET /api/reports/product-wise
// @access  Private
const getProductWiseReport = async (req, res, next) => {
  try {
    const report = await Invoice.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          itemName: { $first: '$items.itemName' },
          size: { $first: '$items.size' },
          colour: { $first: '$items.colour' },
          gsm: { $first: '$items.gsm' },
          packing: { $first: '$items.packing' },
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.amount' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Outstanding Balances Report
// @route   GET /api/reports/outstanding
// @access  Private
const getOutstandingReport = async (req, res, next) => {
  try {
    const report = await Customer.find({ outstandingAmount: { $gt: 0 }, status: 'Active' })
      .sort({ outstandingAmount: -1 });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Payment Entries Report
// @route   GET /api/reports/payments
// @access  Private
const getPaymentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    let match = {};

    if (startDate || endDate) {
      match.paymentDate = {};
      if (startDate) match.paymentDate.$gte = new Date(startDate);
      if (endDate) match.paymentDate.$lte = new Date(endDate);
    }

    const report = await Payment.find(match)
      .populate('customer', 'name')
      .populate('invoice', 'invoiceNumber')
      .sort({ paymentDate: -1 });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Export a report as Excel compatible CSV
// @route   GET /api/reports/export-csv
// @access  Private
const exportCSV = async (req, res, next) => {
  try {
    const { type } = req.query;
    let csvContent = '';
    let filename = 'report.csv';

    if (type === 'sales') {
      filename = 'sales_report.csv';
      const sales = await Invoice.find({}).populate('customer', 'name').sort({ invoiceDate: -1 });
      csvContent = 'Invoice Number,Customer,Invoice Date,Sub Total,Tax Rate(%),Tax Amount,Grand Total,Paid Amount,Outstanding,Status\n';
      sales.forEach((inv) => {
        csvContent += `"${inv.invoiceNumber}","${inv.customer ? inv.customer.name : 'N/A'}",` +
          `"${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}",${inv.subTotal},${inv.taxRate},` +
          `${inv.taxAmount},${inv.grandTotal},${inv.paidAmount},${inv.outstandingAmount},"${inv.paymentStatus}"\n`;
      });
    } else if (type === 'customer') {
      filename = 'customer_report.csv';
      const customers = await Customer.aggregate([
        {
          $lookup: {
            from: 'invoices',
            localField: '_id',
            foreignField: 'customer',
            as: 'invoices',
          },
        },
      ]);
      csvContent = 'Customer Name,Mobile,Email,GSTIN,Outstanding Balance,Total Invoices,Total Billing\n';
      customers.forEach((c) => {
        const totalSales = c.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        csvContent += `"${c.name}","${c.mobile}","${c.email || ''}","${c.gstin || ''}",${c.outstandingAmount},${c.invoices.length},${totalSales}\n`;
      });
    } else if (type === 'product') {
      filename = 'product_report.csv';
      const products = await Invoice.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            itemName: { $first: '$items.itemName' },
            size: { $first: '$items.size' },
            colour: { $first: '$items.colour' },
            gsm: { $first: '$items.gsm' },
            packing: { $first: '$items.packing' },
            totalQty: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.amount' },
          },
        },
      ]);
      csvContent = 'Item Name,Size,Colour,GSM,Packing,Total Quantity Sold,Total Revenue Generated\n';
      products.forEach((p) => {
        csvContent += `"${p.itemName}","${p.size || ''}","${p.colour || ''}",${p.gsm || ''},"${p.packing || ''}",${p.totalQty},${p.totalRevenue}\n`;
      });
    } else if (type === 'outstanding') {
      filename = 'outstanding_report.csv';
      const customers = await Customer.find({ outstandingAmount: { $gt: 0 }, status: 'Active' });
      csvContent = 'Customer Name,Mobile,Email,GSTIN,Outstanding Balance\n';
      customers.forEach((c) => {
        csvContent += `"${c.name}","${c.mobile}","${c.email || ''}","${c.gstin || ''}",${c.outstandingAmount}\n`;
      });
    } else if (type === 'payments') {
      filename = 'payments_report.csv';
      const payments = await Payment.find({}).populate('customer', 'name').populate('invoice', 'invoiceNumber');
      csvContent = 'Payment Number,Invoice Number,Customer Name,Payment Date,Amount Paid,Payment Mode,Reference Number,Notes\n';
      payments.forEach((p) => {
        csvContent += `"${p.paymentNumber}","${p.invoice ? p.invoice.invoiceNumber : 'N/A'}",` +
          `"${p.customer ? p.customer.name : 'N/A'}","${new Date(p.paymentDate).toLocaleDateString('en-IN')}",` +
          `${p.amountPaid},"${p.paymentMode}","${p.referenceNumber || ''}","${p.notes || ''}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReport,
  getCustomerWiseReport,
  getProductWiseReport,
  getOutstandingReport,
  getPaymentReport,
  exportCSV,
};
