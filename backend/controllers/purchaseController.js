const Purchase = require('../models/Purchase');
const RawMaterial = require('../models/RawMaterial');
const { logActivity } = require('../utils/helpers');

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find({}).populate('material').sort({ purchaseDate: -1 });
    res.status(200).json({ success: true, purchases });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a purchase
// @route   POST /api/purchases
// @access  Private
const createPurchase = async (req, res, next) => {
  try {
    const { supplierName, purchaseDate, materialId, quantity, ratePerUnit, invoiceNumber, notes } = req.body;

    const material = await RawMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }

    const totalAmount = quantity * ratePerUnit;

    const purchase = await Purchase.create({
      supplierName,
      purchaseDate,
      material: materialId,
      quantity,
      ratePerUnit,
      totalAmount,
      invoiceNumber,
      notes
    });

    // Update material stock
    material.currentStockQty += Number(quantity);
    await material.save();

    await logActivity(req.user._id, 'Create Purchase', `Purchased ${quantity}${material.unit} of ${material.materialName}`, req);

    res.status(201).json({ success: true, purchase: await purchase.populate('material') });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchases,
  createPurchase
};
