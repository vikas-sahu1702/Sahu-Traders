const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    amountPaid: {
      type: Number,
      required: [true, 'Please specify amount paid'],
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
      required: true,
    },
    referenceNumber: {
      type: String, // Transaction ID, UTR, Cheque No
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
