const Product = require('../models/Product');
const { logActivity } = require('../utils/helpers');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { size: { $regex: search, $options: 'i' } },
        { colour: { $regex: search, $options: 'i' } },
        { packing: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const products = await Product.find(query).sort({ itemName: 1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const { itemName, size, colour, gsm, packing, basePrice } = req.body;

    if (!itemName || basePrice === undefined) {
      return res.status(400).json({ success: false, message: 'Item Name and Base Price are required' });
    }

    const product = await Product.create({
      itemName,
      size,
      colour,
      gsm,
      packing,
      basePrice,
    });

    await logActivity(req.user._id, 'Create Product', `Created product: ${itemName}`, req);

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await logActivity(req.user._id, 'Update Product', `Updated product details: ${updated.itemName}`, req);

    res.status(200).json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.deleteOne();

    await logActivity(req.user._id, 'Delete Product', `Deleted product: ${product.itemName}`, req);

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
