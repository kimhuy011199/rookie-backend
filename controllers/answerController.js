const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

const Answer = require('../models/answerModel');
const User = require('../models/userModel');

const ANSWERS_PER_PAGES = 3;

// @desc    Get answers by question id
// @route   GET /api/answers/:questionId
// @access  Private
const getAnswersByQuestionId = asyncHandler(async (req, res) => {
  const answers = await Answer.find({
    questionId: mongoose.Types.ObjectId(req.params.id),
  });

  for (let index = 0; index < answers.length; index++) {
    const user = await User.findOne({ _id: answers[index].userId.toString() });
    answers[index].user = user;
  }

  res.status(200).json(answers);
});

// @desc    Get answer by id
// @route   GET /api/answers/:id
// @access  Private
const getAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    res.status(404);
    throw new Error('Answer not founds');
  }
  const user = await User.findOne({ _id: answer.userId.toString() });
  answer.user = user;

  res.status(200).json(answer);
});

// @desc    Get all answers
// @route   GET /api/answers
// @access  Private
const paginateAnswers = asyncHandler(async (req, res) => {
  const { page, search } = req.query;

  const limit = ANSWERS_PER_PAGES;
  const offset = page ? (page - 1) * limit : 0;
  const sort = { createdAt: -1 };

  const condition = search
    ? { questionId: { $regex: new RegExp(questionId), $options: 'i' } }
    : {};

  const data = await Answer.paginate(condition, { offset, limit, sort });
  const answers = {
    totalItems: data.totalDocs,
    list: data.docs,
    totalPages: data.totalPages,
    currentPage: data.page,
  };

  for (let index = 0; index < answers.length; index++) {
    const user = await User.findOne({ _id: answers[index].userId.toString() });
    answers[index].user = user;
  }

  res.status(200).json(answers);
});

// @desc    Create answer
// @route   POST /api/answers
// @access  Private
const createAnswer = asyncHandler(async (req, res) => {
  const { content, questionId } = req.body;
  if (!content) {
    res.status(400);
    throw new Error('Please add answer content');
  }

  const userId = req.user.id;
  const user = await User.findById(userId);
  const answer = await Answer.create({
    userId,
    questionId,
    content,
    userLikes: {},
    likesCount: 0,
    user,
  });

  res.status(200).json(answer);
});

// @desc    Update answer
// @route   PUT /api/answers/:id
// @access  Private
const updateAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);

  if (!answer) {
    res.status(400);
    throw new Error('Answer not found');
  }
  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }
  // Make sure the logged in user matches the answer user
  if (answer.userId.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  const updatedAnswer = await Answer.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );

  res.status(200).json(updatedAnswer);
});

// @desc    Delete answer
// @route   DELETE /api/answers/:id
// @access  Private
const deleteAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);

  if (!answer) {
    res.status(400);
    throw new Error('Answer not found');
  }
  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }
  // Make sure the logged in user matches the answer user
  if (answer.userId.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  await answer.remove();

  res.status(200).json({ id: req.params.id });
});

// @desc    Like or unlike answer
// @route   PUT /api/answers/:id/likes
// @access  Private
const likeOrUnlikeAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);

  if (!answer) {
    res.status(400);
    throw new Error('Answer not found');
  }

  const newAnswer = { ...answer }._doc;
  if (!newAnswer.userLikes[req.user.id] || !newAnswer.likesCount) {
    newAnswer.userLikes[req.user.id] = true;
    newAnswer.likesCount++;
  } else {
    delete newAnswer.userLikes[req.user.id];
    newAnswer.likesCount--;
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }

  const updatedAnswer = await Answer.findByIdAndUpdate(
    req.params.id,
    {
      userLikes: newAnswer.userLikes,
      likesCount: newAnswer.likesCount,
    },
    {
      new: true,
    }
  );

  res.status(200).json(updatedAnswer);
});

module.exports = {
  getAnswersByQuestionId,
  getAnswer,
  paginateAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  likeOrUnlikeAnswer,
};
