import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import {
  adminFormInputClass,
  adminFormLabelClass,
  adminFormModalCancelBtnClass,
  adminFormModalFooterClass,
  adminFormModalFormClass,
  adminFormModalGridClass,
  adminFormModalSectionClass,
  adminFormModalSubmitBtnClass,
  adminFormTextareaClass,
} from '@/components/admin/admin-form-modal-styles';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import type { CompanyModerationStatus, UpdateCompanyData } from '@/lib/admin-service';

export interface EditCompanyFormData {
  name: string;
  industry: string;
  location: string;
  size: string;
  website: string;
  description: string;
  reason: string;
  status: CompanyModerationStatus;
}

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateCompanyData) => Promise<void>;
  darkMode: boolean;
  company: {
    id: string;
    name: string;
    industry: string;
    location: string;
    website: string;
    size: string;
    description?: string;
    status?: CompanyModerationStatus;
  } | null;
}

const STATUS_OPTIONS: { value: CompanyModerationStatus; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'rejected', label: 'Rejected' },
];

const COMPANY_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
];

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({ isOpen, onClose, onSubmit, darkMode, company }) => {
  const [formData, setFormData] = useState<EditCompanyFormData>({
    name: '',
    industry: '',
    location: '',
    size: '',
    website: '',
    description: '',
    reason: '',
    status: 'approved',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        location: company.location || '',
        size: company.size || '',
        website: company.website || '',
        description: company.description || '',
        reason: '',
        status: company.status || 'approved',
      });
      setLoading(false);
    }
  }, [isOpen, company]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    setLoading(true);
    try {
      const trim = (v: string) => v.trim();
      const payload: UpdateCompanyData = {
        name: trim(formData.name),
        industry: trim(formData.industry) || undefined,
        location: trim(formData.location) || undefined,
        size: trim(formData.size) || undefined,
        website: trim(formData.website) || undefined,
        description: trim(formData.description) || undefined,
        reason: trim(formData.reason) || undefined,
        status: formData.status,
      };
      
      await onSubmit(company.id, payload);
    } finally {
      setLoading(false);
    }
  };

  const labelClass = adminFormLabelClass(darkMode);
  const inputClass = adminFormInputClass(darkMode);
  const textareaClass = adminFormTextareaClass(darkMode);

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      darkMode={darkMode}
      title="Edit Company"
      subtitle={`Update company profile for ${company?.name || 'Unknown'}`}
      icon={<Building2 className="h-7 w-7" />}
      bareBody
    >
      <form onSubmit={handleFormSubmit} className={adminFormModalFormClass()}>
        <div className={adminFormModalSectionClass(darkMode)}>
          <div>
            <label className={labelClass} htmlFor="edit-company-name">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-company-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div className={adminFormModalGridClass()}>
            <div>
              <label className={labelClass} htmlFor="edit-company-industry">
                Industry (Optional)
              </label>
              <input
                id="edit-company-industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-company-location">
                Location (Optional)
              </label>
              <input
                id="edit-company-location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className={adminFormModalGridClass()}>
            <div>
              <label className={labelClass} htmlFor="edit-company-size">
                Company Size (Optional)
              </label>
              <select
                id="edit-company-size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select size</option>
                {COMPANY_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-company-website">
                Website (Optional)
              </label>
              <input
                id="edit-company-website"
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-company-description">
              Description (Optional)
            </label>
            <textarea
              id="edit-company-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={textareaClass}
              rows={3}
            />
          </div>

          <div className={adminFormModalGridClass()}>
            <div>
              <label className={labelClass} htmlFor="edit-company-status">
                Account Status
              </label>
              <select
                id="edit-company-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className={labelClass} htmlFor="edit-company-reason">
              Reason for Edit <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block font-normal mt-1">This reason will be included in the notification sent to the company owner.</span>
            </label>
            <textarea
              id="edit-company-reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              className={textareaClass}
              placeholder="e.g., Updated incorrect company size as per user request"
              rows={2}
            />
          </div>
        </div>

        <div className={adminFormModalFooterClass(darkMode)}>
          <button type="button" onClick={onClose} className={adminFormModalCancelBtnClass(darkMode)}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={adminFormModalSubmitBtnClass()}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AdminFormModal>
  );
};

export default EditCompanyModal;
