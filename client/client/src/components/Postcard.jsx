import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardHeader, CardContent, CardActions, CardMedia,
  Avatar, IconButton, Typography, Box, TextField, Button,
  Collapse, Divider, Tooltip,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { formatDistanceToNow } from 'date-fns';
import api from '../api';
import { useAuth } from '../context/authContext';

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLiked = likes.includes(user?._id);
  const isOwner = post.author?._id === user?._id;

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLikes((prev) =>
        data.liked ? [...prev, user._id] : prev.filter((id) => id !== user._id)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { text: commentText });
      setComments((prev) => [...prev, data.comment]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${post._id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card elevation={1} sx={{ mb: 2, borderRadius: 3 }}>
      <CardHeader
        avatar={
          <Avatar
            src={post.author?.avatar}
            sx={{ cursor: 'pointer', bgcolor: 'primary.main' }}
            onClick={() => navigate(`/profile/${post.author?._id}`)}
          >
            {post.author?.username?.[0]?.toUpperCase()}
          </Avatar>
        }
        title={
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => navigate(`/profile/${post.author?._id}`)}
          >
            {post.author?.username}
          </Typography>
        }
        subheader={
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </Typography>
        }
        action={
          isOwner && (
            <Tooltip title="Delete post">
              <IconButton onClick={handleDeletePost} size="small" color="error">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )
        }
      />

      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body1">{post.content}</Typography>
      </CardContent>

      {post.image && (
        <CardMedia
          component="img"
          image={post.image}
          alt="Post image"
          sx={{ maxHeight: 400, objectFit: 'cover' }}
        />
      )}

      <CardActions sx={{ px: 2, pb: 0 }}>
        {/* Like */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleLike} size="small" color={isLiked ? 'error' : 'default'}>
            {isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
          </IconButton>
          <Typography variant="caption" color="text.secondary">{likes.length}</Typography>
        </Box>

        {/* Comments toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
          <IconButton onClick={() => setShowComments((p) => !p)} size="small">
            <ChatBubbleOutlineIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary">{comments.length}</Typography>
        </Box>
      </CardActions>

      {/* Comments section */}
      <Collapse in={showComments}>
        <Divider sx={{ mt: 1 }} />
        <Box sx={{ px: 2, py: 1 }}>
          {comments.length === 0 && (
            <Typography variant="caption" color="text.secondary">No comments yet.</Typography>
          )}
          {comments.map((comment) => (
            <Box key={comment._id} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <Avatar
                src={comment.author?.avatar}
                sx={{ width: 28, height: 28, mr: 1, mt: 0.5, bgcolor: 'secondary.main', fontSize: 12 }}
              >
                {comment.author?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, bgcolor: 'grey.100', borderRadius: 2, px: 1.5, py: 0.75 }}>
                <Typography variant="caption" fontWeight={700}>
                  {comment.author?.username}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 13 }}>{comment.text}</Typography>
              </Box>
              {(comment.author?._id === user?._id || isOwner) && (
                <IconButton
                  size="small"
                  onClick={() => handleDeleteComment(comment._id)}
                  sx={{ ml: 0.5 }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          ))}

          {/* Add comment */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddComment}
              disabled={submitting || !commentText.trim()}
              sx={{ borderRadius: 3, textTransform: 'none' }}
            >
              Post
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

export default PostCard;