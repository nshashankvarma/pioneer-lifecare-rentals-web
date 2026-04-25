import {
  AppBar,
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  { path: '/', label: 'Dashboard', icon: <GridViewOutlinedIcon /> },
  { path: '/new-rental', label: 'New Rental', icon: <AddCircleOutlineIcon /> },
  { path: '/reports', label: 'Reports', icon: <BarChartOutlinedIcon /> },
];

const ADMIN_NAV = { path: '/admin', label: 'Admin', icon: <SettingsOutlinedIcon /> };

const DRAWER_WIDTH = 240;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { profile, signOut, isAdmin } = useAuth();

  const navItems = isAdmin ? [...NAV, ADMIN_NAV] : NAV;

  function handleNav(path: string) {
    navigate(path);
  }

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  async function handleSignOut() {
    if (window.confirm('Sign out?')) await signOut();
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          {isMobile && (
            <Box
              component="img"
              src={logo}
              alt="logo"
              sx={{ width: 28, height: 28, mr: 1.5, bgcolor: '#fff', borderRadius: '50%', p: 0.25 }}
            />
          )}
          <Typography variant="h6" sx={{ flex: 1, color: '#fff' }} noWrap>
            Pioneer Lifecare
          </Typography>
          <Tooltip title={profile?.full_name ?? ''}>
            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#0D47A1', fontSize: 14 }}>
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </Avatar>
          </Tooltip>
          <Tooltip title="Sign out">
            <IconButton color="inherit" onClick={handleSignOut} edge="end" size="small">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Desktop sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid #ECEFF1',
            },
          }}
        >
          <Toolbar sx={{ gap: 1.5 }}>
            <Box
              component="img"
              src={logo}
              alt="logo"
              sx={{ width: 32, height: 32, objectFit: 'contain' }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1A237E' }}>
              Pioneer Lifecare
            </Typography>
          </Toolbar>
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.path}
                selected={isActive(item.path)}
                onClick={() => handleNav(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  my: 0.25,
                  '&.Mui-selected': {
                    bgcolor: '#E3F2FD',
                    color: '#0D47A1',
                    '& .MuiListItemIcon-root': { color: '#0D47A1' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      )}

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          pt: { xs: 8, md: 9 },
          pb: { xs: 9, md: 2 },
          px: { xs: 1.5, md: 3 },
        }}
      >
        <Outlet />
      </Box>

      {/* Mobile bottom nav */}
      {isMobile && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.drawer + 1,
            borderTop: '1px solid #ECEFF1',
          }}
        >
          <Stack direction="row" justifyContent="space-around" sx={{ py: 0.5 }}>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <ListItemButton
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: 0.5,
                    color: active ? 'primary.main' : '#9E9E9E',
                  }}
                >
                  <Box sx={{ display: 'flex' }}>{item.icon}</Box>
                  <Typography variant="caption" sx={{ fontSize: 10 }}>
                    {item.label}
                  </Typography>
                </ListItemButton>
              );
            })}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
