const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerHistory,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all customer endpoints

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer);

router.get('/:id/history', getCustomerHistory);

module.exports = router;
