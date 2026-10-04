const RawMaterial = require('../models/RawMaterial');
const { logActivity } = require('../utils/helpers');

// @desc    Get all raw materials
// @route   GET /api/raw-materials
// @access  Private
const getRawMaterials = async (req, res, next) => {
  try {
    const materials = await RawMaterial.find({}).sort({ materialName: 1 });
    res.status(200).json({ success: true, materials });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a raw material
// @route   POST /api/raw-materials
// @access  Private
const createRawMaterial = async (req, res, next) => {
  try {
    const { materialName, size, colourType, unit } = req.body;

    const existing = await RawMaterial.findOne({ materialName, size, colourType });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Material already exists in stock list' });
    }

    const material = await RawMaterial.create({
      materialName,
      size,
      colourType,
      unit,
      currentStockQty: 0 // Default to 0, updated via purchases
    });

    await logActivity(req.user._id, 'Create Raw Material', `Created material: ${materialName} (${size})`, req);

    res.status(201).json({ success: true, material });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRawMaterials,
  createRawMaterial
};
