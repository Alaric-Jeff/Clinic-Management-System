import axios from "axios";

// ✅ Create a pre-configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api", // fallback
  withCredentials: true, // send HttpOnly cookie automatically
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized - redirecting to login...");
      if (window.location.pathname !== "/") {
        window.location.href = "/"; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
