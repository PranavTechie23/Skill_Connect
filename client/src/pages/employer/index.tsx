import { Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard';
import JobManagement from './job-management';
import Candidates from './candidates';
import Profile from './profile';

export default function EmployerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="jobs" element={<JobManagement />} />
      <Route path="candidates" element={<Candidates />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
}