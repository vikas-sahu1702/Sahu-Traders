const express = require('express');
const router = express.Router();
const {
  getCompanySettings,
  updateCompanySettings,
} = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getCompanySettings)
  .put(protect, admin, updateCompanySettings); // Restricted to administrators

module.exports = router;
