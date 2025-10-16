import { useTheme } from '@/components/theme-provider';
import type { ReactElement } from 'react';

const EmployerDashboard = (): ReactElement => {
  const { theme } = useTheme();

  return (
    <div className="flex min-h-screen overflow-hidden">
      <div 
        className={`min-h-screen w-screen ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
            : 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100'
        } fixed inset-0 overflow-hidden`}
      >
        <main className="h-full w-full p-8">
          <div className="container mx-auto">
            {/* Content goes here */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployerDashboard;
