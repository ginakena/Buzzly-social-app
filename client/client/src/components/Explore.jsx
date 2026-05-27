import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, CircularProgress, Alert, Button,
  TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api/Api';
import PostCard from '../components/Postcard';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchPosts = useCallback(async (cursor = null) => {
    try {
      const params = { limit: 15 };
      if (cursor) params.cursor = cursor;
      const { data } = await api.get('/posts/explore', { params });
      setPosts((prev) => cursor ? [...prev, ...data.posts] : data.posts);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchPosts(nextCursor);
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  // Client-side filter by content or username
  const filtered = posts.filter((p) =>
    p.content.toLowerCase().includes(search.toLowerCase()) ||
    p.author?.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: 10, pb: 4 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Explore</Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Filter by content or username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={6}>
          No posts found.
        </Typography>
      ) : (
        <>
          {filtered.map((post) => (
            <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
          ))}
          {hasMore && !search && (
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

export default Explore;