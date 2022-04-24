const asyncHandler = require('express-async-handler');
const showdown = require('showdown');

const Question = require('../models/questionModel');

// @desc    Get questions
// @route   GET /api/questions
// @access  Private
const getQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find();

  res.status(200).json(questions);
});

// @desc    Get question by id
// @route   GET /api/questions/:id
// @access  Private
const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  res.status(200).json(question);
});

// @desc    Create question
// @route   POST /api/questions
// @access  Private
const createQuestion = asyncHandler(async (req, res) => {
  const { title, content: markdown, tags = [] } = req.body;
  if (title || markdown) {
    res.status(400);
    throw new Error('Please add required field');
  }
  const converter = new showdown.Converter();
  const htmlCode = converter.makeHtml(markdown);
  const question = await Question.create({
    user: req.user.id,
    title,
    content: htmlCode,
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
  if (question.user.toString() !== req.user.id) {
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
  if (question.user.toString() !== req.user.id) {
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
