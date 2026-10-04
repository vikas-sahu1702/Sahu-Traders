const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: [true, 'Please add a supplier name'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Please add a purchase date'],
      default: Date.now,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial',
      required: [true, 'Please select a raw material'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please add the purchase quantity'],
      min: 0.01,
    },
    ratePerUnit: {
      type: Number,
      required: [true, 'Please add the rate per unit'],
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    invoiceNumber: {
      type: String,
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

module.exports = mongoose.model('Purchase', purchaseSchema);
