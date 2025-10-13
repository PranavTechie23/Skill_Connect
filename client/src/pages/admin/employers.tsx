import React, { useState } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { Building2, Search, Plus, Edit, Trash2, MoreVertical, Mail, Calendar, MapPin, Users, TrendingUp, Eye, Award, Briefcase, Globe } from 'lucide-react';

export default function Employers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('All Industries');

  const stats = [
    { label: 'Total Companies', value: '354', change: '↑ 8 new this week', icon: Building2, color: 'bg-purple-500', bgLight: 'bg-purple-50' },
    { label: 'Active Employers', value: '287', change: '81% active rate', icon: Users, color: 'bg-blue-500', bgLight: 'bg-blue-50' },
    { label: 'Job Postings', value: '428', change: '↑ 15 this month', icon: Briefcase, color: 'bg-orange-500', bgLight: 'bg-orange-50' },
    { label: 'Total Employees', value: '2,341', change: '↑ 89 hired', icon: TrendingUp, color: 'bg-green-500', bgLight: 'bg-green-50' }
  ];

  const companies = [
    {
      id: 1,
      name: 'TechCorp Inc.',
      logo: 'TC',
      email: 'hr@techcorp.com',
      location: 'San Francisco, CA',
      industry: 'Technology',
      size: '50-200 employees',
      jobPostings: 12,
      employees: 156,
      founded: '2018',
      website: 'techcorp.com',
      status: 'Active',
      verified: true,
      color: 'bg-purple-500'
    },
    {
      id: 2,
      name: 'HealthPlus Medical',
      logo: 'HP',
      email: 'admin@healthplus.com',
      location: 'New York, NY',
      industry: 'Healthcare',
      size: '200-500 employees',
      jobPostings: 8,
      employees: 342,
      founded: '2015',
      website: 'healthplus.com',
      status: 'Active',
      verified: true,
      color: 'bg-blue-500'
    },
    {
      id: 3,
      name: 'FinanceHub Solutions',
      logo: 'FH',
      email: 'contact@financehub.com',
      location: 'Austin, TX',
      industry: 'Finance',
      size: '10-50 employees',
      jobPostings: 5,
      employees: 28,
      founded: '2020',
      website: 'financehub.com',
      status: 'Active',
      verified: false,
      color: 'bg-indigo-500'
    },
    {
      id: 4,
      name: 'StartupXYZ',
      logo: 'SX',
      email: 'contact@startupxyz.com',
      location: 'Seattle, WA',
      industry: 'Technology',
      size: '10-50 employees',
      jobPostings: 3,
      employees: 18,
      founded: '2022',
      website: 'startupxyz.com',
      status: 'Pending',
      verified: false,
      color: 'bg-pink-500'
    },
    {
      id: 5,
      name: 'EduLearn Platform',
      logo: 'EL',
      email: 'info@edulearn.com',
      location: 'Boston, MA',
      industry: 'Education',
      size: '50-200 employees',
      jobPostings: 7,
      employees: 92,
      founded: '2019',
      website: 'edulearn.com',
      status: 'Active',
      verified: true,
      color: 'bg-teal-500'
    },
    {
      id: 6,
      name: 'RetailMax Corp',
      logo: 'RM',
      email: 'hr@retailmax.com',
      location: 'Chicago, IL',
      industry: 'Retail',
      size: '500+ employees',
      jobPostings: 15,
      employees: 687,
      founded: '2012',
      website: 'retailmax.com',
      status: 'Active',
      verified: true,
      color: 'bg-orange-500'
    },
    {
      id: 7,
      name: 'GreenEnergy Co',
      logo: 'GE',
      email: 'contact@greenenergy.com',
      location: 'Portland, OR',
      industry: 'Energy',
      size: '50-200 employees',
      jobPostings: 4,
      employees: 134,
      founded: '2017',
      website: 'greenenergy.com',
      status: 'Active',
      verified: true,
      color: 'bg-green-500'
    },
    {
      id: 8,
      name: 'MediaWorks Studio',
      logo: 'MW',
      email: 'hello@mediaworks.com',
      location: 'Los Angeles, CA',
      industry: 'Media',
      size: '10-50 employees',
      jobPostings: 2,
      employees: 23,
      founded: '2021',
      website: 'mediaworks.com',
      status: 'Inactive',
      verified: false,
      color: 'bg-gray-500'
    }
  ];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterIndustry === 'All Industries' || company.industry === filterIndustry;
    return matchesSearch && matchesFilter;
  });

  const { theme } = useTheme();

  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

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
                    darkMode ? (
                      company.status === 'Active' ? 'bg-green-900/30 text-green-400' :
                      company.status === 'Pending' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-gray-800 text-gray-400'
                    ) : (
                      company.status === 'Active' ? 'bg-green-100 text-green-700' :
                      company.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
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