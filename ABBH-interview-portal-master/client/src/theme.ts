import { createTheme, alpha } from "@mui/material/styles";

// Brand colors (based on your logo)
export const brand = {
  primary: "#005F56", // Teal from the logo text
  secondary: "#FFD700", // Yellow from logo background
  darkText: "#1C1C1C",
  lightText: "#FFFFFF",
};

// Named export for theme creation
export function makeTheme(mode: "light" | "dark" = "light") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: brand.primary,
        contrastText: brand.lightText,
      },
      secondary: {
        main: brand.secondary,
        contrastText: brand.darkText,
      },
      background: {
        default: isDark ? "#0F0F0F" : "#FAFAFA",
        paper: isDark ? "#1E1E1E" : "#FFFFFF",
      },
      text: {
        primary: isDark ? brand.lightText : brand.darkText,
        secondary: isDark
          ? alpha(brand.lightText, 0.7)
          : alpha(brand.darkText, 0.7),
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: "2.5rem",
        color: isDark ? brand.secondary : brand.primary,
      },
      h2: {
        fontWeight: 600,
        fontSize: "2rem",
      },
      h3: {
        fontWeight: 600,
        fontSize: "1.75rem",
      },
      body1: {
        fontSize: "1rem",
        lineHeight: 1.6,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
            padding: "8px 20px",
          },
          containedPrimary: {
            backgroundColor: brand.primary,
            "&:hover": {
              backgroundColor: alpha(brand.primary, 0.85),
            },
          },
          containedSecondary: {
            backgroundColor: brand.secondary,
            color: brand.darkText,
            "&:hover": {
              backgroundColor: alpha(brand.secondary, 0.85),
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: brand.primary,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow:
              "0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)",
          },
        },
      },
    },
  });
}
