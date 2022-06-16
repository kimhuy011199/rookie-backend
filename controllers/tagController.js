const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

const Tag = require('../models/tagModel');

// @desc    Get all tags
// @route   GET /api/tags
// @access  Public
const getTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find();

  res.status(200).json(tags);
});

module.exports = {
  getTags,
};
