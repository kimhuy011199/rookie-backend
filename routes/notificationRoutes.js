const express = require('express');
const router = express.Router();
const {
  getNotificationsByUserId,
  createNotification,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

router.get('/users/:id', protect, getNotificationsByUserId);
router.post('/', protect, createNotification);

module.exports = router;
