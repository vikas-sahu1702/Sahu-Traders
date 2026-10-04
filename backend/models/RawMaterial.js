const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema(
  {
    materialName: {
      type: String,
      required: [true, 'Please add a material name'],
      trim: true,
    },
    size: {
      type: String,
      default: 'NA',
      trim: true,
    },
    colourType: {
      type: String,
      enum: ['Silver', 'Colour', 'Printed', 'Plain', 'NA'],
      default: 'NA',
    },
    currentStockQty: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: 'KG',
      enum: ['KG', 'Roll', 'Packet', 'Piece'],
    },
    defaultRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
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

// Prevent duplicate materials of the same exact type and size
rawMaterialSchema.index({ materialName: 1, size: 1, colourType: 1 }, { unique: true });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
