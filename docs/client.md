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
