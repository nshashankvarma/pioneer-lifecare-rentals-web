import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#1565C0', dark: '#0D47A1', light: '#42A5F5' },
    secondary: { main: '#00897B' },
    error: { main: '#C62828' },
    success: { main: '#2E7D32' },
    warning: { main: '#E65100' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
    text: { primary: '#1A237E', secondary: '#546E7A' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h6: { fontWeight: 700, color: '#1A237E' },
    subtitle1: { fontWeight: 600 },
  },
  components: {
    MuiAppBar: { styleOverrides: { root: { backgroundColor: '#1565C0' } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});

const PALETTE = [
  { bar: '#42A5F5', tint: '#E3F2FD', ink: '#0D47A1' },
  { bar: '#26A69A', tint: '#E0F2F1', ink: '#004D40' },
  { bar: '#66BB6A', tint: '#E8F5E9', ink: '#1B5E20' },
  { bar: '#FFA726', tint: '#FFF3E0', ink: '#E65100' },
  { bar: '#AB47BC', tint: '#F3E5F5', ink: '#4A148C' },
  { bar: '#EC407A', tint: '#FCE4EC', ink: '#880E4F' },
  { bar: '#7E57C2', tint: '#EDE7F6', ink: '#311B92' },
  { bar: '#29B6F6', tint: '#E1F5FE', ink: '#01579B' },
] as const;

export type Accent = (typeof PALETTE)[number];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function accentFor(name?: string | null): Accent {
  if (!name) return PALETTE[0];
  return PALETTE[hash(name) % PALETTE.length];
}
