import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = 'items'
}: PaginationProps) {
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  if (totalPages <= 1) return null;

  const getVisiblePages = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, '...', total];
    if (current >= total - 2) return [1, '...', total - 2, total - 1, total];
    return [1, '...', current, '...', total];
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`p-6 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="sm:w-1/3 flex justify-center sm:justify-start w-full order-2 sm:order-1">
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{startItem}</span> to{' '}
            <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{endItem}</span> of{' '}
            <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalItems}</span> {itemName}
          </p>
        </div>
        
        <div className="sm:w-1/3 flex justify-center w-full order-1 sm:order-2">
          <div className={`flex items-center gap-1.5 p-1.5 rounded-full border backdrop-blur-md shadow-sm transition-all ${
            darkMode ? 'bg-gray-800/40 border-gray-700/50 shadow-black/20' : 'bg-gray-50/80 border-gray-200 shadow-gray-200/50'
          }`}>
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-sm transition-all duration-300 ${
                currentPage === 1
                  ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                  : (darkMode ? 'text-gray-300 hover:bg-gray-700/60 hover:text-white' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:text-purple-600')
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            
            <div className="flex items-center gap-1">
              {getVisiblePages(currentPage, totalPages).map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className={`px-1.5 font-bold ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    …
                  </span>
                ) : (
                  <button
                    key={`page-${page}`}
                    onClick={() => onPageChange(page as number)}
                    className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-300 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)] scale-105'
                        : (darkMode 
                            ? 'text-gray-400 hover:bg-gray-700/60 hover:text-gray-200' 
                            : 'text-gray-600 hover:bg-white hover:shadow-sm hover:text-purple-600')
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>
            
            <button
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-sm transition-all duration-300 ${
                currentPage === totalPages
                  ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                  : (darkMode ? 'text-gray-300 hover:bg-gray-700/60 hover:text-white' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:text-purple-600')
              }`}
              aria-label="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="sm:w-1/3 hidden sm:block order-3"></div>
      </div>
    </div>
  );
}
