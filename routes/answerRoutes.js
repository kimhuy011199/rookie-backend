const express = require('express');
const router = express.Router();
const {
  getAnswersByQuestionId,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  likeOrUnlikeAnswer,
  paginateAnswers,
  getAnswer,
} = require('../controllers/answerController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createAnswer).get(paginateAnswers);
router.route('/questions/:id').get(getAnswersByQuestionId);
router
  .route('/:id')
  .get(getAnswer)
  .delete(protect, deleteAnswer)
  .put(protect, updateAnswer);
router.route('/:id/likes').put(protect, likeOrUnlikeAnswer);

module.exports = router;
