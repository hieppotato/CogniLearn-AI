import { useNavigate } from "react-router-dom";
import axiosInstance from "./axiosInsantce";

export const handleLogout = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await axiosInstance.post('/logout', {
          access_token: token
        });
      }

      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      navigate('/login'); 

    } catch (error) {
      console.error('Logout error:', error);

      localStorage.clear();
      navigate('/login');
    }
  }
};