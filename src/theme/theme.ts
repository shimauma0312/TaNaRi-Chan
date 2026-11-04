"use client"

import { createTheme, type Shadows } from "@mui/material/styles"

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#111111",
    },
    secondary: {
      main: "#5f6368",
    },
    background: {
      default: "#f7f7f7",
      paper: "#ffffff",
    },
    text: {
      primary: "#111111",
      secondary: "#616161",
    },
    divider: "#d7d7d7",
    action: {
      selected: "#e8e8e8",
      hover: "#f0f0f0",
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  },
  shape: {
    borderRadius: 0,
  },
  shadows: Array(25).fill("none") as Shadows,
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: "100vh",
          backgroundColor: "#f7f7f7",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        variant: "outlined",
      },
    },
  },
})

export default theme
