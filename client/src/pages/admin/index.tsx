import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './dashboard';
import UserManagement from './user-management';
import JobManagement from './job-management';
import CompanyManagement from './company-management';
import Analytics from './analytics';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="jobs" element={<JobManagement />} />
      <Route path="companies" element={<CompanyManagement />} />
      <Route path="analytics" element={<Analytics />} />
    </Routes>
  );
}



