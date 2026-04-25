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
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnectAt, setDisconnectAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [disconnecting, setDisconnecting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    agreement_no: '',
    patient_id: '',
    equipment_id: '',
    patient_name: '',
    contact_no: '',
    hospital_name: '',
    ward_no: '',
    house_address: '',
    advance_amount: '',
    monthly_charge: '',
    notes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  function openEdit() {
    if (!rental) return;
    setEditForm({
      agreement_no: rental.agreement_no ?? '',
      patient_id: rental.patient_id ?? '',
      equipment_id: rental.equipment_id ?? '',
      patient_name: rental.patient_name ?? '',
      contact_no: rental.contact_no ?? '',
      hospital_name: rental.hospital_name ?? '',
      ward_no: rental.ward_no ?? '',
      house_address: rental.house_address ?? '',
      advance_amount: rental.advance_amount != null ? String(rental.advance_amount) : '',
      monthly_charge: rental.monthly_charge != null ? String(rental.monthly_charge) : '',
      notes: rental.notes ?? '',
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!rental) return;
    if (!editForm.patient_name.trim()) {
      setErr('Patient name is required');
      return;
    }
    setSavingEdit(true);
    try {
      const update: Record<string, any> = {
        agreement_no: editForm.agreement_no.trim() || null,
        patient_id: editForm.patient_id.trim() || null,
        equipment_id: editForm.equipment_id.trim() || null,
        patient_name: editForm.patient_name.trim(),
        contact_no: editForm.contact_no.trim() || null,
        notes: editForm.notes.trim() || null,
        advance_amount: editForm.advance_amount.trim()
          ? parseFloat(editForm.advance_amount)
          : null,
        monthly_charge: editForm.monthly_charge.trim()
          ? parseFloat(editForm.monthly_charge)
          : null,
      };
      if (rental.location_type === 'hospital') {
        update.hospital_name = editForm.hospital_name.trim() || null;
        update.ward_no = editForm.ward_no.trim() || null;
      } else {
        update.house_address = editForm.house_address.trim() || null;
      }
      const { error } = await supabase.from('rentals').update(update).eq('id', rental.id);
      if (error) throw error;
      setEditOpen(false);
      await fetchRental();
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to save');
    } finally {
      setSavingEdit(false);
    }
  }

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

  function openDisconnectModal() {
    setDisconnectAt(new Date().toISOString().slice(0, 16));
    setDisconnectOpen(true);
  }

  function openCloseModal() {
    setReturnAt(new Date().toISOString().slice(0, 16));
    setCloseOpen(true);
  }

  async function handleDisconnect() {
    if (!rental) return;
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from('rentals')
        .update({
          status: 'disconnected',
          disconnected_date: new Date(disconnectAt).toISOString(),
          disconnected_by: user?.id,
        })
        .eq('id', rental.id);
      if (error) throw error;
      setDisconnectOpen(false);
      await fetchRental();
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleClose() {
    if (!rental) return;
    setClosing(true);
    try {
      const update: Record<string, any> = {
        status: 'closed',
        returned_date: new Date(returnAt).toISOString(),
        closed_by: user?.id,
        notes: closeNotes.trim() || rental.notes,
      };
      if (!rental.disconnected_date) {
        update.disconnected_date = new Date().toISOString();
        update.disconnected_by = user?.id;
      }

      const { error } = await supabase.from('rentals').update(update).eq('id', rental.id);
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
  const isDisconnected = rental.status === 'disconnected';
  const canClose = isActive || isDisconnected;
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
            {rental.patient_id && (
              <Typography variant="caption" sx={{ color: '#78909C', display: 'block' }}>
                Patient ID: {rental.patient_id}
              </Typography>
            )}
            {rental.equipment_id && (
              <Typography variant="caption" sx={{ color: '#78909C', display: 'block' }}>
                Equipment ID: {rental.equipment_id}
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
          {rental.disconnected_date && (
            <>
              <Divider />
              <InfoRow
                label="Disconnected"
                value={format(parseISO(rental.disconnected_date), 'dd MMM yyyy, HH:mm')}
              />
            </>
          )}
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

        <Button variant="outlined" size="large" onClick={openEdit} sx={{ mt: 1 }}>
          Edit Rental Details
        </Button>

        {isActive && (
          <Button
            variant="outlined"
            color="warning"
            size="large"
            onClick={openDisconnectModal}
            sx={{ mt: 1 }}
          >
            Disconnect (Equipment off patient)
          </Button>
        )}

        {canClose && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={openCloseModal}
            sx={{ mt: 1 }}
          >
            Close Rental (Return Equipment)
          </Button>
        )}
      </Stack>

      <Dialog open={disconnectOpen} onClose={() => setDisconnectOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: '#1A237E', fontWeight: 800 }}>Disconnect Equipment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#546E7A', mb: 2 }}>
            Equipment taken off {rental.patient_name}. Select the date and time of disconnection.
          </Typography>
          <TextField
            label="Disconnected at"
            type="datetime-local"
            value={disconnectAt}
            onChange={(e) => setDisconnectAt(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnectOpen(false)} disabled={disconnecting}>
            Cancel
          </Button>
          <Button onClick={handleDisconnect} variant="contained" color="warning" disabled={disconnecting}>
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </DialogActions>
      </Dialog>

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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ color: '#1A237E', fontWeight: 800 }}>Edit Rental</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="Agreement No."
              value={editForm.agreement_no}
              onChange={(e) => setEditForm({ ...editForm, agreement_no: e.target.value })}
              fullWidth
            />
            <TextField
              label="Patient ID"
              value={editForm.patient_id}
              onChange={(e) => setEditForm({ ...editForm, patient_id: e.target.value })}
              fullWidth
            />
            <TextField
              label="Equipment ID"
              value={editForm.equipment_id}
              onChange={(e) => setEditForm({ ...editForm, equipment_id: e.target.value })}
              fullWidth
            />
            <TextField
              label="Patient Name *"
              value={editForm.patient_name}
              onChange={(e) => setEditForm({ ...editForm, patient_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Contact No."
              value={editForm.contact_no}
              onChange={(e) => setEditForm({ ...editForm, contact_no: e.target.value })}
              fullWidth
            />
            {rental.location_type === 'hospital' ? (
              <>
                <TextField
                  label="Hospital Name"
                  value={editForm.hospital_name}
                  onChange={(e) => setEditForm({ ...editForm, hospital_name: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Ward No."
                  value={editForm.ward_no}
                  onChange={(e) => setEditForm({ ...editForm, ward_no: e.target.value })}
                  fullWidth
                />
              </>
            ) : (
              <TextField
                label="House Address"
                value={editForm.house_address}
                onChange={(e) => setEditForm({ ...editForm, house_address: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            )}
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Advance (₹)"
                value={editForm.advance_amount}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    advance_amount: e.target.value.replace(/[^0-9.]/g, ''),
                  })
                }
                inputMode="decimal"
                fullWidth
              />
              <TextField
                label="Monthly (₹)"
                value={editForm.monthly_charge}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    monthly_charge: e.target.value.replace(/[^0-9.]/g, ''),
                  })
                }
                inputMode="decimal"
                fullWidth
              />
            </Stack>
            <TextField
              label="Notes"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={savingEdit}>
            Cancel
          </Button>
          <Button onClick={saveEdit} variant="contained" disabled={savingEdit}>
            {savingEdit ? '…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
