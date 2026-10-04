const CompanySettings = require('../models/CompanySettings');
const { logActivity } = require('../utils/helpers');

// @desc    Get company settings
// @route   GET /api/settings
// @access  Private
const getCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();

    // If no settings exist yet, create a default configuration
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: 'SAHU TRADERS',
        address: 'Main Bazar, Mandi',
        mobile: '9876543210',
        email: 'info@sahutraders.com',
        gstin: '22AAAAA0000A1Z5',
        invoicePrefix: 'ST-',
        defaultTaxRate: 18,
      });
    }

    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();

    const updateFields = {
      companyName: req.body.companyName,
      companyLogo: req.body.companyLogo,
      address: req.body.address,
      mobile: req.body.mobile,
      email: req.body.email,
      gstin: req.body.gstin,
      invoicePrefix: req.body.invoicePrefix,
      defaultTaxRate: Number(req.body.defaultTaxRate),
      updatedBy: req.user._id,
    };

    if (!settings) {
      settings = await CompanySettings.create(updateFields);
    } else {
      settings = await CompanySettings.findByIdAndUpdate(settings._id, updateFields, {
        new: true,
        runValidators: true,
      });
    }

    await logActivity(req.user._id, 'Update Company Settings', `Updated global company details`, req);

    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanySettings,
  updateCompanySettings,
};
