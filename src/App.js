import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/navbar';
import Sidebar from './components/sidebar';
import Dashboard from './pages/dashboard';
import Tenants from './pages/tenants';
import Messages from './pages/messages';
import Inquiries from './pages/inquiries';
import Maintenance from './pages/maintenance';
import Payments from './pages/payments';
import Announcements from './pages/announcements';
import Login from './pages/login';
import Register from './pages/register';
import RoomUpdate from './pages/room-update';
import Profile from './pages/profile'; // Import Profile Page
import GuestApproval from './pages/guest-approval';
import Reports from './pages/reports';
import AmenitiesUse from './pages/amenities-use';
import AuditLog from './pages/audit-log';

function Layout() {
  const location = useLocation();
  const hideLayout = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  return (
    <div style={{ display: "flex" }}>
      {!hideLayout && <Sidebar />}
      <div style={{ marginLeft: !hideLayout ? "250px" : "0", width: "100%" }}>
        {!hideLayout && <Navbar />}
        <div style={{ padding: !hideLayout ? "20px" : "0" }}>
          <Routes>
            {/* Auth Pages */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Main Pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/room-update" element={<RoomUpdate />} />
            <Route path="/guest-approval" element={<GuestApproval />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/amenities-use" element={<AmenitiesUse />} />
            <Route path="/audit-log" element={<AuditLog />} />

            {/* Profile Page */}
            <Route path="/profile" element={<Profile />} /> {/* New route for profile */}
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
