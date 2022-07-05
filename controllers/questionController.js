const asyncHandler = require('express-async-handler');
const { ITEMS_PER_PAGE, ROLE } = require('../core/contants/constants');
const { ERROR_MESSAGE } = require('../core/contants/errorMessage');
const { recommendQuestions } = require('../core/services/recommendation');

const Question = require('../models/questionModel');
const User = require('../models/userModel');
const Tag = require('../models/tagModel');
const Answer = require('../models/answerModel');
const Notification = require('../models/notificationModel');

// @type    GET_ENTRIES_BY_ENTRY2_ID
// @desc    Get questions by user id
// @route   GET /api/questions/user/:userId
// @access  Private
const getQuestionsByUserId = asyncHandler(async (req, res) => {
  const questions = await Question.find({ userId: req.params.id }).sort({
    createdAt: -1,
  });

  res.status(200).json(questions);
});

// @type    GET_ENTRIES
// @desc    Get questions
// @route   GET /api/questions/all
// @access  Public
const getQuestions = asyncHandler(async (req, res) => {
  const { search } = req.query;

  // Search by id
  const isId = search && search.length === 24 && !search.split(' ')[1];
  if (isId) {
    const question = await Question.findById(search);
    return res.status(200).json([question]);
  }

  // Search by title
  const condition = search
    ? { title: { $regex: new RegExp(search), $options: 'i' } }
    : {};

  const questions = await Question.find(condition).sort({
    createdAt: -1,
  });

  res.status(200).json(questions);
});

// @type    PAGINATE_ENTRIES
// @desc    Paginate questions
// @route   GET /api/questions
// @access  Public
const paginateQuestions = asyncHandler(async (req, res) => {
  const { page, search } = req.query;

  const limit = ITEMS_PER_PAGE.QUESTION;
  const offset = page ? (page - 1) * limit : 0;
  const sort = { createdAt: -1 };

  // Search by id
  const isId = search && search.length === 24 && !search.split(' ')[1];
  if (isId) {
    const question = await Question.findById(search);
    const questions = {
      totalItems: 1,
      questionsList: [question],
      totalPages: 1,
      currentPage: 0,
      itemsPerPage: 1,
    };
    return res.status(200).json(questions);
  }

  // Search by title + tag
  const indexOfCloseBracket = search.indexOf(']');
  const title =
    indexOfCloseBracket !== -1
      ? search.substring(indexOfCloseBracket + 2)
      : search.trim();
  const tag =
    indexOfCloseBracket !== -1 ? search.substring(1, indexOfCloseBracket) : '';
  const tagId = await Tag.findOne({ name: tag });
  if (tag && !tagId) {
    const questions = {
      totalItems: 0,
      questionsList: [],
      totalPages: 0,
      currentPage: 0,
      itemsPerPage: 0,
    };
    return res.status(200).json(questions);
  }

  const titleCondition = title
    ? { title: { $regex: new RegExp(title), $options: 'i' } }
    : {};
  const tagCondition = tagId ? { 'tags._id': { $in: [tagId] } } : {};
  const condition = search ? { ...titleCondition, ...tagCondition } : {};

  const data = await Question.paginate(condition, { offset, limit, sort });
  const questions = {
    totalItems: data.totalDocs,
    questionsList: data.docs,
    totalPages: data.totalPages,
    currentPage: data.page,
    itemsPerPage: data.limit,
  };

  for (let index = 0; index < questions.questionsList.length; index++) {
    const user = await User.findOne({
      _id: questions.questionsList[index].userId.toString(),
    });
    questions.questionsList[index].user = user;
  }
  for (let index = 0; index < questions.questionsList.length; index++) {
    if (questions.questionsList[index].tags.length > 0) {
      for (let i = 0; i < questions.questionsList[index].tags.length; i++) {
        const tag = await Tag.findOne({
          _id: questions.questionsList[index].tags[i]._id.toString(),
        });
        questions.questionsList[index].tags[i] = tag;
      }
    }
  }

  res.status(200).json(questions);
});

// @type    GET_ENTRY_BY_ID
// @desc    Get question by id
// @route   GET /api/questions/:id
// @access  Public
const getQuestionById = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.QUESTION_NOT_FOUND);
  }

  const user = await User.findOne({ _id: question.userId.toString() });
  question.user = user;

  for (let index = 0; index < question.tags.length; index++) {
    const tag = await Tag.findOne({
      _id: question.tags[index]._id.toString(),
    });
    question.tags[index] = tag;
  }

  res.status(200).json(question);
});

// @type    CREATE_ENTRY
// @desc    Create question
// @route   POST /api/questions
// @access  Private
const createQuestion = asyncHandler(async (req, res) => {
  const { title, content, tags = [], reqUserId } = req.body;

  // Check required fields
  if (!title | !content) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.REQUIRED_FIELD);
  }
  // Check title already exists
  const titleAlreadyExists = await Question.findOne({ title });
  if (titleAlreadyExists) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.TITLE_EXIST);
  }
  // Check user not founds
  if (!req.user) {
    res.status(401);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }

  const question = await Question.create({
    userId: reqUserId ? reqUserId : req.user.id,
    title,
    content,
    tags,
  });

  res.status(200).json(question);
});

// @type    UPDATE_ENTRY
// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private
const updateQuestion = asyncHandler(async (req, res) => {
  const { reqUserId } = req.body;
  const question = await Question.findById(req.params.id);
  const userId = reqUserId ? reqUserId : question.userId;

  // Check question not founds
  if (!question) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.QUESTION_NOT_FOUND);
  }
  // Check user not founds
  if (!req.user) {
    res.status(401);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }
  // Check title already exists
  const { title } = req.body;
  if (question.title !== title) {
    const titleAlreadyExists = await Question.findOne({ title });
    if (titleAlreadyExists) {
      res.status(400);
      throw new Error(ERROR_MESSAGE.TITLE_EXIST);
    }
  }
  // Check permission
  const hasPermission =
    req.user.role === ROLE.ADMIN || question.userId.toString() === req.user.id;
  if (!hasPermission) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }

  const updatedQuestion = await Question.findByIdAndUpdate(
    req.params.id,
    { ...req.body, userId },
    {
      new: true,
    }
  );

  res.status(200).json(updatedQuestion);
});

// @type    DELETE_ENTRY
// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
const deleteQuestion = asyncHandler(async (req, res) => {
  const questionId = req.params.id;
  const question = await Question.findById(questionId);

  // Check question is founded
  if (!question) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.QUESTION_NOT_FOUND);
  }
  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }
  // Check permission
  const hasPermission =
    req.user.role === ROLE.ADMIN || question.userId.toString() === req.user.id;
  if (!hasPermission) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }

  // Remove question
  await question.remove();
  // Remove related answers
  await Answer.deleteMany({ questionId });
  // Remove related notifications
  await Notification.deleteMany({ questionId });

  res.status(200).json({ id: questionId });
});

// @type    GET_ENTRIES_RECOMMENDATION
// @desc    Get recommendation questions by question id
// @route   GET /api/questions/:id/recommendation
// @access  Public
const getRecommendQuestions = asyncHandler(async (req, res) => {
  const documents = await Question.find();

  const questionsList = recommendQuestions(documents, req.params.id);

  res.status(200).json(questionsList);
});

module.exports = {
  getQuestionsByUserId,
  getQuestions,
  paginateQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getRecommendQuestions,
};
