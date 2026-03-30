import axios from "axios";
import { store } from "../store";
import { tokenRefreshed, logout } from "../store/authSlice";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // send refresh token cookie
  timeout: 15000,
});

// ── Request interceptor — attach access token to every request ──
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — auto-refresh on 401 ──
let isRefreshing = false;
let pendingQueue = []; // requests waiting for new token

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token),
  );
  pendingQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const newToken = data.accessToken;
      store.dispatch(tokenRefreshed(newToken));
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(logout());
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
