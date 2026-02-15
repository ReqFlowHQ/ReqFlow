import axios from "axios";
import { AxiosHeaders } from "axios";
import { getCookieValue, shouldAttachCsrf } from "./securityHeaders";

console.log("API BASE:", import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

let csrfInitialized = false;
let refreshPromise: Promise<void> | null = null;

const ensureCsrfCookie = async () => {
  if (csrfInitialized) return;
  try {
    await api.get("/auth/csrf");
  } finally {
    csrfInitialized = true;
  }
};

api.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toUpperCase();
  if (shouldAttachCsrf(method)) {
    await ensureCsrfCookie();
    const csrfToken = getCookieValue(document.cookie || "", "csrfToken");
    if (csrfToken) {
      const headers = AxiosHeaders.from(config.headers || {});
      headers.set("x-csrf-token", csrfToken);
      config.headers = headers;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;
    if (!originalConfig || originalConfig._retry) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const isRefreshCall = String(originalConfig.url || "").includes("/auth/refresh");
    if (status === 401 && !isRefreshCall) {
      originalConfig._retry = true;
      if (!refreshPromise) {
        refreshPromise = api
          .post("/auth/refresh")
          .then(() => undefined)
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        return api(originalConfig);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
