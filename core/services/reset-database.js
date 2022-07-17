const User = require('../../models/userModel');
const Question = require('../../models/questionModel');
const Answer = require('../../models/answerModel');
const Tag = require('../../models/tagModel');
const Notification = require('../../models/notificationModel');

const resetDatabase = async () => {
  try {
    // await User.deleteMany({});
    // await Tag.deleteMany({});
    // await Question.deleteMany({});
    // await Answer.deleteMany({});
    // await Notification.deleteMany({});
  } catch (error) {
    console.log(error);
  }
};

module.exports = { resetDatabase };
