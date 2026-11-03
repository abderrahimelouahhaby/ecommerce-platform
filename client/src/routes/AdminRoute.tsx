import { Navigate, Outlet, useLocation } from "react-router";
import { PageSpinner } from "@/components/PageSpinner";
import { getLoginPath } from "@/features/auth/redirect";
import { useAuth } from "@/features/auth/useAuth";
import { ForbiddenPage } from "@/pages/ForbiddenPage";

// Pages for admins. The server checks the role again on every admin API call.
export function AdminRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={getLoginPath(location.pathname, location.search)} replace />;
  }

  if (!isAdmin) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
