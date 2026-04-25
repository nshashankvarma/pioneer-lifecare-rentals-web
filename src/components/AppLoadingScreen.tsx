import { Box, CircularProgress, Typography } from '@mui/material';
import logo from '../assets/logo.png';

export default function AppLoadingScreen() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        gap: 1,
      }}
    >
      <Box component="img" src={logo} alt="Pioneer Lifecare" sx={{ width: 140, height: 140, objectFit: 'contain' }} />
      <Typography variant="h6" sx={{ color: '#1A237E', fontWeight: 700 }}>
        Pioneer Lifecare
      </Typography>
      <Typography variant="body2" sx={{ color: '#78909C' }}>
        Equipment Rental Management
      </Typography>
      <CircularProgress size={20} sx={{ mt: 2 }} />
    </Box>
  );
}
