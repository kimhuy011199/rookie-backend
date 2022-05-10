const mongoose = require('mongoose');

const answerSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Question',
    },
    content: {
      type: String,
      required: [true, 'Please add answer content'],
    },
    userLikes: {
      type: {},
      default: {},
    },
    likesCount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Answer', answerSchema);
