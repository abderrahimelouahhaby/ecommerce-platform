import { createBrowserRouter } from "react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { CartPage } from "@/pages/CartPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { ProductPage } from "@/pages/ProductPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ShopPage } from "@/pages/ShopPage";
import { AdminRoute } from "./AdminRoute";
import { GuestRoute } from "./GuestRoute";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "shop", element: <ShopPage /> },
      { path: "products/:slug", element: <ProductPage /> },
      { path: "cart", element: <CartPage /> },
      {
        // Only for visitors.
        element: <GuestRoute />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },
      {
        // Only for logged in users. The real pages come in later parts.
        element: <ProtectedRoute />,
        children: [
          { path: "checkout", element: <PlaceholderPage title="Checkout" /> },
          { path: "wishlist", element: <PlaceholderPage title="Wishlist" /> },
          { path: "orders", element: <PlaceholderPage title="Orders" /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    // Only for admins.
    path: "admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [{ index: true, element: <AdminDashboardPage /> }],
      },
    ],
  },
]);
