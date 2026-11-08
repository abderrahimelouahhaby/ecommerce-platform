import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getLoginPath } from "@/features/auth/redirect";
import { useAuth } from "@/features/auth/useAuth";
import type { Product } from "@/features/products/types";
import { cn } from "@/lib/utils";
import { useToggleWishlist, useWishlistIds } from "./hooks";

type WishlistButtonProps = {
  product: Product;
  variant?: "icon" | "labeled";
  className?: string;
};

export function WishlistButton({ product, variant = "icon", className }: WishlistButtonProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const savedIds = useWishlistIds();
  const toggle = useToggleWishlist();

  const isSaved = savedIds.has(product.id);

  function handleClick() {
    if (isLoading) {
      return;
    }

    // A visitor is sent to login, and comes back to this page afterwards.
    if (!isAuthenticated) {
      toast("Log in to save products to your wishlist");
      navigate(getLoginPath(location.pathname, location.search));
      return;
    }

    toggle.mutate({ product, isSaved });
  }

  const heart = <Heart className={cn("size-5", isSaved && "fill-destructive text-destructive")} />;

  if (variant === "labeled") {
    return (
      <Button variant="outline" size="lg" className={className} onClick={handleClick}>
        {heart}
        {isSaved ? "Saved to wishlist" : "Add to wishlist"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={
        isSaved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`
      }
      onClick={handleClick}
    >
      {heart}
    </Button>
  );
}
