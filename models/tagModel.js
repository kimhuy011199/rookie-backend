const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const tagSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

tagSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Tag', tagSchema);
