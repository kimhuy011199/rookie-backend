const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

const Tag = require('../models/tagModel');
const TAGS_PER_PAGES = 10;

// @desc    Get all tags
// @route   GET /api/tags
// @access  Public
const getTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find();

  res.status(200).json(tags);
});

// @desc    Paginate all tags
// @route   GET /api/tags/pagination
// @access  Public
const paginationTags = asyncHandler(async (req, res) => {
  const { page, search } = req.query;

  const limit = TAGS_PER_PAGES;
  const offset = page ? (page - 1) * limit : 0;
  const sort = { name: 1 };

  const condition = search
    ? { name: { $regex: new RegExp(name), $options: 'i' } }
    : {};

  const data = await Tag.paginate(condition, { offset, limit, sort });
  const tags = {
    totalItems: data.totalDocs,
    list: data.docs,
    totalPages: data.totalPages,
    currentPage: data.page,
  };

  res.status(200).json(tags);
});

// @desc    Get tag by id
// @route   GET /api/tags/:id
// @access  Private
const getTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) {
    res.status(404);
    throw new Error('Tag not founds');
  }

  res.status(200).json(tag);
});

// @desc    Create tag
// @route   POST /api/tags
// @access  Private
const createTag = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Please add required field');
  }

  const existedTag = await Tag.findOne({ name });
  if (existedTag) {
    res.status(400);
    throw new Error('Tag name already existed');
  }

  const tag = await Tag.create({ name });
  res.status(200).json(tag);
});

// @desc    Update tag
// @route   PUT /api/tags/:id
// @access  Private
const updateTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);

  if (!tag) {
    res.status(400);
    throw new Error('Tag not found');
  }

  const updatedTag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedTag);
});

// @desc    Delete tag
// @route   DELETE /api/tags/:id
// @access  Private
const deleteTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);

  if (!tag) {
    res.status(400);
    throw new Error('Tag not found');
  }

  await tag.remove();
  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getTags,
  paginationTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
};
