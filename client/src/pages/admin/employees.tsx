import React, { useState, useEffect } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { Users, Search, Plus, Edit, Trash2, MoreVertical, Mail, Calendar, MapPin, Briefcase, Award, TrendingUp, Clock, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import { adminService, User } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';

export default function AdminEmployees() {
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const allUsers = await adminService.getUsers();
      // Assuming 'Professional' userType are employees
      setEmployees(allUsers.filter(u => u.userType === 'Professional'));
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast({ title: "Error", description: "Could not fetch employee data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const stats = [
    { label: 'Total Employees', value: employees.length, change: '↑ 12 new this week', icon: Users, color: 'bg-green-500', bgLight: 'bg-green-50' },
    { label: 'Active Users', value: employees.length, change: '100% active rate', icon: CheckCircle, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
    { label: 'Job Applications', value: '1,234', change: '↑ 45 this month', icon: Briefcase, color: 'bg-purple-500', bgLight: 'bg-purple-50' },
    { label: 'Profile Views', value: '8,421', change: '↑ 324 today', icon: Eye, color: 'bg-orange-500', bgLight: 'bg-orange-50' }
  ];

  const filteredEmployees = employees.filter(employee => {
    const name = `${employee.firstName} ${employee.lastName}`;
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
            <button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-200/20">
              <Plus className="w-5 h-5" />
              Add Employee
            </button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className={`border rounded-xl p-6 transition-all ${
                darkMode 
                  ? 'border-gray-700 hover:border-green-500/50 bg-gray-800/50'
                  : 'border-gray-200 hover:border-green-300 bg-white' 
              } hover:shadow-lg`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{employee.firstName} {employee.lastName}</h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm flex items-center gap-1 mb-2`}>
                        <Mail className="w-4 h-4" />
                        {employee.email}
                      </p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm flex items-center gap-1`}>
                        <MapPin className="w-4 h-4" />
                        {employee.location}
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
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{employee.applications || 0}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Joined</p>
                    <p className={`font-semibold text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>{new Date(employee.createdAt).toLocaleDateString()}</p>
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
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="p-12 text-center">
              <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>No employees found</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}