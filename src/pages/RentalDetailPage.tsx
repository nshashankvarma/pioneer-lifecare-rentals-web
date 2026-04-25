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
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format, parseISO } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Rental } from '../types';
import StatusBadge from '../components/StatusBadge';
import { accentFor } from '../theme';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" sx={{ color: '#90A4AE' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#37474F', fontWeight: 500, textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function RentalDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [returnAt, setReturnAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [closeNotes, setCloseNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const fetchRental = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('rentals')
      .select('*, issuer:issued_by(id, full_name), closer:closed_by(id, full_name)')
      .eq('id', id)
      .single();
    if (error) setErr(error.message);
    else setRental(data as Rental);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchRental().finally(() => setLoading(false));
  }, [fetchRental]);

  async function handleClose() {
    if (!rental) return;
    setClosing(true);
    try {
      const { error } = await supabase
        .from('rentals')
        .update({
          status: 'closed',
          returned_date: new Date(returnAt).toISOString(),
          closed_by: user?.id,
          notes: closeNotes.trim() || rental.notes,
        })
        .eq('id', rental.id);
      if (error) throw error;
      supabase.functions
        .invoke('send-push-notification', {
          body: {
            type: 'rental_closed',
            patientName: rental.patient_name,
            itemName: rental.item_name,
          },
        })
        .catch(() => {});
      setCloseOpen(false);
      await fetchRental();
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to close rental');
    } finally {
      setClosing(false);
    }
  }

  if (loading || !rental) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  const accent = accentFor(rental.item_name);
  const isActive = rental.status === 'active';
  const location =
    rental.location_type === 'hospital'
      ? [rental.hospital_name, rental.ward_no && `Ward ${rental.ward_no}`]
          .filter(Boolean)
          .join(' — ')
      : rental.house_address ?? '';

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Rental Details
        </Typography>
      </Stack>

      {err && (
        <Alert severity="error" onClose={() => setErr(null)} sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <Stack spacing={1.5}>
        <Paper sx={{ display: 'flex', overflow: 'hidden' }}>
          <Box sx={{ width: 5, bgcolor: accent.bar }} />
          <Box sx={{ flex: 1, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" sx={{ color: '#1A237E' }}>
                {rental.patient_name}
              </Typography>
              <StatusBadge status={rental.status} />
            </Stack>
            <Typography variant="body2" sx={{ color: accent.ink, fontWeight: 600 }}>
              {rental.item_name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#37474F', mt: 0.5 }}>
              {location}
            </Typography>
            {rental.contact_no && (
              <Typography variant="body2" sx={{ color: '#37474F', mt: 0.25 }}>
                {rental.contact_no}
              </Typography>
            )}
            {rental.agreement_no && (
              <Typography variant="caption" sx={{ color: '#78909C', mt: 0.5, display: 'block' }}>
                Agreement: {rental.agreement_no}
              </Typography>
            )}
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#1A237E', fontWeight: 700, mb: 1 }}>
            Timeline
          </Typography>
          <InfoRow
            label="Issued"
            value={format(parseISO(rental.issued_date), 'dd MMM yyyy, HH:mm')}
          />
          {rental.issuer && <InfoRow label="Issued by" value={rental.issuer.full_name} />}
          {rental.returned_date && (
            <>
              <Divider />
              <InfoRow
                label="Returned"
                value={format(parseISO(rental.returned_date), 'dd MMM yyyy, HH:mm')}
              />
            </>
          )}
          {rental.closer && <InfoRow label="Closed by" value={rental.closer.full_name} />}
        </Paper>

        {(rental.advance_amount != null || rental.monthly_charge != null) && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#1A237E', fontWeight: 700, mb: 1 }}>
              Billing
            </Typography>
            {rental.advance_amount != null && (
              <InfoRow
                label="Advance"
                value={`₹ ${Number(rental.advance_amount).toLocaleString('en-IN')}`}
              />
            )}
            {rental.monthly_charge != null && (
              <InfoRow
                label="Monthly"
                value={`₹ ${Number(rental.monthly_charge).toLocaleString('en-IN')} / month`}
              />
            )}
          </Paper>
        )}

        {rental.notes && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#1A237E', fontWeight: 700, mb: 1 }}>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ color: '#37474F' }}>
              {rental.notes}
            </Typography>
          </Paper>
        )}

        {isActive && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setCloseOpen(true)}
            sx={{ mt: 1 }}
          >
            Close Rental (Return Equipment)
          </Button>
        )}
      </Stack>

      <Dialog open={closeOpen} onClose={() => setCloseOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: '#1A237E', fontWeight: 800 }}>Close Rental</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#546E7A', mb: 2 }}>
            Confirm return of {rental.item_name} from {rental.patient_name}.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Returned at"
              type="datetime-local"
              value={returnAt}
              onChange={(e) => setReturnAt(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Closing notes (optional)"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseOpen(false)} disabled={closing}>
            Cancel
          </Button>
          <Button onClick={handleClose} variant="contained" disabled={closing}>
            {closing ? 'Closing…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
