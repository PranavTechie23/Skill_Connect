// API configuration
// In development, use relative paths to let Vite's dev-server proxy (localhost:5001) handle requests
// API_BASE_URL: only use when explicitly provided via VITE_API_URL
// In production, API_BASE_URL should be set to the actual API server URL
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const apiFetch = async (url: string, options?: RequestInit) => {
	// Build URL: if absolute already provided, use it. Otherwise prefer relative path
	// so the dev server proxy handles it. If API_BASE_URL is explicitly set, use that.
	const fullUrl = url.startsWith("http")
		? url
		: API_BASE_URL
		? `${API_BASE_URL}${url}`
		: url; // relative

	// Use session-based authentication (cookies) instead of Bearer token
	let headers: Record<string, string> = {};

	try {
		const response = await fetch(fullUrl, {
			...options,
			headers: { ...(options && (options as any).headers), ...headers }, // Merge headers
			credentials: options?.credentials ?? "include", // Allow overriding default 'include'
		});
		
		// Check if response is ok (status in the range 200-299)
		if (!response.ok) {
			console.warn(`API request failed: ${fullUrl}`, response.status, response.statusText);
			// Still return the response so the caller can handle it
		}
		
		return response;
	} catch (error: any) {
		// Ignore AbortError logs to avoid noise from React StrictMode double-effects
		if (error?.name === "AbortError") {
			throw error;
		}
		console.error(`API fetch error for ${fullUrl}:`, error);
		// Re-throw the error for the caller to handle
		throw error;
	}
};

// Example API call function
export async function fetchJobs(filters = {}) {
  try {
    const response = await fetch(`/api/jobs?${new URLSearchParams(filters)}`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}