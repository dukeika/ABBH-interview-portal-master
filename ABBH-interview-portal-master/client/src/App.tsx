import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/layout/Header";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ApplicationForm from "./pages/candidate/ApplicationForm";
import ApplicationStatus from "./pages/ApplicationStatus";
import WrittenTest from "./pages/WrittenTest";
import VideoInterview from "./pages/admin/VideoInterview";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CandidateDetail from "./pages/admin/CandidateDetail";
import ManageRoles from "./pages/admin/ManageRoles";
import { useAuth } from "./context/AuthContext";
import { Container } from "@mui/material";
import ApplyNow from "./pages/ApplyNow";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Send users to the correct “home” for their role
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
    // Redirect to their own home instead of "/" to avoid loops
    return <Navigate to={user.role === "HR" ? "/admin" : "/status"} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Header />
      <Container sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/apply"
            element={
              <Protected roles={["CANDIDATE"]}>
                <ApplicationForm />
              </Protected>
            }
          />
          <Route
            path="/status"
            element={
              <Protected roles={["CANDIDATE"]}>
                <ApplicationStatus />
              </Protected>
            }
          />
          <Route
            path="/written/:id"
            element={
              <Protected roles={["CANDIDATE"]}>
                <WrittenTest />
              </Protected>
            }
          />
          <Route
            path="/video/:id"
            element={
              <Protected roles={["CANDIDATE"]}>
                <VideoInterview />
              </Protected>
            }
          />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/apply-now" element={<ApplyNow />} />

          <Route
            path="/admin/applications/:id"
            element={
              <Protected roles={["HR"]}>
                <CandidateDetail />
              </Protected>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <Protected roles={["HR"]}>
                <ManageRoles />
              </Protected>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  );
}
