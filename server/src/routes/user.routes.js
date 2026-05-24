const express = require('express');
const router = express.Router();

const {
  getProfile,
  searchUsers,
  toggleFollow,
  updateProfile,
  getSuggestions,
  getFollowers,
  getFollowing,
} = require('../controllers/user.controller');

const { protect, optionalAuth } = require('../middleware/auth');
const { updateProfileRules, validate } = require('../middleware/validate');

// GET /api/users/search?q=term  (works logged-in or out)
router.get('/search', optionalAuth, searchUsers);

// GET /api/users/suggestions  
router.get('/suggestions', protect, getSuggestions);

// PATCH /api/users/profile  (protected)
router.patch('/profile', protect, updateProfileRules, validate, updateProfile);

// GET /api/users/:id
router.get('/:id', getProfile);

// GET /api/users/:id/followers
router.get('/:id/followers', getFollowers);

// GET /api/users/:id/following
router.get('/:id/following', getFollowing);

// POST /api/users/:id/follow  (protected)
router.post('/:id/follow', protect, toggleFollow);

module.exports = router;