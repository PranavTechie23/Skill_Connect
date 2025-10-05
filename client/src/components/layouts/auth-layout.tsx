import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface AuthLayoutProps {
  userType: 'Professional' | 'Employer';
}

export default function AuthLayout({ userType }: AuthLayoutProps) {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.userType !== userType) {
    return <Navigate to={`/${user.userType.toLowerCase()}/dashboard`} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Protected Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold">
                  SkillConnect
                </Link>
              </div>

              {user.userType === 'Professional' ? (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/employee/dashboard" className="nav-link">Dashboard</Link>
                  <Link to="/employee/applications" className="nav-link">Applications</Link>
                  <Link to="/employee/jobs" className="nav-link">Find Jobs</Link>
                  <Link to="/employee/profile" className="nav-link">Profile</Link>
                </div>
              ) : (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/employer/dashboard" className="nav-link">Dashboard</Link>
                  <Link to="/employer/jobs" className="nav-link">Manage Jobs</Link>
                  <Link to="/employer/candidates" className="nav-link">Candidates</Link>
                  <Link to="/employer/profile" className="nav-link">Company Profile</Link>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <span className="mr-4">{user.firstName} {user.lastName}</span>
              <Button variant="destructive" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}