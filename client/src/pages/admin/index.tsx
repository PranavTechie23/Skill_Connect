import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./dashboard";

/**
 * Admin shell: AdminDashboard reads `/admin/:tab` from the URL and renders the correct panel.
 */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="users" element={<AdminDashboard />} />
      <Route path="jobs" element={<AdminDashboard />} />
      <Route path="companies" element={<AdminDashboard />} />
      <Route path="employers" element={<AdminDashboard />} />
      <Route path="analytics" element={<AdminDashboard />} />
      <Route path="applications" element={<AdminDashboard />} />
      <Route path="approvals" element={<AdminDashboard />} />
      <Route path="employees" element={<AdminDashboard />} />
      <Route path="stories" element={<AdminDashboard />} />
      <Route path="success-stories" element={<AdminDashboard />} />
      <Route path="settings" element={<AdminDashboard />} />
      <Route path="job-postings" element={<AdminDashboard />} />
      <Route path="*" element={<AdminDashboard />} />
    </Routes>
  );
}
