import React from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const theme = createTheme({
  palette: {
    primary: { main: "#136A64" }, // teal to match your brand
  },
});

function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ gap: 2, minHeight: 56 }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to={user?.role === "HR" ? "/admin/applications" : "/status"}
          color="inherit"
          sx={{ textDecoration: "none", fontWeight: 800, flexShrink: 0 }}
        >
          Applied Behavioral Holistic Health
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* Right-side nav */}
        {!user && (
          <>
            <Button
              component={RouterLink}
              to="/status"
              color="inherit"
              sx={{ fontWeight: 700 }}
            >
              STATUS
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              color="inherit"
              sx={{ fontWeight: 700 }}
            >
              LOGIN
            </Button>
          </>
        )}

        {user?.role === "CANDIDATE" && (
          <>
            <Button
              component={RouterLink}
              to="/status"
              color="inherit"
              sx={{ fontWeight: 700 }}
            >
              STATUS
            </Button>
            <Button onClick={logout} color="inherit" sx={{ fontWeight: 700 }}>
              LOGOUT
            </Button>
          </>
        )}

        {user?.role === "HR" && (
          <>
            <Button
              component={RouterLink}
              to="/admin/applications"
              color="inherit"
              sx={{ fontWeight: 700 }}
            >
              APPLICATIONS
            </Button>
            <Button
              component={RouterLink}
              to="/admin/jobs"
              color="inherit"
              sx={{ fontWeight: 700 }}
              state={{ from: location.pathname }}
            >
              JOBS & QUESTIONS
            </Button>
            <Button onClick={logout} color="inherit" sx={{ fontWeight: 700 }}>
              LOGOUT
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppHeader />
        <Container sx={{ py: 2 }}>{children}</Container>
      </Box>
    </ThemeProvider>
  );
}

// Keep default export too (for safety with different imports)
export default AppThemeProvider;
