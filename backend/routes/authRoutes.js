const express = require('express');
const router = express.Router();
const {
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUsers,
  createUser,
  updateUser,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

// User administration routes
router.route('/users')
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);
router.route('/users/:id')
  .put(protect, admin, updateUser);

module.exports = router;
