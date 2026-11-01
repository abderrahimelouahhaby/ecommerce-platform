import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export function HomePage() {
  return (
    <section className="flex flex-col items-start gap-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Gadgets you will love, at {APP_NAME}
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Smartphones, laptops, audio and smart home devices. Browse the catalog, save your favorites
        and check out in a few clicks.
      </p>
      <Link to="/shop" className={buttonVariants({ size: "lg" })}>
        Browse the shop
      </Link>
    </section>
  );
}
