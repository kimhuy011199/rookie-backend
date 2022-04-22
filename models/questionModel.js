const mongoose = require('mongoose');

const questionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Please add question title'],
    },
    content: {
      type: String,
      required: [true, 'Please add question content'],
    },
    tags: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Question', questionSchema);
