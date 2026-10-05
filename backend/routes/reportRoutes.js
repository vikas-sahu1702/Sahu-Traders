const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getCustomerWiseReport,
  getProductWiseReport,
  getOutstandingReport,
  getPaymentReport,
  getPurchaseReport,
  exportCSV,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all reports endpoints

router.get('/sales', getSalesReport);
router.get('/customer-wise', getCustomerWiseReport);
router.get('/product-wise', getProductWiseReport);
router.get('/outstanding', getOutstandingReport);
router.get('/payments', getPaymentReport);
router.get('/purchases', getPurchaseReport);
router.get('/export-csv', exportCSV);

module.exports = router;
