import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png"; // adjust path if needed

function ThemeToggle() {
  const theme = useTheme();
  return (
    <Tooltip title="Toggle theme">
      <IconButton onClick={() => (window as any).toggleTheme?.()}>
        {theme.palette.mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const brand = import.meta.env.VITE_APP_NAME || "Interview Portal";

  // Correct routes to match App.tsx
  const publicLinks = [
    { to: "/apply", label: "Apply" },
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
  ];

  const candidateLinks = [
    { to: "/apply", label: "Apply" },
    { to: "/status", label: "My Status" },
  ];

  const hrLinks = [
    { to: "/admin", label: "Admin" },
    { to: "/admin/jobs", label: "Jobs & Questions" }, // <-- fixed
  ];

  const links = !user
    ? publicLinks
    : user.role === "HR"
    ? hrLinks
    : candidateLinks;

  const onLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <AppBar position="sticky" elevation={0} color="primary">
      <Toolbar sx={{ gap: 1 }}>
        {/* Logo + Brand */}
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Box
            component="img"
            src={logo}
            alt={brand}
            sx={{ height: 40, mr: 1, flexShrink: 0 }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              letterSpacing: 0.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={brand}
          >
            Applied Behavioral Holistic Health
          </Typography>
        </Box>

        {/* Desktop Links */}
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            gap: 1,
            alignItems: "center",
          }}
        >
          {links.map((l) => (
            <Button key={l.to} color="inherit" component={RouterLink} to={l.to}>
              {l.label}
            </Button>
          ))}
          {user && (
            <Button onClick={onLogout} color="inherit">
              Logout
            </Button>
          )}
          <ThemeToggle />
        </Box>

        {/* Mobile Menu */}
        <Box sx={{ display: { xs: "flex", sm: "none" }, alignItems: "center" }}>
          <ThemeToggle />
          <IconButton
            color="inherit"
            onClick={handleMenu}
            size="large"
            aria-label="menu"
            aria-controls={open ? "main-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="main-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {links.map((l) => (
              <MenuItem
                key={l.to}
                component={RouterLink}
                to={l.to}
                onClick={handleClose}
              >
                {l.label}
              </MenuItem>
            ))}
            {user && (
              <>
                <Divider />
                <MenuItem
                  onClick={() => {
                    handleClose();
                    onLogout();
                  }}
                >
                  Logout
                </MenuItem>
              </>
            )}
          </Menu>
        </Box>
      </Toolbar>
      <Box sx={{ height: 2, bgcolor: "secondary.main", opacity: 0.3 }} />
    </AppBar>
  );
}
