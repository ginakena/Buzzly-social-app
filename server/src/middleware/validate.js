const { body, validationResult } = require('express-validator');

// Run validation rules and return 400 if any fail
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // return the first error message
      errors: errors.array(),
    });
  }
  next();
};

// ── Auth rules ─────────────────────────────────────────────────────────────

const registerRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ── Post rules ──────────────────────────────────────────────────────────────

const createPostRules = [
  body('content')
    .trim()
    .notEmpty().withMessage('Post content cannot be empty.')
    .isLength({ max: 2000 }).withMessage('Post cannot exceed 2000 characters.'),
  body('image')
    .optional()
    .isURL().withMessage('Image must be a valid URL.'),
];

const commentRules = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text cannot be empty.')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters.'),
];

// ── Profile rules ───────────────────────────────────────────────────────────

const updateProfileRules = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters.'),
  body('avatar')
    .optional()
    .isURL().withMessage('Avatar must be a valid URL.'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  createPostRules,
  commentRules,
  updateProfileRules,
};