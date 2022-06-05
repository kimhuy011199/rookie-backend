const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const { cloudinary } = require('../config/cloudinary');

const UPLOAD_PRESET = 'rookie';

// @desc    Upload image to cloudinary
// @route   POST /api/upload
// @access  Public
const uploadImg = asyncHandler(async (req, res) => {
  try {
    const fileStr = req.body.data;
    const response = await cloudinary.uploader.upload(fileStr, {
      upload_preset: UPLOAD_PRESET,
    });
    const { url } = response;
    res.status(200).json({ url });
  } catch (err) {
    throw new Error('Something went wrong');
  }
});

module.exports = {
  uploadImg,
};
