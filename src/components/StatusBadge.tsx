import { Chip } from '@mui/material';
import type { RentalStatus } from '../types';

const PALETTE: Record<RentalStatus, { bg: string; fg: string; label: string }> = {
  active: { bg: '#E8F5E9', fg: '#2E7D32', label: 'Active' },
  disconnected: { bg: '#FFF3E0', fg: '#E65100', label: 'Disconnected' },
  closed: { bg: '#EEEEEE', fg: '#757575', label: 'Closed' },
};

export default function StatusBadge({ status }: { status: RentalStatus }) {
  const p = PALETTE[status] ?? PALETTE.active;
  return (
    <Chip
      size="small"
      label={p.label}
      sx={{ height: 24, fontWeight: 700, fontSize: 11, bgcolor: p.bg, color: p.fg }}
    />
  );
}
