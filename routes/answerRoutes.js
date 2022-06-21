const express = require('express');
const router = express.Router();
const {
  getAnswersByQuestionId,
  paginateAnswers,
  getAnswerById,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  likeOrUnlikeAnswer,
} = require('../controllers/answerController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', paginateAnswers);
router.get('/questions/:id', getAnswersByQuestionId);
router.get('/:id', protect, getAnswerById);
router.post('/', protect, createAnswer);
router.put('/:id', protect, updateAnswer);
router.delete('/:id', protect, deleteAnswer);
router.put('/:id/likes', protect, likeOrUnlikeAnswer);

module.exports = router;
