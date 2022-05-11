const asyncHandler = require('express-async-handler');
const Question = require('../models/questionModel');

const QUESTIONS_PER_PAGES = 3;

// @desc    Get questions
// @route   GET /api/questions
// @access  Private
const getQuestions = asyncHandler(async (req, res) => {
  const { page, q } = req.query;

  const limit = QUESTIONS_PER_PAGES;
  const offset = page ? (page - 1) * limit : 0;
  const condition = q
    ? { title: { $regex: new RegExp(q), $options: 'i' } }
    : {};

  const data = await Question.paginate(condition, { offset, limit });
  const questions = {
    totalItems: data.totalDocs,
    questionsList: data.docs,
    totalPages: data.totalPages,
    currentPage: data.page,
  };

  res.status(200).json(questions);
});

// @desc    Get question by id
// @route   GET /api/questions/:id
// @access  Private
const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not founds');
  }
  res.status(200).json(question);
});

// @desc    Create question
// @route   POST /api/questions
// @access  Private
const createQuestion = asyncHandler(async (req, res) => {
  const { title, content, tags = [] } = req.body;
  if (!title || !content) {
    res.status(400);
    throw new Error('Please add required field');
  }

  const question = await Question.create({
    userId: req.user.id,
    title,
    content,
    tags,
  });

  res.status(200).json(question);
});

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private
const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    res.status(400);
    throw new Error('Question not found');
  }
  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }
  // Make sure the logged in user matches the question user
  if (question.userId.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  const updatedQuestion = await Question.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

  res.status(200).json(updatedQuestion);
});

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    res.status(400);
    throw new Error('Question not found');
  }
  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }
  // Make sure the logged in user matches the question user
  if (question.userId.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  await question.remove();

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
