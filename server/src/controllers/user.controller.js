const User = require('../models/User');
const Post = require('../models/Post');

// GET /api/users/:id
// Get a user's public profile with their posts
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Fetch their posts, newest first
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');

    res.status(200).json({
      success: true,
      user,
      posts,
      postCount: posts.length,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/search
// Search users by username
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' },
      _id: { $ne: req.user?._id }, // exclude self if authenticated
    })
      .select('username avatar bio followers')
      .limit(20);

    res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:id/follow 
// Toggle follow / unfollow
const toggleFollow = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user._id;

    if (targetId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const alreadyFollowing = targetUser.followers.includes(currentUserId);

    if (alreadyFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } });

      return res.status(200).json({
        success: true,
        message: `Unfollowed ${targetUser.username}.`,
        following: false,
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetId } });

      return res.status(200).json({
        success: true,
        message: `Now following ${targetUser.username}.`,
        following: true,
      });
    }
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/profile 
// Update authenticated user's own profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['username', 'bio', 'avatar'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Check username uniqueness if changing
    if (updates.username) {
      const taken = await User.findOne({
        username: updates.username,
        _id: { $ne: req.user._id },
      });
      if (taken) {
        return res.status(400).json({ success: false, message: 'Username already taken.' });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/suggestions 
// Return users the authenticated user isn't following yet
const getSuggestions = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select('following');

    const suggestions = await User.find({
      _id: { $ne: req.user._id, $nin: currentUser.following },
    })
      .select('username avatar bio followers')
      .limit(10)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, suggestions });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/followers 
const getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('followers')
      .populate('followers', 'username avatar bio');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.status(200).json({ success: true, followers: user.followers });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/following 
const getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('following')
      .populate('following', 'username avatar bio');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.status(200).json({ success: true, following: user.following });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  searchUsers,
  toggleFollow,
  updateProfile,
  getSuggestions,
  getFollowers,
  getFollowing,
};