import axios, { AxiosInstance } from "axios";

/** Base URL (local by default) */
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:4000/api";

/** Axios instance */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

/** Token helpers */
export function setToken(token: string) {
  localStorage.setItem("token", token);
}
export function getToken(): string | null {
  return localStorage.getItem("token");
}
export function clearToken() {
  localStorage.removeItem("token");
}

/** Attach token automatically */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Handle 401 → optional logout logic */
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // Optional: auto-logout
      // clearToken(); window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/* ===========================
   SHARED TYPES
   =========================== */

export type JwtLoginResponse = { token: string; user: any };

export type Job = {
  id: string | number;
  title: string;
  department?: string | null;
  location?: string | null;
  description?: string | null;
  status?: string | null;
};

export type ApplicationStatus = {
  stage?: string;
  status?: string;
  noteBeforeWritten?: string | null;
  noteBeforeVideo?: string | null;
  noteBeforeFinal?: string | null;
  finalLink?: string | null;
  writtenScore?: number | null;
  videoAnswers?: Array<{ questionId: string | number; url: string }>;
  resumeUrl?: string | null;
};

/* ===========================
   AUTH
   =========================== */

/** Login */
export function login(body: {
  email: string;
  password: string;
}): Promise<JwtLoginResponse> {
  return api.post("/auth/login", body).then((r) => r.data);
}

/** Register */
export function register(body: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<JwtLoginResponse> {
  return api.post("/auth/register", body).then((r) => r.data);
}

/** Current user */
export function me(): Promise<any> {
  return api.get("/auth/me").then((r) => r.data);
}

/* ===========================
   JOBS / ROLES
   =========================== */

export function listJobs(): Promise<Job[]> {
  return api.get("/jobs").then((r) => r.data);
}

export function getJob(id: string | number): Promise<Job> {
  return api.get(`/jobs/${id}`).then((r) => r.data);
}

/* ===========================
   CANDIDATE: APPLY / STATUS
   =========================== */

export function submitApplication(payload: {
  jobId: string | number;
  fullName: string;
  phone?: string;
  coverLetter?: string;
  file: File;
}): Promise<any> {
  const fd = new FormData();
  fd.append("jobId", String(payload.jobId));
  fd.append("fullName", payload.fullName);
  if (payload.phone) fd.append("phone", payload.phone);
  if (payload.coverLetter) fd.append("coverLetter", payload.coverLetter);
  fd.append("resume", payload.file, payload.file.name);

  return api
    .post("/applications", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

export function getApplicationStatus(): Promise<ApplicationStatus> {
  return api.get("/application-status").then((r) => r.data);
}

/* ===========================
   WRITTEN TEST
   =========================== */

export type Question = {
  id: string | number;
  text: string;
  category?: string | null;
  difficulty?: number | null;
  weight?: number | null;
};

export function getWrittenQuestions(
  params: {
    jobId?: string | number;
  } = {}
): Promise<Question[] | { questions: Question[] }> {
  return api.get("/written-test/questions", { params }).then((r) => r.data);
}

export function submitWrittenAnswers(body: {
  answers: Record<string, string>;
}): Promise<any> {
  return api.post("/written-test", body).then((r) => r.data);
}

/* ===========================
   VIDEO INTERVIEW
   =========================== */

export function getVideoQuestions(
  params: {
    jobId?: string | number;
  } = {}
): Promise<Question[] | { questions: Question[] }> {
  return api.get("/video-questions", { params }).then((r) => r.data);
}

export function uploadVideoAnswer(
  applicationId: string | number,
  questionId: string | number,
  file: File | Blob
): Promise<any> {
  const fd = new FormData();
  fd.append("questionId", String(questionId));
  // for Blob, name may not exist; fallback
  const fileName = (file as File).name || "answer.webm";
  fd.append("video", file, fileName);

  return api
    .post(`/applications/${applicationId}/video/upload`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

/* ===========================
   FINAL STAGE
   =========================== */

export function getFinalLink(): Promise<{ finalLink?: string }> {
  return api.get("/final-link").then((r) => r.data);
}

/* ===========================
   ADMIN / HR
   =========================== */

export function adminListCandidates(): Promise<any[]> {
  return api.get("/admin/candidates").then((r) => r.data);
}

export function adminGetCandidate(id: string | number): Promise<any> {
  return api.get(`/admin/candidates/${id}`).then((r) => r.data);
}

export function adminAdvanceStage(
  id: string | number,
  body: { message?: string; note?: string } = {}
): Promise<any> {
  return api.post(`/admin/candidates/${id}/advance`, body).then((r) => r.data);
}

export function adminRevertStage(
  id: string | number,
  body: { message?: string; note?: string } = {}
): Promise<any> {
  return api.post(`/admin/candidates/${id}/revert`, body).then((r) => r.data);
}

export function adminSetFinalLink(
  id: string | number,
  body: { finalLink: string; message?: string }
): Promise<any> {
  return api
    .post(`/admin/candidates/${id}/final-link`, body)
    .then((r) => r.data);
}

export function adminCreateJob(role: {
  title: string;
  description?: string;
  department?: string;
  location?: string;
}): Promise<any> {
  return api.post("/admin/jobs", role).then((r) => r.data);
}

export function adminAddQuestion(q: {
  jobId: string | number;
  type: "WRITTEN" | "VIDEO";
  text: string;
  category?: string;
  difficulty?: number;
  weight?: number;
}): Promise<any> {
  return api.post(`/admin/jobs/${q.jobId}/questions`, q).then((r) => r.data);
}

export function adminListJobQuestions(jobId: string | number): Promise<any> {
  return api.get(`/admin/jobs/${jobId}/questions`).then((r) => r.data);
}

/* ===========================
   FILE HELPERS
   =========================== */

export function toPublicUrl(relativeOrAbsolute: string): string {
  if (!relativeOrAbsolute) return "";
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute;
  // Allow absolute path starting with /uploads on same origin:
  if (relativeOrAbsolute.startsWith("/uploads/")) {
    const apiOrigin = API_BASE_URL.replace(/\/api$/, "");
    return `${apiOrigin}${relativeOrAbsolute}`;
  }
  return relativeOrAbsolute;
}

export default api;
