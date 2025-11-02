import { ArrowLeft } from 'lucide-react';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

const AdminBackButton: React.FC<Props> = ({ className = '', children }) => {
  return (
    <button
      onClick={() => window.history.back()}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/80 hover:bg-gray-100 dark:bg-gray-800/90 dark:hover:bg-gray-700 dark:text-white text-sm transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {children ?? 'Back'}
    </button>
  );
};

export default AdminBackButton;
