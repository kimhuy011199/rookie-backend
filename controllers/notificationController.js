const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Question = require('../models/questionModel');

// @desc    Get notifications by user id
// @route   GET /api/notification/:userId
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    userId: mongoose.Types.ObjectId(req.params.id),
  }).sort({ createdAt: -1 });

  for (let index = 0; index < notifications.length; index++) {
    const action = await User.findOne({
      _id: notifications[index].actionId.toString(),
    });
    notifications[index].action = action;
    const question = await Question.findOne({
      _id: notifications[index].questionId.toString(),
    });
    notifications[index].question = question;
  }

  res.status(200).json(notifications);
});

// @desc    Create notification
// @route   POST /api/notification
// @access  Private
const createNotification = asyncHandler(async (req, res) => {
  const { type, userId, questionId } = req.body;
  // A answered on your question B        type = 1
  // A liked your comment on question B   type = 2

  const existedNotification = await Notification.findOne({
    questionId,
    userId,
    type,
  });

  if (existedNotification) {
    await existedNotification.remove();
  }

  const notification = await Notification.create({
    userId,
    actionId: req.user.id,
    action: null,
    questionId,
    question: null,
    type,
  });

  res.status(200).json(notification);
});

module.exports = {
  getNotifications,
  createNotification,
};
