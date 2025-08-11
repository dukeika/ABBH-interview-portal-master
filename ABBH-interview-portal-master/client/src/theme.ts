import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0ea5e9" }, // change to match your logo color
    secondary: { main: "#0ea5e9" },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", borderRadius: 12 } },
    },
  },
});
export default theme;
