import { useAuth } from '../../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Company Profile</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Welcome {user?.email || 'Guest'}</p>
      </div>
    </div>
  );
}