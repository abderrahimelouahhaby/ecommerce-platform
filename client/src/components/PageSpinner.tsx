import { Loader2 } from "lucide-react";

export function PageSpinner() {
  return (
    <div className="flex justify-center py-20" role="status" aria-label="Loading">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
