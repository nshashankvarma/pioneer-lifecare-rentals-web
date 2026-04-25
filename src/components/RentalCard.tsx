import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { format, parseISO } from 'date-fns';
import type { Rental } from '../types';
import { accentFor } from '../theme';
import StatusBadge from './StatusBadge';

export default function RentalCard({
  rental,
  onClick,
  footer,
}: {
  rental: Rental;
  onClick?: () => void;
  footer?: ReactNode;
}) {
  const accent = accentFor(rental.item_name);
  const location =
    rental.location_type === 'hospital'
      ? [rental.hospital_name, rental.ward_no && `Ward ${rental.ward_no}`]
          .filter(Boolean)
          .join(' — ')
      : rental.house_address ?? '';

  return (
    <Paper
      elevation={1}
      onClick={onClick}
      sx={{
        display: 'flex',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': onClick ? { transform: 'translateY(-1px)', boxShadow: 4 } : {},
      }}
    >
      <Box sx={{ width: 5, bgcolor: accent.bar, flexShrink: 0 }} />
      <Box sx={{ flex: 1, p: 1.5, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} mb={0.5}>
          <Typography
            variant="subtitle1"
            sx={{ color: '#1A237E', fontWeight: 700, flex: 1, minWidth: 0 }}
            noWrap
          >
            {rental.patient_name}
          </Typography>
          <StatusBadge status={rental.status} />
        </Stack>

        {(rental.agreement_no || rental.patient_id || rental.equipment_id) && (
          <Stack direction="row" spacing={1.5} mb={0.5} flexWrap="wrap">
            {rental.agreement_no && (
              <Typography variant="caption" sx={{ color: '#546E7A', fontWeight: 600 }} noWrap>
                📄 {rental.agreement_no}
              </Typography>
            )}
            {rental.patient_id && (
              <Typography variant="caption" sx={{ color: '#546E7A', fontWeight: 600 }} noWrap>
                🆔 {rental.patient_id}
              </Typography>
            )}
            {rental.equipment_id && (
              <Typography variant="caption" sx={{ color: '#546E7A', fontWeight: 600 }} noWrap>
                🔧 {rental.equipment_id}
              </Typography>
            )}
          </Stack>
        )}

        <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '10px',
              bgcolor: accent.tint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MedicalServicesOutlinedIcon sx={{ fontSize: 12, color: accent.ink }} />
          </Box>
          <Typography
            variant="body2"
            sx={{ color: accent.ink, fontWeight: 600, flex: 1, minWidth: 0 }}
            noWrap
          >
            {rental.item_name}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
          {rental.location_type === 'hospital' ? (
            <BusinessOutlinedIcon sx={{ fontSize: 14, color: '#546E7A', flexShrink: 0 }} />
          ) : (
            <HomeOutlinedIcon sx={{ fontSize: 14, color: '#546E7A', flexShrink: 0 }} />
          )}
          <Typography
            variant="body2"
            sx={{ color: '#37474F', flex: 1, minWidth: 0 }}
            noWrap
          >
            {location}
          </Typography>
        </Stack>

        {rental.contact_no && (
          <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
            <CallOutlinedIcon sx={{ fontSize: 14, color: '#546E7A' }} />
            <Typography variant="body2" sx={{ color: '#37474F' }}>
              {rental.contact_no}
            </Typography>
          </Stack>
        )}

        <Stack direction="row" alignItems="center" spacing={0.75}>
          <EventOutlinedIcon sx={{ fontSize: 13, color: '#90A4AE' }} />
          <Typography variant="caption" sx={{ color: '#90A4AE' }}>
            Issued: {format(parseISO(rental.issued_date), 'dd MMM yyyy, HH:mm')}
          </Typography>
        </Stack>
        {rental.returned_date && (
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <CheckCircleOutlineIcon sx={{ fontSize: 13, color: '#90A4AE' }} />
            <Typography variant="caption" sx={{ color: '#90A4AE' }}>
              Returned: {format(parseISO(rental.returned_date), 'dd MMM yyyy, HH:mm')}
            </Typography>
          </Stack>
        )}
        {footer && <Box sx={{ mt: 0.75 }}>{footer}</Box>}
      </Box>
    </Paper>
  );
}
