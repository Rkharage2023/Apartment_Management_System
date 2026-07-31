import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
});
console.log(import.meta.env.VITE_API_URL);
console.log("BASE URL:", import.meta.env.VITE_API_URL);
// Auto attach token to every request
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle token expiry
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout on 401 from protected routes, not from /auth/login itself
    const isAuthRoute = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/register");
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default API;
