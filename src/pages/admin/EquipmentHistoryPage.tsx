import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Rental } from '../../types';
import StatusBadge from '../../components/StatusBadge';

type Group = {
  equipmentId: string;
  itemNames: string[];
  rentals: Rental[];
};

export default function EquipmentHistoryPage() {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchRentals = useCallback(async () => {
    const { data, error } = await supabase
      .from('rentals')
      .select('*, issuer:issued_by(id, full_name), closer:closed_by(id, full_name)')
      .not('equipment_id', 'is', null)
      .order('issued_date', { ascending: false });
    if (error) setErr(error.message);
    else setRentals((data as Rental[]) ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRentals().finally(() => setLoading(false));
  }, [fetchRentals]);

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    rentals.forEach((r) => {
      if (!r.equipment_id) return;
      let g = map.get(r.equipment_id);
      if (!g) {
        g = { equipmentId: r.equipment_id, itemNames: [], rentals: [] };
        map.set(r.equipment_id, g);
      }
      g.rentals.push(r);
      if (r.item_name && !g.itemNames.includes(r.item_name)) g.itemNames.push(r.item_name);
    });
    // Sort groups by their most recent rental's issued_date.
    return Array.from(map.values()).sort((a, b) =>
      b.rentals[0].issued_date.localeCompare(a.rentals[0].issued_date)
    );
  }, [rentals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        rentals: g.rentals.filter(
          (r) =>
            g.equipmentId.toLowerCase().includes(q) ||
            r.patient_name.toLowerCase().includes(q) ||
            r.item_name.toLowerCase().includes(q) ||
            r.hospital_name?.toLowerCase().includes(q)
        ),
      }))
      .filter(
        (g) =>
          g.equipmentId.toLowerCase().includes(q) || g.rentals.length > 0
      );
  }, [groups, search]);

  return (
    <Box sx={{ maxWidth: 1080, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        spacing={1.5}
        mb={2}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          Equipment Rental History
        </Typography>
        <TextField
          size="small"
          placeholder="Search equipment ID or patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 } }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: '#90A4AE' }} />,
          }}
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
          <HistoryOutlinedIcon sx={{ fontSize: 48, color: '#B0BEC5' }} />
          <Typography variant="subtitle1">
            {rentals.length === 0
              ? 'No rentals with equipment IDs yet'
              : 'No equipment matches the search'}
          </Typography>
          {rentals.length === 0 && (
            <Typography variant="body2">
              Rentals created with an Equipment ID will appear here, grouped by unit.
            </Typography>
          )}
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((g) => (
            <Paper key={g.equipmentId} sx={{ overflow: 'hidden' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  bgcolor: '#F5F7FA',
                  flexWrap: 'wrap',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ color: '#1A237E', fontWeight: 700, flex: 1, minWidth: 0 }}
                  noWrap
                >
                  🔧 {g.equipmentId}
                </Typography>
                {g.itemNames.length > 0 && (
                  <Typography variant="body2" sx={{ color: '#546E7A' }} noWrap>
                    {g.itemNames.join(', ')}
                  </Typography>
                )}
                <Chip
                  size="small"
                  label={`${g.rentals.length} rental${g.rentals.length !== 1 ? 's' : ''}`}
                  sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }}
                />
              </Box>
              <Divider />
              <Stack divider={<Divider />}>
                {g.rentals.map((r) => {
                  const issued = format(parseISO(r.issued_date), 'dd MMM yyyy');
                  const endRaw = r.disconnected_date ?? r.returned_date;
                  const endLabel = endRaw
                    ? format(parseISO(endRaw), 'dd MMM yyyy')
                    : r.status === 'active'
                    ? 'ongoing'
                    : '—';
                  const location =
                    r.location_type === 'hospital'
                      ? [r.hospital_name, r.ward_no && `Ward ${r.ward_no}`]
                          .filter(Boolean)
                          .join(' — ')
                      : r.house_address ?? '';
                  return (
                    <Box
                      key={r.id}
                      onClick={() => navigate(`/rental/${r.id}`)}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        p: 1.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#FAFBFC' },
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          mb={0.25}
                          flexWrap="wrap"
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ color: '#212121', fontWeight: 700 }}
                          >
                            {r.patient_name}
                          </Typography>
                          <StatusBadge status={r.status} />
                        </Stack>
                        {location && (
                          <Typography variant="body2" sx={{ color: '#546E7A' }} noWrap>
                            {location}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: '#90A4AE' }}>
                          {issued} → {endLabel}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
