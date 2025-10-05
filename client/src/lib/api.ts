// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const apiFetch = (url: string, options?: RequestInit) => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  return fetch(fullUrl, {
    ...options,
    credentials: "include",
  });
};

// Add the missing apiRequest export
export async function apiRequest(method: string, url: string, body?: unknown): Promise<Response> {    
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {}
    throw new Error(message);
  }
  
  return res;
}
