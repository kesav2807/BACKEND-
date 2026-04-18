const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, phone, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ username, email, phone, password, role });
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isSubscribed: user.isSubscribed,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get owner stats
// @route   GET /api/users/owner-stats
// @access  Private (Owner)
const getOwnerStats = async (req, res) => {
  const Lead = require('../models/Lead');
  const Property = require('../models/Property');
  try {
    const activeProperties = await Property.countDocuments({ owner: req.user._id, status: 'Approved' });
    const totalEnquiries = await Lead.countDocuments({ owner: req.user._id });
    const acceptedLeads = await Lead.countDocuments({ owner: req.user._id, status: 'Accepted' });
    
    // Simple conversion rate: Accepted / Total
    const conversionRate = totalEnquiries > 0 ? Math.round((acceptedLeads / totalEnquiries) * 100) : 0;
    
    res.json({
      activeProperties,
      totalEnquiries,
      conversionRate: `${conversionRate}%`,
      subscriptionExpiry: req.user.subscriptionExpiry || 'N/A'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Send OTP for password reset
// @route   POST /api/users/forgot-password
// @access  Public
const sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user with 10 mins expiry
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    
    // In production, send via email. For now, log it.
    console.log(`\n\n=== PASSWORD RESET OTP FOR ${email} ===\nOTP IS: ${otp}\n=======================================\n\n`);
    
    res.json({ message: 'OTP sent successfully. Check backend console.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reset user password using OTP
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get platform-wide stats (Admin only)
// @route   GET /api/users/admin-stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  const Property = require('../models/Property');
  try {
    const totalUsers = await User.countDocuments({});
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const pendingApprovals = await Property.countDocuments({ status: 'Pending' });
    
    // Revenue from successful property listings/subscriptions
    const revenueResult = await Property.aggregate([
      { $match: { 'paymentDetails.status': 'Paid' } },
      { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? (revenueResult[0].total / 100) : 0; // Assuming paisa for Razorpay

    res.json({
      totalUsers,
      totalOwners,
      totalRevenue,
      pendingApprovals
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users/all
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Safety: Don't delete self or other admins if needed, but for now simple
    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
       // Optional: block deleting other admins
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update user role (Admin only)
// @route   PATCH /api/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Send OTP for Login via Phone
// @route   POST /api/users/login-otp
// @access  Public
const sendLoginOTP = async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this phone number' });
    }

    // Rate limiting: check resend count and time
    const now = new Date();
    if (user.lastLoginOTPSentAt && (now - user.lastLoginOTPSentAt < 10000)) { // 10 sec cool down (relaxed for testing)
       return res.status(429).json({ message: 'Please wait a few seconds before requesting another OTP' });
    }

    if (user.loginOTPResentCount >= 10 && (now - user.lastLoginOTPSentAt < 3600000)) { // 10 times limit per hour (relaxed for testing)
       return res.status(429).json({ message: 'Maximum OTP attempts reached. Try again later.' });
    }

    // Reset resend count if it's been an hour
    if (user.lastLoginOTPSentAt && (now - user.lastLoginOTPSentAt >= 3600000)) {
        user.loginOTPResentCount = 0;
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user with 5 mins expiry
    user.loginOTP = otp;
    user.loginOTPExpires = Date.now() + 5 * 60 * 1000;
    user.loginOTPResentCount = (user.loginOTPResentCount || 0) + 1;
    user.lastLoginOTPSentAt = now;
    await user.save();

    // In local dev, we might not have real SMTP. Log it too.
    console.log(`\n\n=== LOGIN OTP FOR ${user.email} (${phone}) ===\nOTP IS: ${otp}\n=======================================\n\n`);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Setup Nodemailer
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Your Login OTP - EaseMyTrip Clone',
          text: `Your OTP for login is: ${otp}. It expires in 5 minutes.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP sent successfully to registered email' });
    } else {
        res.json({ message: 'OTP generated. (Check backend console as email config is missing)', otp });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Verify Login OTP
// @route   POST /api/users/verify-otp
// @access  Public
const verifyLoginOTP = async (req, res) => {
  const { phone, otp } = req.body;
  try {
    const user = await User.findOne({ 
      phone,
      loginOTP: otp,
      loginOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    
    // Clear OTP fields
    user.loginOTP = undefined;
    user.loginOTPExpires = undefined;
    user.loginOTPResentCount = 0;
    await user.save();
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isSubscribed: user.isSubscribed,
      token: generateToken(user._id)
    });

  } catch (err) {
    console.error('Error in verifyLoginOTP:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
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
};
