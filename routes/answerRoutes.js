const express = require('express');
const router = express.Router();
const {
  getAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
} = require('../controllers/answerController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createAnswer);
router
  .route('/:id')
  .get(getAnswers)
  .delete(protect, deleteAnswer)
  .put(protect, updateAnswer);

module.exports = router;
