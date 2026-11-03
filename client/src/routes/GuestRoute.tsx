import { Navigate, Outlet, useSearchParams } from "react-router";
import { PageSpinner } from "@/components/PageSpinner";
import { getSafeRedirect } from "@/features/auth/redirect";
import { useAuth } from "@/features/auth/useAuth";

// Pages for visitors only (login, register). A logged in user is sent away.
export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return <PageSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to={getSafeRedirect(searchParams.get("redirect"))} replace />;
  }

  return <Outlet />;
}
