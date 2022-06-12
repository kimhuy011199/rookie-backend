const asyncHandler = require('express-async-handler');
const Question = require('../models/questionModel');
const User = require('../models/userModel');

const ContentBasedRecommendationSystem = require('../core/services/content-based-recommendation');
const recommender = new ContentBasedRecommendationSystem({
  minScore: 0.01,
  maxSimilarDocuments: 100,
});

const QUESTIONS_PER_PAGES = 3;

// @desc    Get questions
// @route   GET /api/questions
// @access  Private
const getQuestions = asyncHandler(async (req, res) => {
  const { page, search } = req.query;

  const limit = QUESTIONS_PER_PAGES;
  const offset = page ? (page - 1) * limit : 0;
  const sort = { createdAt: -1 };
  const condition = search
    ? { title: { $regex: new RegExp(search), $options: 'i' } }
    : {};

  const data = await Question.paginate(condition, { offset, limit, sort });
  const questions = {
    totalItems: data.totalDocs,
    questionsList: data.docs,
    totalPages: data.totalPages,
    currentPage: data.page,
  };

  for (let index = 0; index < questions.questionsList.length; index++) {
    const user = await User.findOne({
      _id: questions.questionsList[index].userId.toString(),
    });
    questions.questionsList[index].user = user;
  }

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
  const user = await User.findOne({ _id: question.userId.toString() });
  question.user = user;

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

// @desc    Get questions
// @route   GET /api/questions/:id/recommendation
// @access  Private
const getRecommendQuestions = asyncHandler(async (req, res) => {
  const documents = await Question.find();

  recommender.train(documents);
  const recommendQuestions = recommender
    .getSimilarDocuments(req.params.id, 0, 10)
    .map((item) => {
      return { ...item._doc, score: item.score };
    });

  res.status(200).json(recommendQuestions);
});

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getRecommendQuestions,
};
