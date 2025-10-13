import { apiRequest } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  location?: string;
  title?: string;
  bio?: string;
  skills: string[];
  profilePhoto?: string;
  telephoneNumber?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeJobs: number;
  totalCompanies: number;
  totalApplications: number;
  newUsersThisWeek: number;
  newJobsThisWeek: number;
  newCompaniesThisWeek: number;
  newApplicationsThisWeek: number;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'Professional' | 'Employer' | 'admin';
  location?: string;
  title?: string;
  bio?: string;
  skills?: string[];
  profilePhoto?: string;
  telephoneNumber?: string;
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'userType'>> {}

export const adminService = {
  // User Management
  getUsers: async (): Promise<User[]> => {
    const response = await apiRequest('GET', '/api/admin/users');
    return response.json();
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiRequest('GET', `/api/admin/users/${id}`);
    return response.json();
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await apiRequest('POST', '/api/admin/users', data);
    return response.json();
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await apiRequest('PUT', `/api/admin/users/${id}`, data);
    return response.json();
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiRequest('DELETE', `/api/admin/users/${id}`);
  },

  // Admin Stats
  getStats: async (): Promise<AdminStats> => {
    const response = await apiRequest('GET', '/api/admin/stats');
    return response.json();
  },

  // Application Management
  getApplications: async () => {
    const response = await apiRequest('GET', '/api/admin/applications');
    return response.json();
  },

  updateApplication: async (id: string, status: string) => {
    const response = await apiRequest('PUT', `/api/admin/applications/${id}`, { status });
    return response.json();
  },

  // Job Management
  getJobs: async () => {
    const response = await apiRequest('GET', '/api/admin/jobs');
    return response.json();
  },

  updateJob: async (id: string, data: any) => {
    const response = await apiRequest('PUT', `/api/admin/jobs/${id}`, data);
    return response.json();
  },

  deleteJob: async (id: string) => {
    await apiRequest('DELETE', `/api/admin/jobs/${id}`);
  },

  // Company Management
  getCompanies: async () => {
    const response = await apiRequest('GET', '/api/admin/companies');
    return response.json();
  },

  updateCompany: async (id: string, data: any) => {
    const response = await apiRequest('PUT', `/api/admin/companies/${id}`, data);
    return response.json();
  },

  deleteCompany: async (id: string) => {
    await apiRequest('DELETE', `/api/admin/companies/${id}`);
  },

  // Approval Management
  getApprovals: async () => {
    const response = await apiRequest('GET', '/api/admin/approvals');
    return response.json();
  },

  updateApproval: async (id: string, status: string) => {
    const response = await apiRequest('PUT', `/api/admin/approvals/${id}`, { status });
    return response.json();
  }
};