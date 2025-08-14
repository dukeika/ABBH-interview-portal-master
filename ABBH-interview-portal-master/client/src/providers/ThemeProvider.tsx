import React from "react";
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Toolbar,
  Typography,
  ThemeProvider,
  createTheme,
  Stack,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Global MUI theme (tweak as you like).
 * If you previously had a custom palette/typography,
 * fold those values in here.
 */
const theme = createTheme({
  palette: {
    primary: { main: "#0f6a5b" }, // deep green (adjust to your brand)
    secondary: { main: "#ffc107" },
  },
  shape: { borderRadius: 10 },
});

/**
 * App-wide provider that:
 *  - injects the MUI theme & CssBaseline
 *  - renders a persistent header (logo + menu links)
 *  - renders page content underneath
 */
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isHR = user?.role === "HR";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Header */}
      <AppBar position="fixed" color="primary" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography
            component={RouterLink}
            to={isHR ? "/admin" : "/status"}
            variant="h6"
            color="inherit"
            sx={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
            title="Applied Behavioral Holistic Health"
          >
            {/* If you have a real logo file, replace with <img src="/logo.png" .../> */}
            <span role="img" aria-label="logo">
              🟨
            </span>
            Applied Behavioral Holistic Health
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {isHR ? (
              <>
                <Button color="inherit" component={RouterLink} to="/admin">
                  Admin
                </Button>
                <Button color="inherit" component={RouterLink} to="/admin/jobs">
                  Jobs &amp; Questions
                </Button>
              </>
            ) : (
              <Button color="inherit" component={RouterLink} to="/status">
                Status
              </Button>
            )}
            {user ? (
              <Button
                color="inherit"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                Logout
              </Button>
            ) : (
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Page content offset below the fixed header */}
      <Box component="main" sx={{ pt: 10, pb: 4, px: { xs: 2, md: 4 } }}>
        {children}
      </Box>
    </ThemeProvider>
  );
}

/** Also export as default for convenience */
export default AppThemeProvider;
