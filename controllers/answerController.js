const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const {
  ITEMS_PER_PAGE,
  ROLE,
  NOTIFICATION_TYPE,
} = require('../core/contants/constants');
const { ERROR_MESSAGE } = require('../core/contants/errorMessage');

const Answer = require('../models/answerModel');
const User = require('../models/userModel');
const Question = require('../models/questionModel');
const Notification = require('../models/notificationModel');

// @type    GET_ENTRIES_BY_ENTRY2_ID
// @desc    Get answers by question id
// @route   GET /api/answers/questions/:questionId
// @access  Public
const getAnswersByQuestionId = asyncHandler(async (req, res) => {
  const answers = await Answer.find({
    questionId: mongoose.Types.ObjectId(req.params.id),
  });

  if (answers.length) {
    for (let index = 0; index < answers.length; index++) {
      const user = await User.findOne({
        _id: answers[index].userId.toString(),
      });
      answers[index].user = user;
    }
  }

  res.status(200).json(answers);
});

// @type    PAGINATE_ENTRIES
// @desc    Paginate answers
// @route   GET /api/answers
// @access  Private
const paginateAnswers = asyncHandler(async (req, res) => {
  const { page, search } = req.query;

  const limit = ITEMS_PER_PAGE.ANSWER;
  const offset = page ? (page - 1) * limit : 0;
  const sort = { createdAt: -1 };

  // Search by question id
  const condition = search ? { questionId: search } : {};

  const data = await Answer.paginate(condition, { offset, limit, sort });
  const answers = {
    totalItems: data.totalDocs,
    list: data.docs,
    totalPages: data.totalPages,
    currentPage: data.page,
    itemsPerPage: data.limit,
  };

  res.status(200).json(answers);
});

// @type    GET_ENTRY_BY_ID
// @desc    Get answer by id
// @route   GET /api/answers/:id
// @access  Private
const getAnswerById = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.ANSWER_NOT_FOUND);
  }

  const user = await User.findOne({ _id: answer.userId.toString() });
  answer.user = user;
  const question = await Question.findOne({
    _id: answer.questionId.toString(),
  });
  answer.question = question;

  res.status(200).json(answer);
});

// @type    CREATE_ENTRY
// @desc    Create answer
// @route   POST /api/answers
// @access  Private
const createAnswer = asyncHandler(async (req, res) => {
  const { content, questionId, reqUserId } = req.body;

  // Check required fields
  if (!content || !questionId) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.REQUIRED_FIELD);
  }
  // Check user not founds
  if (!req.user) {
    res.status(401);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }

  const userId = reqUserId ? reqUserId : req.user.id;
  const user = await User.findById(userId);
  const answer = await Answer.create({
    userId,
    user,
    questionId,
    content,
    userLikes: {},
    likesCount: 0,
  });

  res.status(200).json(answer);
});

// @type    UPDATE_ENTRY
// @desc    Update answer
// @route   PUT /api/answers/:id
// @access  Private
const updateAnswer = asyncHandler(async (req, res) => {
  const { reqUserId } = req.body;
  const answer = await Answer.findById(req.params.id);
  const userId = reqUserId ? reqUserId : answer.userId;

  // Check answer not founds
  if (!answer) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.ANSWER_NOT_FOUND);
  }
  // Check user not founds
  if (!req.user) {
    res.status(401);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }
  // Check permission
  const hasPermission =
    req.user.role === ROLE.ADMIN || answer.userId.toString() === req.user.id;
  if (!hasPermission) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }

  const updatedAnswer = await Answer.findByIdAndUpdate(
    req.params.id,
    { ...req.body, userId },
    {
      new: true,
    }
  );

  res.status(200).json(updatedAnswer);
});

// @type    DELETE_ENTRY
// @desc    Delete answer
// @route   DELETE /api/answers/:id
// @access  Private
const deleteAnswer = asyncHandler(async (req, res) => {
  const answerId = req.params.id;
  const answer = await Answer.findById(answerId);

  // Check answer not founds
  if (!answer) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.ANSWER_NOT_FOUND);
  }
  // Check user not founds
  if (!req.user) {
    res.status(401);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }
  // Check permission
  const hasPermission =
    req.user.role === ROLE.ADMIN || answer.userId.toString() === req.user.id;
  if (!hasPermission) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }

  // Remove answer
  await answer.remove();
  // Remove related notifcation
  const { questionId } = answer;
  await Notification.deleteMany({
    questionId,
    type: NOTIFICATION_TYPE.LIKE_COMMENT,
  });

  res.status(200).json({ id: answerId });
});

// @type    LIKE_UNLIKE_ENTRY
// @desc    Like or unlike answer
// @route   PUT /api/answers/:id/likes
// @access  Private
const likeOrUnlikeAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);

  // Check answer not founds
  if (!answer) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.ANSWER_NOT_FOUND);
  }
  // Check user not founds
  if (!req.user) {
    res.status(401);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }

  const newAnswer = { ...answer }._doc;
  if (!newAnswer.userLikes[req.user.id] || !newAnswer.likesCount) {
    newAnswer.userLikes[req.user.id] = true;
    newAnswer.likesCount++;
  } else {
    delete newAnswer.userLikes[req.user.id];
    newAnswer.likesCount--;
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

// @type    GET_ENTRIES2_BY_ENTRY_ID
// @desc    Get users like by answer id
// @route   GET /api/answers/likes/:answerId
// @access  Public
const getUsersLikeByAnswerId = asyncHandler(async (req, res) => {
  const answerId = req.params.id;
  const answer = await Answer.findById(answerId);
  const usersList = [];
  const usersArr = Object.keys(answer.userLikes);

  for (let i = 0; i < usersArr.length; i++) {
    const user = await User.findById(usersArr[i]);
    usersList.push(user);
  }

  res.status(200).json({ usersList, answerId });
});

module.exports = {
  getAnswersByQuestionId,
  paginateAnswers,
  getAnswerById,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  likeOrUnlikeAnswer,
  getUsersLikeByAnswerId,
};
