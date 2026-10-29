# Development guide

How to run the project on your computer.

## Requirements

- Node.js 22 or higher
- Docker Desktop (running)

## First time setup

    npm install
    npm run db:up
    cd server
    npm install
    cp .env.example .env
    npm run dev

The API runs on http://localhost:4000. Check it with http://localhost:4000/api/health.

## Root scripts

| Script                 | What it does                            |
| ---------------------- | --------------------------------------- |
| `npm run db:up`        | Start PostgreSQL in Docker              |
| `npm run db:down`      | Stop PostgreSQL (data is kept)          |
| `npm run db:logs`      | Show PostgreSQL logs                    |
| `npm run format`       | Format all files with Prettier          |
| `npm run format:check` | Check formatting without changing files |

## Server scripts (run inside `server/`)

| Script               | What it does                                 |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start the server and restart on every change |
| `npm run build`      | Compile TypeScript to `dist/`                |
| `npm start`          | Run the compiled server                      |
| `npm run typecheck`  | Check types without building                 |
| `npm run lint`       | Run ESLint                                   |
| `npm test`           | Run all tests once                           |
| `npm run test:watch` | Run tests again on every change              |

## Environment variables

Copy `server/.env.example` to `server/.env`. The server checks the variables at startup and stops with a clear message if one is missing or invalid.

## Reset the database

This deletes all data in the development database.

    docker compose -f docker-compose.dev.yml down -v
    npm run db:up

## Database (from part 3)

After the first setup, run these commands inside `server/`:

    npm run db:generate
    npm run db:migrate
    npm run db:seed

To create the test database once (in the project root):

    npm run db:test:create
    cd server
    npm run db:test:migrate

More about the models and the commands is in `docs/database.md`.
