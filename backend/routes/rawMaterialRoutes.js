const express = require('express');
const router = express.Router();
const { getRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial } = require('../controllers/rawMaterialController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getRawMaterials).post(protect, createRawMaterial);
router.route('/:id').put(protect, updateRawMaterial).delete(protect, admin, deleteRawMaterial);

module.exports = router;
