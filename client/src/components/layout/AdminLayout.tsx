import { Link, Outlet } from "react-router";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col gap-4 border-r p-4 md:flex">
        <span className="text-lg font-bold tracking-tight">{APP_NAME} Admin</span>
        <Separator />
        <nav className="flex flex-col gap-2 text-sm" aria-label="Admin">
          <Link to="/admin" className="font-medium">
            Dashboard
          </Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            Back to the shop
          </Link>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <span className="font-medium md:hidden">{APP_NAME} Admin</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
