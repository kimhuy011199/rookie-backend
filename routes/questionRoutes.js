const express = require('express');
const router = express.Router();
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getQuestions).post(protect, createQuestion);
router
  .route('/:id')
  .delete(protect, deleteQuestion)
  .put(protect, updateQuestion);

module.exports = router;
