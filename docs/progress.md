# Progress log

A short note after each part: what I built, what I learned, what was hard.

## Part 1: Planning and repo setup

- Created the repository and protected the main branch, so all work goes through pull requests
- Set up the client with Vite, React and TypeScript
- Set up the server with Node.js, TypeScript and tsx
- Added Prettier for formatting, Husky and lint-staged to format on commit, and commitlint for commit messages
- Learned: strict TypeScript settings catch mistakes early, and Node ES modules need the .js extension in local imports

## Part 2: Docker database and server skeleton

- Started PostgreSQL 17 in Docker with a named volume and a healthcheck, bound to 127.0.0.1 only
- Built the Express app in small files: config, lib, middleware, modules, routes
- Environment variables are validated with Zod at startup, so a wrong config stops the server immediately
- Added Helmet, a strict CORS rule, a request body size limit and Pino logging with redaction
- One central error handler gives every error the same JSON shape and never leaks internal details
- Added the health route and 6 tests with Vitest and Supertest
- Learned: exporting the app separately from `listen` is what makes API tests easy, and a graceful shutdown lets requests finish before the server stops

## Part 3: Prisma schema, migrations and seed

- Set up Prisma 7 with the PostgreSQL adapter and a generated client that is not committed
- Wrote the models: User, Category, Product, WishlistItem, Order and OrderItem, with enums for roles, order status and payment
- Stored money in cents, used UUIDs, and chose Cascade or Restrict for every relation
- Added CHECK constraints by editing the migration, so the database refuses negative stock and prices
- Added a database health route and a separate test database
- Wrote a seed script with 5 categories and 30 electronics products that can run many times without duplicates
- Wrote tests for the seed data and for the database rules

## Part 4: Authentication (server)

- Added Better Auth with the Prisma adapter, and the session, account and verification models
- Passwords are hashed, sessions live in the database and the cookie is HttpOnly and SameSite Lax
- Added a role to the user that cannot be chosen at registration (`input: false`)
- Wrote requireAuth and requireAdmin, and locked the whole admin router by default
- Added rate limits on the auth routes, a strict one for sign in and sign up
- The seed script creates an admin from environment variables and a demo customer
- Wrote 14 tests: hashed password, role escalation, wrong password, cookie flags, sign out, 401 and 403 and 200 on the admin route, and the rate limiter

## Part 5: Products and categories API

- Split the feature in a schema, a service, a controller and routes
- Validated every query parameter with Zod: limit capped at 50, sort is an allowed word, min price not above max price
- Sent only whitelisted fields to the client, so internal fields never leak
- Inactive products behave like products that do not exist (404, hidden in lists and counts)
- Built pagination with a stable sort order and a count that matches the page
- Wrote 11 focused tests on visibility, filters, validation and SQL injection, and wrote down what we do not test
- Learned: in Express 5 `req.query` is read only, so validation happens in the controller.

## Part 6: Client foundation

- Set up Tailwind CSS 4 and shadcn/ui (the component code is copied into the project)
- Added an `@/` import alias and a Vite dev proxy, so the browser calls `/api` on the same address as the page
- Built a public layout (navbar with a mobile menu, footer) and an admin layout with React Router
- Added a light and dark theme with next-themes, toasts with Sonner and TanStack Query with its devtools
- Created an Axios instance, a checked environment file and a price formatter with a test
- Only tested the money formatting, the rest is visible in the browser right away
- Learned: a dev proxy makes the app behave like production

## Part 7: Authentication UI

- Added the Better Auth client and a `useAuth` hook, so every component knows who is logged in
- Built the login and register pages with React Hook Form and Zod, with accessible fields and error messages
- Used a generic login error, so the form does not tell which emails have an account
- Added route guards for logged in users, admins and visitors, while the server stays the real lock
- Protected the redirect after login against open redirect attacks, and cleared the query cache on logout
- Added Playwright with its own ports and test database, and wrote 4 end to end tests plus a unit test for the redirect helper

## Part 8: Shop pages

- Built the data layer for products: types, API functions and TanStack Query hooks
- Stored the shop filters in the URL, with validation that falls back to defaults, so pages can be shared and the Back button works
- Built the shop page with search, categories, a price filter, sorting and pagination, and a product details page
- Handled loading, error, empty and not found states, and kept the previous page on screen while the next one loads
- Added the categories and new arrivals to the home page
- Tested only the dollars to cents conversion and two e2e journeys (filter and open a product, product not found)
