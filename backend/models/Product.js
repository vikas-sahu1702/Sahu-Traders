const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Please add product name'],
      trim: true,
      index: true,
    },
    size: {
      type: String,
      trim: true,
    },
    colour: {
      type: String,
      trim: true,
    },
    gsm: {
      type: Number,
      default: 0,
    },
    packing: {
      type: String,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Please add base price'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
