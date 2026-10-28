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
