const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const { ITEMS_PER_PAGE, ROLE } = require('../core/contants/constants');
const { ERROR_MESSAGE } = require('../core/contants/errorMessage');

const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Question = require('../models/questionModel');

// @type    GET_ENTRIES_BY_ENTRY2_ID
// @desc    Get notifications by user id
// @route   GET /api/notifications/users/:id
// @access  Private
const getNotificationsByUserId = asyncHandler(async (req, res) => {
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

// @type    CREATE_ENTRY
// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
const createNotification = asyncHandler(async (req, res) => {
  const { type, userId, questionId } = req.body;
  // A answered on your question B        type = 1
  // A liked your comment on question B   type = 2

  // Check required fields
  if (!type || !userId || !questionId) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.REQUIRED_FIELD);
  }
  // Check user not founds
  if (!req.user) {
    res.status(401);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }
  // Check notification already exists
  const notificationAlreadyExists = await Notification.findOne({
    questionId,
    userId,
    type,
  });
  if (notificationAlreadyExists) {
    await notificationAlreadyExists.remove();
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
  getNotificationsByUserId,
  createNotification,
};
