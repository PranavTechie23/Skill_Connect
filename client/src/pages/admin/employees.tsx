import React, { useState, useEffect, useMemo } from 'react';
import AdminBackButton, { useAdminEmbedded } from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { Users, Search, Plus, Edit, Trash2, Mail, MapPin, Briefcase, Eye, CheckCircle, Building2, X, AlertTriangle, Save, Copy, RefreshCw } from 'lucide-react';
import { adminService, User, CreateUserData, AdminStats } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import { scrollDashboardToTop } from '@/lib/scroll-to-top';
import { Pagination } from '@/components/Pagination';
import { LogoLoader } from '@/components/LogoLoader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  adminFormDialogBodyScrollClass,
  adminFormDialogContentClass,
  adminFormDialogFooterClass,
  adminFormDialogHeaderClass,
  adminFormModalGridClass,
  adminFormModalHeaderGradientClass,
  adminFormModalIconWrapClass,
  adminFormModalSectionClass,
  adminFormModalSubtitleClass,
  adminFormModalTitleClass,
  adminFormDialogFieldClass,
  adminFormLabelClass,
} from '@/components/admin/admin-form-modal-styles';

interface EditEmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  location: string;
  status: string;
}

export default function AdminEmployees() {
  const { theme } = useTheme();
  const { embedded } = useAdminEmbedded();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = useState<User | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<EditEmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    location: '',
    status: 'active'
  });
  const [newEmployee, setNewEmployee] = useState<Omit<CreateUserData, 'userType'>>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [statsData, setStatsData] = useState<Partial<AdminStats>>({
    totalUsers: 0,
    totalApplications: 0,
    newUsersThisWeek: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddEmployee = async () => {
    setFormLoading(true);
    setFormError(null);
    if (!newEmployee.email || !newEmployee.password || !newEmployee.firstName || !newEmployee.lastName) {
      setFormError('All fields are required.');
      setFormLoading(false);
      return;
    }

    try {
      await adminService.createUser({ ...newEmployee, userType: 'Professional' });
      toast({ title: "Success", description: "Employee created successfully." });
      setIsModalOpen(false);
      setNewEmployee({ email: '', password: '', firstName: '', lastName: '' });
      fetchEmployees(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setFormError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const getEmployeeFirstName = (employee: User) => employee.firstName || (employee as any).first_name || '';
  const getEmployeeLastName = (employee: User) => employee.lastName || (employee as any).last_name || '';
  const getEmployeeName = (employee: User) => {
    const firstName = getEmployeeFirstName(employee);
    const lastName = getEmployeeLastName(employee);
    return firstName && lastName ? `${firstName} ${lastName}`.trim() : employee.email || 'Unknown User';
  };

  const getEmployeeInitials = (employee: User) => {
    const firstName = getEmployeeFirstName(employee);
    const lastName = getEmployeeLastName(employee);
    if (firstName && lastName) return `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
    if (firstName) return `${firstName[0].toUpperCase()}${firstName[1]?.toUpperCase() || ''}`;
    if (lastName) return `${lastName[0].toUpperCase()}${lastName[1]?.toUpperCase() || ''}`;
    return (employee.email?.[0] || 'U').toUpperCase();
  };

  const handleOpenEditModal = (employee: User) => {
    setEmployeeToEdit(employee);
    setEditFormData({
      firstName: getEmployeeFirstName(employee),
      lastName: getEmployeeLastName(employee),
      email: employee.email || '',
      title: employee.title || (employee as any).designation || employee.profile?.headline || '',
      location: employee.location || '',
      status: employee.status || 'active'
    });
  };

  const handleSaveEmployee = async () => {
    if (!employeeToEdit) return;
    if (!editFormData.firstName || !editFormData.lastName || !editFormData.email) {
      toast({
        title: 'Missing fields',
        description: 'First name, last name, and email are required.',
        variant: 'destructive'
      });
      return;
    }

    setEditLoading(true);
    try {
      const updatedEmployee = await adminService.updateUser(employeeToEdit.id, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        title: editFormData.title,
        location: editFormData.location,
        status: editFormData.status as any,
        accountStatus: editFormData.status as any
      });
      setEmployees(prev => prev.map(user => (user.id === employeeToEdit.id ? { ...user, ...updatedEmployee } : user)));
      setEmployeeToEdit(null);
      toast({
        title: 'Success',
        description: 'Employee updated successfully.'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update employee.';
      toast({
        title: 'Update failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteUser(employeeToDelete.id);
      setEmployees(prev => prev.filter(user => user.id !== employeeToDelete.id));
      setEmployeeToDelete(null);
      toast({
        title: 'Deleted',
        description: 'Employee removed successfully.'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete employee.';
      toast({
        title: 'Delete failed',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopyEmployeeEmail = async (employee: User) => {
    if (!employee.email) return;
    try {
      await navigator.clipboard.writeText(employee.email);
      toast({
        title: 'Copied',
        description: `${employee.email} copied to clipboard.`
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy email.',
        variant: 'destructive'
      });
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching employees...');
      const allUsers = await adminService.getUsers();
      console.log('✅ Received users:', allUsers);
      console.log('🔍 First user sample:', allUsers[0] ? {
        id: allUsers[0].id,
        email: allUsers[0].email,
        userType: allUsers[0].userType,
        user_type: (allUsers[0] as any).user_type,
        firstName: allUsers[0].firstName,
        lastName: allUsers[0].lastName
      } : 'No users');
      
      // Filter for 'Professional' and 'job_seeker' as they represent the employees/professionals on the platform
      // The database uses both 'Professional' and 'job_seeker' as user types
      // Also check for user_type (snake_case) in case the API returns that format
      const professionals = allUsers.filter(u => {
        const userType = u.userType || (u as any).user_type || '';
        return userType === 'Professional' || userType === 'job_seeker' || userType === 'professional';
      }).map(u => {
        // Map both camelCase and snake_case fields to ensure names are available
        return {
          ...u,
          firstName: u.firstName || (u as any).first_name || '',
          lastName: u.lastName || (u as any).last_name || '',
          createdAt: u.createdAt || (u as any).created_at || new Date().toISOString()
        };
      });
      
      console.log(`✅ Filtered ${professionals.length} professionals (from ${allUsers.length} total users)`);
      if (professionals.length > 0) {
        console.log('🔍 Sample professional:', {
          id: professionals[0].id,
          email: professionals[0].email,
          firstName: professionals[0].firstName,
          lastName: professionals[0].lastName,
          first_name: (professionals[0] as any).first_name,
          last_name: (professionals[0] as any).last_name
        });
      }
      
      if (professionals.length === 0 && allUsers.length > 0) {
        console.warn('⚠️ No professionals found! Showing all users for debugging:');
        console.log('All user types:', allUsers.map(u => ({
          id: u.id,
          email: u.email,
          userType: u.userType,
          user_type: (u as any).user_type
        })));
        // Fallback: If no professionals found but we have users, show all users
        // This helps debug the issue and ensures something is displayed
        console.log('⚠️ Showing all users as fallback since no professionals were found');
        const mappedUsers = allUsers.map(u => ({
          ...u,
          firstName: u.firstName || (u as any).first_name || '',
          lastName: u.lastName || (u as any).last_name || '',
          createdAt: u.createdAt || (u as any).created_at || new Date().toISOString()
        }));
        setEmployees(mappedUsers);
      } else {
        setEmployees(professionals);
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch employees:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error details:", errorMessage);
      if (!error?.message?.includes("401")) {
        toast({ 
          title: "Error", 
          description: `Could not fetch employee data: ${errorMessage}`, 
          variant: "destructive" 
        });
      }
      setEmployees([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminService.getStats();
      setStatsData(data);
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
      if (!error?.message?.includes("401")) {
        toast({ title: "Error", description: "Could not fetch statistics.", variant: "destructive" });
      }
    }
  };

  // Calculate total profile views (sum of all employees' profile views if available)
  const calculateProfileViews = () => {
    // For now, we'll calculate based on employees count * a multiplier
    // In a real app, this would come from analytics/views tracking
    // You can replace this with actual profile views data from your API
    const baseViews = employees.length * 10; // Example: 10 views per employee on average
    return baseViews > 0 ? baseViews.toLocaleString() : '0';
  };

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, []);

  const profileViews = useMemo(() => calculateProfileViews(), [employees.length]);
  
  const stats = [
    { label: 'Total Employees', value: employees.length, change: `↑ ${statsData.newUsersThisWeek || 0} new this week`, icon: Users, color: 'bg-green-500', bgLight: 'bg-green-50' },
    { label: 'Active Users', value: employees.length, change: '100% active rate', icon: CheckCircle, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
    { label: 'Job Applications', value: statsData.totalApplications?.toLocaleString() || '0', change: 'Across all users', icon: Briefcase, color: 'bg-purple-500', bgLight: 'bg-purple-50' },
    { label: 'Profile Views', value: profileViews, change: `${employees.length} employee profiles`, icon: Eye, color: 'bg-orange-500', bgLight: 'bg-orange-50' }
  ];

  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (searchTerm.trim()) {
      filtered = filtered.filter(employee => {
        const firstName = employee.firstName || (employee as any).first_name || '';
        const lastName = employee.lastName || (employee as any).last_name || '';
        const name = `${firstName} ${lastName}`.trim();
        const email = employee.email || '';
        const location = employee.location || '';
        const title = employee.title || (employee as any).designation || '';
        
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               location.toLowerCase().includes(searchTerm.toLowerCase()) ||
               title.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(employee => (employee.status || 'active') === filterStatus);
    }
    
    return filtered;
  }, [employees, searchTerm, filterStatus]);
  
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollDashboardToTop();
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return (
    <>
      {selectedEmployee && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setSelectedEmployee(null)}>
          <div
            className={`w-full max-w-2xl rounded-3xl border-2 p-8 shadow-2xl ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Employee Details</h2>
                <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quick profile overview</p>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className={`rounded-lg p-2 transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-xl font-bold text-white shadow-lg">
                {getEmployeeInitials(selectedEmployee)}
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{getEmployeeName(selectedEmployee)}</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedEmployee.email || 'No email'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Title</p>
                <p className={`mt-1 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedEmployee.title || (selectedEmployee as any).designation || 'N/A'}</p>
              </div>
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                <p className={`mt-1 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedEmployee.location || 'N/A'}</p>
              </div>
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>User Type</p>
                <p className={`mt-1 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedEmployee.userType || (selectedEmployee as any).user_type || 'Professional'}</p>
              </div>
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Joined</p>
                <p className={`mt-1 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {employeeToEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEmployeeToEdit(null)}>
          <div
            className={`w-full max-w-2xl rounded-3xl border-2 p-8 shadow-2xl ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Employee</h2>
              <button
                onClick={() => setEmployeeToEdit(null)}
                className={`rounded-lg p-2 transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editFirstName" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>First Name</Label>
                <Input id="editFirstName" value={editFormData.firstName} onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Last Name</Label>
                <Input id="editLastName" value={editFormData.lastName} onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editEmail" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</Label>
                <Input id="editEmail" type="email" value={editFormData.email} onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTitle" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title</Label>
                <Input id="editTitle" value={editFormData.title} onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLocation" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</Label>
                <Input id="editLocation" value={editFormData.location} onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editStatus" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Account Status</Label>
                <select
                  id="editStatus"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                  className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEmployeeToEdit(null)}
                className={`rounded-xl px-5 py-2.5 font-semibold transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEmployee}
                disabled={editLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {editLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {employeeToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border-2 p-7 shadow-2xl ${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-200'}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`rounded-full p-2 ${darkMode ? 'bg-red-500/20' : 'bg-red-50'}`}>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete Employee?</h3>
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This will permanently remove <span className="font-semibold">{getEmployeeName(employeeToDelete)}</span>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className={`rounded-xl px-5 py-2.5 font-semibold transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                disabled={deleteLoading}
                className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    <div className={`${embedded ? '' : `min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} p-8`}`}>
      <div className={`${embedded ? 'space-y-6' : 'max-w-7xl mx-auto'}`}>
        <div className={`${embedded ? 'mb-6' : 'mb-8'}`}>
          <div className="mb-4"><AdminBackButton /></div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/40">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-4xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'}`}>Employees Management</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage and monitor employee accounts</p>
              </div>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg">
                  <Plus className="w-5 h-5" />
                  Add Employee
                </button>
              </DialogTrigger>
              <DialogContent 
                className={adminFormDialogContentClass(darkMode)}
                onInteractOutside={(e) => e.preventDefault()}
              >
                <DialogHeader className={adminFormDialogHeaderClass(darkMode)}>
                  <div className={adminFormModalHeaderGradientClass(darkMode)} aria-hidden />
                  <div className="relative flex items-start gap-5 pr-10">
                    <div className={adminFormModalIconWrapClass()}>
                      <Users className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <DialogTitle className={adminFormModalTitleClass(darkMode)}>Add New Employee</DialogTitle>
                      <DialogDescription className={adminFormModalSubtitleClass(darkMode)}>
                        Create a clean, complete profile for your employee.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className={adminFormDialogBodyScrollClass()}>
                  <div className={adminFormModalSectionClass(darkMode)}>
                    <div className="mb-4">
                      <p className={`text-sm font-semibold tracking-[0.35em] uppercase ${darkMode ? 'text-indigo-200/75' : 'text-gray-500'}`}>
                        Employee Details
                      </p>
                      <p className={`mt-1 text-base ${darkMode ? 'text-indigo-100/80' : 'text-gray-600'}`}>
                        Keep it concise and accurate.
                      </p>
                    </div>
                    <div className={adminFormModalGridClass()}>
                      {formError && (
                        <p className={`col-span-full text-sm font-medium ${darkMode ? 'text-rose-300' : 'text-red-600'}`}>{formError}</p>
                      )}

                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className={adminFormLabelClass(darkMode)}>
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={newEmployee.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter first name"
                          className={adminFormDialogFieldClass(darkMode)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className={adminFormLabelClass(darkMode)}>
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={newEmployee.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter last name"
                          className={adminFormDialogFieldClass(darkMode)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email" className={adminFormLabelClass(darkMode)}>
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmployee.email}
                          onChange={handleInputChange}
                          placeholder="name@company.com"
                          className={adminFormDialogFieldClass(darkMode)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="password" className={adminFormLabelClass(darkMode)}>
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={newEmployee.password}
                          onChange={handleInputChange}
                          placeholder="Set a strong password"
                          className={adminFormDialogFieldClass(darkMode)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className={adminFormDialogFooterClass(darkMode)}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={`min-w-[120px] rounded-xl px-4 py-2.5 text-base font-semibold transition-colors ${darkMode ? 'text-indigo-100 hover:bg-[#223560]' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleAddEmployee}
                    disabled={formLoading}
                    className={`min-w-[190px] rounded-xl px-5 py-2.5 text-base font-semibold text-white transition-all ${
                      formLoading
                        ? 'cursor-not-allowed bg-violet-400/70'
                        : 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-400 hover:to-indigo-400 hover:shadow-lg hover:shadow-violet-900/40'
                    }`}
                  >
                    {formLoading ? 'Creating...' : 'Create Employee'}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {stats.map((stat, index) => (
              <div key={index} className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-lg border-2 p-6 hover:shadow-xl transition-all`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`${darkMode ? stat.color + '/20' : stat.bgLight} p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${darkMode ? stat.color.replace('bg-', 'text-') + '/80' : stat.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className={`w-2 h-2 rounded-full ${stat.color} animate-pulse`}></div>
                </div>
                <div>
                  <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>{stat.label}</h3>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stat.value}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{stat.change}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className={`${darkMode ? 'border-indigo-500/25 bg-gradient-to-br from-slate-900/95 via-indigo-950/30 to-slate-900/90 shadow-[0_24px_60px_-28px_rgba(99,102,241,0.5)]' : 'bg-white border-gray-100'} rounded-3xl shadow-xl border-2 w-full`}>
          {/* Search and Filter Bar */}
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search employees by name, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`px-5 py-3 border-2 rounded-xl font-semibold text-sm cursor-pointer focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="flagged">Flagged</option>
                </select>
                <button
                  onClick={fetchEmployees}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                    darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Employee Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`border rounded-2xl p-6 transition-all duration-300 flex flex-col h-64 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200/80 bg-gray-50/50'} animate-pulse`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
                    <div className="flex-1">
                      <div className={`h-5 w-3/4 rounded mb-2 ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
                      <div className={`h-3 w-1/2 rounded mb-2 ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
                      <div className={`h-3 w-2/3 rounded ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
                    </div>
                  </div>
                  <div className={`h-16 w-full rounded-xl mb-4 ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
                  <div className={`h-10 w-full rounded-xl mt-auto ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
                </div>
              ))}
            </div>
          ) : paginatedEmployees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {paginatedEmployees.map((employee) => {
              return (
              <div key={employee.id} className={`border rounded-2xl p-6 transition-all duration-300 flex flex-col relative overflow-hidden group ${
                darkMode 
                  ? 'border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 hover:border-green-500/30 hover:shadow-[0_0_30px_rgba(34,197,94,0.08)] shadow-lg'
                  : 'border-gray-200/80 bg-gradient-to-br from-white to-gray-50/50 hover:border-green-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] shadow-sm' 
              }`}>
                {/* Accent line */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                      {((employee.firstName || (employee as any).first_name)?.[0] || '').toUpperCase()}{((employee.lastName || (employee as any).last_name)?.[0] || '').toUpperCase() || (employee.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <h3 className={`font-extrabold text-lg mb-1 leading-tight group-hover:text-green-400 transition-colors duration-250 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {(employee.firstName || (employee as any).first_name || '') && (employee.lastName || (employee as any).last_name || '')
                          ? `${employee.firstName || (employee as any).first_name || ''} ${employee.lastName || (employee as any).last_name || ''}`.trim()
                          : employee.email || 'Unknown User'
                        }
                      </h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs flex items-center gap-1.5 mb-1.5`}>
                        <Mail className="w-3.5 h-3.5 text-blue-500/80 dark:text-blue-400/80" />
                        <span className="truncate max-w-[150px]">{employee.email || 'No email'}</span>
                      </p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs flex items-center gap-1.5`}>
                        <MapPin className="w-3.5 h-3.5 text-green-600/80 dark:text-green-400/80" />
                        <span>{employee.location || 'No location'}</span>
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const status = employee.status || 'active';
                    let statusClasses = '';
                    let statusLabel = '';
                    if (status === 'active') {
                      statusClasses = darkMode ? 'bg-green-500/15 text-green-400' : 'bg-green-50 text-green-700 border border-green-200/50';
                      statusLabel = 'Active';
                    } else if (status === 'pending') {
                      statusClasses = darkMode ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700 border border-amber-200/50';
                      statusLabel = 'Pending';
                    } else if (status === 'suspended') {
                      statusClasses = darkMode ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-700 border border-red-200/50';
                      statusLabel = 'Suspended';
                    } else {
                      statusClasses = darkMode ? 'bg-gray-500/15 text-gray-400' : 'bg-gray-50 text-gray-700 border border-gray-200/50';
                      statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
                    }
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClasses}`}>
                        {statusLabel}
                      </span>
                    );
                  })()}
                </div>

                {/* Designation & Joined */}
                <div className={`flex items-center gap-3 mb-4 rounded-xl px-3.5 py-3 border transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-slate-900/60 border-slate-800/80' 
                    : 'bg-gray-50/80 border-gray-200/60'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[9px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'} font-bold mb-0.5`}>Designation</p>
                    <p className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {employee.title || (employee as any).designation || employee.profile?.headline || 'Not specified'}
                    </p>
                  </div>
                  <div className={`w-px h-8 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                  <div className="shrink-0">
                    <p className={`text-[9px] uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'} font-bold mb-0.5`}>Joined</p>
                    <p className={`font-bold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {employee.createdAt 
                        ? (() => {
                            try {
                              const date = new Date(employee.createdAt);
                              return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                            } catch {
                              return 'N/A';
                            }
                          })()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={`mt-auto flex items-center gap-1.5 rounded-xl border p-1.5 transition-colors duration-300 ${
                  darkMode ? 'border-slate-800/80 bg-slate-900/30' : 'border-gray-200/60 bg-gray-50/30'
                }`}>
                  <button
                    onClick={() => setSelectedEmployee(employee)}
                    title="View profile"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 border rounded-lg transition-all duration-200 text-xs font-bold ${
                    darkMode
                      ? 'border-slate-700 hover:bg-green-600 hover:border-transparent text-gray-200 hover:text-white shadow-sm'
                      : 'border-gray-300 hover:bg-green-600 hover:border-transparent text-gray-700 hover:text-white shadow-sm'
                  }`}>
                    <Eye className="w-3.5 h-3.5" />
                    View Profile
                  </button>
                  <button className={`p-1.5 rounded-lg transition-all duration-200 ${
                    darkMode
                      ? 'hover:bg-blue-500/15 text-blue-400'
                      : 'hover:bg-blue-50 text-blue-600'
                  }`}
                  onClick={() => handleOpenEditModal(employee)}
                  title="Edit employee"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className={`p-1.5 rounded-lg transition-all duration-200 ${
                    darkMode
                      ? 'hover:bg-red-500/15 text-red-400'
                      : 'hover:bg-red-50 text-red-600'
                  }`}
                  onClick={() => setEmployeeToDelete(employee)}
                  title="Delete employee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className={`p-1.5 rounded-lg transition-all duration-200 ${
                    darkMode
                      ? 'hover:bg-emerald-500/15 text-emerald-400'
                      : 'hover:bg-emerald-50 text-emerald-600'
                  }`}
                  onClick={() => handleCopyEmployeeEmail(employee)}
                  title="Copy email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              );
            })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {employees.length === 0 ? 'No employees found' : `No employees match your filters`}
              </p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {employees.length === 0 
                  ? 'Try adding an employee or check your database' 
                  : `Found ${employees.length} total employees. Try adjusting your search or filters.`}
              </p>
            </div>
          )}
          {/* Pagination Controls */}
          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEmployees.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            itemName="employees"
          />
        </div>
      </div>
    </div>
    </>
  );
}
