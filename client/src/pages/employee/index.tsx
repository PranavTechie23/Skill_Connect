import { Routes, Route } from 'react-router-dom';
import Applications from './applications';
import JobSearch from './browse-jobs';
import Profile from './profile';
import Home from '../home';

export default function EmployeeRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="applications" element={<Applications />} />
      <Route path="jobs" element={<JobSearch />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
}