const express = require('express');
const { getPropertyById, deleteProperty, addProperty, updateProperty, getMyProperties, getProperties, updatePropertyStatus, getPendingProperties, getAllPropertiesAdmin } = require('../controllers/propertyController');
const { protect, restrictTo } = require('../middleware/auth');

const upload = require('../middleware/multer');

const router = express.Router();

router.get('/', getProperties);
router.get('/search', getProperties);
router.get('/all', protect, restrictTo('admin'), getAllPropertiesAdmin);
router.get('/my', protect, restrictTo('owner'), getMyProperties);
router.post('/', protect, restrictTo('owner'), addProperty);
router.get('/:id', getPropertyById);
router.put('/:id', protect, restrictTo('owner'), updateProperty);
router.delete('/:id', protect, deleteProperty);
router.get('/pending', protect, restrictTo('admin'), getPendingProperties);
router.patch('/:id/status', protect, restrictTo('admin'), updatePropertyStatus);
router.post('/upload', protect, restrictTo('owner'), upload.array('photos', 6), async (req, res) => {
  const cloudinary = require('../config/cloudinary');
  try {
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'properties' },
          (err, result) => {
            if (err) return reject(err);
            resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ message: 'Error uploading to Cloudinary: ' + err.message });
  }
});

module.exports = router;
