const express = require('express');
const router = express.Router();
const { getRawMaterials, createRawMaterial } = require('../controllers/rawMaterialController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getRawMaterials).post(protect, createRawMaterial);

module.exports = router;
