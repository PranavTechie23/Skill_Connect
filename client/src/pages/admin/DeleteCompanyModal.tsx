import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  adminFormLabelClass,
  adminFormModalCancelBtnClass,
  adminFormModalFooterClass,
  adminFormModalFormClass,
  adminFormModalSectionClass,
  adminFormTextareaClass,
} from '@/components/admin/admin-form-modal-styles';
import { AdminFormModal } from '@/components/admin/AdminFormModal';

interface DeleteCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, reason: string) => Promise<void>;
  darkMode: boolean;
  company: {
    id: string;
    name: string;
  } | null;
}

const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({ isOpen, onClose, onSubmit, darkMode, company }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    setLoading(true);
    try {
      await onSubmit(company.id, reason.trim());
    } finally {
      setLoading(false);
    }
  };

  const labelClass = adminFormLabelClass(darkMode);
  const textareaClass = adminFormTextareaClass(darkMode);

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      darkMode={darkMode}
      title="Delete Company"
      subtitle={`Are you sure you want to permanently delete ${company?.name || 'this company'}?`}
      icon={<AlertTriangle className="h-7 w-7 text-red-500" />}
      bareBody
    >
      <form onSubmit={handleFormSubmit} className={adminFormModalFormClass()}>
        <div className={adminFormModalSectionClass(darkMode)}>
          <div className={`p-4 rounded-xl border mb-4 ${darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
              Warning: This action cannot be undone. All data associated with this company will be permanently removed.
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="delete-company-reason">
              Reason for Deletion <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block font-normal mt-1">This reason will be included in the notification sent to the company owner before their data is removed.</span>
            </label>
            <textarea
              id="delete-company-reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className={textareaClass}
              placeholder="e.g., Violation of terms of service"
              rows={3}
            />
          </div>
        </div>

        <div className={adminFormModalFooterClass(darkMode)}>
          <button type="button" onClick={onClose} className={adminFormModalCancelBtnClass(darkMode)}>
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || !reason.trim()} 
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all text-white shadow-lg ${
              loading || !reason.trim()
                ? (darkMode ? 'bg-red-500/50 cursor-not-allowed' : 'bg-red-300 cursor-not-allowed')
                : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 hover:shadow-red-500/25'
            }`}
          >
            {loading ? 'Deleting...' : 'Delete Company'}
          </button>
        </div>
      </form>
    </AdminFormModal>
  );
};

export default DeleteCompanyModal;
