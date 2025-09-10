import axios from "axios";
import { handleLogout } from "./logout";

const axiosInstance = axios.create({
  baseURL: "https://cogni-learn-server.vercel.app", // backend API
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // nếu backend có dùng cookie/session
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("⚠️ Token expired or invalid, logging out...");
      await handleLogout();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;