import { Outlet } from 'react-router-dom';
import Navbar from '../navbar';
import { SkillConnectAssistant } from '@/components/skillconnect-assistant';

const SHOW_SUPPORT_CHATBOT = true;

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      {SHOW_SUPPORT_CHATBOT ? <SkillConnectAssistant /> : null}
    </div>
  );
}