import { useEffect } from "react";
import { APP_NAME } from "@/lib/constants";

// Sets the browser tab title, for example "Laptops | GadgetHub".
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [title]);
}
