import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Use your theme provider if present; otherwise no-op wrapper
import * as ThemeModule from "./providers/ThemeProvider";
const AppThemeProvider: React.ComponentType<any> =
  (ThemeModule as any).AppThemeProvider ||
  (ThemeModule as any).default ||
  (({ children }: { children: React.ReactNode }) => <>{children}</>);

import App from "./App"; // <-- default export provided below

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppThemeProvider>
          <App />
        </AppThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
