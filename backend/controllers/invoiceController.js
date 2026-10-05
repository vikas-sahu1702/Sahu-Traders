const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const CompanySettings = require('../models/CompanySettings');
const { logActivity } = require('../utils/helpers');
const { recalculateCustomerOutstanding } = require('./customerController');
const { generateInvoicePDF } = require('../services/pdfService');

// Helper to generate the next unique invoice number sequential by year
const generateNextInvoiceNumber = async () => {
  let prefix = 'ST-';
  const settings = await CompanySettings.findOne();
  if (settings && settings.invoicePrefix) {
    prefix = settings.invoicePrefix;
  }

  const currentYear = new Date().getFullYear();
  const searchPattern = new RegExp(`^${prefix}${currentYear}-`);
  const lastInvoice = await Invoice.findOne({ invoiceNumber: searchPattern }).sort({ createdAt: -1 });

  let sequence = 1;
  if (lastInvoice) {
    // E.g. ST-2026-0005 -> split by '-' yields ['ST', '2026', '0005']
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  const paddedSeq = String(sequence).padStart(4, '0');
  return `${prefix}${currentYear}-${paddedSeq}`;
};

// @desc    Get next invoice number suggestion
// @route   GET /api/invoices/next-number
// @access  Private
const getNextInvoiceNumber = async (req, res, next) => {
  try {
    const nextNumber = await generateNextInvoiceNumber();
    res.status(200).json({ success: true, nextNumber });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res, next) => {
  try {
    const { customer, invoiceDate, dueDate, items, taxRate, paymentMode, notes } = req.body;

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and items are required' });
    }

    // Verify Customer exists
    const customerObj = await Customer.findById(customer);
    if (!customerObj) {
      return res.status(404).json({ success: false, message: 'Selected customer not found' });
    }

    // Generate Invoice Number
    const invoiceNumber = await generateNextInvoiceNumber();

    // Map and calculate amounts for items
    const calculatedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);
      const amount = Number((quantity * rate).toFixed(2));
      return {
        product: item.product,
        itemName: item.itemName,
        size: item.size,
        colour: item.colour,
        gsm: item.gsm,
        packing: item.packing,
        quantity,
        rate,
        amount,
      };
    });

    // Subtotal calculation
    const subTotal = Number(calculatedItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2));

    // Taxes
    const tax = Number(taxRate) || 0;
    const taxAmount = Number(((subTotal * tax) / 100).toFixed(2));
    const grandTotal = Number((subTotal + taxAmount).toFixed(2));
    const outstandingAmount = grandTotal; // Paid amount starts at 0

    const newInvoice = await Invoice.create({
      invoiceNumber,
      customer,
      invoiceDate: invoiceDate || new Date(),
      dueDate,
      items: calculatedItems,
      subTotal,
      taxRate: tax,
      taxAmount,
      grandTotal,
      outstandingAmount,
      paymentStatus: 'Unpaid',
      paymentMode: paymentMode || 'Credit',
      notes,
    });

    // Update Customer Outstanding Balance
    await recalculateCustomerOutstanding(customer);

    // Audit Trail
    await logActivity(
      req.user._id,
      'Create Invoice',
      `Created invoice ${invoiceNumber} for customer ${customerObj.name}. Total: Rs. ${grandTotal}`,
      req
    );

    res.status(201).json({ success: true, invoice: newInvoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const { search, paymentStatus, customerId } = req.query;
    let query = {};

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (customerId) {
      query.customer = customerId;
    }

    let invoicesQuery = Invoice.find(query)
      .populate('customer', 'name mobile')
      .sort({ invoiceDate: -1, createdAt: -1 });

    let invoices = await invoicesQuery;

    // Filter by customer name if search matches customer name
    if (search) {
      const searchLower = search.toLowerCase();
      invoices = invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          (inv.customer && inv.customer.name.toLowerCase().includes(searchLower))
      );
    }

    res.status(200).json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice detail
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Invoice
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Keep customer ID reference for post-delete outstanding updates
    const customerId = invoice.customer;
    const invNumber = invoice.invoiceNumber;

    // Remove Invoice
    await Invoice.findByIdAndDelete(req.params.id);

    // Refresh Customer Balance
    await recalculateCustomerOutstanding(customerId);

    // Audit Trail
    await logActivity(req.user._id, 'Delete Invoice', `Deleted invoice ${invNumber}`, req);

    res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Download PDF for invoice
// @route   GET /api/invoices/:id/pdf
// @access  Private
const downloadInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    let company = await CompanySettings.findOne();
    if (!company) {
      company = {
        companyName: 'SAHU TRADERS',
        address: 'Main Bazaar, India',
        mobile: '',
        email: '',
        gstin: '',
        defaultTaxRate: 18,
      };
    }

    // Configure response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);

    // Stream PDF directly to HTTP write response
    generateInvoicePDF(invoice, company, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res, next) => {
  try {
    const { customer, invoiceDate, dueDate, items, taxRate, paymentMode, notes } = req.body;
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const oldCustomerId = invoice.customer;

    // Calculate items
    let subTotal = 0;
    let calculatedItems = invoice.items;
    
    if (items && items.length > 0) {
      calculatedItems = items.map((item) => {
        const quantity = Number(item.quantity);
        const rate = Number(item.rate);
        const amount = Number((quantity * rate).toFixed(2));
        return {
          product: item.product,
          itemName: item.itemName,
          size: item.size,
          colour: item.colour,
          gsm: item.gsm,
          packing: item.packing,
          quantity,
          rate,
          amount,
        };
      });
      subTotal = Number(calculatedItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
    } else {
      subTotal = invoice.subTotal;
    }

    const tax = taxRate !== undefined ? Number(taxRate) : invoice.taxRate;
    const taxAmount = Number(((subTotal * tax) / 100).toFixed(2));
    const grandTotal = Number((subTotal + taxAmount).toFixed(2));
    
    // Maintain current paidAmount and calculate outstanding (Auto-correct negative values)
    let paidAmount = invoice.paidAmount || 0;
    if (paidAmount < 0) {
      paidAmount = Math.abs(paidAmount);
      invoice.paidAmount = paidAmount;
    }
    const outstandingAmount = grandTotal - paidAmount;

    invoice.customer = customer || invoice.customer;
    invoice.invoiceDate = invoiceDate || invoice.invoiceDate;
    invoice.dueDate = dueDate || invoice.dueDate;
    if (items && items.length > 0) invoice.items = calculatedItems;
    invoice.subTotal = subTotal;
    invoice.taxRate = tax;
    invoice.taxAmount = taxAmount;
    invoice.grandTotal = grandTotal;
    invoice.outstandingAmount = outstandingAmount;
    invoice.paymentMode = paymentMode || invoice.paymentMode;
    invoice.notes = notes !== undefined ? notes : invoice.notes;
    
    if (outstandingAmount <= 0) {
      invoice.paymentStatus = 'Paid';
    } else if (outstandingAmount < grandTotal) {
      invoice.paymentStatus = 'Partial';
    } else {
      invoice.paymentStatus = 'Unpaid';
    }

    await invoice.save();

    await recalculateCustomerOutstanding(oldCustomerId);
    if (customer && customer.toString() !== oldCustomerId.toString()) {
      await recalculateCustomerOutstanding(customer);
    }

    await logActivity(req.user._id, 'Update Invoice', `Updated invoice ${invoice.invoiceNumber}`, req);

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNextInvoiceNumber,
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
};
