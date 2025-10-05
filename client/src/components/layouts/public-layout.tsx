import { Outlet } from 'react-router-dom';
import Navbar from '../navbar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
    </div>
  );
}