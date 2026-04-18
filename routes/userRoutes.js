const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  getOwnerStats, 
  resetPassword, 
  sendOTP, 
  getAdminStats, 
  getAllUsers,
  deleteUser,
  updateUserRole,
  sendLoginOTP,
  verifyLoginOTP
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login-otp', sendLoginOTP);
router.post('/verify-otp', verifyLoginOTP);
router.post('/forgot-password', sendOTP);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.get('/owner-stats', protect, restrictTo('owner'), getOwnerStats);
router.get('/admin-stats', protect, restrictTo('admin'), getAdminStats);
router.get('/all', protect, restrictTo('admin'), getAllUsers);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);
router.patch('/:id/role', protect, restrictTo('admin'), updateUserRole);

module.exports = router;
