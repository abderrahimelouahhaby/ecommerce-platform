import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/useAuth";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleLogout() {
    await authClient.signOut();
    // Remove everything cached for the previous user (orders, wishlist...).
    queryClient.clear();
    toast.success("You are logged out");
    navigate("/");
  }

  if (isLoading) {
    return <Skeleton className="ml-2 h-8 w-24" />;
  }

  if (!user) {
    return (
      <div className="ml-2 flex items-center gap-2">
        <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Log in
        </Link>
        <Link
          to="/register"
          className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-2 flex items-center gap-2">
      {isAdmin && (
        <Link to="/admin" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Admin
        </Link>
      )}
      <span className="hidden max-w-32 truncate text-sm text-muted-foreground lg:inline">
        {user.name}
      </span>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}
