const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // STEP 1: ACCOUNT REGISTRATION (PARTNER SIGN-UP)
  businessType: { type: String, enum: ['Individual', 'Company', 'Chain'], default: 'Individual' },
  gstRegistered: { type: Boolean, default: false },
  referralCode: String,

  // STEP 2: PROPERTY BASIC INFORMATION
  propertyName: { type: String },
  propertyType: { type: String, enum: ['Hotel', 'Guesthouse', 'Homestay', 'Resort', 'Apartment', 'Villa', 'Hostel', 'Cottage'] },
  brandName: String,
  starCategory: { type: String, enum: ['0', '1', '2', '3', '4', '5', 'Unrated'], default: 'Unrated' },
  yearOfOpening: Number,
  lastRenovationYear: Number,
  totalFloors: Number,
  totalRooms: Number,
  description: { type: String },
  
  // STEP 3: LOCATION & ADDRESS DETAILS
  address: {
    country: { type: String, default: 'India' },
    state: String,
    city: String,
    area: String,
    completeAddress: String,
    landmark: String,
    pincode: String,
    lat: Number,
    lng: Number
  },
  
  // STEP 4: OWNER / CONTACT DETAILS
  contactDetails: {
    name: String,
    primaryMobile: String,
    secondaryMobile: String,
    email: String,
    alternateContact: String,
    is24x7Available: { type: Boolean, default: true }
  },
  
  // STEP 5: ROOM DETAILS (IMPORTANT SECTION)
  rooms: [{
    id: { type: Number, default: Date.now },
    roomName: String,
    roomSize: Number, // sq ft
    numRooms: Number,
    maxAdults: Number,
    maxChildren: Number,
    bedType: String,
    basePrice: Number,
    extraBedCharges: Number,
    isTaxIncluded: { type: Boolean, default: false }
  }],
  
  // STEP 6: MEALS & POLICIES
  meals_policies: {
    breakfastIncluded: { type: Boolean, default: false },
    mealPlans: [String], // EP, CP, MAP, AP
    cancellationPolicy: {
      freeDays: Number,
      chargesPercent: Number
    }
  },
  
  // STEP 7: AMENITIES & FACILITIES
  amenities: [String], // WiFi, Parking, AC, Power Backup, Elevator, Reception, Restaurant, Room Service, Bar, Swimming Pool, Gym, Spa, CCTV, Fire Extinguisher, First Aid
  
  // STEP 8: PROPERTY RULES
  rules: {
    checkInTime: { type: String, default: '12:00 PM' },
    checkOutTime: { type: String, default: '11:00 AM' },
    earlyCheckIn: { type: String, enum: ['Allowed', 'Chargeable', 'Not Allowed'], default: 'Allowed' },
    lateCheckOut: { type: String, enum: ['Allowed', 'Chargeable', 'Not Allowed'], default: 'Allowed' },
    coupleFriendly: { type: Boolean, default: true },
    localIdAllowed: { type: Boolean, default: true },
    petsAllowed: { type: Boolean, default: false },
    smokingPolicy: { type: String, enum: ['Allowed', 'Not Allowed'], default: 'Not Allowed' }
  },
  
  // STEP 9: PHOTOS & MEDIA UPLOAD
  photos: [String],
  
  // STEP 10: BANK & PAYMENT DETAILS
  bankDetails: {
    accountHolder: String,
    bankName: String,
    accountNumber: String,
    ifsc: String,
    branchName: String,
    upiId: String,
    chequeUrl: String // File upload URL
  },
  
  // STEP 11: LEGAL & TAX DETAILS
  legal: {
    panNumber: String,
    gstNumber: String,
    ownershipProofUrl: String,
    tradeLicenseUrl: String
  },
  
  // STEP 12: PRICING & INVENTORY SETUP
  pricing_inventory: {
    weekdayPrice: Number,
    weekendPrice: Number,
    seasonalPrice: Number,
    inventoryCalendar: [{ date: Date, available: Number }],
    minStay: { type: Number, default: 1 },
    maxStay: { type: Number, default: 30 }
  },
  
  // STEP 13: COMMISSION & AGREEMENT
  commissionPercent: { type: Number, default: 15 }, // Platform Defined
  agreementAccepted: { type: Boolean, default: false },
  digitalSignature: String, // Optional string/URL
  
  // Platform Status
  status: { 
    type: String, 
    enum: ['Draft', 'Pending', 'Live', 'Rejected'], 
    default: 'Draft' 
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: Number,
    status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' }
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Property', propertySchema);

