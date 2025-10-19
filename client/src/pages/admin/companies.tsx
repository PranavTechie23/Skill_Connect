import React, { useState, useEffect } from 'react';
import AdminBackButton from '@/components/AdminBackButton';
import { useTheme } from '@/components/theme-provider';
import { Building2, Search, Plus, Edit, Trash2, MoreVertical, Mail, MapPin, Globe, Users, CheckCircle, XCircle, Clock, Filter, ExternalLink } from 'lucide-react';
import { adminService } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  website: string;
  size: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  logo?: string;
}

export default function AdminCompanies() {
  const { theme } = useTheme();
  const darkMode = typeof window !== 'undefined' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCompanies();
      setCompanies(data);
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

  const handleUpdateStatus = async (companyId: string, status: 'approved' | 'rejected') => {
    try {
      await adminService.updateCompany(companyId, { status });
      toast({ title: "Success", description: `Company status updated to ${status}.` });
      fetchCompanies();
    } catch (error) {
      console.error("Failed to update company status:", error);
      toast({ title: "Error", description: "Could not update company status.", variant: "destructive" });
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    const configs = {
      approved: { color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', icon: CheckCircle },
      pending: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', icon: Clock },
      rejected: { color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="mr-4"><AdminBackButton /></div>
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Employers</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage and verify company accounts</p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-800 transition-all shadow-lg">
              <Plus className="w-5 h-5" />
              Add Company
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Content Card */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
          {/* Search and Filter Bar */}
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
                <input
                  type="text"
                  placeholder="Search companies by name, industry, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Companies Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-xs uppercase ${darkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-700 bg-gray-50'}`}>
                <tr>
                  <th scope="col" className="px-6 py-3">Company</th>
                  <th scope="col" className="px-6 py-3">Industry</th>
                  <th scope="col" className="px-6 py-3">Location</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Joined</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => {
                  const statusConfig = getStatusConfig(company.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={company.id} className={`border-b ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-600/50' : 'bg-white hover:bg-gray-50'}`}>
                      <th scope="row" className={`px-6 py-4 font-medium whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {company.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{company.name}</div>
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className={`text-xs flex items-center gap-1 ${darkMode ? 'text-gray-400 hover:text-purple-400' : 'text-gray-500 hover:text-purple-600'}`}>
                              {company.website} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </th>
                      <td className="px-6 py-4">{company.industry}</td>
                      <td className="px-6 py-4">{company.location}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{new Date(company.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        {company.status === 'pending' && (
                          <>
                            <button onClick={() => handleUpdateStatus(company.id, 'approved')} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-green-500/10 text-green-400' : 'hover:bg-green-50 text-green-600'}`}><CheckCircle className="w-5 h-5" /></button>
                            <button onClick={() => handleUpdateStatus(company.id, 'rejected')} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'}`}><XCircle className="w-5 h-5" /></button>
                          </>
                        )}
                        <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><Edit className="w-5 h-5" /></button>
                        <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'}`}><Trash2 className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredCompanies.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>No companies found</p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}