import { Navigate, Outlet, useLocation } from "react-router";
import { PageSpinner } from "@/components/PageSpinner";
import { getLoginPath } from "@/features/auth/redirect";
import { useAuth } from "@/features/auth/useAuth";

// Pages for logged in users. A visitor is sent to the login page and brought back after login.
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={getLoginPath(location.pathname, location.search)} replace />;
  }

  return <Outlet />;
}
