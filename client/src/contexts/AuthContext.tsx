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
// Helper to normalize backend user response
function normalizeUser(backendUser: any): User {
  return {
    ...backendUser,
    userType: backendUser.userType || backendUser.user_type,
  };
}
interface ProfessionalProfile {
  id?: number;
  userId?: number;
  headline?: string | null;
  bio?: string | null;
  skills?: string[];
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

  const checkAuth = async (controller: AbortController) => {
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
        // For 401/403, this is expected for unauthenticated users
        if (res.status !== 401 && res.status !== 403) {
          console.warn("Failed to parse auth response:", e);
        }
        data = {};
      }

      if (!res.ok) {
        // For 401/403, this is normal for unauthenticated users
        if (res.status !== 401 && res.status !== 403) {
          console.warn(`Auth check failed with status ${res.status}`);
        }
        setUserState(null);
        return;
      }

      const returnedUser: User | null = data?.user ?? data ?? null;
      setUserState(returnedUser);
    } catch (err: any) {
      if (err.name === "AbortError") {
        // This is normal during component unmount
        return;
      } else {
        // Only log other errors
        console.error("Auth check failed:", err);
        setUserState(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    checkAuth(controller);
    return () => { controller.abort(); };
  }, []);

  const setUser = (u: User | null) => setUserState(u);

  const login = async (email: string, password: string): Promise<User | null> => {
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
        // For 401 or 403 errors, just log out silently without error
        if (res.status === 401 || res.status === 403) {
          setUserState(null);
          return null;
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

  const updateUser = async (userData: Partial<User>): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Failed to update user profile");
      }

      const updatedUser = await res.json();
      setUserState(prevUser => ({
        ...prevUser,
        ...updatedUser
      }));
      
      return updatedUser;
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