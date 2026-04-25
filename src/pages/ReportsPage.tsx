import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Hospital, Rental, RentalStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import { accentFor } from '../theme';

const ALL = '__all__';
type Filter = 'all' | RentalStatus;

function computeDays(rental: Rental, month: Date) {
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const issued = parseISO(rental.issued_date);
  const closed = rental.returned_date ? parseISO(rental.returned_date) : today;
  const totalDays = Math.max(0, differenceInCalendarDays(closed, issued) + 1);

  if (issued > monthEnd || closed < monthStart) return { monthDays: 0, totalDays };
  const effStart = maxDate([issued, monthStart]);
  const effEnd = minDate([closed, monthEnd, today]);
  const monthDays = Math.max(0, differenceInCalendarDays(effEnd, effStart) + 1);
  return { monthDays, totalDays };
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [equipmentFilter, setEquipmentFilter] = useState(ALL);
  const [hospitalFilter, setHospitalFilter] = useState(ALL);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchRentals = useCallback(async (month: Date) => {
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('rentals')
      .select('*, issuer:issued_by(id, full_name), closer:closed_by(id, full_name)')
      .lte('issued_date', end)
      .or(`returned_date.gte.${start},returned_date.is.null`)
      .order('issued_date', { ascending: false });
    if (error) setErr(error.message);
    else setRentals((data as Rental[]) ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRentals(currentMonth).finally(() => setLoading(false));
  }, [currentMonth, fetchRentals]);

  useEffect(() => {
    supabase
      .from('hospitals')
      .select('*')
      .order('name')
      .then(({ data }) => setHospitals((data as Hospital[]) ?? []));
  }, []);

  const enriched = useMemo(
    () => rentals.map((r) => ({ rental: r, ...computeDays(r, currentMonth) })),
    [rentals, currentMonth]
  );

  const equipmentOptions = useMemo(() => {
    const set = new Set<string>();
    rentals.forEach((r) => r.item_name && set.add(r.item_name));
    return Array.from(set).sort();
  }, [rentals]);
  const hospitalOptions = useMemo(() => hospitals.map((h) => h.name).sort(), [hospitals]);

  useEffect(() => {
    if (equipmentFilter !== ALL && !equipmentOptions.includes(equipmentFilter))
      setEquipmentFilter(ALL);
  }, [equipmentFilter, equipmentOptions]);
  useEffect(() => {
    if (hospitalFilter !== ALL && !hospitalOptions.includes(hospitalFilter))
      setHospitalFilter(ALL);
  }, [hospitalFilter, hospitalOptions]);

  const filtered = useMemo(
    () =>
      enriched.filter((e) => {
        if (filter !== 'all' && e.rental.status !== filter) return false;
        if (equipmentFilter !== ALL && e.rental.item_name !== equipmentFilter) return false;
        if (hospitalFilter !== ALL && e.rental.hospital_name !== hospitalFilter) return false;
        return true;
      }),
    [enriched, filter, equipmentFilter, hospitalFilter]
  );

  const activeCount = enriched.filter((e) => e.rental.status === 'active').length;
  const closedCount = enriched.filter((e) => e.rental.status === 'closed').length;

  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  return (
    <Box sx={{ maxWidth: 1080, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          alignItems: { sm: 'center' },
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          Reports
        </Typography>
        <Paper sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
          <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ minWidth: 140, textAlign: 'center' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton
            onClick={() => {
              const next = addMonths(currentMonth, 1);
              if (next <= new Date()) setCurrentMonth(next);
            }}
            disabled={isCurrentMonth}
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>
        </Paper>
      </Box>

      {err && (
        <Alert severity="error" onClose={() => setErr(null)} sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          mb: 2,
        }}
      >
        <StatTile color="#E3F2FD" valueColor="#1565C0" value={enriched.length} label="Rentals" />
        <StatTile color="#E8F5E9" valueColor="#2E7D32" value={activeCount} label="Active" />
        <StatTile color="#EEEEEE" valueColor="#757575" value={closedCount} label="Closed" />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          mb: 2,
          alignItems: { sm: 'center' },
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(['all', 'active', 'closed'] as Filter[]).map((f) => (
            <Chip
              key={f}
              clickable
              label={f.charAt(0).toUpperCase() + f.slice(1)}
              variant={filter === f ? 'filled' : 'outlined'}
              color={filter === f ? 'primary' : 'default'}
              onClick={() => setFilter(f)}
            />
          ))}
        </Box>
        <Box sx={{ flex: 1 }} />
        <TextField
          select
          size="small"
          label="Equipment"
          value={equipmentFilter}
          onChange={(e) => setEquipmentFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value={ALL}>All equipment</MenuItem>
          {equipmentOptions.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Hospital"
          value={hospitalFilter}
          onChange={(e) => setHospitalFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value={ALL}>All hospitals</MenuItem>
          {hospitalOptions.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: '#90A4AE' }}>
          <Typography variant="subtitle1">No rentals match the filter</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
          {filtered.map((item) => {
            const accent = accentFor(item.rental.item_name);
            const sameAsTotal = item.monthDays === item.totalDays;
            return (
              <Paper
                key={item.rental.id}
                onClick={() => navigate(`/rental/${item.rental.id}`)}
                sx={{
                  display: 'flex',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <Box sx={{ width: 5, bgcolor: accent.bar }} />
                <Box sx={{ flex: 1, p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ color: '#1A237E', fontWeight: 700 }} noWrap>
                      {item.rental.patient_name}
                    </Typography>
                    <StatusBadge status={item.rental.status} />
                  </Box>
                  <Typography variant="body2" sx={{ color: accent.ink, fontWeight: 600, mb: 0.5 }} noWrap>
                    {item.rental.item_name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                    <EventOutlinedIcon sx={{ fontSize: 13, color: '#90A4AE' }} />
                    <Typography variant="caption" sx={{ color: '#90A4AE' }}>
                      {format(parseISO(item.rental.issued_date), 'dd MMM yyyy')} →{' '}
                      {item.rental.returned_date
                        ? format(parseISO(item.rental.returned_date), 'dd MMM yyyy')
                        : 'active'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        bgcolor: accent.tint,
                        color: accent.ink,
                        px: 1,
                        py: 0.25,
                        borderRadius: 2,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {item.monthDays} {item.monthDays === 1 ? 'day' : 'days'} in {format(currentMonth, 'MMM')}
                    </Box>
                    {!sameAsTotal && (
                      <Typography variant="caption" sx={{ color: '#78909C', fontWeight: 600 }}>
                        · {item.totalDays} total
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function StatTile({
  color,
  valueColor,
  value,
  label,
}: {
  color: string;
  valueColor: string;
  value: number;
  label: string;
}) {
  return (
    <Paper sx={{ bgcolor: color, p: 1.5, textAlign: 'center' }}>
      <Typography variant="h5" sx={{ color: valueColor, fontWeight: 800 }}>
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: '#546E7A', textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
    </Paper>
  );
}
