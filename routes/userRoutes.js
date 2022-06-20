const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/', protect, getUsers);
router.get('/me', protect, getMe);
router.get('/:id', protect, getUserById);
router.put('/:id/password', protect, changePassword);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;
