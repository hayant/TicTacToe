import React from "react";
import { createRoot } from "react-dom/client";
import LoginForm from "./LoginForm";
import {
    Container,
    CssBaseline,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";

const container = document.getElementById("root");
const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#1976d2", // MUI default blue
        },
        secondary: {
            main: "#9c27b0",
        },
        error: {
            main: "#ff0000",
        }
    },
});

if (container) {
  const root = createRoot(container);
  root.render(
      <ThemeProvider theme={theme}>
          <CssBaseline />
              <Container style={{ width: 400, alignContent: "center" }}>
                  <LoginForm />
              </Container>
      </ThemeProvider>
  );
}
