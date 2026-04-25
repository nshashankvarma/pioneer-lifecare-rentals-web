import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import HospitalIcon from '@mui/icons-material/LocalHospitalOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Hospital, RentalItem } from '../types';

export default function NewRentalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [agreementNo, setAgreementNo] = useState('');
  const [patientName, setPatientName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [locationType, setLocationType] = useState<'hospital' | 'home'>('hospital');
  const [hospitalName, setHospitalName] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [houseAddress, setHouseAddress] = useState('');

  const [items, setItems] = useState<RentalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  const [issuedAt, setIssuedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [advance, setAdvance] = useState('');
  const [monthly, setMonthly] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
    fetchHospitals();
  }, []);

  async function fetchItems() {
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
    }));
    setItems(enriched);
  }

  async function fetchHospitals() {
    const { data } = await supabase.from('hospitals').select('*').order('name');
    setHospitals((data as Hospital[]) ?? []);
  }

  const hospitalOptions = useMemo(() => hospitals.map((h) => h.name), [hospitals]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) return setErr('Patient name is required');
    if (locationType === 'hospital' && !hospitalName.trim())
      return setErr('Select or enter a hospital');
    if (locationType === 'home' && !houseAddress.trim())
      return setErr('House address is required');
    if (!selectedItem) return setErr('Select equipment');
    if ((selectedItem.available_quantity ?? 0) <= 0) return setErr('Equipment is out of stock');

    setSubmitting(true);
    try {
      const payload = {
        agreement_no: agreementNo.trim() || null,
        patient_name: patientName.trim(),
        contact_no: contactNo.trim() || null,
        location_type: locationType,
        hospital_name: locationType === 'hospital' ? hospitalName.trim() : null,
        ward_no: locationType === 'hospital' ? wardNo.trim() || null : null,
        house_address: locationType === 'home' ? houseAddress.trim() : null,
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        issued_by: user?.id,
        issued_date: new Date(issuedAt).toISOString(),
        notes: notes.trim() || null,
        advance_amount: advance.trim() ? parseFloat(advance) : null,
        monthly_charge: monthly.trim() ? parseFloat(monthly) : null,
        status: 'active',
      };

      const { error } = await supabase.from('rentals').insert(payload);
      if (error) throw error;

      // Fire-and-forget the broadcast notification — best effort.
      supabase.functions
        .invoke('send-push-notification', {
          body: {
            type: 'rental_issued',
            patientName: payload.patient_name,
            itemName: payload.item_name,
          },
        })
        .catch(() => {});

      setToast(`${payload.item_name} issued to ${payload.patient_name}`);
      setTimeout(() => navigate('/'), 600);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to create rental');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h6" mb={2}>
        New Rental
      </Typography>

      {err && (
        <Alert severity="error" onClose={() => setErr(null)} sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#1A237E', fontWeight: 700, mb: 1.5 }}>
              Agreement
            </Typography>
            <TextField
              label="Agreement No."
              value={agreementNo}
              onChange={(e) => setAgreementNo(e.target.value)}
              fullWidth
              placeholder="e.g. PLS-2026-0042"
            />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#1A237E', fontWeight: 700, mb: 1.5 }}>
              Patient
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="Patient Name *"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Contact No."
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                fullWidth
              />
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#1A237E', fontWeight: 700, mb: 1.5 }}>
              Location
            </Typography>
            <ToggleButtonGroup
              value={locationType}
              exclusive
              onChange={(_, v) => v && setLocationType(v)}
              fullWidth
              sx={{ mb: 1.5 }}
            >
              <ToggleButton value="hospital">
                <HospitalIcon sx={{ mr: 1, fontSize: 18 }} /> Hospital
              </ToggleButton>
              <ToggleButton value="home">
                <HomeOutlinedIcon sx={{ mr: 1, fontSize: 18 }} /> Home
              </ToggleButton>
            </ToggleButtonGroup>

            {locationType === 'hospital' ? (
              <Stack spacing={1.5}>
                <Autocomplete
                  freeSolo
                  options={hospitalOptions}
                  value={hospitalName}
                  onInputChange={(_, v) => setHospitalName(v)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Hospital *"
                      placeholder="Select or type a custom hospital"
                      helperText="Custom names are saved on this rental only."
                    />
                  )}
                />
                <TextField
                  label="Ward No."
                  value={wardNo}
                  onChange={(e) => setWardNo(e.target.value)}
                  fullWidth
                />
              </Stack>
            ) : (
              <TextField
                label="House Address *"
                value={houseAddress}
                onChange={(e) => setHouseAddress(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#1A237E', fontWeight: 700, mb: 1.5 }}>
              Equipment
            </Typography>
            <TextField
              select
              fullWidth
              label="Equipment *"
              value={selectedItem?.id ?? ''}
              onChange={(e) =>
                setSelectedItem(items.find((i) => i.id === e.target.value) ?? null)
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MedicalServicesOutlinedIcon />
                  </InputAdornment>
                ),
              }}
            >
              {items.map((item) => {
                const avail = item.available_quantity ?? 0;
                return (
                  <MenuItem key={item.id} value={item.id} disabled={avail <= 0}>
                    {item.name}{' '}
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: '#90A4AE' }}>
                      ({avail <= 0 ? 'out of stock' : `${avail} available`})
                    </Typography>
                  </MenuItem>
                );
              })}
            </TextField>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#1A237E', fontWeight: 700, mb: 1.5 }}>
              Details
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="Issued at"
                type="datetime-local"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#1A237E', fontWeight: 700, mb: 1.5 }}>
              Billing
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Advance (₹)"
                value={advance}
                onChange={(e) => setAdvance(e.target.value.replace(/[^0-9.]/g, ''))}
                fullWidth
                inputMode="decimal"
              />
              <TextField
                label="Monthly (₹)"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value.replace(/[^0-9.]/g, ''))}
                fullWidth
                inputMode="decimal"
              />
            </Stack>
            <Typography variant="caption" sx={{ color: '#78909C', mt: 1, display: 'block' }}>
              Optional. Advance is a one-time deposit; monthly charge repeats per month.
            </Typography>
          </Paper>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button onClick={() => navigate(-1)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Create Rental'}
            </Button>
          </Stack>
        </Stack>
      </form>

      <Snackbar
        open={!!toast}
        message={toast}
        onClose={() => setToast(null)}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <input type="hidden" value={format(new Date(), 'yyyy-MM-dd')} readOnly />
    </Box>
  );
}
