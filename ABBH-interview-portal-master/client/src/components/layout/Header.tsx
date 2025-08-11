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
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useTheme } from "@mui/material/styles";
import logo from "../../assets/logo.png"; // adjust path as needed

function ThemeToggle() {
  const theme = useTheme();
  return (
    <Tooltip title="Toggle theme">
      <IconButton onClick={() => (window as any).toggleTheme()}>
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

  const publicLinks = [
    { to: "/apply-now", label: "Apply" },
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
  ];

  const candidateLinks = [
    { to: "/apply-now", label: "Apply" },
    { to: "/status", label: "My Status" },
  ];

  const hrLinks = [
    { to: "/admin", label: "Admin" },
    { to: "/admin/roles", label: "Jobs & Questions" },
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
          component={Link}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            flexGrow: 1,
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="ABHolistic Logo"
            sx={{ height: 40, mr: 1 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
            {brand}
          </Typography>
        </Box>

        {/* Desktop Links */}
        <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
          {links.map((l) => (
            <Button key={l.to} color="inherit" component={Link} to={l.to}>
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
        <Box sx={{ display: { xs: "flex", sm: "none" } }}>
          <ThemeToggle />
          <IconButton
            color="inherit"
            onClick={handleMenu}
            size="large"
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {links.map((l) => (
              <MenuItem
                key={l.to}
                component={Link}
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
