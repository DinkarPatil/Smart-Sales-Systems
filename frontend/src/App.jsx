import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import SalesRepDashboard from './pages/SalesRepDashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { Layout } from './components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/v1/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent-aurora border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route element={<Layout user={user} />}>
          <Route path="/admin" element={user?.role === 'Admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/manager" element={user?.role === 'Manager' ? <ManagerDashboard /> : <Navigate to="/login" />} />
          <Route path="/owner" element={user?.role === 'Owner' ? <OwnerDashboard /> : <Navigate to="/login" />} />
          <Route path="/sales" element={user?.role === 'SalesRep' ? <SalesRepDashboard /> : <Navigate to="/login" />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
