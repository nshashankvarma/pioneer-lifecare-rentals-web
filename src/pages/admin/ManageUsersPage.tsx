import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile } from '../../types';

export default function ManageUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchUsers().finally(() => setLoading(false));
  }, [fetchUsers]);

  async function handleAdd() {
    if (!name.trim()) return setErr('Full name is required');
    if (!email.trim() || !email.includes('@')) return setErr('Valid email required');
    if (password.length < 6) return setErr('Password ≥ 6 characters');
    if (!session) return setErr('Not signed in');

    setSubmitting(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          full_name: name.trim(),
          role,
        }),
      });
      const text = await res.text();
      let body: any = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {}
      if (!res.ok) {
        throw new Error(`[${res.status}] ${body?.error ?? text ?? 'failed'}`);
      }
      setToast(`Added ${name.trim()} as ${role}`);
      setOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      await fetchUsers();
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(u: Profile) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !u.is_active })
      .eq('id', u.id);
    if (error) {
      setErr(error.message);
      return;
    }
    setToast(u.is_active ? `${u.full_name} deactivated` : `${u.full_name} activated`);
    await fetchUsers();
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h6" mb={2}>
        Manage Users
      </Typography>

      {err && (
        <Alert severity="error" onClose={() => setErr(null)} sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Stack spacing={1}>
          {users.map((u) => (
            <Paper key={u.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, gap: 1.5 }}>
              <Avatar sx={{ bgcolor: u.role === 'admin' ? '#1565C0' : '#90A4AE' }}>
                {u.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ color: '#212121', fontWeight: 600 }}>
                  {u.full_name}
                </Typography>
                <Stack direction="row" spacing={0.75}>
                  <Chip
                    size="small"
                    label={u.role}
                    sx={{
                      bgcolor: u.role === 'admin' ? '#E3F2FD' : '#ECEFF1',
                      color: u.role === 'admin' ? '#0D47A1' : '#546E7A',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      fontSize: 10,
                      height: 20,
                    }}
                  />
                  {!u.is_active && (
                    <Chip
                      size="small"
                      label="Inactive"
                      sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700, fontSize: 10, height: 20 }}
                    />
                  )}
                </Stack>
              </Box>
              <Button size="small" variant="outlined" onClick={() => toggleActive(u)}>
                {u.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </Paper>
          ))}
        </Stack>
      )}

      <Fab
        sx={{ position: 'fixed', right: 20, bottom: { xs: 80, md: 24 }, bgcolor: '#1565C0', color: '#fff' }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: '#1A237E', fontWeight: 700 }}>Add User</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField label="Full Name *" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField
              label="Email *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Password * (min 6)"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton size="small" onClick={() => setShowPw((p) => !p)}>
                    {showPw ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              fullWidth
            >
              <MenuItem value="user">User — create and close rentals</MenuItem>
              <MenuItem value="admin">Admin — full access</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAdd} variant="contained" disabled={submitting}>
            {submitting ? '…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} message={toast} autoHideDuration={2500} onClose={() => setToast(null)} />
    </Box>
  );
}
