const express = require('express');
const router = express.Router();
const {
  getNextInvoiceNumber,
  createInvoice,
  getInvoices,
  getInvoiceById,
  deleteInvoice,
  downloadInvoicePDF,
} = require('../controllers/invoiceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect); // Secure all invoice endpoints

router.get('/next-number', getNextInvoiceNumber);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoiceById)
  .delete(admin, deleteInvoice); // Restricted to administrators for transaction safety

router.get('/:id/pdf', downloadInvoicePDF);

module.exports = router;
