const express = require('express');
const router = express.Router();
const { getTags } = require('../controllers/tagController');

router.route('/').get(getTags);

module.exports = router;
