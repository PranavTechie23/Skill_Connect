import { Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard';
import Applications from './applications';
import JobSearch from './job-search';
import Profile from './profile';

export default function EmployeeRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="applications" element={<Applications />} />
      <Route path="jobs" element={<JobSearch />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
}