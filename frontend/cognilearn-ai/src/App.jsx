import React, { useCallback, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { supabase } from './utils/supabaseClient';

import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/SignUp";
import DashBoard from "./pages/Home/DashBoard";
import LandingPage from './pages/Home/LandingPage';
import Contest from './pages/Contest/Contest';
import CreateContest from './pages/Contest/CreateContest';
import ContestResult from './pages/Contest/ContestResult';
import PrivateRoute from './components/PrivateRoute';
import axiosInstance from './utils/axiosInsantce';
import Library from './pages/Contest/Library';
import TeacherDashboard from './pages/Home/TeacherDashBoard';
import UserProfile from './pages/Account/UserProfile';
import Setting from './pages/Setting/Setting';
import Notifications from './pages/Home/Notifications';
import CogniChat from './pages/Interview/CogniChat';
import TeacherLibrary from './pages/Contest/TeacherLibrary';
import Standing from './pages/Contest/Standing';
import LoaderPage from './components/Loader/LoaderPage';
import Orientation from './pages/Interview/Orientation';

const App = () => {
  const [userInfo, SetUserInfo] = useState(null);

   const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data?.session?.access_token) {
    console.error("Refresh token error:", error);
    return null;
  }

  const newToken = data.session.access_token;
  const newRefreshToken = data.session.refresh_token;
  localStorage.setItem("token", newToken);
  localStorage.setItem("refresh_token", newRefreshToken);
  return newToken;
};

const fetchProfile = useCallback(async () => {
  let token = localStorage.getItem("token");
  try {
    if (!token) {
      SetUserInfo(null);
      return;
    }

    const res = await axiosInstance.get("/get-profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    SetUserInfo(res.data.user);

  } catch (err) {
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        SetUserInfo(null);
        return;
      }

      // Retry request với token mới
      try {
        const res = await axiosInstance.get("/get-profile", {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        SetUserInfo(res.data.user);
      } catch (retryErr) {
        console.error("Retry fetchProfile failed:", retryErr);
        SetUserInfo(null);
      }
    } else {
      SetUserInfo(null);
    }
  }
}, []);

  useEffect(() => {
    fetchProfile();
    const handleStorageChange = () => {
      fetchProfile();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  return (
    <div >
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage/>}/>
          <Route path="/loader" element={<LoaderPage />} />
          <Route path="/landing" element={<LandingPage/>}/>
          <Route path="/cogni-chat/:sessionId" element={<CogniChat userInfo={userInfo}/>}/>      
          <Route path="/orientation/:sessionId" element={<Orientation userInfo={userInfo}/>}/>     
          <Route path="/login" element={<Login fetchProfile = {fetchProfile}/>}/>
          <Route path="/signup" element={<Signup fetchProfile = {fetchProfile}/>}/>
          <Route path="/contest/:id" element={<Contest userInfo = {userInfo}/>}/>
          {userInfo?.role === "teacher" && <Route path="/create-contest" element={<CreateContest userInfo={userInfo}/>}/>}
          {userInfo?.role === "teacher" && <Route path="/standing/:contestId/:name" element={<Standing />}/>}
          <Route path="/contest-result/:id" element={<ContestResult/>}/>
          <Route path="/settings" element={<Setting userInfo={userInfo}/>}/>
          <Route path="/notifications" element={<Notifications userInfo={userInfo}/>}/>
          
          <Route
            path="/profile"
            element={
            
              <UserProfile userInfo={userInfo}/>
            
          } 
        />
          <Route
            path="/library"
            element={
            
              userInfo?.role ===  "student" ? (<Library userInfo={userInfo}/>) : (<TeacherLibrary userInfo={userInfo}/>)
            
          } />

          <Route
            path="/dashboard"
            element={
            
              userInfo?.role ===  "student" ? (<DashBoard userInfo={userInfo}/>) : (<TeacherDashboard userInfo={userInfo}/>)
            
          }
        />
        </Routes>
      </Router>
      <Toaster
        toastOptions={{
          className:"",
          style: {
            fontSize: "13px",
          },
        }}
      />
    </div>
  )
}

export default App