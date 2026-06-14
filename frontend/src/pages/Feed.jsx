import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, TextField, Button, Card, CardContent, Typography,
  CircularProgress, Alert, Avatar, Divider, IconButton,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api/Api';
import { useAuth } from '../context/authContext';
import PostCard from '../components/Postcard';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState('');

  // Create post state
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const fileInputRef = useRef(null);

  const fetchFeed = useCallback(async (cursor = null) => {
    try {
      const params = { limit: 10 };
      if (cursor) params.cursor = cursor;
      const { data } = await api.get('/posts/feed', { params });
      setPosts((prev) => cursor ? [...prev, ...data.posts] : data.posts);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchFeed(nextCursor);
  };

  // When user picks a file — show preview immediately, no upload yet
  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit post — sends as FormData so backend receives the actual file
  const handleCreatePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    setPostError('');
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (imageFile) formData.append('image', imageFile);

      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPosts((prev) => [data.post, ...prev]);
      setContent('');
      setImageFile(null);
      setImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to create post.');
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: 10, pb: 4 }}>

      {/* Create post box */}
      <Card elevation={1} sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Avatar src={user?.avatar} sx={{ bgcolor: 'primary.main', mt: 0.5 }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <TextField
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
                placeholder={`What's on your mind, ${user?.username}?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              {/* Image preview with remove button */}
              {imagePreview && (
                <Box sx={{ position: 'relative', mt: 1, borderRadius: 2, overflow: 'hidden' }}>
                  <img
                    src={imagePreview}
                    alt="preview"
                    style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute', top: 6, right: 6,
                      bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {postError && <Alert severity="error" sx={{ mt: 1 }}>{postError}</Alert>}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                {/* Hidden file input — triggered by the Photo button below */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImagePick}
                />

                <Button
                  size="small"
                  startIcon={<ImageIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: 'none', color: 'text.secondary' }}
                >
                  Photo
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreatePost}
                  disabled={posting || !content.trim()}
                  sx={{ borderRadius: 3, textTransform: 'none', px: 3 }}
                >
                  {posting ? <CircularProgress size={18} color="inherit" /> : 'Post'}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      {/* Feed posts */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography color="text.secondary">
            Your feed is empty. Follow some users or check out{' '}
            <Typography component="a" href="/explore" color="primary" sx={{ textDecoration: 'none' }}>
              Explore
            </Typography>
            .
          </Typography>
        </Box>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
          ))}
          {hasMore && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={loadingMore}
                sx={{ borderRadius: 3, textTransform: 'none' }}
              >
                {loadingMore ? <CircularProgress size={20} /> : 'Load more'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Feed;