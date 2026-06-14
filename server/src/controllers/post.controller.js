const Post = require('../models/Post');
const User = require('../models/User');

// POST /api/posts
const createPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    const image = req.file ? req.file.path : '';


    const post = await Post.create({
      author: req.user._id,
      content,
      image: image || '',
    });

    // Populate author info before returning
    await post.populate('author', 'username avatar');

    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/feed 
// Posts from users the current user follows + their own posts
// Supports cursor-based pagination via ?cursor=<lastPostId>&limit=<n>
const getFeed = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select('following');
    const authorIds = [...currentUser.following, req.user._id];

    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const cursor = req.query.cursor; // _id of last seen post

    const filter = { author: { $in: authorIds } };
    if (cursor) filter._id = { $lt: cursor }; // posts older than cursor

    const posts = await Post.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1) // fetch one extra to determine hasMore
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    const nextCursor = hasMore ? posts[posts.length - 1]._id : null;

    res.status(200).json({ success: true, posts, hasMore, nextCursor });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/explore 
// All public posts — for users with no following yet
const getExplorePosts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor = req.query.cursor;

    const filter = {};
    if (cursor) filter._id = { $lt: cursor };

    const posts = await Post.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();

    res.status(200).json({
      success: true,
      posts,
      hasMore,
      nextCursor: hasMore ? posts[posts.length - 1]._id : null,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:id
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    res.status(200).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

//  PATCH /api/posts/:id 
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post.' });
    }

    const { content, image } = req.body;
    if (content !== undefined) post.content = content;
    if (image !== undefined) post.image = image;

    await post.save();
    await post.populate('author', 'username avatar');

    res.status(200).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

//  DELETE /api/posts/:id 
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post.' });
    }

    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
};

//POST /api/posts/:id/like
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const userId = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.addToSet(userId);
    }

    await post.save();

    res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likeCount: post.likes.length,
    });
  } catch (err) {
    next(err);
  }
};

//POST /api/posts/:id/comments
const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const comment = { author: req.user._id, text: req.body.text };
    post.comments.push(comment);
    await post.save();

    // Return just the new comment with author populated
    const savedPost = await Post.findById(post._id).populate('comments.author', 'username avatar');
    const newComment = savedPost.comments[savedPost.comments.length - 1];

    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    next(err);
  }
};

//  DELETE /api/posts/:id/comments/:commentId 
const deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    // Allow comment author OR post author to delete
    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isPostAuthor = post.author.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
    }

    comment.deleteOne();
    await post.save();

    res.status(200).json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPost,
  getFeed,
  getExplorePosts,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
};