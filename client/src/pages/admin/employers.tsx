import React, { useState, useEffect } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { Building2, Search, Plus, Edit, Trash2, MoreVertical, Mail, Calendar, MapPin, Users, TrendingUp, Eye, Award, Briefcase, Globe } from 'lucide-react';
import { adminService } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  email: string; // Assuming owner's email
  location: string;
  industry: string;
  size: string;
  jobPostings: number;
  employees: number; // This might need to be calculated or joined
  founded: string; // createdAt
  website: string;
  status: 'approved' | 'pending' | 'rejected';
  verified: boolean; // Can be derived from status
  logo?: string;
}

export default function Employers() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('All Industries');
  const { toast } = useToast();
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCompanies();
      const formattedData = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.owner?.email || 'N/A',
        location: c.location || 'N/A',
        industry: c.industry || 'N/A',
        size: c.size || 'N/A',
        jobPostings: c.jobs?.length || 0,
        employees: 0, // Placeholder
        founded: new Date(c.createdAt).getFullYear().toString(),
        website: c.website || 'N/A',
        status: c.status,
        verified: c.status === 'approved',
        logo: c.name.substring(0, 2).toUpperCase(),
        color: 'bg-purple-500' // Example color
      }));
      setCompanies(formattedData);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      toast({ title: "Error", description: "Could not fetch company data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterIndustry === 'All Industries' || company.industry === filterIndustry;
    return matchesSearch && matchesFilter;
  });

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'approved').length;
  const totalJobPostings = companies.reduce((sum, c) => sum + c.jobPostings, 0);

  const stats = [
    { label: 'Total Companies', value: totalCompanies.toLocaleString(), change: 'All registered companies', icon: Building2, color: 'bg-purple-500', bgLight: 'bg-purple-50' },
    { label: 'Active Employers', value: activeCompanies.toLocaleString(), change: `${totalCompanies > 0 ? Math.round((activeCompanies / totalCompanies) * 100) : 0}% active`, icon: Users, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
    { label: 'Job Postings', value: totalJobPostings.toLocaleString(), change: 'From all companies', icon: Briefcase, color: 'bg-orange-500', bgLight: 'bg-orange-50' },
    { label: 'Total Employees', value: 'N/A', change: 'Across all companies', icon: TrendingUp, color: 'bg-green-500', bgLight: 'bg-green-50' }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="mr-4"><AdminBackButton /></div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Employers Management</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage and monitor registered employers</p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-900/20">
              <Plus className="w-5 h-5" />
              Add Company
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`${darkMode ? stat.color + '/20' : stat.bgLight} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className={`w-2 h-2 rounded-full ${stat.color} animate-pulse`}></div>
              </div>
              <div>
                <h3 className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm font-medium mb-1`}>{stat.label}</h3>
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stat.value}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.change}</p>
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
                  placeholder="Search companies by name, location, or industry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className={`px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none cursor-pointer ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option>All Industries</option>
                <option>Technology</option>
                <option>Healthcare</option>
                <option>Finance</option>
                <option>Education</option>
                <option>Retail</option>
                <option>Energy</option>
                <option>Media</option>
              </select>
            </div>
          </div>

          {/* Company Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {filteredCompanies.map((company) => (
              <div key={company.id} className={`border rounded-xl p-6 transition-all ${
                darkMode 
                  ? 'border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10' 
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-lg' 
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`${company.color} w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {company.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</h3>
                        {company.verified && (
                          <Award className="w-5 h-5 text-blue-500" aria-label="Verified Company" />
                        )}
                      </div>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm flex items-center gap-1 mb-1`}>
                        <Mail className="w-4 h-4" />
                        {company.email}
                      </p>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm flex items-center gap-1`}>
                        <MapPin className="w-4 h-4" />
                        {company.location}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    darkMode ? ( // Assuming status is 'approved', 'pending', etc.
                      company.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                      company.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-gray-800 text-gray-400'
                    ) : (
                      company.status === 'approved' ? 'bg-green-100 text-green-700' :
                      company.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    )
                  }`}>
                    {company.status}
                  </span>
                </div>

                {/* Company Info */}
                <div className="mb-4">
                  <div className="flex gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {company.industry}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {company.size}
                    </span>
                  </div>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm flex items-center gap-1`}>
                    <Globe className="w-4 h-4" />
                    {company.website}
                  </p>
                </div>

                {/* Stats Row */}
                <div className={`grid grid-cols-3 gap-4 mb-4 rounded-lg p-3 ${
                  darkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Job Posts</p>
                    <p className="font-bold text-purple-500">{company.jobPostings}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Employees</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.employees}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Founded</p>
                    <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.founded}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg transition-all text-sm font-medium ${
                    darkMode
                      ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}>
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}>
                    <Edit className="w-5 h-5" />
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
                  }`}>
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}>
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className={`w-16 h-16 ${darkMode ? 'text-gray-700' : 'text-gray-300'} mx-auto mb-4`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No companies found</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}