// client/src/theme.ts
import { createTheme, alpha } from "@mui/material/styles";

// Brand tokens (from your logo)
export const brand = {
  teal: {
    900: "#073D3A",
    800: "#0C4F4A",
    700: "#0F5F59",
    600: "#106C65",
    500: "#0F7A72", // base action hover
    400: "#0F8D83",
    main: "#085C55", // PRIMARY — deep teal from logo letters
  },
  yellow: {
    main: "#FFE45C", // ACCENT — warm yellow background from logo tile
    soft: "#FFF4B8",
    contrast: "#1A1A1A",
  },
  gray: {
    50: "#F7F9F9",
    100: "#EFF3F3",
    200: "#E2E8E8",
    300: "#CBD5D5",
    400: "#94A3A3",
    500: "#6B7A7A",
    600: "#495454",
    700: "#334040",
    800: "#1F2727",
    900: "#0E1313",
  },
};

export function makeTheme(mode: "light" | "dark" = "light") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: brand.teal.main,
        dark: brand.teal[700],
        light: brand.teal[400],
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: brand.yellow.main,
        contrastText: brand.yellow.contrast,
      },
      background: {
        default: isDark ? brand.gray[900] : "#FFFFFF",
        paper: isDark ? brand.gray[800] : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#EAF2F2" : brand.gray[900],
        secondary: isDark ? brand.gray[300] : brand.gray[600],
      },
      success: { main: "#1EB980" },
      warning: { main: "#F2A900" },
      error: { main: "#E53935" },
      info: { main: "#2F80ED" },
      divider: isDark ? alpha("#FFFFFF", 0.14) : brand.gray[200],
    },

    shape: { borderRadius: 14 },

    typography: {
      fontFamily: [
        "Inter",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "system-ui",
        "sans-serif",
      ].join(","),
      h1: { fontWeight: 800, letterSpacing: "-0.02em" },
      h2: { fontWeight: 800, letterSpacing: "-0.02em" },
      h3: { fontWeight: 800 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: "none", fontWeight: 700, letterSpacing: 0 },
      subtitle1: { fontWeight: 600 },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            // subtle canvas tint that echoes the brand (very low opacity)
            background: isDark
              ? `radial-gradient(1200px 1200px at 100% -100%, ${alpha(
                  brand.teal.main,
                  0.12
                )}, transparent 60%)`
              : `radial-gradient(1200px 1200px at -20% -20%, ${alpha(
                  brand.yellow.main,
                  0.12
                )}, transparent 55%)`,
          },
          "::selection": {
            backgroundColor: alpha(brand.yellow.main, 0.6),
            color: brand.yellow.contrast,
          },
        },
      },

      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${
              isDark ? alpha("#FFFFFF", 0.08) : brand.gray[200]
            }`,
            boxShadow: isDark
              ? "0 8px 24px rgba(0,0,0,0.35)"
              : "0 8px 24px rgba(8,92,85,0.08)", // soft teal shadow
          },
        },
      },

      MuiButton: {
        defaultProps: { disableRipple: true },
        styleOverrides: {
          root: { borderRadius: 12, paddingInline: 16, paddingBlock: 10 },
          containedPrimary: {
            background: `linear-gradient(180deg, ${brand.teal.main}, ${brand.teal[700]})`,
            "&:hover": { background: brand.teal[700] },
          },
          outlined: {
            borderColor: isDark ? alpha("#FFFFFF", 0.24) : brand.teal.main,
            "&:hover": {
              backgroundColor: alpha(brand.teal.main, 0.06),
              borderColor: brand.teal.main,
            },
          },
          containedSecondary: {
            color: brand.yellow.contrast,
            "&:hover": { filter: "brightness(0.95)" },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 10, fontWeight: 700 },
          colorPrimary: {
            backgroundColor: alpha(brand.teal.main, 0.15),
            color: brand.teal[800],
          },
          colorSecondary: { backgroundColor: alpha(brand.yellow.main, 0.25) },
        },
      },

      MuiTextField: {
        defaultProps: { size: "small" },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha("#FFFFFF", 0.04) : "#FFFFFF",
            borderRadius: 12,
          },
          notchedOutline: {
            borderColor: isDark ? alpha("#FFFFFF", 0.18) : brand.gray[300],
          },
          input: { paddingBlock: 12 },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            overflow: "hidden",
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${
              isDark ? alpha("#FFFFFF", 0.1) : brand.gray[200]
            }`,
            backgroundColor: isDark ? brand.gray[900] : "#FFFFFF",
            color: isDark ? "#EAF2F2" : brand.gray[900],
          },
        },
      },
    },
  });
}
