// ─── lib/api.ts ───────────────────────────────────────────────────────────────
// Configured Axios instance used by all API calls in the app.
//
// Benefits of a central instance:
//   - One place to set the base URL (points to the Vite proxy → Express)
//   - Request interceptor automatically attaches the JWT from localStorage
//   - Response interceptor handles 401s globally (token expired → logout)
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";

// Create an Axios instance. All requests go through /api, which Vite proxies
// to the Express backend in development.
const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Runs before every outgoing request. If we have a token in localStorage,
// it's added to the Authorization header automatically.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
// Runs after every response. If the server returns 401 (token expired or invalid),
// we wipe local storage and reload to send the user back to the login page.
api.interceptors.response.use(
  (response) => response, // pass through successful responses untouched

  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid/expired — clear everything and send to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;