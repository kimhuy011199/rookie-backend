const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

const Answer = require('../models/answerModel');

// @desc    Get answers by question id
// @route   GET /api/answers/:questionId
// @access  Private
const getAnswers = asyncHandler(async (req, res) => {
  const answers = await Answer.find({
    question: mongoose.Types.ObjectId(req.params.id),
  });

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

  const answer = await Answer.create({
    user: req.user.id,
    question: questionId,
    content,
    userLikes: {},
    likesCount: 0,
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
  if (answer.user.toString() !== req.user.id) {
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
  if (answer.user.toString() !== req.user.id) {
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
  getAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  likeOrUnlikeAnswer,
};
