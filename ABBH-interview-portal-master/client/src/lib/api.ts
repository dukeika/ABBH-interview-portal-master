import axios, { AxiosRequestConfig } from "axios";

/** --- Base config --- */
export const API_BASE: string =
  import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

/** --- Token helpers --- */
const TOKEN_KEY = "token";
export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Attach Bearer token when present */
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${t}`;
  }
  return config;
});

/** NEW: auto-handle 401s globally */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // kill stale/invalid token and go to login (avoid loops)
      clearToken();
      const path = window.location.pathname;
      if (!path.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/** Build an absolute URL for files served under /uploads */
function absoluteUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const ORIGIN = API_BASE.replace(/\/api$/, "");
  return path.startsWith("/") ? `${ORIGIN}${path}` : `${ORIGIN}/${path}`;
}

/** --- Auth --- */
export type LoginResponse = {
  token: string;
  user: {
    id: string;
    role: "HR" | "CANDIDATE";
    email: string;
    name?: string | null;
  };
};
export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  setToken(data.token);
  return data;
}

/** --- Candidate latest status --- */
export type LatestStatus = {
  id: string | null;
  stage:
    | null
    | "APPLIED"
    | "SCREENING"
    | "WRITTEN"
    | "VIDEO"
    | "FINAL_CALL"
    | "OFFER"
    | "REJECTED";
  jobId: string | null;
  jobTitle: string | null;
};
export async function fetchLatestApplicationStatus() {
  const { data } = await api.get<LatestStatus>("/application-status", {
    params: { latest: true },
  });
  return data;
}

/** --- VIDEO interview --- */
export type VideoQuestion = { id: string; prompt: string; order: number };
export async function fetchVideoQuestions(applicationId: string) {
  const { data } = await api.get<VideoQuestion[]>(
    `/applications/${applicationId}/video-questions`
  );
  return Array.isArray(data) ? data : [];
}
export async function uploadVideoAnswer(opts: {
  applicationId: string;
  questionId: string;
  blob: Blob;
  durationMs: number;
  startedAt: string;
  endedAt: string;
  mimeType: string;
  onProgress?: (pct: number) => void;
}) {
  const fd = new FormData();
  fd.append("video", opts.blob, `${opts.questionId}-${Date.now()}.webm`);
  fd.append("durationMs", String(opts.durationMs));
  fd.append("startedAt", opts.startedAt);
  fd.append("endedAt", opts.endedAt);
  fd.append("mimeType", opts.mimeType || "video/webm");

  const config: AxiosRequestConfig = {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!opts.onProgress || !evt.total) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      opts.onProgress(pct);
    },
  };

  const { data } = await api.post(
    `/videos/${opts.applicationId}/${opts.questionId}`,
    fd,
    config
  );
  return data;
}

/** --- Admin: list videos for an application --- */
export type AdminVideoItem = {
  id: string;
  url: string;
  mimeType: string;
  durationMs: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  question: { id: string; prompt: string; order: number } | null;
  absoluteUrl: string;
};
export async function listVideosByApplication(applicationId: string) {
  const { data } = await api.get<{
    items: Omit<AdminVideoItem, "absoluteUrl">[];
  }>(`/videos/by-application/${applicationId}`);
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map((v) => ({
    ...v,
    absoluteUrl: absoluteUrl(v.url),
  })) as AdminVideoItem[];
}

/** --- Applications --- */
export async function fetchApplication(appId: string) {
  const { data } = await api.get(`/applications/${appId}`);
  return data;
}
export async function fetchApplications(params?: Record<string, any>) {
  const { data } = await api.get(`/applications`, { params });
  return data as any[];
}

/** --- WRITTEN (candidate) --- */
export type WrittenQuestion = {
  id: string;
  prompt: string;
  order: number;
  forStage?: "WRITTEN";
};
export async function fetchWrittenQuestions(applicationId: string) {
  const { data } = await api.get<WrittenQuestion[]>(
    `/applications/${applicationId}/written-questions`
  );
  return Array.isArray(data) ? data : [];
}
export async function submitWrittenAnswers(
  applicationId: string,
  answers: { questionId: string; answer: string }[]
) {
  const { data } = await api.post(
    `/applications/${applicationId}/written-answers`,
    {
      answers,
    }
  );
  return data;
}

/** --- WRITTEN review (admin) --- */
export type AdminWrittenItem = {
  question: { id: string; prompt: string; order: number };
  answer: string;
};
export type AdminWrittenReview = {
  submittedAt: string | null;
  items: AdminWrittenItem[];
};
export async function fetchAdminWrittenReview(applicationId: string) {
  const { data } = await api.get<AdminWrittenReview>(
    `/admin/applications/${applicationId}/written`
  );
  return data;
}
