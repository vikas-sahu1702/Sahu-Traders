const Purchase = require('../models/Purchase');
const RawMaterial = require('../models/RawMaterial');
const { logActivity } = require('../utils/helpers');

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find({}).populate('material').populate('supplier').sort({ purchaseDate: -1 });
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
    const { supplierId, purchaseDate, materialId, quantity, ratePerUnit, invoiceNumber, notes } = req.body;

    const material = await RawMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }

    const totalAmount = quantity * ratePerUnit;

    const purchase = await Purchase.create({
      supplier: supplierId,
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

const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const { supplierId, purchaseDate, materialId, quantity, ratePerUnit, invoiceNumber, notes } = req.body;

    // Handle stock revert if material changed or quantity changed
    const oldMaterial = await RawMaterial.findById(purchase.material);
    const newMaterial = await RawMaterial.findById(materialId || purchase.material);
    
    if (oldMaterial) {
      oldMaterial.currentStockQty -= purchase.quantity;
      await oldMaterial.save();
    }

    const finalQuantity = quantity !== undefined ? Number(quantity) : purchase.quantity;
    
    if (newMaterial) {
      newMaterial.currentStockQty += finalQuantity;
      await newMaterial.save();
    }

    if (supplierId) purchase.supplier = supplierId;
    if (purchaseDate) purchase.purchaseDate = purchaseDate;
    if (materialId) purchase.material = materialId;
    if (quantity !== undefined) purchase.quantity = finalQuantity;
    if (ratePerUnit !== undefined) purchase.ratePerUnit = Number(ratePerUnit);
    purchase.totalAmount = purchase.quantity * purchase.ratePerUnit;
    if (invoiceNumber !== undefined) purchase.invoiceNumber = invoiceNumber;
    if (notes !== undefined) purchase.notes = notes;

    await purchase.save();

    await logActivity(req.user._id, 'Update Purchase', `Updated purchase of ${purchase.quantity} units`, req);

    res.status(200).json({ success: true, purchase: await purchase.populate('material') });
  } catch (error) {
    next(error);
  }
};

const deletePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    // Revert stock
    const material = await RawMaterial.findById(purchase.material);
    if (material) {
      material.currentStockQty -= purchase.quantity;
      await material.save();
    }

    await purchase.deleteOne();

    await logActivity(req.user._id, 'Delete Purchase', `Deleted purchase of ${purchase.quantity} units`, req);

    res.status(200).json({ success: true, message: 'Purchase deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchases,
  createPurchase,
  updatePurchase,
  deletePurchase
};
