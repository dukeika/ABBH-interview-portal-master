// client/src/services/api.js
import axios from "axios";

/** Base URL (local by default) */
const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL &&
    import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")) ||
  "http://localhost:4000/api";

/** Axios instance */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

/** Token helpers */
export function setToken(token) {
  localStorage.setItem("token", token);
}
export function getToken() {
  return localStorage.getItem("token");
}
export function clearToken() {
  localStorage.removeItem("token");
}

/** Attach token automatically */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Handle 401 → optional logout logic */
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // clearToken(); window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/* ===========================
   AUTH
   =========================== */

export function login(body) {
  // { email, password } -> { token, user }
  return api.post("/auth/login", body).then((r) => r.data);
}

export function register(body) {
  // { fullName, email, password, phone? } -> { token, user }
  return api.post("/auth/register", body).then((r) => r.data);
}

export function me() {
  return api.get("/auth/me").then((r) => r.data);
}

/* ===========================
   JOBS / ROLES
   =========================== */

export function listJobs() {
  return api.get("/jobs").then((r) => r.data);
}

export function getJob(id) {
  return api.get(`/jobs/${id}`).then((r) => r.data);
}

/* ===========================
   CANDIDATE: APPLY / STATUS
   =========================== */

export function submitApplication(payload) {
  // payload: { jobId, fullName, phone?, coverLetter?, file }
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

export function getApplicationStatus() {
  return api.get("/application-status").then((r) => r.data);
}

/* ===========================
   WRITTEN TEST
   =========================== */

export function getWrittenQuestions(params = {}) {
  return api.get("/written-test/questions", { params }).then((r) => r.data);
}

export function submitWrittenAnswers(body) {
  // body: { answers: Record<string, string> }
  return api.post("/written-test", body).then((r) => r.data);
}

/* ===========================
   VIDEO INTERVIEW
   =========================== */

export function getVideoQuestions(params = {}) {
  return api.get("/video-questions", { params }).then((r) => r.data);
}

export function uploadVideoAnswer(applicationId, questionId, file) {
  const fd = new FormData();
  fd.append("questionId", String(questionId));
  const name = file?.name || "answer.webm";
  fd.append("video", file, name);

  return api
    .post(`/applications/${applicationId}/video/upload`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

/* ===========================
   FINAL STAGE
   =========================== */

export function getFinalLink() {
  return api.get("/final-link").then((r) => r.data);
}

/* ===========================
   ADMIN / HR
   =========================== */

export function adminListCandidates() {
  return api.get("/admin/candidates").then((r) => r.data);
}

export function adminGetCandidate(id) {
  return api.get(`/admin/candidates/${id}`).then((r) => r.data);
}

export function adminAdvanceStage(id, body = {}) {
  return api.post(`/admin/candidates/${id}/advance`, body).then((r) => r.data);
}

export function adminRevertStage(id, body = {}) {
  return api.post(`/admin/candidates/${id}/revert`, body).then((r) => r.data);
}

export function adminSetFinalLink(id, body) {
  // { finalLink, message? }
  return api
    .post(`/admin/candidates/${id}/final-link`, body)
    .then((r) => r.data);
}

export function adminCreateJob(role) {
  return api.post("/admin/jobs", role).then((r) => r.data);
}

export function adminAddQuestion(q) {
  // { jobId, type: 'WRITTEN'|'VIDEO', text, category?, difficulty?, weight? }
  return api.post(`/admin/jobs/${q.jobId}/questions`, q).then((r) => r.data);
}

export function adminListJobQuestions(jobId) {
  return api.get(`/admin/jobs/${jobId}/questions`).then((r) => r.data);
}

/* ===========================
   FILE HELPERS
   =========================== */

export function toPublicUrl(relativeOrAbsolute) {
  if (!relativeOrAbsolute) return "";
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute;
  if (relativeOrAbsolute.startsWith("/uploads/")) {
    const apiOrigin = API_BASE_URL.replace(/\/api$/, "");
    return `${apiOrigin}${relativeOrAbsolute}`;
  }
  return relativeOrAbsolute;
}

export default api;
