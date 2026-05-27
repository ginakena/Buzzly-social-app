import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/authContext';
import ProtectedRoute from './components/Protectedroute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Search from './pages/Search';

const theme = createTheme({
  palette: {
    primary: { main: '#1E104E' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Akt", "Roboto", "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

// Layout wraps all protected pages with Navbar
const Layout = ({ children }) => (
  <>
    <Navbar />
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {children}
    </Box>
  </>
);

// Redirect logged-in users away from auth pages
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/feed" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* Protected routes */}
    <Route path="/feed" element={
      <ProtectedRoute>
        <Layout><Feed /></Layout>
      </ProtectedRoute>
    } />
    <Route path="/explore" element={
      <ProtectedRoute>
        <Layout><Explore /></Layout>
      </ProtectedRoute>
    } />
    <Route path="/profile/:id" element={
      <ProtectedRoute>
        <Layout><Profile /></Layout>
      </ProtectedRoute>
    } />
    <Route path="/search" element={
      <ProtectedRoute>
        <Layout><Search /></Layout>
      </ProtectedRoute>
    } />

    {/* Default redirect */}
    <Route path="/" element={<Navigate to="/feed" replace />} />
    <Route path="*" element={<Navigate to="/feed" replace />} />
  </Routes>
);

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;