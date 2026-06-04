import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import "@fontsource/orbitron/400.css";
import "@fontsource/orbitron/500.css";
import "@fontsource/orbitron/700.css";
import "@fontsource/orbitron/900.css";
import "@fontsource/press-start-2p/400.css";

// Synthwave / Outrun neon palette
const NEON_CYAN = "#05d9e8";
const NEON_MAGENTA = "#ff2a6d";
const DEEP_SPACE = "#0d0221";

const container = document.getElementById("root");

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: NEON_CYAN,
        },
        secondary: {
            main: NEON_MAGENTA,
        },
        error: {
            main: "#ff3864",
        },
        background: {
            default: DEEP_SPACE,
            paper: "rgba(26, 11, 46, 0.72)",
        },
        text: {
            primary: "#f5f5ff",
            secondary: "#b8a9d9",
        },
    },
    typography: {
        fontFamily: '"Orbitron", "Segoe UI", sans-serif',
        h1: { textTransform: "uppercase", letterSpacing: "0.08em" },
        h2: { textTransform: "uppercase", letterSpacing: "0.08em" },
        h3: { textTransform: "uppercase", letterSpacing: "0.08em" },
        h4: { textTransform: "uppercase", letterSpacing: "0.06em" },
        h5: { textTransform: "uppercase", letterSpacing: "0.06em" },
        h6: { textTransform: "uppercase", letterSpacing: "0.05em" },
        button: { letterSpacing: "0.08em" },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    minHeight: "100vh",
                    color: "#f5f5ff",
                    // Sunset gradient base
                    background: "linear-gradient(180deg, #0d0221 0%, #240b36 45%, #3a0a4a 62%, #c31432 100%)",
                    backgroundAttachment: "fixed",
                },
                // Perspective neon grid floor overlaid on the sunset
                "body::before": {
                    content: '""',
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "55vh",
                    pointerEvents: "none",
                    zIndex: 0,
                    backgroundImage: `
                        repeating-linear-gradient(to right, rgba(5, 217, 232, 0.45) 0 1px, transparent 1px 80px),
                        repeating-linear-gradient(to bottom, rgba(5, 217, 232, 0.45) 0 1px, transparent 1px 80px)`,
                    backgroundPosition: "center bottom",
                    transform: "perspective(40vh) rotateX(62deg)",
                    transformOrigin: "center bottom",
                    maskImage: "linear-gradient(to bottom, transparent, #000 60%)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 60%)",
                },
                // Keep app content above the grid floor
                "#root": {
                    position: "relative",
                    zIndex: 1,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                    backgroundColor: "rgba(26, 11, 46, 0.72)",
                    border: `1px solid ${NEON_CYAN}`,
                    borderRadius: 10,
                    backdropFilter: "blur(6px)",
                    boxShadow: "0 0 18px rgba(5, 217, 232, 0.35), inset 0 0 12px rgba(255, 42, 109, 0.12)",
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    textTransform: "uppercase",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    transition: "box-shadow 160ms ease, transform 120ms ease",
                },
                contained: {
                    color: "#0d0221",
                    boxShadow: "0 0 10px rgba(5, 217, 232, 0.6)",
                    "&:hover": {
                        boxShadow: "0 0 18px rgba(5, 217, 232, 0.95)",
                        transform: "translateY(-1px)",
                    },
                },
                outlined: {
                    borderColor: NEON_MAGENTA,
                    color: NEON_MAGENTA,
                    boxShadow: "0 0 8px rgba(255, 42, 109, 0.35)",
                    "&:hover": {
                        borderColor: NEON_MAGENTA,
                        backgroundColor: "rgba(255, 42, 109, 0.08)",
                        boxShadow: "0 0 16px rgba(255, 42, 109, 0.8)",
                        transform: "translateY(-1px)",
                    },
                },
                text: {
                    "&:hover": {
                        backgroundColor: "rgba(5, 217, 232, 0.08)",
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: "rgba(13, 2, 33, 0.85)",
                    backgroundImage: "none",
                    borderRadius: 8,
                    border: `1px solid ${NEON_MAGENTA}`,
                    boxShadow: "0 0 18px rgba(255, 42, 109, 0.45)",
                    backdropFilter: "blur(6px)",
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(5, 217, 232, 0.55)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: NEON_CYAN,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: NEON_MAGENTA,
                        boxShadow: "0 0 10px rgba(255, 42, 109, 0.55)",
                    },
                },
            },
        },
        MuiSlider: {
            styleOverrides: {
                thumb: {
                    boxShadow: `0 0 10px ${NEON_CYAN}`,
                    "&:hover, &.Mui-focusVisible": {
                        boxShadow: `0 0 16px ${NEON_CYAN}`,
                    },
                },
                track: {
                    boxShadow: "0 0 8px rgba(5, 217, 232, 0.6)",
                },
            },
        },
    },
});

if (container) {
  const root = createRoot(container);
  root.render(
      <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
      </ThemeProvider>);
}
