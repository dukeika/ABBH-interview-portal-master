import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { makeTheme } from "../theme";

export default function AppThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<"light" | "dark">(
    (localStorage.getItem("ui_mode") as "light" | "dark") || "light"
  );

  useEffect(() => localStorage.setItem("ui_mode", mode), [mode]);
  const theme = useMemo(() => makeTheme(mode), [mode]);

  // simple global toggle (you can wire to a settings menu)
  (window as any).toggleTheme = () =>
    setMode((m) => (m === "light" ? "dark" : "light"));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
