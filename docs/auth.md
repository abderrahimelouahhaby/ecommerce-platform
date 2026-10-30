# Authentication

Authentication uses Better Auth with email and password. Sessions are saved in PostgreSQL and the browser keeps a session cookie.

## How it works

- The React app calls the routes under `/api/auth/*`. Better Auth creates the user, hashes the password (scrypt) and creates a session.
- The session token is sent in an `HttpOnly` cookie with `SameSite=Lax`, so JavaScript cannot read it.
- Sessions last 7 days. They are checked in the database on every request, so signing out or changing a role works immediately.
- Better Auth only accepts state changing requests from the trusted origin (`CLIENT_URL`), and CORS only allows that origin.

## Routes

| Method | Path                      | Purpose                                      |
| ------ | ------------------------- | -------------------------------------------- |
| POST   | `/api/auth/sign-up/email` | Register with `name`, `email` and `password` |
| POST   | `/api/auth/sign-in/email` | Log in with `email` and `password`           |
| POST   | `/api/auth/sign-out`      | Log out                                      |
| GET    | `/api/auth/get-session`   | Current session, or null                     |
| GET    | `/api/me`                 | Current user, or 401                         |
| GET    | `/api/admin/ping`         | Admin only check route                       |

## Roles

- `USER`: every new account.
- `ADMIN`: set only by the seed script or by another admin. The role cannot be sent when registering (`input: false`).

## Protecting routes

- One route: `router.get("/", requireAuth, handler)`.
- Admin routes: add them to `adminRouter`. The whole router is already behind `requireAuth` and `requireAdmin`.
- Always check ownership too, for example an order must belong to `req.user.id`.

## Rate limits

- `/api/auth/sign-in` and `/api/auth/sign-up`: 10 requests per 15 minutes per IP.
- All other `/api/auth/*` routes: 300 requests per 15 minutes per IP.
- The limits are turned off when `NODE_ENV` is `test`.

## Development accounts

Created by `npm run db:seed` (development only).

| Role     | Email                     | Password                     |
| -------- | ------------------------- | ---------------------------- |
| Admin    | `ADMIN_EMAIL` from `.env` | `ADMIN_PASSWORD` from `.env` |
| Customer | `customer@example.com`    | `Customer-Pass-123`          |

## Known limits

- Emails are not sent, so email verification and password reset are not enabled.
- Registering with an email that already exists returns an error, which tells a visitor that the email has an account. The rate limit slows down anyone who tries to check many emails.
