import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type Props = {
  fallback?: string;
  className?: string;
  children?: React.ReactNode;
};

const AdminBackButton: React.FC<Props> = ({ fallback = '/admin', className = '', children }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    try {
      // If there's history to go back to, use it; otherwise fallback to admin root
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallback);
      }
    } catch (e) {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/80 hover:bg-gray-100 dark:bg-gray-800/90 dark:hover:bg-gray-700 dark:text-white text-sm transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {children ?? 'Back'}
    </button>
  );
};

export default AdminBackButton;
