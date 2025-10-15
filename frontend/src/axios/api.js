// src/axios/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:3000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("Unauthorized - redirecting to login...");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
