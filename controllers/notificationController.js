const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

// @desc    Get notifications by user id
// @route   GET /api/notification/:userId
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    userId: mongoose.Types.ObjectId(req.params.id),
  });

  for (let index = 0; index < notifications.length; index++) {
    const action = await User.findOne({
      _id: notifications[index].actionId.toString(),
    });
    notifications[index].action = action;
  }

  res.status(200).json(notifications);
});

// @desc    Create notification
// @route   POST /api/notification
// @access  Private
const createNotification = asyncHandler(async (req, res) => {
  const { type, userId, actionDisplayName, commentContent } = req.body;
  // commented on your question
  // liked your comment

  const content = `${actionDisplayName} commented on your question (${commentContent})`;

  const notification = await Notification.create({
    userId,
    actionId: req.user.id,
    action: {
      displayName: actionDisplayName,
    },
    content,
    type,
  });

  res.status(200).json(notification);
});

module.exports = {
  getNotifications,
  createNotification,
};
