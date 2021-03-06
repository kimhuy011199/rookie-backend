const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const tagSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add tag name'],
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

tagSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Tag', tagSchema);
