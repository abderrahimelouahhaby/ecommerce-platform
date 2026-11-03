import { authClient } from "@/lib/auth-client";

// Simple view of the session for components.
export function useAuth() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user ?? null;

  return {
    user,
    isLoading: isPending,
    isAuthenticated: user !== null,
    isAdmin: user?.role === "ADMIN",
  };
}
