const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,

} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createNotification);
router.route('/:id').get(protect, getNotifications);

module.exports = router;
