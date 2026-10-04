const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const { logActivity } = require('../utils/helpers');
const { recalculateCustomerOutstanding } = require('./customerController');

// Helper to generate the next payment sequential number
const generatePaymentNumber = async () => {
  const currentYear = new Date().getFullYear();
  const searchPattern = new RegExp(`^PAY-${currentYear}-`);
  const lastPayment = await Payment.findOne({ paymentNumber: searchPattern }).sort({ createdAt: -1 });

  let sequence = 1;
  if (lastPayment) {
    const parts = lastPayment.paymentNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  const paddedSeq = String(sequence).padStart(4, '0');
  return `PAY-${currentYear}-${paddedSeq}`;
};

// @desc    Record a new payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res, next) => {
  try {
    const { invoiceId, paymentDate, amountPaid, paymentMode, referenceNumber, notes } = req.body;

    if (!invoiceId || amountPaid === undefined || !paymentMode) {
      return res.status(400).json({ success: false, message: 'Invoice ID, amount paid, and payment mode are required' });
    }

    // Retrieve Invoice
    const invoice = await Invoice.findById(invoiceId).populate('customer');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const parsedAmountPaid = Number(amountPaid);

    if (parsedAmountPaid > invoice.outstandingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (Rs. ${parsedAmountPaid}) exceeds invoice outstanding amount (Rs. ${invoice.outstandingAmount})`,
      });
    }

    const paymentNumber = await generatePaymentNumber();

    // Create payment entry
    const payment = await Payment.create({
      paymentNumber,
      invoice: invoiceId,
      customer: invoice.customer._id,
      paymentDate: paymentDate || new Date(),
      amountPaid: parsedAmountPaid,
      paymentMode,
      referenceNumber,
      notes,
    });

    // Update invoice fields
    invoice.paidAmount = Number((invoice.paidAmount + parsedAmountPaid).toFixed(2));
    invoice.outstandingAmount = Number((invoice.grandTotal - invoice.paidAmount).toFixed(2));

    if (invoice.outstandingAmount === 0) {
      invoice.paymentStatus = 'Paid';
    } else if (invoice.paidAmount > 0) {
      invoice.paymentStatus = 'Partially Paid';
    } else {
      invoice.paymentStatus = 'Unpaid';
    }

    await invoice.save();

    // Sync Customer Outstanding Balance
    await recalculateCustomerOutstanding(invoice.customer._id);

    // Audit Trail
    await logActivity(
      req.user._id,
      'Create Payment',
      `Logged payment ${paymentNumber} of Rs. ${parsedAmountPaid} for invoice ${invoice.invoiceNumber}`,
      req
    );

    res.status(201).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res, next) => {
  try {
    const { customerId, invoiceId } = req.query;
    let query = {};

    if (customerId) {
      query.customer = customerId;
    }
    if (invoiceId) {
      query.invoice = invoiceId;
    }

    const payments = await Payment.find(query)
      .populate('customer', 'name mobile')
      .populate('invoice', 'invoiceNumber grandTotal')
      .sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a payment record
// @route   DELETE /api/payments/:id
// @access  Private/Admin
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      // Refund the paid values on invoice
      invoice.paidAmount = Number((invoice.paidAmount - payment.amountPaid).toFixed(2));
      invoice.outstandingAmount = Number((invoice.grandTotal - invoice.paidAmount).toFixed(2));

      if (invoice.outstandingAmount === invoice.grandTotal) {
        invoice.paymentStatus = 'Unpaid';
      } else if (invoice.paidAmount > 0) {
        invoice.paymentStatus = 'Partially Paid';
      } else {
        invoice.paymentStatus = 'Unpaid';
      }

      await invoice.save();
      // Sync Customer Balance
      await recalculateCustomerOutstanding(invoice.customer);
    }

    const payNum = payment.paymentNumber;
    await Payment.findByIdAndDelete(req.params.id);

    // Audit Trail
    await logActivity(req.user._id, 'Delete Payment', `Removed payment entry ${payNum}`, req);

    res.status(200).json({ success: true, message: 'Payment entry removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPayments,
  deletePayment,
};
