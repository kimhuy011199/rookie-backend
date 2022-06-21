const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    user: {
      type: {},
    },
    actionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    action: {
      type: {},
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Question',
    },
    question: {
      type: {},
    },
    type: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
