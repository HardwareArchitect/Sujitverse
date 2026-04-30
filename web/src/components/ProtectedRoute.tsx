import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const loc = useLocation();
  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}
