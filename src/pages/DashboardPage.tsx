import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Rental } from '../types';
import RentalCard from '../components/RentalCard';
import { accentFor } from '../theme';

const ALL = '__all__';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<string>(ALL);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchRentals = useCallback(async () => {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, issuer:issued_by(id, full_name), closer:closed_by(id, full_name)')
      .in('status', ['active', 'disconnected'])
      .order('created_at', { ascending: false });
    if (error) setErr(error.message);
    else setRentals((data as Rental[]) ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRentals().finally(() => setLoading(false));

    const channel = supabase
      .channel('active-rentals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentals' }, () => {
        fetchRentals();
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [fetchRentals]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    rentals.forEach((r) => {
      const n = r.item_name || 'Other';
      counts.set(n, (counts.get(n) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
  }, [rentals]);

  useEffect(() => {
    if (selectedItem === ALL) return;
    if (!categories.some(([n]) => n === selectedItem)) setSelectedItem(ALL);
  }, [categories, selectedItem]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rentals.filter((r) => {
      if (selectedItem !== ALL && r.item_name !== selectedItem) return false;
      if (!q) return true;
      return (
        r.patient_name.toLowerCase().includes(q) ||
        r.item_name.toLowerCase().includes(q) ||
        r.hospital_name?.toLowerCase().includes(q) ||
        r.contact_no?.includes(q) ||
        r.agreement_no?.toLowerCase().includes(q) ||
        r.patient_id?.toLowerCase().includes(q) ||
        r.equipment_id?.toLowerCase().includes(q)
      );
    });
  }, [rentals, search, selectedItem]);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        mb={2}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          Active Rentals
        </Typography>
        <TextField
          size="small"
          placeholder="Search patient, item, hospital, agreement..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { sm: 320 } }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: '#90A4AE' }} />,
          }}
        />
      </Stack>

      {categories.length > 0 && (
        <Box sx={{ overflowX: 'auto', pb: 1, mb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ minWidth: 'max-content' }}>
            <Chip
              label="All"
              clickable
              variant={selectedItem === ALL ? 'filled' : 'outlined'}
              color={selectedItem === ALL ? 'primary' : 'default'}
              onClick={() => setSelectedItem(ALL)}
            />
            {categories.map(([name]) => {
              const active = selectedItem === name;
              const accent = accentFor(name);
              return (
                <Chip
                  key={name}
                  label={name}
                  clickable
                  onClick={() => setSelectedItem(active ? ALL : name)}
                  sx={{
                    bgcolor: active ? accent.bar : '#fff',
                    color: active ? '#fff' : accent.ink,
                    borderColor: accent.bar,
                    border: '1px solid',
                    fontWeight: 600,
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      )}

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
        <Box sx={{ textAlign: 'center', py: 8, color: '#90A4AE' }}>
          <Typography variant="subtitle1">No active rentals</Typography>
          <Typography variant="body2">
            {search || selectedItem !== ALL
              ? 'No results match your filter.'
              : 'All equipment has been returned.'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {filtered.map((r) => (
            <RentalCard key={r.id} rental={r} onClick={() => navigate(`/rental/${r.id}`)} />
          ))}
        </Box>
      )}

      <Typography
        variant="caption"
        display="block"
        textAlign="center"
        sx={{ mt: 2, color: '#9E9E9E' }}
      >
        {filtered.length} active rental{filtered.length !== 1 ? 's' : ''}
        {selectedItem !== ALL ? ` · ${selectedItem}` : ''}
      </Typography>
    </Box>
  );
}
