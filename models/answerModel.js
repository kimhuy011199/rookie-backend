const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const answerSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    user: {
      type: {},
    },
    questionId: {
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

answerSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Answer', answerSchema);
