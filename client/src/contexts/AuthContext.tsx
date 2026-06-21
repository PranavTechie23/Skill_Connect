import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { apiFetch } from "../lib/api";

/**
 * Improved AuthContext
 * - Persists user to localStorage
 * - Defensive JSON parsing
 * - credentials: "include" by default for cookie-based sessions
 * - isLoading properly set during async ops
 * - Cancels stale checkAuth requests on unmount
 */
interface ProfessionalProfile {
  id?: number;
  userId?: number;
  headline?: string | null;
  bio?: string | null;
  skills?: string[];
  resumeUrl?: string | null;
  resumeName?: string | null;
  resume_url?: string | null;
  resume_name?: string | null;
}

interface Company {
  id?: number;
  name: string;
  description?: string | null;
  website?: string | null;
  location?: string | null;
  size?: string | null;
  industry?: string | null;
  logo?: string | null;
  ownerId?: number;
  createdAt?: string;
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
  bio?: string;
  skills?: string[];
  profile?: ProfessionalProfile | null;
  company?: Company | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void; // exposed for components that need to set user manually
  updateUser: (userData: Partial<User>) => Promise<User>; // new function to update user profile
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const authVersionRef = useRef(0);

  useEffect(() => {
    // Persist changes to localStorage
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, [user]);

  const checkAuth = async (controller: AbortController) => {
    const requestVersion = ++authVersionRef.current;
    try {
      const res = await apiFetch("/api/auth/me", {
        signal: controller.signal,
        credentials: "include",
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        // For 401/403, this is expected for unauthenticated users
        if (res.status !== 401 && res.status !== 403) {
          console.warn("Failed to parse auth response:", e);
        }
        data = {};
      }

      if (!res.ok) {
        // For 401/403, check if we have a user in localStorage first
        // Only clear if we don't have a cached user (might be temporary session issue)
        if (res.status === 401 || res.status === 403) {
          if (requestVersion !== authVersionRef.current) return;
          // Check if we have a cached user - if yes, keep it (session might be temporarily unavailable)
          const cachedUser = localStorage.getItem(STORAGE_KEY);
          if (!cachedUser) {
            // No cached user and no session - truly logged out
            setUserState(null);
          } else {
            // We have a cached user but session check failed - log warning but keep user
            console.warn('⚠️ Session check failed but user cached in localStorage. Keeping cached user.');
          }
          return;
        }
        // For other errors, log and clear
        console.warn(`Auth check failed with status ${res.status}`);
        if (requestVersion !== authVersionRef.current) return;
        setUserState(null);
        return;
      }

      const returnedUser: User | null = data?.user ?? data ?? null;
      if (requestVersion !== authVersionRef.current) return;
      setUserState(returnedUser);
    } catch (err: any) {
      if (err.name === "AbortError") {
        // This is normal during component unmount
        return;
      } else {
        // Only log other errors
        console.error("Auth check failed:", err);
        if (requestVersion !== authVersionRef.current) return;
        setUserState(null);
      }
    }
  };

  useEffect(() => {
    // Only perform a server-side session check if there's reason to believe
    // a session may exist. Avoid calling `/api/auth/me` for anonymous guests
    // on initial page view to prevent unnecessary 401s and server work.
    const hasCachedUser = !!localStorage.getItem(STORAGE_KEY);
    const hasToken = !!localStorage.getItem("skillconnect_token_v1");
    if (!hasCachedUser && !hasToken) {
      // No local session indicators — treat as guest and skip auth check.
      return;
    }

    const controller = new AbortController();
    checkAuth(controller);
    return () => { controller.abort(); };
  }, []);

  const setUser = (u: User | null) => setUserState(u);

  const login = async (email: string, password: string): Promise<User | null> => {
    // Invalidate stale /api/auth/me checks before logging in.
    authVersionRef.current += 1;
    setIsLoading(true);
    try {
      // Always use backend for login, including admin
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      // Defensive JSON parsing
      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch (e) {
          console.error("Failed to parse JSON response on login:", e);
          data = {};
        }
      }

      if (!res.ok) {
        // Invalid credentials should be surfaced to the login form.
        if (res.status === 401 || res.status === 403) {
          setUserState(null);
          throw new Error("Invalid email or password");
        }
        // For 500 errors, provide a more user-friendly message
        if (res.status === 500) {
          throw new Error("A server error occurred. Please try again later.");
        }
        const msg = data?.message || data?.error || `Login failed: ${res.statusText}`;
        throw new Error(msg);
      }

      let returnedUser: User = data?.user ?? data;
      
      // For employers, fetch full user data with company info from /api/auth/me
      if (returnedUser.userType === 'Employer' && !returnedUser.company) {
        try {
          const meRes = await apiFetch("/api/auth/me", {
            credentials: "include",
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData?.user) {
              returnedUser = meData.user;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch full user data after login:", e);
        }
      }
      
      setUserState(returnedUser);
      // After successful login, the user object is now set in the state.
      // This will trigger effects in components like login.tsx to redirect.
      return returnedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<User> => {
    authVersionRef.current += 1;
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        // If not JSON, read as text to help debug server errors (like HTML error pages)
        const text = await res.text();
        console.error("Non-JSON response from register:", text);
      }

      if (!res.ok) {
        const msg = data?.message || data?.error || `Registration failed: ${res.statusText}`;
        throw new Error(msg);
      }

      // The backend should return the full user object on successful registration.
      const returnedUser: User = data?.user ?? data;
      setUserState(returnedUser); // Set the full user profile
      return returnedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    authVersionRef.current += 1;
    setUserState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.warn("Logout endpoint failed or unreachable:", e);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<User> => {
    // If it's a local-only state update (profile provided from already-saved server call)
    if (userData.profile && Object.keys(userData).length === 1) {
      setUserState(prev => prev ? ({ ...prev, profile: userData.profile as any }) : null);
      return { profile: userData.profile } as any;
    }

    setIsLoading(true);
    try {
      // Use the consolidated profile update endpoint
      const res = await apiFetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Failed to update user profile");
      }

      const { user: savedUser, profile } = await res.json();
      setUserState(prevUser => prevUser ? ({
        ...prevUser,
        ...(savedUser || {}),
        profile: profile || prevUser.profile,
      }) : null);
      
      return { ...(savedUser || {}), profile } as any;
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
    updateUser,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;