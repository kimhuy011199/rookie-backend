const express = require('express');
const router = express.Router();
const {
  getTags,
  paginationTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} = require('../controllers/tagController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', paginationTags);
router.get('/all', getTags);
router.get('/:id', getTagById);
router.post('/', protect, createTag);
router.put('/:id', protect, updateTag);
router.delete('/:id', protect, deleteTag);

module.exports = router;
