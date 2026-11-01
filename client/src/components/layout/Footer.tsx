import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} {APP_NAME}. A portfolio project, no real orders or
          payments.
        </p>
      </div>
    </footer>
  );
}
