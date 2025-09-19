import { QueryClient, type QueryFunction } from "@tanstack/react-query";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type UnauthorizedBehavior = "throw" | "returnNull";

function getQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach(v => query.append(key, String(v)));
    } else {
      query.append(key, String(value));
    }
  }
  return query.toString();
}

async function throwIfResNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  let message = `Request failed with status ${res.status}`;
  try {
    const data = await res.json();
    if (data?.message) message = data.message;
  } catch {}
  const error = new Error(message);
  throw error;
}

export function getQueryFn<T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T> {
  const { on401 } = options;
  return async ({ queryKey }) => {
    let url = queryKey[0] as string;
    const params = queryKey[1] as Record<string, unknown> | undefined;

    if (params && typeof params === "object") {
      const qs = getQueryString(params);
      if (qs) url = `${url}?${qs}`;
    }

    const res = await fetch(url, { credentials: "include" });
    if (on401 === "returnNull" && res.status === 401) {
      // @ts-expect-error allow null when caller expects it
      return null;
    }
    await throwIfResNotOk(res);
    return res.json();
  };
}

export async function apiRequest(method: HttpMethod, url: string, body?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});