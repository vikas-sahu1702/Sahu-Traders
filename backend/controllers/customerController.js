const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { logActivity } = require('../utils/helpers');

// Helper function to dynamically recalculate customer outstanding balances
const recalculateCustomerOutstanding = async (customerId) => {
  const invoices = await Invoice.find({ customer: customerId });
  const outstandingAmount = invoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);
  await Customer.findByIdAndUpdate(customerId, { outstandingAmount });
  return outstandingAmount;
};

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const customers = await Customer.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, customers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
  try {
    const { name, contactPerson, email, mobile, address, gstin } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer Name is required' });
    }

    const customer = await Customer.create({
      name,
      contactPerson,
      email,
      mobile,
      address,
      gstin,
    });

    await logActivity(req.user._id, 'Create Customer', `Added customer: ${name}`, req);

    res.status(201).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logActivity(req.user._id, 'Update Customer', `Updated customer details: ${updated.name}`, req);

    res.status(200).json({ success: true, customer: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer history (Invoices and Payments)
// @route   GET /api/customers/:id/history
// @access  Private
const getCustomerHistory = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const invoices = await Invoice.find({ customer: customerId }).sort({ invoiceDate: -1 });
    const payments = await Payment.find({ customer: customerId }).populate('invoice', 'invoiceNumber').sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      customer,
      invoices,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerHistory,
  recalculateCustomerOutstanding,
};
