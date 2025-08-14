import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// auth + guards
import { useAuth } from "./context/AuthContext";

// candidate pages
import ApplicationStatus from "./pages/ApplicationStatus";
import WrittenTest from "./pages/WrittenTest";
import VideoInterview from "./pages/VideoInterview";
import VideoSubmitted from "./pages/VideoSubmitted";

// admin pages
import JobsManager from "./pages/admin/JobsManager";
import AdminApplicationDetail from "./pages/admin/AdminApplicationDetail";
import AdminVideoReview from "./pages/admin/AdminVideoReview";
import AdminWrittenReview from "./pages/admin/AdminWrittenReview";

// auth pages
import Login from "./pages/Login";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "HR") return <Navigate to="/status" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Candidate */}
      <Route path="/" element={<Navigate to="/status" replace />} />
      <Route
        path="/status"
        element={
          <Protected>
            <ApplicationStatus />
          </Protected>
        }
      />
      <Route
        path="/written/:applicationId"
        element={
          <Protected>
            <WrittenTest />
          </Protected>
        }
      />
      <Route
        path="/video-interview/:applicationId"
        element={
          <Protected>
            <VideoInterview />
          </Protected>
        }
      />
      <Route
        path="/video-submitted/:applicationId"
        element={
          <Protected>
            <VideoSubmitted />
          </Protected>
        }
      />

      {/* Admin */}
      <Route path="/admin" element={<Navigate to="/admin/jobs" replace />} />
      <Route
        path="/admin/jobs"
        element={
          <AdminOnly>
            <JobsManager />
          </AdminOnly>
        }
      />
      <Route
        path="/admin/applications/:applicationId"
        element={
          <AdminOnly>
            <AdminApplicationDetail />
          </AdminOnly>
        }
      />
      <Route
        path="/admin/applications/:applicationId/videos"
        element={
          <AdminOnly>
            <AdminVideoReview />
          </AdminOnly>
        }
      />
      <Route
        path="/admin/applications/:applicationId/written"
        element={
          <AdminOnly>
            <AdminWrittenReview />
          </AdminOnly>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<div style={{ padding: 16 }}>Not Found</div>} />
    </Routes>
  );
}
