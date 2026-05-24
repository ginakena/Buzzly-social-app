const express = require('express');
const router = express.Router();

const {
  createPost,
  getFeed,
  getExplorePosts,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
} = require('../controllers/post.controller');

const { protect } = require('../middleware/auth');
const { createPostRules, commentRules, validate } = require('../middleware/validate');

// GET /api/posts/feed      (protected — shows posts from followed users)
router.get('/feed', protect, getFeed);

// GET /api/posts/explore   (public — latest posts from everyone)
router.get('/explore', getExplorePosts);

// POST /api/posts          (protected)
router.post('/', protect, createPostRules, validate, createPost);

// GET /api/posts/:id
router.get('/:id', getPost);

// PATCH /api/posts/:id     (post author only)
router.patch('/:id', protect, createPostRules, validate, updatePost);

// DELETE /api/posts/:id    (post author only)
router.delete('/:id', protect, deletePost);

// POST /api/posts/:id/like  (post author only)
router.post('/:id/like', protect, toggleLike);

// POST /api/posts/:id/comments  (post author only)
router.post('/:id/comments', protect, commentRules, validate, addComment);

// DELETE /api/posts/:id/comments/:commentId  (protected)
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;