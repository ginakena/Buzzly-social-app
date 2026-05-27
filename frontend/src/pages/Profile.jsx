import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Button, CircularProgress, Alert,
  Card, CardContent, Tabs, Tab, Divider, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import api from '../api/Api';
import { useAuth } from '../context/authContext';
import PostCard from '../components/Postcard';

const Profile = () => {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Edit profile dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', avatar: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const isOwnProfile = user?._id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/users/${id}`);
        setProfile(data.user);
        setPosts(data.posts);
        // Check if current user follows this profile
        setFollowing(data.user.followers.some((f) => f._id === user?._id || f === user?._id));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, user?._id]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const { data } = await api.post(`/users/${id}/follow`);
      setFollowing(data.following);
      // Update follower count locally
      setProfile((prev) => ({
        ...prev,
        followers: data.following
          ? [...prev.followers, { _id: user._id }]
          : prev.followers.filter((f) => f._id !== user._id),
      }));
      refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleOpenEdit = () => {
    setEditForm({ username: profile.username, bio: profile.bio, avatar: profile.avatar });
    setEditError('');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      const { data } = await api.patch('/users/profile', editForm);
      setProfile((prev) => ({ ...prev, ...data.user }));
      refreshUser();
      setEditOpen(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', pt: 12, px: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', px: 2, pt: 10, pb: 4 }}>
      {/* Profile header */}
      <Card elevation={1} sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
            <Avatar
              src={profile?.avatar}
              sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}
            >
              {profile?.username?.[0]?.toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight={700}>{profile?.username}</Typography>

                {isOwnProfile ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={handleOpenEdit}
                    sx={{ borderRadius: 3, textTransform: 'none' }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    variant={following ? 'outlined' : 'contained'}
                    size="small"
                    onClick={handleFollow}
                    disabled={followLoading}
                    sx={{ borderRadius: 3, textTransform: 'none', minWidth: 100 }}
                  >
                    {followLoading
                      ? <CircularProgress size={16} />
                      : following ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
              </Box>

              {profile?.bio && (
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {profile.bio}
                </Typography>
              )}

              {/* Stats */}
              <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                <Chip label={`${posts.length} Posts`} size="small" variant="outlined" />
                <Chip
                  label={`${profile?.followers?.length || 0} Followers`}
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/profile/${id}/followers`)}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label={`${profile?.following?.length || 0} Following`}
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/profile/${id}/following`)}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Posts" />
      </Tabs>
      <Divider sx={{ mb: 2 }} />

      {/* Posts */}
      {posts.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          {isOwnProfile ? "You haven't posted anything yet." : 'No posts yet.'}
        </Typography>
      ) : (
        posts.map((post) => (
          <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
        ))
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Edit Profile</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {editError && <Alert severity="error">{editError}</Alert>}
          <TextField
            label="Username"
            value={editForm.username}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            fullWidth
            size="small"
          />
          <TextField
            label="Bio"
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            fullWidth
            multiline
            rows={3}
            size="small"
            inputProps={{ maxLength: 160 }}
            helperText={`${editForm.bio.length}/160`}
          />
          <TextField
            label="Avatar URL"
            value={editForm.avatar}
            onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
            fullWidth
            size="small"
            placeholder="https://example.com/avatar.jpg"
          />
          {editForm.avatar && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">Preview:</Typography>
              <Avatar src={editForm.avatar} sx={{ width: 48, height: 48 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={editLoading}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {editLoading ? <CircularProgress size={18} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;