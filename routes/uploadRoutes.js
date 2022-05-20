const express = require('express');
const router = express.Router();
const { uploadImg } = require('../controllers/uploadController');

router.post('/', uploadImg);

module.exports = router;
