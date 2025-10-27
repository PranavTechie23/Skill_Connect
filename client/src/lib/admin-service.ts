import { apiFetch } from './api';

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
  profile?: {
    id: number;
    userId: number;
    headline: string | null;
    bio: string | null;
    skills: string[];
  };
  company?: {
    id: number;
    name: string;
    description: string | null;
    website: string | null;
    location: string | null;
    size: string | null;
    industry: string | null;
    logo: string | null;
    ownerId: number;
    createdAt: string;
  };
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

export interface AdminAnalyticsData {
  userGrowth: any[];
  jobCategories: any[];
  recentActivities: any[];
  performanceMetrics: any;
  stats: any;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'job_seeker' | 'employer' | 'admin';
  location?: string;
  title?: string;
  bio?: string;
  skills?: string[];
  profilePhoto?: string;
  telephoneNumber?: string;
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'userType'>> {}

/**
 * A helper function to safely parse JSON from a fetch response.
 * It checks for a successful response and correct content type.
 */
const safeJsonResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorText = await response.text();
      console.error(`API request failed with status ${response.status}:`, errorText);
      // Throw an error with more context, including the non-JSON response body
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    } catch (error) {
      console.error('Error processing failed response:', error);
      throw new Error(`API request failed with status ${response.status}`);
    }
  }

  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return await response.json();
    }
    const text = await response.text();
    console.error("Received non-JSON response from server:", text);
    throw new Error("Received non-JSON response from server.");
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    throw new Error("Failed to parse server response");
  }
};

export const adminService = {
  // User Management
  getUsers: async (): Promise<User[]> => {
    const response = await apiFetch('/api/admin/users', { method: 'GET' });
    return safeJsonResponse(response);
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiFetch(`/api/admin/users/${id}`, { method: 'GET' });
    return safeJsonResponse(response);
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await apiFetch('/api/admin/users', { 
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data) 
    });
    return safeJsonResponse(response);
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await apiFetch(`/api/admin/users/${id}`, { 
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data) 
    });
    return safeJsonResponse(response);
  },

  deleteUser: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  // Admin Stats
  getStats: async (): Promise<AdminStats> => {
    const response = await apiFetch('/api/admin/stats', { method: 'GET' });
    return safeJsonResponse(response);
  },

  // Application Management
  getApplications: async () => {
    const response = await apiFetch('/api/admin/applications', { method: 'GET' });
    return safeJsonResponse(response);
  },

  updateApplication: async (id: string, status: string) => {
    const response = await apiFetch(`/api/admin/applications/${id}`, { 
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }) 
    });
    return safeJsonResponse(response);
  },

  // Job Management
  getJobs: async () => {
    const response = await apiFetch('/api/admin/jobs', { method: 'GET' });
    return safeJsonResponse(response);
  },

  updateJob: async (id: string, data: any) => {
    const response = await apiFetch(`/api/admin/jobs/${id}`, { 
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data) 
    });
    return safeJsonResponse(response);
  },

  deleteJob: async (id: string) => {
    const response = await apiFetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete job');
  },

  // Company Management
  getCompanies: async () => {
    const response = await apiFetch('/api/admin/companies', { method: 'GET' });
    return safeJsonResponse(response);
  },

  updateCompany: async (id: string, data: any) => {
    const response = await apiFetch(`/api/admin/companies/${id}`, { 
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data) 
    });
    return safeJsonResponse(response);
  },

  deleteCompany: async (id: string) => {
    const response = await apiFetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete company');
  },

  // Approval Management
  getApprovals: async () => {
    const response = await apiFetch('/api/admin/approvals', { method: 'GET' });
    return safeJsonResponse(response);
  },

  updateApproval: async (id: string, status: string) => {
    const response = await apiFetch(`/api/admin/approvals/${id}`, { 
      method: 'PUT', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }) 
    });
    return safeJsonResponse(response);
  },

  // Analytics
  getAnalytics: async (timeRange: string): Promise<AdminAnalyticsData> => {
    const response = await apiFetch(`/api/admin/analytics?timeRange=${timeRange}`, { method: 'GET' });
    return safeJsonResponse(response);
  }
};