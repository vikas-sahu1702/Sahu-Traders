const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'SAHU TRADERS',
      required: true,
      trim: true,
    },
    companyLogo: {
      type: String, // Base64 data URI or logo URL
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    invoicePrefix: {
      type: String,
      default: 'ST-',
      trim: true,
    },
    defaultTaxRate: {
      type: Number,
      default: 18, // GST %
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
