import { createBrowserRouter } from "react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutCancelledPage } from "@/pages/CheckoutCancelledPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { CheckoutSuccessPage } from "@/pages/CheckoutSuccessPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OrderPage } from "@/pages/OrderPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { ProductPage } from "@/pages/ProductPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ShopPage } from "@/pages/ShopPage";
import { WishlistPage } from "@/pages/WishlistPage";
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
        // Only for logged in users.
        element: <ProtectedRoute />,
        children: [
          { path: "checkout", element: <CheckoutPage /> },
          { path: "checkout/success", element: <CheckoutSuccessPage /> },
          { path: "checkout/cancelled", element: <CheckoutCancelledPage /> },
          { path: "wishlist", element: <WishlistPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:id", element: <OrderPage /> },
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
