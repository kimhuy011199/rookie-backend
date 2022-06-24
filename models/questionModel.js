const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const questionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    user: {
      type: {},
    },
    title: {
      type: String,
      required: [true, 'Please add question title'],
      unique: true,
    },
    content: {
      type: String,
      required: [true, 'Please add question content'],
    },
    tags: {
      type: [
        {
          _id: mongoose.Schema.Types.ObjectId,
          name: String,
        }
      ],
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Question', questionSchema);
