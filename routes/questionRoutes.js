const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getQuestions).post(protect, createQuestion);
router
  .route('/:id')
  .get(getQuestion)
  .delete(protect, deleteQuestion)
  .put(protect, updateQuestion);

module.exports = router;
