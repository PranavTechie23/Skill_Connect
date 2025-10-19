import React, { useState, useEffect } from 'react';
import { XCircle, User as UserIcon, Building } from 'lucide-react';

// Use a local type for the form that matches the UI logic
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
    // Reset form when modal is closed
    if (!isOpen) {
      // Use a timeout to avoid seeing the form clear before the closing animation
      const timer = setTimeout(() => {
        setFormData(initialFormData);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    // The parent component will close the modal on success,
    // but we stop loading here in case of an error.
    // The useEffect will handle cleanup.
    setLoading(false); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className={`rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create New User</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>User Type</label>
              <div className="flex gap-2" role="radiogroup">
                {(['Professional', 'Employer', 'admin'] as const).map(role => {
                  const active = formData.userType === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, userType: role }))}
                      role="radio"
                      aria-checked={active}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 transition-colors ${
                        active
                          ? `border-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:border-blue-400 ring-blue-300`
                          : `border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700`
                      }`}
                    > 
                      {role === 'Employer' 
                        ? <Building className="h-5 w-5 text-green-600" /> 
                        : <UserIcon className="h-5 w-5 text-blue-600" />
                      }
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>First Name</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Last Name</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
            </div>

            {/* Conditional Fields */}
            {formData.userType === 'Professional' && (
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Professional Title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Software Engineer"
                  className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
            )}

            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., San Francisco, CA"
                className={`w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all font-medium ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;