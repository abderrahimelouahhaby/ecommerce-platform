# Client

React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, React Router 7, TanStack Query, Axios, next-themes.

## Folder structure

    client/src/
      app/            providers (theme, queries, toasts)
      components/
        ui/           shadcn components (generated, do not lint)
        layout/       navbar, footer, layouts, theme toggle
      pages/          one component per page
      routes/         the router
      lib/            api client, env check, formatters, constants
      features/       one folder per feature

## Conventions

- Import with the `@/` shortcut, for example `@/components/ui/button`.
- Prices come from the API in cents. Always show them with `formatPrice`.
- Server data is fetched with TanStack Query. Local data is kept in Zustand.
- Errors from the API have the shape `{ error: { message } }`. Show them with `getErrorMessage`.
- Use theme colors (`bg-background`, `text-muted-foreground`) and not fixed colors, so dark mode works everywhere.
- Mobile first: write the phone layout, then add `md:` and `lg:` rules for bigger screens.

## API address

The client always calls `/api/...`. In development Vite forwards it to `http://localhost:4000` (see `vite.config.ts`). In production a Vercel rewrite forwards it to the Render server. The browser sees one address, so there is no CORS problem and cookies stay simple.

## Scripts (inside `client/`)

| Script               | What it does                         |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the dev server on port 5173    |
| `npm run build`      | Check types and build for production |
| `npm run typecheck`  | Check types only                     |
| `npm run lint`       | Run ESLint                           |
| `npm test`           | Run the tests once                   |
| `npm run test:watch` | Run the tests again on every change  |

## Authentication

- `lib/auth-client.ts` is the Better Auth client. It calls `/api/auth/*` on the same address as the page.
- `features/auth/useAuth.ts` gives `user`, `isLoading`, `isAuthenticated` and `isAdmin` to any component.
- Forms use React Hook Form with Zod schemas (`features/auth/schemas.ts`). The server rules are the real ones, the form rules are only fast feedback.
- Route guards in `routes/`: `ProtectedRoute` (logged in users), `AdminRoute` (admins) and `GuestRoute` (visitors only). They are for comfort only, the API checks access again.
- After login the user returns to the page they wanted through `?redirect=`. The value always goes through `getSafeRedirect`, which accepts local paths only.
- On logout the TanStack Query cache is cleared, so no data of the previous user stays in memory.

## Shop pages

- `features/products/` holds the types, the API calls (`api.ts`), the TanStack Query hooks (`hooks.ts`) and the filter helpers (`filters.ts`).
- The shop filters live in the URL (`/shop?category=laptops&sort=price_asc&page=2`). `useShopFilters` reads and updates them, and `readFilters` replaces any invalid value with a default.
- Prices in the URL and in the filters are dollars as typed ("19.99"). They are converted to cents with `dollarsToCents` right before the API call.
- Every data page handles four states: loading (skeleton), error (message and retry), empty, and success.
- While a new page loads, the previous one stays on screen, dimmed (`keepPreviousData`).
- Components: `ProductCard`, `ProductGrid`, `ProductGridSkeleton`, `ShopSidebar`, `SortSelect`, `Pagination`, `ErrorState`, `EmptyState`.

## Cart

- The cart rules are pure functions in `features/cart/cartLogic.ts` (add, change quantity, remove, totals, sanitize). The Zustand store in `cartStore.ts` only calls them.
- The cart is saved in localStorage under the key `gadgethub-cart`. When it loads, `sanitizeCart` checks every field, because users can edit localStorage.
- Limits: at most the stock, at most 10 of one product, at most 50 lines.
- The cart keeps a snapshot of the name, price and stock for display. It is never trusted: the server reads the real prices and stock when an order is created.
- `useCart()` gives the items, the totals and the actions to components. Do not return a new object from a Zustand selector, compute derived values with `useMemo`.
- The cart drawer (`CartButton`) and the cart page share `CartItemRow`.

## Wishlist

- `features/wishlist/hooks.ts` holds the query (`useWishlist`), the set of saved ids (`useWishlistIds`) and the optimistic toggle (`useToggleWishlist`).
- The query key contains the user id (`["wishlist", userId]`), so cached data of one user is never shown to another. The whole cache is also cleared on logout.
- Optimistic update in three steps: `onMutate` changes the cache at once, `onError` puts the old list back, `onSettled` refetches the real list.
- `WishlistButton` has two looks (`icon` for cards, `labeled` for the product page). A visitor who clicks it is sent to login and comes back.
- A button must never be inside a link. On the product card the heart is a sibling of the link, placed over the image.
