const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const { ITEMS_PER_PAGE, ROLE } = require('../core/contants/constants');
const { ERROR_MESSAGE } = require('../core/contants/errorMessage');

const Tag = require('../models/tagModel');
const Question = require('../models/questionModel');

// @type    GET_ENTRIES
// @desc    Get tags
// @route   GET /api/tags/all
// @access  Public
const getTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find().sort({ name: 1 });

  res.status(200).json(tags);
});

// @type    PAGINATE_ENTRIES
// @desc    Paginate tags
// @route   GET /api/tags
// @access  Public
const paginationTags = asyncHandler(async (req, res) => {
  const { page, search } = req.query;

  const limit = ITEMS_PER_PAGE.TAG;
  const offset = page ? (page - 1) * limit : 0;
  const sort = { name: 1 };

  // Search by tag name
  const condition = search
    ? { name: { $regex: new RegExp(search), $options: 'i' } }
    : {};

  const data = await Tag.paginate(condition, { offset, limit, sort });
  const tags = {
    totalItems: data.totalDocs,
    list: data.docs,
    totalPages: data.totalPages,
    currentPage: data.page,
    itemsPerPage: data.limit,
  };

  res.status(200).json(tags);
});

// @type    GET_ENTRY_BY_ID
// @desc    Get tag by id
// @route   GET /api/tags/:id
// @access  Public
const getTagById = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.TAG_NOT_FOUND);
  }

  res.status(200).json(tag);
});

// @type    CREATE_ENTRY
// @desc    Create tag
// @route   POST /api/tags
// @access  Private
const createTag = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // Check required fields
  if (!name) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.REQUIRED_FIELD);
  }
  // Check tag name already exists
  const nameAlreadyExists = await Tag.findOne({ name });
  if (nameAlreadyExists) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.NAME_EXIST);
  }

  const tag = await Tag.create({ name });
  res.status(200).json(tag);
});

// @type    UPDATE_ENTRY
// @desc    Update tag
// @route   PUT /api/tags/:id
// @access  Private
const updateTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);

  // Check tag not founds
  if (!tag) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.TAG_NOT_FOUND);
  }

  const updatedTag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedTag);
});

// @type    DELETE_ENTRY
// @desc    Delete tag
// @route   DELETE /api/tags/:id
// @access  Private
const deleteTag = asyncHandler(async (req, res) => {
  const tagId = req.params.id;
  const tag = await Tag.findById(tagId);

  // Check tag not founds
  if (!tag) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.TAG_NOT_FOUND);
  }
  // Check permission
  if (req.user.role !== ROLE.ADMIN) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }

  // Remove tag
  await tag.remove();
  // Update question has removed tag
  const relatedQuestions = await Question.find({ "tags._id": { $in: [tagId] } });
  for (let index = 0; index < relatedQuestions.length; index++) {
    const question = await Question.findOne({ _id: relatedQuestions[index]._id.toString() })
    await question.tags.pull({ _id: tagId });
    await question.save();
  }

  res.status(200).json({ id: tagId });
});

module.exports = {
  getTags,
  paginationTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
};
