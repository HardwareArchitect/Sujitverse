import axios, { AxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";
import { useAuth } from "../store/auth";

export const api = axios.create({
  baseURL: "/api",
  timeout: 30_000,
});

// Attach the current access token to every outgoing request
api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().accessToken;
  if (token) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return cfg;
});

// Auto-refresh on 401, then retry once.
let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const { refreshToken, setAccessToken, clear } = useAuth.getState();
  if (!refreshToken) return null;
  try {
    const resp = await axios.post("/api/auth/refresh", {
      refresh_token: refreshToken,
    });
    const newAccess = resp.data.access_token as string;
    setAccessToken(newAccess);
    return newAccess;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes("/auth/login") &&
      !original.url?.includes("/auth/refresh")
    ) {
      original._retried = true;
      if (!refreshing) refreshing = refreshAccess();
      const newAccess = await refreshing;
      refreshing = null;
      if (newAccess) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>)["Authorization"] = `Bearer ${newAccess}`;
        return api.request(original);
      }
    }
    return Promise.reject(error);
  }
);
