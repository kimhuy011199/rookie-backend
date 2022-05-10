const express = require('express');
const router = express.Router();
const {
  getAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  likeOrUnlikeAnswer,
} = require('../controllers/answerController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createAnswer);
router
  .route('/:id')
  .get(getAnswers)
  .delete(protect, deleteAnswer)
  .put(protect, updateAnswer);
router.route('/:id/likes').put(protect, likeOrUnlikeAnswer);

module.exports = router;
