import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string | null;
  alt: string;
  className?: string;
};

export function ProductImage({ src, alt, className }: ProductImageProps) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
      >
        <ImageOff className="size-8" />
      </div>
    );
  }

  return (
    <img src={src} alt={alt} loading="lazy" className={cn("bg-muted object-cover", className)} />
  );
}
