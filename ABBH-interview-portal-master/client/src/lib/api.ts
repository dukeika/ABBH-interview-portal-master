import axios, { AxiosInstance } from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:4000";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE, // can be http://localhost:4000 OR http://localhost:4000/api
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

export function getToken(): string | null {
  return localStorage.getItem("token");
}
export function setToken(token: string) {
  localStorage.setItem("token", token);
}
export function clearToken() {
  localStorage.removeItem("token");
}

/** Normalize paths so we never get /api/api/... and never miss /api */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const base = api.defaults.baseURL ?? "";
  const baseHasApi = /\/api$/.test(base);
  let url = config.url ?? "";

  // Only touch relative URLs
  const isAbsolute = /^https?:\/\//i.test(url);
  if (!isAbsolute) {
    url = url.replace(/\/{2,}/g, "/"); // collapse // in the path
    if (baseHasApi && url.startsWith("/api/")) {
      url = url.replace(/^\/api/, ""); // base ends with /api → strip leading /api
    } else if (!baseHasApi && !url.startsWith("/api")) {
      url = url.startsWith("/") ? `/api${url}` : `/api/${url}`; // base is server root → ensure /api
    }
    config.url = url;
  }
  return config;
});

export default api;
