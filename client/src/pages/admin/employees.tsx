import React, { useState, useEffect, useMemo } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { Users, Search, Plus, Edit, Trash2, MoreVertical, Mail, Calendar, MapPin, Briefcase, Award, TrendingUp, Clock, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import { adminService, User, CreateUserData, AdminStats } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
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

export default function AdminEmployees() {
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    } catch (error) {
      console.error("❌ Failed to fetch employees:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error details:", errorMessage);
      toast({ 
        title: "Error", 
        description: `Could not fetch employee data: ${errorMessage}`, 
        variant: "destructive" 
      });
      setEmployees([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminService.getStats();
      setStatsData(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast({ title: "Error", description: "Could not fetch statistics.", variant: "destructive" });
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
    if (!searchTerm.trim()) {
      console.log('✅ No search term, showing all', employees.length, 'employees');
      return employees;
    }
    
    const filtered = employees.filter(employee => {
      const firstName = employee.firstName || (employee as any).first_name || '';
      const lastName = employee.lastName || (employee as any).last_name || '';
      const name = `${firstName} ${lastName}`.trim();
      const email = employee.email || '';
      const location = employee.location || '';
      const title = employee.title || (employee as any).designation || '';
      
      const matches = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             email.toLowerCase().includes(searchTerm.toLowerCase()) ||
             location.toLowerCase().includes(searchTerm.toLowerCase()) ||
             title.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matches;
    });
    
    console.log('🔍 Search filter:', {
      searchTerm,
      totalEmployees: employees.length,
      filteredCount: filtered.length
    });
    
    return filtered;
  }, [employees, searchTerm]);
  
  // Debug logging
  useEffect(() => {
    console.log('📊 Employees state update:', {
      totalEmployees: employees.length,
      filteredCount: filteredEmployees.length,
      searchTerm: searchTerm,
      loading: loading
    });
    if (employees.length > 0) {
      console.log('👥 First employee sample:', {
        id: employees[0].id,
        firstName: employees[0].firstName,
        lastName: employees[0].lastName,
        email: employees[0].email,
        userType: employees[0].userType
      });
    }
  }, [employees, filteredEmployees, searchTerm, loading]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="mr-4"><AdminBackButton /></div>
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Employees</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage and monitor employee accounts</p>
              </div>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-200/20">
                  <Plus className="w-5 h-5" />
                  Add Employee
                </button>
              </DialogTrigger>
              <DialogContent 
                className={`sm:max-w-[425px] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
                onInteractOutside={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Create a new employee account. They will be able to log in with these credentials.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {formError && <p className="text-red-500 text-sm">{formError}</p>}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="firstName" className="text-right">
                      First Name
                    </Label>
                    <Input id="firstName" value={newEmployee.firstName} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lastName" className="text-right">
                      Last Name
                    </Label>
                    <Input id="lastName" value={newEmployee.lastName} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input id="email" type="email" value={newEmployee.email} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input id="password" type="password" value={newEmployee.password} onChange={handleInputChange} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <button type="submit" onClick={handleAddEmployee} disabled={formLoading} className={`px-4 py-2 rounded-md text-white transition-colors ${
                    formLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}>
                    {formLoading ? 'Creating...' : 'Create Employee'}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow`}>
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

        {/* Main Content Card */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
          {/* Search and Filter Bar */}
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search employees by name, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Employee Cards Grid */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Loading employees...</p>
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {filteredEmployees.map((employee) => {
              console.log('🎨 Rendering employee:', employee.id, employee.email);
              return (
              <div key={employee.id} className={`border rounded-xl p-6 transition-all ${
                darkMode 
                  ? 'border-gray-700 hover:border-green-500/50 bg-gray-800/50'
                  : 'border-gray-200 hover:border-green-300 bg-white' 
              } hover:shadow-lg`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {((employee.firstName || (employee as any).first_name)?.[0] || '').toUpperCase()}{((employee.lastName || (employee as any).last_name)?.[0] || '').toUpperCase() || (employee.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <h3 className={`font-bold text-2xl mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {(employee.firstName || (employee as any).first_name || '') && (employee.lastName || (employee as any).last_name || '')
                          ? `${employee.firstName || (employee as any).first_name || ''} ${employee.lastName || (employee as any).last_name || ''}`.trim()
                          : employee.email || 'Unknown User'
                        }
                      </h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm flex items-center gap-1 mb-2`}>
                        <Mail className="w-4 h-4" />
                        {employee.email || 'No email'}
                      </p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm flex items-center gap-1`}>
                        <MapPin className="w-4 h-4" />
                        {employee.location || 'No location'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>
                    Active
                  </span>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2 font-medium`}>Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {employee.skills?.map((skill, idx) => (
                      <span key={idx} className={`px-3 py-1 rounded-full text-xs font-medium ${
                        darkMode 
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats Row */}
                <div className={`grid grid-cols-3 gap-4 mb-4 rounded-lg p-3 ${
                  darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Applications</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>N/A</p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Joined</p>
                    <p className={`font-semibold text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {employee.createdAt 
                        ? (() => {
                            try {
                              const date = new Date(employee.createdAt);
                              return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                            } catch {
                              return 'N/A';
                            }
                          })()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Last Active</p>
                    <p className={`font-semibold text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>{'N/A'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg transition-colors text-sm font-medium ${
                    darkMode
                      ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}>
                    <Eye className="w-4 h-4" />
                    View Profile
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}>
                    <Edit className="w-5 h-5" />
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'hover:bg-red-500/10 text-red-400'
                      : 'hover:bg-red-50 text-red-600'
                  }`}>
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}>
                    <MoreVertical className="w-5 h-5" />
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
                {employees.length === 0 ? 'No employees found' : `No employees match "${searchTerm}"`}
              </p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {employees.length === 0 
                  ? 'Try adding an employee or check your database' 
                  : `Found ${employees.length} total employees. Try adjusting your search.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}