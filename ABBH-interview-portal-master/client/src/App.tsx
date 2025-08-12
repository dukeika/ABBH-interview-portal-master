// client/src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Container } from "@mui/material";

import Header from "./components/layout/Header";
import { useAuth } from "./context/AuthContext";

/* Auth pages */
import Login from "./pages/Login";
import Register from "./pages/Register";

/* Candidate pages */
import ApplicationStatus from "./pages/ApplicationStatus";
import WrittenTest from "./pages/candidate/WrittenTest";
import VideoInterview from "./pages/candidate/VideoInterview";
import Apply from "./pages/Apply";

/* Admin pages */
import AdminDashboard from "./pages/admin/AdminDashboard";
import ApplicationDetail from "./pages/admin/ApplicationDetail";
import JobsManager from "./pages/admin/JobsManager";

/* -------------------------------------------------- */

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "HR" ? "/admin" : "/status"} replace />;
}

function Protected({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<"CANDIDATE" | "HR">;
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "HR" ? "/admin" : "/status"} replace />;
  }
  return <>{children}</>;
}

/* -------------------------------------------------- */

export default function App() {
  return (
    <>
      <Header />
      <Container sx={{ py: 3 }}>
        <Routes>
          {/* Default landing sends users to their role home */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public application (resume + cover letter + password) */}
          <Route path="/apply" element={<Apply />} />

          {/* Candidate area */}
          <Route
            path="/status"
            element={
              <Protected roles={["CANDIDATE"]}>
                <ApplicationStatus />
              </Protected>
            }
          />
          <Route
            path="/candidate/written/:interviewId"
            element={
              <Protected roles={["CANDIDATE"]}>
                <WrittenTest />
              </Protected>
            }
          />
          <Route
            path="/candidate/video/:interviewId"
            element={
              <Protected roles={["CANDIDATE"]}>
                <VideoInterview />
              </Protected>
            }
          />

          {/* Admin area */}
          <Route
            path="/admin"
            element={
              <Protected roles={["HR"]}>
                <AdminDashboard />
              </Protected>
            }
          />
          <Route
            path="/admin/applications/:id"
            element={
              <Protected roles={["HR"]}>
                <ApplicationDetail />
              </Protected>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <Protected roles={["HR"]}>
                <JobsManager />
              </Protected>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  );
}
