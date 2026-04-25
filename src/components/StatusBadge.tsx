import { Chip } from '@mui/material';
import type { RentalStatus } from '../types';

export default function StatusBadge({ status }: { status: RentalStatus }) {
  const isActive = status === 'active';
  return (
    <Chip
      size="small"
      label={isActive ? 'Active' : 'Closed'}
      sx={{
        height: 24,
        fontWeight: 700,
        fontSize: 11,
        bgcolor: isActive ? '#E8F5E9' : '#EEEEEE',
        color: isActive ? '#2E7D32' : '#757575',
      }}
    />
  );
}
