const Supplier = require('../models/Supplier');
const { logActivity } = require('../utils/helpers');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, suppliers });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = async (req, res, next) => {
  try {
    const { name, contactNumber, email, address, gstin } = req.body;

    const supplier = await Supplier.create({
      name,
      contactNumber,
      email,
      address,
      gstin,
    });

    await logActivity(req.user._id, 'Create Supplier', `Added new supplier: ${name}`, req);

    res.status(201).json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  createSupplier
};
