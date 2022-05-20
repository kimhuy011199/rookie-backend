const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getRecommendQuestions,
} = require('../controllers/questionController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getQuestions).post(protect, createQuestion);
router
  .route('/:id')
  .get(getQuestion)
  .delete(protect, deleteQuestion)
  .put(protect, updateQuestion);
router.route('/:id/recommendation').get(getRecommendQuestions);

module.exports = router;
