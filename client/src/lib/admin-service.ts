import { apiFetch } from './api';

export type UserAccountStatus = 'active' | 'pending' | 'suspended' | 'flagged';

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
  accountStatus?: UserAccountStatus;
  status?: UserAccountStatus;
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

export interface AdminAnalyticsUserGrowth {
  month: string;
  users: number;
  employees: number;
  employers: number;
}

export interface AdminAnalyticsCategory {
  name: string;
  value: number;
}

export interface AdminAnalyticsActivity {
  type: string;
  action: string;
  user: string;
  createdAt: string | null;
}

export interface AdminAnalyticsStats {
  totalUsers: number;
  activeJobs: number;
  totalCompanies: number;
  applications: number;
  newUsers: number;
  newJobs: number;
  newApplications: number;
  newCompanies: number;
  successRate: number;
  successRateChange: number;
  periodApplications?: number;
  periodUsers?: number;
}

export interface AdminAnalyticsPerformance {
  employeeSatisfaction: number;
  employerSatisfaction: number;
  placementRate: number;
  avgTimeToHire: number;
  timeToHireChange: number;
  interviewRate?: number;
  responseRate?: number;
  hiredCount?: number;
  pipeline?: Record<string, number>;
}

export interface AdminAnalyticsData {
  range?: string;
  rangeLabel?: string;
  generatedAt?: string;
  userGrowth: AdminAnalyticsUserGrowth[];
  jobCategories: AdminAnalyticsCategory[];
  recentActivities: AdminAnalyticsActivity[];
  performanceMetrics: AdminAnalyticsPerformance;
  stats: AdminAnalyticsStats;
}

export interface AdminAiEventAnalytics {
  range: string;
  rangeLabel: string;
  generatedAt: string;
  overview: {
    totalEvents: number;
    successfulEvents: number;
    errorEvents: number;
    successRate: number;
    avgLatencyMs: number;
  };
  byFeature: Array<{
    feature: string;
    total: number;
    success: number;
    error: number;
  }>;
  byProvider: Array<{
    provider: string;
    total: number;
  }>;
  recentErrors: Array<{
    id: number;
    feature: string;
    provider: string | null;
    model: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: string | null;
  }>;
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

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  accountStatus?: UserAccountStatus;
  status?: UserAccountStatus;
}

export interface CreateCompanyData {
  name: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  size?: string;
  ownerId?: string | null;
}

export type CompanyModerationStatus = 'approved' | 'pending' | 'rejected' | 'suspended' | 'blocked';

export interface UpdateCompanyData extends Partial<CreateCompanyData> {
  status?: CompanyModerationStatus;
  reason?: string;
}

/**
 * A helper function to safely parse JSON from a fetch response.
 * It checks for a successful response and correct content type.
 */
let approvalsCache: any[] | null = null;
let approvalsFetchPromise: Promise<any[]> | null = null;

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return safeJsonResponse(response);
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await apiFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return safeJsonResponse(response);
  },

  deleteUser: async (id: string): Promise<void> => {
    const response = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        const message = data?.message || data?.error;
        throw new Error(typeof message === 'string' ? message : 'Failed to delete user');
      }
      throw new Error(`Failed to delete user (${response.status})`);
    }
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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

  createCompany: async (data: CreateCompanyData) => {
    const response = await apiFetch('/api/admin/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return safeJsonResponse(response);
  },

  updateCompany: async (id: string, data: UpdateCompanyData) => {
    const response = await apiFetch(`/api/admin/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return safeJsonResponse(response);
  },

  deleteCompany: async (id: string, reason?: string) => {
    const url = reason ? `/api/admin/companies/${id}?reason=${encodeURIComponent(reason)}` : `/api/admin/companies/${id}`;
    const response = await apiFetch(url, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete company');
  },

  // Approval Management (cached — dashboard preloads on login)
  getCachedApprovals: (): any[] | null => approvalsCache,

  setApprovalsCache: (data: any[]) => {
    approvalsCache = Array.isArray(data) ? data : [];
  },

  invalidateApprovalsCache: () => {
    approvalsCache = null;
    approvalsFetchPromise = null;
  },

  getApprovals: async (options?: { force?: boolean }) => {
    if (!options?.force && approvalsCache) {
      return approvalsCache;
    }
    if (!options?.force && approvalsFetchPromise) {
      return approvalsFetchPromise;
    }

    approvalsFetchPromise = (async () => {
      const response = await apiFetch('/api/admin/approvals', { method: 'GET' });
      const data = await safeJsonResponse(response);
      const list = Array.isArray(data) ? data : [];
      approvalsCache = list;
      return list;
    })();

    try {
      return await approvalsFetchPromise;
    } finally {
      approvalsFetchPromise = null;
    }
  },

  updateApproval: async (id: string, status: string) => {
    const response = await apiFetch(`/api/admin/approvals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await safeJsonResponse(response);
    approvalsCache = null;
    approvalsFetchPromise = null;
    return result;
  },

  // Story Management
  getStories: async () => {
    const response = await apiFetch('/api/admin/stories', { method: 'GET' });
    return safeJsonResponse(response);
  },

  updateStory: async (id: string, data: any) => {
    const response = await apiFetch(`/api/admin/stories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return safeJsonResponse(response);
  },

  deleteStory: async (id: string) => {
    const response = await apiFetch(`/api/admin/stories/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete story');
  },

  // Analytics
  getAnalytics: async (timeRange: string): Promise<AdminAnalyticsData> => {
    const response = await apiFetch(`/api/admin/analytics?timeRange=${timeRange}`, { method: 'GET' });
    return safeJsonResponse(response);
  },

  getAiEvents: async (timeRange: string): Promise<AdminAiEventAnalytics> => {
    const response = await apiFetch(`/api/admin/ai-events?timeRange=${timeRange}`, { method: 'GET' });
    return safeJsonResponse(response);
  }
};
