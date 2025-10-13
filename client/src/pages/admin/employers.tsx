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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="mr-4"><AdminBackButton /></div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Employers Management</h1>
                <p className="text-gray-500 mt-1">Manage and monitor registered employers</p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
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
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgLight} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className={`w-2 h-2 rounded-full ${stat.color} animate-pulse`}></div>
              </div>
              <div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Search and Filter Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search companies by name, location, or industry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white cursor-pointer"
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
              <div key={company.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-purple-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`${company.color} w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {company.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg">{company.name}</h3>
                        {company.verified && (
                          <Award className="w-5 h-5 text-blue-500" aria-label="Verified Company" />
                        )}
                      </div>
                      <p className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                        <Mail className="w-4 h-4" />
                        {company.email}
                      </p>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {company.location}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    company.status === 'Active' ? 'bg-green-100 text-green-700' :
                    company.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {company.status}
                  </span>
                </div>

                {/* Company Info */}
                <div className="mb-4">
                  <div className="flex gap-2 mb-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {company.industry}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {company.size}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {company.website}
                  </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Job Posts</p>
                    <p className="font-bold text-purple-600">{company.jobPostings}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Employees</p>
                    <p className="font-bold text-gray-900">{company.employees}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Founded</p>
                    <p className="font-semibold text-gray-900 text-sm">{company.founded}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No companies found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}