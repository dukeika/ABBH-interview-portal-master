// client/src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ApplicationStatus from "./pages/ApplicationStatus";
import WrittenTest from "./pages/WrittenTest";
import VideoInterview from "./pages/VideoInterview";
import VideoSubmitted from "./pages/VideoSubmitted";
import VideoDeviceCheck from "./pages/VideoDeviceCheck"; // ✅ new page

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApplicationsList from "./pages/admin/AdminApplicationsList"; // ✅ fixed import
import AdminApplicationDetail from "./pages/admin/AdminApplicationDetail";
import AdminWrittenReview from "./pages/admin/AdminWrittenReview";
import AdminVideoReview from "./pages/admin/AdminVideoReview";
import JobsManager from "./pages/admin/JobsManager";

import { useAuth } from "./context/AuthContext";

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "HR") return <Navigate to="/status" replace />;
  return <>{children}</>;
}

function AuthedOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* auth */}
      <Route path="/login" element={<Login />} />

      {/* candidate */}
      <Route
        path="/status"
        element={
          <AuthedOnly>
            <ApplicationStatus />
          </AuthedOnly>
        }
      />
      <Route
        path="/written/:applicationId"
        element={
          <AuthedOnly>
            <WrittenTest />
          </AuthedOnly>
        }
      />
      <Route
        path="/video-interview/:applicationId"
        element={
          <AuthedOnly>
            <VideoInterview />
          </AuthedOnly>
        }
      />
      <Route
        path="/video-submitted/:applicationId"
        element={
          <AuthedOnly>
            <VideoSubmitted />
          </AuthedOnly>
        }
      />

      {/* admin */}
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <AdminDashboard />
          </AdminOnly>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <AdminOnly>
            <AdminApplicationsList /> {/* ✅ fixed usage */}
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
      {/* ✅ explicit, no wildcard capture */}
      <Route
        path="/video-setup/:applicationId" // ✅ device test page before interview
        element={
          <AuthedOnly>
            <VideoDeviceCheck />
          </AuthedOnly>
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
      <Route
        path="/admin/applications/:applicationId/videos"
        element={
          <AdminOnly>
            <AdminVideoReview />
          </AdminOnly>
        }
      />

      <Route
        path="/admin/jobs"
        element={
          <AdminOnly>
            <JobsManager />
          </AdminOnly>
        }
      />

      {/* default */}
      <Route path="/" element={<Navigate to="/status" replace />} />
      <Route path="*" element={<Navigate to="/status" replace />} />
    </Routes>
  );
}
