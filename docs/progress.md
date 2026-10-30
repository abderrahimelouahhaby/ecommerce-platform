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
