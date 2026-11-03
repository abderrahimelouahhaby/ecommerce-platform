import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";

export function ForbiddenPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-20">
      <h1 className="text-3xl font-bold tracking-tight">Access denied</h1>
      <p className="text-muted-foreground">You do not have access to this page.</p>
      <Link to="/" className={buttonVariants({ variant: "outline" })}>
        Back to home
      </Link>
    </section>
  );
}
