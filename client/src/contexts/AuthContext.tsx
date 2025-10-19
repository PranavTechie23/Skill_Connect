import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch, API_BASE_URL } from "../lib/api";

/**
 * Improved AuthContext
 * - Persists user to localStorage
 * - Defensive JSON parsing
 * - credentials: "include" by default for cookie-based sessions
 * - isLoading properly set during async ops
 * - Cancels stale checkAuth requests on unmount
 */

interface ProfessionalProfile {
  id: number;
  userId: number;
  headline: string | null;
  bio: string | null;
  skills: string[];
}

interface Company {
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
}

interface User {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: "Professional" | "Employer" | "admin" | "job_seeker" | string;
  location?: string;
  profilePhoto?: string;
  telephoneNumber?: string;
  profile?: ProfessionalProfile | null;
  company?: Company | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void; // exposed for components that need to set user manually
  isLoading: boolean;
}

const STORAGE_KEY = "skillconnect_user_v1";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Persist changes to localStorage
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch("/api/auth/me", {
          signal: controller.signal,
          credentials: "include",
        });

        let data: any = {};
        try {
          data = await res.json();
        } catch (e) {
          console.warn("Failed to parse auth response:", e);
          data = {};
        }

        if (!res.ok) {
          if (!cancelled) setUserState(null); // Only set state if not cancelled
          return;
        }

        if (!cancelled) {
          const returnedUser: User | null = data?.user ?? data ?? null;
          setUserState(returnedUser);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.warn("Request aborted:", err);
        } else {
          console.error("Auth check failed:", err);
          if (!cancelled) setUserState(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const setUser = (u: User | null) => setUserState(u);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // Always use backend for login, including admin
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      let data: any = {};
      try { data = await res.json(); } catch { data = {}; }

      if (!res.ok) {
        const msg = data?.message || data?.error || res.statusText || "Login failed";
        throw new Error(msg);
      }

      const returnedUser: User = data?.user ?? data;
      setUserState(returnedUser);
      return returnedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<User> => {
    setIsLoading(true);
    try {
      // First try a relative fetch so the dev server's proxy (Vite) forwards to backend.
      // If that fails (dev proxy not available or network resolution issue),
      // fall back to the explicit API_BASE_URL.
      let res: Response | null = null;
      try {
        res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
          credentials: "include"
        });
      } catch (err) {
        // network-level failure for relative url; try direct backend URL if configured
        if (API_BASE_URL) {
          try {
            res = await fetch(`${API_BASE_URL}/api/auth/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(userData),
              credentials: "include"
            });
          } catch (err2) {
            // rethrow original error to be handled by caller
            throw err2;
          }
        } else {
          throw err;
        }
      }

      let data: any = {};
      try { data = await res.json(); } catch { data = {}; }

      if (!res || !res.ok) {
        const msg = data?.message || data?.error || (res ? res.statusText : "Network error") || "Registration failed";
        throw new Error(msg);
      }

      // After login, fetch the full user profile to get all relations (like company)
      const meRes = await apiFetch("/api/auth/me", {
        credentials: "include",
      });
      if (!meRes.ok) {
        const returnedUser: User = data?.user ?? data;
        setUserState(returnedUser); // Fallback to login response
        return returnedUser;
      }
      const meData = await meRes.json();
      const returnedUser: User = meData?.user ?? meData;
      setUserState(returnedUser); // Set the full user profile
      return returnedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Best-effort: call backend logout, ignore network errors but clear local state
      try {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } catch (e) {
        console.warn("Logout endpoint failed or unreachable:", e);
      }
      setUserState(null);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    setUser,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;