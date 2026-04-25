import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import { supabase } from '../../lib/supabase';
import type { RentalItem } from '../../types';

interface EnrichedItem extends RentalItem {
  _inUse?: number;
}

export default function ManageItemsPage() {
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<EnrichedItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newDesc, setNewDesc] = useState('');

  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const [{ data: itemsData }, { data: activeRentals }] = await Promise.all([
      supabase.from('rental_items').select('*').order('name'),
      supabase.from('rentals').select('item_id').eq('status', 'active'),
    ]);
    const counts = new Map<string, number>();
    (activeRentals ?? []).forEach((r: { item_id: string | null }) => {
      if (r.item_id) counts.set(r.item_id, (counts.get(r.item_id) ?? 0) + 1);
    });
    const enriched = ((itemsData as RentalItem[]) ?? []).map((i) => ({
      ...i,
      available_quantity: Math.max(0, (i.total_quantity ?? 0) - (counts.get(i.id) ?? 0)),
      _inUse: counts.get(i.id) ?? 0,
    }));
    setItems(enriched);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchItems().finally(() => setLoading(false));
  }, [fetchItems]);

  async function handleSaveEdit() {
    if (!editing) return;
    if (!editName.trim()) return setErr('Name is required');
    const q = parseInt(editQty, 10);
    if (!Number.isFinite(q) || q < 0) return setErr('Quantity must be 0 or more');
    if (q < (editing._inUse ?? 0))
      return setErr(`Cannot set below ${editing._inUse} — that many are currently rented out`);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rental_items')
        .update({
          name: editName.trim(),
          total_quantity: q,
          description: editDesc.trim() || null,
        })
        .eq('id', editing.id);
      if (error) throw error;
      setToast(`Updated ${editName.trim()}`);
      setEditing(null);
      setEditName('');
      setEditQty('');
      setEditDesc('');
      await fetchItems();
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: EnrichedItem) {
    if (
      !window.confirm(
        `Delete "${item.name}" from the catalog? Existing rentals keep their item name. Blocked if any rental still references this item.`
      )
    )
      return;
    const { count } = await supabase
      .from('rentals')
      .select('id', { count: 'exact', head: true })
      .eq('item_id', item.id);
    if ((count ?? 0) > 0) {
      setErr(`Cannot delete — ${count} rental(s) reference this item`);
      return;
    }
    const { error } = await supabase.from('rental_items').delete().eq('id', item.id);
    if (error) {
      setErr(error.message);
      return;
    }
    setToast(`Removed ${item.name}`);
    await fetchItems();
  }

  async function handleAdd() {
    if (!newName.trim()) return setErr('Name is required');
    const q = parseInt(newQty, 10);
    if (!Number.isFinite(q) || q < 1) return setErr('Quantity must be at least 1');
    setSaving(true);
    try {
      const { error } = await supabase.from('rental_items').insert({
        name: newName.trim(),
        total_quantity: q,
        description: newDesc.trim() || null,
      });
      if (error) throw error;
      setToast(`Added ${newName.trim()}`);
      setAddOpen(false);
      setNewName('');
      setNewQty('1');
      setNewDesc('');
      await fetchItems();
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to add');
    } finally {
      setSaving(false);
    }
  }

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Manage Equipment
        </Typography>
        <TextField
          size="small"
          placeholder="Search equipment..."
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
        <Box sx={{ textAlign: 'center', py: 6, color: '#90A4AE' }}>No equipment yet</Box>
      ) : (
        <Stack spacing={1}>
          {filtered.map((item) => {
            const avail = item.available_quantity ?? item.total_quantity ?? 0;
            const allOut = avail === 0;
            return (
              <Paper key={item.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, gap: 1.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: allOut ? '#FFF3E0' : '#E8F5E9',
                    color: allOut ? '#E65100' : '#2E7D32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MedicalServicesOutlinedIcon />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: '#212121', fontWeight: 600 }}>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#546E7A' }}>
                    {avail} available · {item.total_quantity} total
                  </Typography>
                  {item.description && (
                    <Typography variant="caption" display="block" sx={{ color: '#90A4AE' }}>
                      {item.description}
                    </Typography>
                  )}
                </Box>
                <Chip
                  size="small"
                  label={allOut ? 'Out of stock' : `${avail} free`}
                  sx={{
                    bgcolor: allOut ? '#FFF3E0' : '#E8F5E9',
                    color: allOut ? '#E65100' : '#2E7D32',
                    fontWeight: 700,
                  }}
                />
                <IconButton
                  onClick={() => {
                    setEditing(item);
                    setEditName(item.name);
                    setEditQty(String(item.total_quantity ?? 0));
                    setEditDesc(item.description ?? '');
                  }}
                  size="small"
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => handleDelete(item)} size="small" sx={{ color: '#C62828' }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Fab
        color="secondary"
        sx={{ position: 'fixed', right: 20, bottom: { xs: 80, md: 24 }, bgcolor: '#00897B' }}
        onClick={() => setAddOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: '#1A237E', fontWeight: 700 }}>Edit Equipment</DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ color: '#90A4AE' }}>
            {editing?._inUse ?? 0} currently rented out
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField label="Name *" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
            <TextField
              label="Total quantity"
              value={editQty}
              onChange={(e) => setEditQty(e.target.value.replace(/[^0-9]/g, ''))}
              type="number"
              inputMode="numeric"
              fullWidth
            />
            <TextField
              label="Description"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={saving}>
            {saving ? '…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: '#1A237E', fontWeight: 700 }}>Add Equipment</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="Equipment Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Quantity *"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value.replace(/[^0-9]/g, ''))}
              type="number"
              inputMode="numeric"
              fullWidth
            />
            <TextField
              label="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleAdd} variant="contained" disabled={saving}>
            {saving ? '…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        message={toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
      />
    </Box>
  );
}
