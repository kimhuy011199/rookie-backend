const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, 'Please add a display name'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    about: {
      type: String,
    },
    linkGithub: {
      type: String,
    },
    linkLinkedIn: {
      type: String,
    },
    avatarImg: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('User', userSchema);
