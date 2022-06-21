const express = require('express');
const router = express.Router();
const {
  getQuestionsByUserId,
  paginateQuestions,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getRecommendQuestions,
} = require('../controllers/questionController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', paginateQuestions);
router.get('/all', getQuestions);
router.get('/user/:id', protect, getQuestionsByUserId);
router.get('/:id', getQuestionById);
router.get('/:id/recommendation', getRecommendQuestions);
router.post('/', protect, createQuestion);
router.put('/:id', protect, updateQuestion);
router.delete('/:id', protect, deleteQuestion);

module.exports = router;
