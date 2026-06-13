import { startGlobalLoading, stopGlobalLoading } from "./loading-store";

// API configuration
// In development, use relative paths to let Vite's dev-server proxy handle requests
// API_BASE_URL: only use when explicitly provided via VITE_API_URL
// In production, API_BASE_URL should be set to the actual API server URL
export const API_BASE_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL ?? "");

/** Set on a request to opt out of the global overlay loader (e.g. polling). */
export const SKIP_GLOBAL_LOADER_HEADER = "X-Skip-Global-Loader";

/** Set on a GET request to show the global overlay (exports, heavy reads). */
export const SHOW_GLOBAL_LOADER_HEADER = "X-Show-Global-Loader";

/** Employee dashboard reads — pages use inline skeletons instead. */
const SILENT_LOADER_PATHS = [
	"/api/auth/me",
	"/api/auth/logout",
	"/api/auth/login",
	"/api/auth/register",
	"/api/dashboard",
	"/api/applications",
	"/api/jobs",
	"/api/messages",
	"/api/notifications",
	"/api/activity/insights",
];

function requestPath(url: string): string {
	if (url.startsWith("http")) {
		try {
			return new URL(url).pathname;
		} catch {
			return url.split("?")[0] ?? url;
		}
	}
	return url.split("?")[0] ?? url;
}

function shouldSkipGlobalLoader(url: string, options?: RequestInit): boolean {
	const headers = new Headers(options?.headers as HeadersInit);
	if (headers.get(SKIP_GLOBAL_LOADER_HEADER) === "true") return true;

	const path = requestPath(url);
	if (SILENT_LOADER_PATHS.some((silent) => path === silent || path.endsWith(silent))) {
		return true;
	}

	const method = (options?.method ?? "GET").toUpperCase();
	// Reads use inline/skeleton loaders on pages; polling and parallel GETs stay quiet.
	if (method === "GET" || method === "HEAD") {
		return headers.get(SHOW_GLOBAL_LOADER_HEADER) !== "true";
	}

	return false;
}

/** Merge options with the skip-global-loader header (for polling, auth checks, etc.). */
export function withSkipGlobalLoader(options: RequestInit = {}): RequestInit {
	const headers = new Headers(options.headers as HeadersInit);
	headers.set(SKIP_GLOBAL_LOADER_HEADER, "true");
	return { ...options, headers };
}

/** Opt in to the global overlay for a slow GET (e.g. export). */
export function withShowGlobalLoader(options: RequestInit = {}): RequestInit {
	const headers = new Headers(options.headers as HeadersInit);
	headers.set(SHOW_GLOBAL_LOADER_HEADER, "true");
	return { ...options, headers };
}

export const apiFetch = async (url: string, options?: RequestInit) => {
	// Build URL: if absolute already provided, use it. Otherwise prefer relative path
	// so the dev server proxy handles it. If API_BASE_URL is explicitly set, use that.
	const fullUrl = url.startsWith("http")
		? url
		: API_BASE_URL
		? `${API_BASE_URL}${url}`
		: url; // relative

	const skipLoader = shouldSkipGlobalLoader(fullUrl, options);
	if (!skipLoader) startGlobalLoading();

	try {
		const response = await fetch(fullUrl, {
			...options,
			headers: options?.headers,
			credentials: options?.credentials ?? "include",
		});

		if (!response.ok) {
			console.warn(`API request failed: ${fullUrl}`, response.status, response.statusText);
		}

		return response;
	} catch (error: unknown) {
		if ((error as { name?: string })?.name === "AbortError") {
			throw error;
		}
		console.error(`API fetch error for ${fullUrl}:`, error);
		throw error;
	} finally {
		if (!skipLoader) stopGlobalLoading();
	}
};

// Types
export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  postedDate: string;
  applications: number;
  newApplications: number;
  status: 'active' | 'paused' | 'closed';
  views: number;
  conversion: number;
}

export interface Story {
  id?: string;
  title: string;
  content: string;
  tags?: string[];
  status: 'pending' | 'approved' | 'rejected';
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

// API endpoints
export const api = {
  // Base HTTP methods
  async get(url: string, params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    const response = await apiFetch(`/api${url}${queryString}`);
    return response.json();
  },

  async post(url: string, data?: any) {
    const response = await apiFetch(`/api${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async put(url: string, data?: any) {
    const response = await apiFetch(`/api${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async delete(url: string) {
    const response = await apiFetch(`/api${url}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async patch(url: string, data?: any) {
    const response = await apiFetch(`/api${url}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Stories API
  stories: {
    async getAll() {
      return api.get('/stories');
    },

    async getPending() {
      const allStories = await api.get('/admin/stories');
      if (Array.isArray(allStories)) {
        return { stories: allStories.filter((s: any) => !s.approved) };
      }
      return { stories: [] };
    },

    async getApproved() {
      return api.get('/stories', { status: 'approved' });
    },

    async submit(data: { title: string; content: string; tags?: string[] }) {
      return api.post('/stories', {
        ...data,
        status: 'pending'
      });
    },

    async update(id: string, storyData: Partial<Story>) {
      return api.put(`/stories/${id}`, storyData);
    },

    async delete(id: string) {
      return api.delete(`/stories/${id}`);
    },

    async updateStatus(id: string | number, status: Story['status']) {
      const isApproved = status === 'approved';
      return api.put(`/admin/stories/${id}/approval`, { approved: isApproved });
    }
  },

  // Jobs API
  jobs: {
    async getAll(filters = {}) {
      return api.get('/jobs', filters);
    },

    async getOne(id: string) {
      return api.get(`/jobs/${id}`);
    },

    async create(jobData: Partial<Job>) {
      return api.post('/jobs', jobData);
    },

    async update(id: string, jobData: Partial<Job>) {
      return api.put(`/jobs/${id}`, jobData);
    },

    async delete(id: string) {
      return api.delete(`/jobs/${id}`);
    },

    async updateStatus(id: string, status: Job['status']) {
      return api.patch(`/jobs/${id}/status`, { status });
    },

    async getApplications(id: string) {
      return api.get(`/jobs/${id}/applications`);
    },

    async export(filters = {}) {
      return api.get('/jobs/export', filters);
    },
    async getRecommended() {
      return api.get('/jobs?page=1&itemsPerPage=4'); // Use basic jobs list as fallback
    }
  }
};