const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPayments,
  deletePayment,
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect); // Secure all payment endpoints

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.route('/:id')
  .delete(admin, deletePayment); // Restricted to administrators to preserve ledger compliance

module.exports = router;
