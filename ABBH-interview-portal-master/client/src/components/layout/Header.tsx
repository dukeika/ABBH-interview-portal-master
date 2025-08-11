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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const brand = import.meta.env.VITE_APP_NAME || "Interview Portal";

  // Navigation items by role
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
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, letterSpacing: 0.2, flexGrow: 1 }}
          component={Link}
          to="/"
          color="inherit"
          style={{ textDecoration: "none" }}
        >
          {brand}
        </Typography>

        {/* Desktop links */}
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
        </Box>

        {/* Mobile menu */}
        <Box sx={{ display: { xs: "flex", sm: "none" } }}>
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

            {user
              ? [
                  <Divider key="divider" />,
                  <MenuItem
                    key="logout"
                    onClick={() => {
                      handleClose();
                      onLogout();
                    }}
                  >
                    Logout
                  </MenuItem>,
                ]
              : null}
          </Menu>
        </Box>
      </Toolbar>
      <Box sx={{ height: 2, bgcolor: "secondary.main", opacity: 0.3 }} />
    </AppBar>
  );
}
