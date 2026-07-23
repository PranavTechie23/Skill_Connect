import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getDashboardPathForRole, normalizeUserType } from "@/lib/utils";

type Props = {
  children: React.ReactElement;
  allowedUserTypes?: string[]; // backend userType values e.g. ["professional", "employer", "admin"]
};

/**
 * ProtectedRoute: checks auth.user exists and optionally checks allowedUserTypes.
 * If not authenticated -> redirect to /login
 * If authenticated but userType not allowed -> redirect to the user's own dashboard
 */
export const ProtectedRoute: React.FC<Props> = ({ children, allowedUserTypes }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedUserTypes && allowedUserTypes.length > 0) {
    const ut = (user as { userType?: string; user_type?: string }).userType
      ?? (user as { user_type?: string }).user_type;
    const normalized = normalizeUserType(ut);
    const allowedNormalized = allowedUserTypes.map((role) => normalizeUserType(role));

    if (!allowedNormalized.includes(normalized)) {
      return <Navigate to={getDashboardPathForRole(ut)} replace />;
    }
  }

  return children;
};
