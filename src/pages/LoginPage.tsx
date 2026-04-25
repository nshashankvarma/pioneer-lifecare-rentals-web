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
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';

function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return null;
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const e164 = toE164(phone);
    if (!e164) {
      setErr('Enter a valid 10-digit phone number');
      return;
    }
    if (!password) {
      setErr('Enter your password');
      return;
    }
    setLoading(true);
    setErr(null);
    // eslint-disable-next-line no-console
    console.log('[login] attempting sign-in', {
      phoneRaw: phone,
      phoneE164: e164,
      passwordLength: password.length,
    });
    try {
      await signIn(e164, password);
      console.log('[login] success');
    } catch (e: any) {
      console.error('[login] failed', {
        name: e?.name,
        status: e?.status,
        message: e?.message,
        code: e?.code,
      });
      setErr(`${e?.code ?? e?.status ?? 'err'}: ${e?.message ?? 'Login failed'}`);
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
              label="Phone"
              type="tel"
              fullWidth
              autoComplete="tel"
              placeholder="10-digit number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              inputProps={{ maxLength: 10, inputMode: 'numeric' }}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlinedIcon sx={{ mr: 0.5 }} />
                    <span style={{ color: '#546E7A' }}>+91</span>
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
