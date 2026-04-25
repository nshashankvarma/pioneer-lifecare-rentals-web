import { Box, Paper, Stack, Typography } from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

function Tile({
  icon,
  title,
  subtitle,
  color,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.75,
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: `${color}20`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" sx={{ color: '#212121', fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#78909C' }}>
          {subtitle}
        </Typography>
      </Box>
      <ChevronRightIcon sx={{ color: '#B0BEC5' }} />
    </Paper>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h6" mb={2}>
        Admin
      </Typography>
      <Typography
        variant="overline"
        sx={{ color: '#90A4AE', letterSpacing: 1, ml: 0.5, display: 'block', mb: 1 }}
      >
        MANAGEMENT
      </Typography>
      <Stack spacing={1.25}>
        <Tile
          icon={<PeopleOutlineIcon />}
          title="Manage Users"
          subtitle="Add or deactivate user accounts"
          color="#1565C0"
          onClick={() => navigate('/admin/users')}
        />
        <Tile
          icon={<MedicalServicesOutlinedIcon />}
          title="Manage Equipment"
          subtitle="Add or update rental items catalog"
          color="#00897B"
          onClick={() => navigate('/admin/equipment')}
        />
        <Tile
          icon={<BusinessOutlinedIcon />}
          title="Manage Hospitals"
          subtitle="Hospitals selectable when creating rentals"
          color="#6A1B9A"
          onClick={() => navigate('/admin/hospitals')}
        />
      </Stack>
    </Box>
  );
}
