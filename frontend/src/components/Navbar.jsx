import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Box,
  Menu, MenuItem, InputBase, Tooltip, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import ExploreIcon from '@mui/icons-material/Explore';
import { useAuth } from '../context/authContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar sx={{ gap: 2 }}>
        {/* Logo */}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/feed"
          sx={{ fontWeight: 700, textDecoration: 'none', color: 'primary.main', flexShrink: 0 }}
        >
          Buzzly
        </Typography>

        {/* Search bar */}
        <Box sx={{
          display: 'flex', alignItems: 'center', bgcolor: 'grey.100',
          borderRadius: 2, px: 1.5, py: 0.5, flex: 1, maxWidth: 400,
        }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            fullWidth
            sx={{ fontSize: 14 }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Nav icons */}
        <Tooltip title="Feed">
          <IconButton component={RouterLink} to="/feed" color="inherit">
            <HomeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Explore">
          <IconButton component={RouterLink} to="/explore" color="inherit">
            <ExploreIcon />
          </IconButton>
        </Tooltip>

        {/* Avatar menu */}
        <Tooltip title="Account">
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
            <Avatar
              src={user?.avatar}
              alt={user?.username}
              sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem
            onClick={() => { setAnchorEl(null); navigate(`/profile/${user?._id}`); }}
          >
            Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;