const express = require('express');
const router = express.Router();
const { getPurchases, createPurchase, updatePurchase, deletePurchase } = require('../controllers/purchaseController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getPurchases).post(protect, createPurchase);
router.route('/:id').put(protect, updatePurchase).delete(protect, admin, deletePurchase);

module.exports = router;
