import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { supabase } from '../../lib/supabase';
import type { Hospital } from '../../types';

export default function ManageHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Hospital | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase.from('hospitals').select('*').order('name');
    setHospitals((data as Hospital[]) ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  function startNew() {
    setEditing(null);
    setName('');
    setAddress('');
    setContact('');
    setOpen(true);
  }

  function startEdit(h: Hospital) {
    setEditing(h);
    setName(h.name);
    setAddress(h.address ?? '');
    setContact(h.contact ?? '');
    setOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return setErr('Name is required');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        contact: contact.trim() || null,
      };
      const { error } = editing
        ? await supabase.from('hospitals').update(payload).eq('id', editing.id)
        : await supabase.from('hospitals').insert(payload);
      if (error) throw error;
      setToast(editing ? 'Updated' : `Added ${payload.name}`);
      setOpen(false);
      await fetchAll();
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(h: Hospital) {
    if (!window.confirm(`Remove "${h.name}" from the hospital list?`)) return;
    const { error } = await supabase.from('hospitals').delete().eq('id', h.id);
    if (error) {
      setErr(error.message);
      return;
    }
    setToast(`Removed ${h.name}`);
    await fetchAll();
  }

  const filtered = search
    ? hospitals.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()))
    : hospitals;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Manage Hospitals
        </Typography>
        <TextField
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: 200, sm: 300 } }}
        />
      </Stack>

      {err && (
        <Alert severity="error" onClose={() => setErr(null)} sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: '#90A4AE' }}>
          <BusinessOutlinedIcon sx={{ fontSize: 48, color: '#B0BEC5' }} />
          <Typography variant="subtitle1">No hospitals yet</Typography>
          <Typography variant="body2">
            Click + to add. They'll appear in the rental form dropdown.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {filtered.map((h) => (
            <Paper key={h.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#F3E5F5',
                  color: '#6A1B9A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BusinessOutlinedIcon />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ color: '#212121', fontWeight: 600 }}>
                  {h.name}
                </Typography>
                {h.address && (
                  <Typography variant="caption" sx={{ color: '#546E7A' }}>
                    {h.address}
                  </Typography>
                )}
                {h.contact && (
                  <Typography variant="caption" display="block" sx={{ color: '#546E7A' }}>
                    {h.contact}
                  </Typography>
                )}
              </Box>
              <IconButton onClick={() => startEdit(h)} size="small">
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => handleDelete(h)} size="small" sx={{ color: '#C62828' }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      )}

      <Fab
        sx={{ position: 'fixed', right: 20, bottom: { xs: 80, md: 24 }, bgcolor: '#6A1B9A', color: '#fff' }}
        onClick={startNew}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: '#1A237E', fontWeight: 700 }}>
          {editing ? 'Edit Hospital' : 'Add Hospital'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField label="Hospital Name *" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth multiline minRows={2} />
            <TextField label="Contact" value={contact} onChange={(e) => setContact(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? '…' : editing ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} message={toast} autoHideDuration={2500} onClose={() => setToast(null)} />
    </Box>
  );
}
