const Lead = require('../models/Lead');

// @desc    Get leads for an owner
// @route   GET /api/leads/my
// @access  Private (Owner)
const getMyLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ owner: req.user._id })
      .populate('property', 'propertyName address.city')
      .sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a lead
// @route   POST /api/leads
// @access  Private (Traveler)
const createLead = async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      user: req.user._id
    });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all leads/activity (Admin only)
// @route   GET /api/leads/all
// @access  Private (Admin)
const getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find({})
      .populate('property', 'propertyName')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update lead status (Accept/Reject)
// @route   PATCH /api/leads/:id
// @access  Private (Owner)
const updateLeadStatus = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    
    // Check if user is the owner of the property
    if (lead.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    lead.status = req.body.status;
    await lead.save();
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyLeads, createLead, getAllLeads, updateLeadStatus };
