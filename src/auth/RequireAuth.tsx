import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";

// Client-side replacement for the old _authenticated route guard:
// blocks rendering until the session is known, then redirects unauthenticated users to /login.
export function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
