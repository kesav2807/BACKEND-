const Property = require('../models/Property');

// @desc    Add new property or update draft
// @route   POST /api/properties
// @access  Private (Owner)
const addProperty = async (req, res) => {
  try {
    const { propertyName, address } = req.body;

    let duplicate = null;
    if (propertyName && address?.city) {
      // Duplicate Check: ONLY if we have a name and city
      duplicate = await Property.findOne({
        propertyName: new RegExp(`^${propertyName}$`, 'i'),
        'address.city': new RegExp(`^${address.city}$`, 'i'),
        owner: req.user._id
      });
    }

    if (duplicate && !req.body._id) {
      return res.status(400).json({ message: 'A property with this name already exists in this city.' });
    }

    let property;
    if (req.body._id) {
      // Update existing draft or property
      property = await Property.findByIdAndUpdate(req.body._id, { ...req.body, owner: req.user._id }, { new: true });
    } else {
      // Create new - Remove _id if it's null to avoid Mongoose casting error
      const propertyData = { ...req.body };
      delete propertyData._id;
      
      property = await Property.create({
        ...propertyData,
        owner: req.user._id,
        status: req.body.isDraft ? 'Draft' : 'Pending'
      });
    }

    res.status(201).json(property);
  } catch (err) {
    console.error('ADD_PROPERTY_ERROR:', err);
    console.log('REQUEST_BODY:', req.body);
    
    // Check for Mongoose Validation Error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation Error: ' + messages.join(', ') });
    }

    res.status(500).json({ message: err.message });
  }
};

// @desc    Approve/Reject property (Admin only)
// @route   PATCH /api/properties/:id/status
// @access  Private (Admin)
const updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const property = await Property.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get owner's properties
// @route   GET /api/properties/my
// @access  Private (Owner)
const getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all active properties (for search)
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
  const { city, type, minPrice, maxPrice, amenities } = req.query;
  try {
    const query = { status: 'Live' };
    
    if (city) query['address.city'] = new RegExp(city, 'i');
    
    if (type) {
      const types = type.split(',');
      query.propertyType = { $in: types };
    }
    
    if (minPrice || maxPrice) {
      // Find properties where AT LEAST one room matches the price criteria
      query.rooms = {
        $elemMatch: {}
      };
      if (minPrice) query.rooms.$elemMatch.basePrice = { $gte: Number(minPrice) };
      if (maxPrice) {
        if (!query.rooms.$elemMatch.basePrice) query.rooms.$elemMatch.basePrice = {};
        query.rooms.$elemMatch.basePrice.$lte = Number(maxPrice);
      }
    }
    
    if (amenities) {
      const amenitiesList = amenities.split(',');
      query.amenities = { $all: amenitiesList };
    }
    
    const properties = await Property.find(query).populate('owner', 'username email phone');
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all pending properties (Admin only)
// @route   GET /api/properties/pending
// @access  Private (Admin)
const getPendingProperties = async (req, res) => {
  try {
    const properties = await Property.find({ status: 'Pending' }).populate('owner', 'username email phone');
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all properties for monitoring (Admin only)
// @route   GET /api/properties/all
// @access  Private (Admin)
const getAllPropertiesAdmin = async (req, res) => {
  try {
    const properties = await Property.find({}).populate('owner', 'username email').sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update property listing (Owner only)
// @route   PUT /api/properties/:id
// @access  Private (Owner)
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this property' });
    }

    // Keep existing status unless admin changes it; owner edits go back to Pending for review
    const updatedData = { ...req.body };
    delete updatedData._id;
    delete updatedData.owner;
    updatedData.status = 'Pending'; // Re-submit for admin approval after edit

    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: false }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete property listing (Admin or Owner)
// @route   DELETE /api/properties/:id
// @access  Private
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    // Allow if admin OR if owner of the property
    if (req.user.role !== 'admin' && property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single property details
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'username email phone');
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPropertyById, deleteProperty, addProperty, updateProperty, updatePropertyStatus, getMyProperties, getProperties, getPendingProperties, getAllPropertiesAdmin };

