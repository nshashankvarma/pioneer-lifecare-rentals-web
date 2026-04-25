import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErr('Email and password are required');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setErr(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#1565C0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Stack alignItems="center" spacing={1.5} mb={4}>
          <Box
            sx={{
              width: 108,
              height: 108,
              borderRadius: '50%',
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 6,
            }}
          >
            <Box component="img" src={logo} alt="logo" sx={{ width: 84, height: 84 }} />
          </Box>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, textAlign: 'center' }}>
            Pioneer Lifecare Systems
          </Typography>
          <Typography variant="body2" sx={{ color: '#BBDEFB' }}>
            Equipment Rental Management
          </Typography>
        </Stack>

        <Paper sx={{ p: 3, borderRadius: 4 }} elevation={4}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" textAlign="center" mb={2.5}>
              Sign In
            </Typography>

            {err && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErr(null)}>
                {err}
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              fullWidth
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} edge="end">
                      {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.2 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>

            <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 2, color: '#9E9E9E' }}>
              Contact your administrator to get an account.
            </Typography>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}
