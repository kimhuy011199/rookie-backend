const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const { ITEMS_PER_PAGE, ROLE } = require('../core/contants/constants');
const { ERROR_MESSAGE } = require('../core/contants/errorMessage');

const User = require('../models/userModel');
const Answer = require('../models/answerModel');
const Question = require('../models/questionModel');
const Notification = require('../models/notificationModel');

// @type    REGISTER_USER
// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    displayName,
    email,
    password,
    linkGithub = '',
    linkLinkedIn = '',
    about = '',
  } = req.body;

  // Check required fields
  if (!displayName || !email || !password) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.REQUIRED_FIELD);
  }
  // Check email already exists
  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.EMAIL_EXIST);
  }
  // Check display name already exists
  const displayNameAlreadyExists = await User.findOne({ displayName });
  if (displayNameAlreadyExists) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.DISPLAYNAME_EXIST);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    displayName,
    email,
    password: hashedPassword,
    linkGithub,
    linkLinkedIn,
    about,
    avatarImg: '',
    role: ROLE.MEMBER,
  });

  if (user) {
    res.status(201).json({
      ...user._doc,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error(ERROR_MESSAGE.INVALID_INPUT);
  }
});

// @type    LOGIN_USER
// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.REQUIRED_FIELD);
  }

  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      ...user._doc,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error(ERROR_MESSAGE.INVALID_EMAIL_PASSOWRD);
  }
});

// @type    GET_CURRENT_USER
// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

// @type    PAGINATE_ENTRIES
// @desc    Paginate users
// @route   GET /api/users
// @access  Private
const paginateUsers = asyncHandler(async (req, res) => {
  const { page, search } = req.query;

  const limit = ITEMS_PER_PAGE.USER;
  const offset = page ? (page - 1) * limit : 0;
  const sort = { createdAt: -1 };

  // Search by displayName
  const condition = search
    ? { displayName: { $regex: new RegExp(search), $options: 'i' } }
    : {};

  const data = await User.paginate(condition, { offset, limit, sort });
  const users = {
    totalItems: data.totalDocs,
    list: data.docs,
    totalPages: data.totalPages,
    currentPage: data.page,
    itemsPerPage: data.limit,
  };

  res.status(200).json(users);
});

// @type    GET_ENTRIES
// @desc    Get users
// @route   GET /api/users/all
// @access  Public
const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  // Search by id
  const isId = search && search.length === 24 && !search.split(' ')[1];
  if (isId) {
    const user = await User.findById(search);
    return res.status(200).json([user]);
  }

  // Search by display name
  const condition = search
    ? { displayName: { $regex: new RegExp(search), $options: 'i' } }
    : {};

  const users = await User.find(condition).sort({
    createdAt: -1,
  });

  res.status(200).json(users);
});

// @type    GET_ENTRY_BY_ID
// @desc    Get user by id
// @route   GET /api/users/:id
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }

  res.status(200).json(user);
});

// @type    UPDATE_ENTRY
// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  // Check user not founds
  if (!user) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }
  // Check email already existed
  const { email } = req.body;
  if (user.email !== email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error(ERROR_MESSAGE.EMAIL_EXIST);
    }
  }
  // Check display name and role cannot change
  const { displayName, role } = req.body;
  if (
    (displayName && user.displayName !== displayName) ||
    (role && user.role !== role)
  ) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }
  // Check permission
  const hasPermission =
    req.user?.role === ROLE.ADMIN || user._id.toString() === req.user.id;
  if (!hasPermission) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedUser);
});

// @type    UPDATE_ENTRY
// @desc    Change password
// @route   PUT /api/users/:id/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  const { oldPassword, newPassword } = req.body;

  // Check required fields
  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error(ERROR_MESSAGE.REQUIRED_FIELD);
  }
  // Check user not founds
  if (!user) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }
  // Check permission
  const hasPermission =
    req.user?.role === ROLE.ADMIN || user._id.toString() === req.user.id;
  if (!hasPermission) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }

  if (user && (await bcrypt.compare(oldPassword, user.password))) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      {
        new: true,
      }
    );
    res.status(200).json(updatedUser);
  } else {
    res.status(400);
    throw new Error(ERROR_MESSAGE.INVALID_PASSOWRD);
  }
});

// @type    DELETE_ENTRY
// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);

  // Check user not founds
  if (!req.user) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }
  // Check permission
  if (req.user.role !== ROLE.ADMIN) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }

  // Remove user
  await user.remove();
  // Remove answers
  await Answer.deleteMany({ userId });
  // Remove questions
  await Question.deleteMany({ userId });
  // Remove related notifications
  await Notification.deleteMany({ userId });
  await Notification.deleteMany({ actionId: userId });
  // Remove related likes
  const relatedAnswers = await Answer.find();
  for (let index = 0; index < relatedAnswers.length; index++) {
    const answer = await Answer.findOne({
      _id: relatedAnswers[index]._id.toString(),
    });
    await answer.tags.pull();
    await answer.save();
  }

  res.status(200).json({ id: userId });
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '300d',
  });
};

// @type    RESET_PASSWORD
// @desc    Reset user password
// @route   POST /api/users/reset-password/:id
// @access  Private
const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  // Check user not founds
  if (!req.user || !user) {
    res.status(404);
    throw new Error(ERROR_MESSAGE.USER_NOT_FOUND);
  }
  // Check permission
  if (!req.user?.role === ROLE.ADMIN) {
    res.status(403);
    throw new Error(ERROR_MESSAGE.PERMISSION_DENID);
  }

  // Generate random password
  const newPassword = bcrypt
    .genSaltSync(10)
    .toString()
    .slice(10, 22)
    .concat(0, 'z');

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { password: hashedPassword },
    {
      new: true,
    }
  );

  res.status(200).json(newPassword);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  paginateUsers,
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
  resetPassword,
};
