const express = require('express');
const { getMyLeads, createLead, getAllLeads, updateLeadStatus } = require('../controllers/leadController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.get('/my', protect, restrictTo('owner'), getMyLeads);
router.get('/all', protect, restrictTo('admin'), getAllLeads);
router.post('/', protect, restrictTo('traveler'), createLead);
router.patch('/:id', protect, restrictTo('owner'), updateLeadStatus);

module.exports = router;
