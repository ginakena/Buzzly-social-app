import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Alert, Avatar,
  List, ListItem, ListItemAvatar, ListItemText, Button, Paper,
} from '@mui/material';
import api from '../api/Api';
import { useAuth } from '../context/authContext';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followingMap, setFollowingMap] = useState({});
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError('');
    api.get(`/users/search?q=${encodeURIComponent(query)}`)
      .then(({ data }) => {
        setResults(data.users);
        // Build a map of who the current user already follows
        const map = {};
        data.users.forEach((u) => {
          map[u._id] = u.followers?.some((f) => f === user?._id || f?._id === user?._id);
        });
        setFollowingMap(map);
      })
      .catch((err) => setError(err.response?.data?.message || 'Search failed.'))
      .finally(() => setLoading(false));
  }, [query, user?._id]);

  const handleFollow = async (targetId) => {
    setFollowLoading((prev) => ({ ...prev, [targetId]: true }));
    try {
      const { data } = await api.post(`/users/${targetId}/follow`);
      setFollowingMap((prev) => ({ ...prev, [targetId]: data.following }));
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: 10, pb: 4 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Search results for &quot;{query}&quot;
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : results.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={6}>
          No users found for &quot;{query}&quot;.
        </Typography>
      ) : (
        <Paper elevation={1} sx={{ borderRadius: 3 }}>
          <List disablePadding>
            {results.map((u, i) => (
              <ListItem
                key={u._id}
                divider={i < results.length - 1}
                secondaryAction={
                  u._id !== user?._id && (
                    <Button
                      variant={followingMap[u._id] ? 'outlined' : 'contained'}
                      size="small"
                      onClick={() => handleFollow(u._id)}
                      disabled={followLoading[u._id]}
                      sx={{ borderRadius: 3, textTransform: 'none', minWidth: 90 }}
                    >
                      {followLoading[u._id]
                        ? <CircularProgress size={14} />
                        : followingMap[u._id] ? 'Unfollow' : 'Follow'}
                    </Button>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar
                    src={u.avatar}
                    sx={{ cursor: 'pointer', bgcolor: 'primary.main' }}
                    onClick={() => navigate(`/profile/${u._id}`)}
                  >
                    {u.username?.[0]?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => navigate(`/profile/${u._id}`)}
                    >
                      {u.username}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {u.bio || 'No bio yet'} · {u.followers?.length || 0} followers
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Search;