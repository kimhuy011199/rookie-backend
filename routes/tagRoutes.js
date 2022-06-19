const express = require('express');
const router = express.Router();
const {
  getTags,
  paginationTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
} = require('../controllers/tagController');

router.route('/').get(getTags).post(createTag);
router.route('/pagination').get(paginationTags);
router.route('/:id').get(getTag).put(updateTag).delete(deleteTag);

module.exports = router;
