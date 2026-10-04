const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier } = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getSuppliers).post(protect, createSupplier);

module.exports = router;
