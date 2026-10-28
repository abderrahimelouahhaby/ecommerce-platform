# Ecommerce Platform

A full stack online store for electronics and gadgets. Customers can browse products, save favorites to a wishlist, fill a cart and pay by card (Stripe test mode) or cash on delivery. An admin manages products, orders, users and stock from a dashboard.

## Planned features

- Product catalog with search, filters and pagination
- Authentication with roles (customer and admin)
- Cart, wishlist and order history
- Checkout with Stripe (test mode) or cash on delivery
- Admin dashboard with sales charts, products, orders, users and inventory

## Tech stack

- Client: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Zustand
- Server: Node.js, Express, TypeScript, Prisma, PostgreSQL, Better Auth, Zod
- Testing: Vitest, Supertest, Playwright
- DevOps: Docker, GitHub Actions, Vercel, Render, Neon

## Getting started

Requirements: Node.js 22 or higher and Docker Desktop.

    npm install
    npm run db:up
    cd server
    npm install
    cp .env.example .env
    npm run dev

The API runs on http://localhost:4000, and the health check is at http://localhost:4000/api/health. More details are in `docs/development.md`.

## Project structure

- `client/` : the React app
- `server/` : the Express API
- `docs/` : design notes, development guide and progress log

## License

MIT
