"use client";

import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3965ff"
    },
    secondary: {
      main: "#ff7a18"
    },
    background: {
      default: "#f4f6fb",
      paper: "#ffffff"
    },
    text: {
      primary: "#1d2433",
      secondary: "#667085"
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: '"Noto Sans TC", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700
    },
    h2: {
      fontWeight: 700
    },
    h3: {
      fontWeight: 700
    },
    button: {
      textTransform: "none",
      fontWeight: 700
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 18px 45px rgba(31, 50, 91, 0.08)"
        }
      }
    }
  }
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
