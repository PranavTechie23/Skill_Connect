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
import type { CreateCompanyData } from '@/lib/admin-service';

export interface AddCompanyFormData {
  name: string;
  industry: string;
  location: string;
  size: string;
  website: string;
  description: string;
}

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCompanyData) => Promise<void>;
  darkMode: boolean;
}

const COMPANY_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
];

const emptyForm: AddCompanyFormData = {
  name: '',
  industry: '',
  location: '',
  size: '',
  website: '',
  description: '',
};

function toCreatePayload(form: AddCompanyFormData): CreateCompanyData {
  const trim = (v: string) => v.trim();
  return {
    name: trim(form.name),
    industry: trim(form.industry) || undefined,
    location: trim(form.location) || undefined,
    size: trim(form.size) || undefined,
    website: trim(form.website) || undefined,
    description: trim(form.description) || undefined,
  };
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ isOpen, onClose, onSubmit, darkMode }) => {
  const [formData, setFormData] = useState<AddCompanyFormData>(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setFormData(emptyForm);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(toCreatePayload(formData));
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
      title="Add Company"
      subtitle="Register a new company profile for the platform directory."
      icon={<Building2 className="h-7 w-7" />}
      bareBody
    >
      <form onSubmit={handleFormSubmit} className={adminFormModalFormClass()}>
        <div className={adminFormModalSectionClass(darkMode)}>
          <div>
            <label className={labelClass} htmlFor="company-name">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="company-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="e.g., Acme Technologies"
            />
          </div>

          <div className={adminFormModalGridClass()}>
            <div>
              <label className={labelClass} htmlFor="company-industry">
                Industry (Optional)
              </label>
              <input
                id="company-industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g., Technology"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="company-location">
                Location (Optional)
              </label>
              <input
                id="company-location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g., San Francisco, CA"
              />
            </div>
          </div>

          <div className={adminFormModalGridClass()}>
            <div>
              <label className={labelClass} htmlFor="company-size">
                Company Size (Optional)
              </label>
              <select
                id="company-size"
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
              <label className={labelClass} htmlFor="company-website">
                Website (Optional)
              </label>
              <input
                id="company-website"
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className={inputClass}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="company-description">
              Description (Optional)
            </label>
            <textarea
              id="company-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={textareaClass}
              placeholder="Brief overview of the company"
              rows={4}
            />
          </div>
        </div>

        <div className={adminFormModalFooterClass(darkMode)}>
          <button type="button" onClick={onClose} className={adminFormModalCancelBtnClass(darkMode)}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={adminFormModalSubmitBtnClass()}>
            {loading ? 'Creating...' : 'Create Company'}
          </button>
        </div>
      </form>
    </AdminFormModal>
  );
};

export default AddCompanyModal;
