import axios from "axios";

console.log("API BASE:", import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // ✅ OAuth cookies
});

export default api;
