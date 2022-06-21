const express = require('express');
const router = express.Router();
const { uploadImg } = require('../controllers/uploadController');

const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, uploadImg);

module.exports = router;
