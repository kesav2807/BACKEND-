const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'owner', 'traveler'], 
    default: 'traveler' 
  },
  avatar: { type: String, default: 'https://res.cloudinary.com/dybqmcgdz/image/upload/v1711718400/default-avatar_mzvztb.png' },
  dob: String,
  gender: String,
  maritalStatus: String,
  city: String,
  isSubscribed: { type: Boolean, default: false }, // for property owners
  subscriptionExpiry: Date, // for property owners
  loginOTP: String,
  loginOTPExpires: Date,
  loginOTPResentCount: { type: Number, default: 0 },
  lastLoginOTPSentAt: Date,
  resetPasswordOTP: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
