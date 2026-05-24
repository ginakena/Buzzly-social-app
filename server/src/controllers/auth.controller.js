const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

//  sign a JWT for a user
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

//  send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Strip password before sending (it's select: false but guard anyway)
  const userData = {
    _id: user._id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    followers: user.followers,
    following: user.following,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({ success: true, token, user: userData });
};

// POST /api/auth/register 
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check for existing user
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      return res.status(400).json({ success: false, message: `${field} already in use.` });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ username, email, password: hashedPassword });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login 
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it's select: false on the model)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

//  GET /api/auth/me 
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware
    const user = await User.findById(req.user._id)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };