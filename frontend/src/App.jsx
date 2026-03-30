import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import SalesRepDashboard from './pages/SalesRepDashboard';
import { Layout } from './components/Layout';

function App() {
  const [user, setUser] = useState(null);

  // Mock auto-login or token check could go here
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        
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
