const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const USERS_PER_PAGES = 3;

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { displayName, email, password } = req.body;

  if (!displayName || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const emailExists = await User.findOne({ email });
  const displayNameExists = await User.findOne({ displayName });
  if (emailExists) {
    res.status(400);
    throw new Error('Email already exists');
  }
  if (displayNameExists) {
    res.status(400);
    throw new Error('Display name already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    displayName,
    email,
    password: hashedPassword,
    linkGithub: '',
    linkLinkedIn: '',
    avatarImg: '',
    about: '',
  });

  if (user) {
    res.status(201).json({
      ...user._doc,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      ...user._doc,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

// @desc    Get all users
// @route   PUT /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  const { page, search } = req.query;

  const limit = USERS_PER_PAGES;
  const offset = page ? (page - 1) * limit : 0;
  const sort = { createdAt: -1 };

  const condition = search
    ? { displayName: { $regex: new RegExp(displayName), $options: 'i' } }
    : {};

  const data = await User.paginate(condition, { offset, limit, sort });
  const users = {
    totalItems: data.totalDocs,
    list: data.docs,
    totalPages: data.totalPages,
    currentPage: data.page,
  };

  res.status(200).json(users);
});

// @desc    Get user by id
// @route   PUT /api/users/:id
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not founds');
  }

  res.status(200).json(user);
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  // Check for user
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  // Make sure the logged in user matches the user
  if (user._id.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }
  // Email already existed
  const { email } = req.body;
  if (user.email !== email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already exists');
    }
  }

  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedUser);
});

// @desc    Change password
// @route   PUT /api/users/:id/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  const { oldPassword, newPassword } = req.body;

  // Check for user
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  // Make sure the logged in user matches the user
  if (user._id.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
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
    throw new Error('Invalid password');
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '300d',
  });
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!tag) {
    res.status(400);
    throw new Error('User not found');
  }

  await user.remove();
  res.status(200).json({ id: req.params.id });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
};
