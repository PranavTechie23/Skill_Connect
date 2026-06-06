import React, { useState, useEffect } from 'react';
import { UserPlus, User as UserIcon, Building } from 'lucide-react';
import {
  adminFormInputClass,
  adminFormLabelClass,
  adminFormModalCancelBtnClass,
  adminFormModalFooterClass,
  adminFormModalFormClass,
  adminFormModalGridClass,
  adminFormModalSectionClass,
  adminFormModalSubmitBtnClass,
} from '@/components/admin/admin-form-modal-styles';
import { AdminFormModal } from '@/components/admin/AdminFormModal';

interface ModalCreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'Professional' | 'Employer' | 'admin';
  location?: string;
  title?: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ModalCreateUserData) => Promise<void>;
  darkMode: boolean;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSubmit, darkMode }) => {
  const initialFormData: ModalCreateUserData = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    userType: 'Professional',
    location: '',
    title: '',
  };
  const [formData, setFormData] = useState<ModalCreateUserData>(initialFormData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setFormData(initialFormData);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  const labelClass = adminFormLabelClass(darkMode);
  const inputClass = adminFormInputClass(darkMode);

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      darkMode={darkMode}
      title="Create New User"
      subtitle="Add account details and assign the correct user role."
      icon={<UserPlus className="h-7 w-7" />}
      bareBody
    >
      <form onSubmit={handleFormSubmit} className={adminFormModalFormClass()}>
        <div className={adminFormModalSectionClass(darkMode)}>
          <div>
            <label className={labelClass}>User Type</label>
            <div className="flex gap-2" role="radiogroup">
              {(['Professional', 'Employer', 'admin'] as const).map((role) => {
                const active = formData.userType === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, userType: role }))}
                    role="radio"
                    aria-checked={active}
                    className={`flex flex-1 items-center gap-2 rounded-lg border-2 px-3 py-2 transition-colors focus:outline-none focus:ring-2 ${
                      active
                        ? 'border-blue-600 bg-blue-50 ring-blue-300 dark:border-blue-400 dark:bg-blue-900/50'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                  >
                    {role === 'Employer' ? (
                      <Building className="h-5 w-5 text-green-600" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    )}
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={adminFormModalGridClass()}>
            <div>
              <label className={labelClass}>First Name</label>
              <input name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} />
            </div>
          </div>

          <div className={adminFormModalGridClass()}>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className={inputClass}
              />
            </div>
          </div>

          {formData.userType === 'Professional' && (
            <div>
              <label className={labelClass}>Professional Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Software Engineer"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Location</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., San Francisco, CA"
              className={inputClass}
            />
          </div>
        </div>

        <div className={adminFormModalFooterClass(darkMode)}>
          <button type="button" onClick={onClose} className={adminFormModalCancelBtnClass(darkMode)}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={adminFormModalSubmitBtnClass()}>
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </AdminFormModal>
  );
};

export default AddUserModal;

