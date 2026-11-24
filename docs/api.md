# API

Base path: `/api`. Errors always have the shape `{ "error": { "message": "..." } }`. Validation errors (400) also include `details` with the wrong fields.

## Health

| Method | Path         | Purpose                                |
| ------ | ------------ | -------------------------------------- |
| GET    | `/health`    | The server is running                  |
| GET    | `/health/db` | The database is reachable (503 if not) |

## Authentication

See `docs/auth.md`. Routes under `/api/auth/*` are handled by Better Auth.

| Method | Path          | Access    | Purpose            |
| ------ | ------------- | --------- | ------------------ |
| GET    | `/me`         | Logged in | The current user   |
| GET    | `/admin/ping` | Admin     | Access check route |

## Products (public)

### GET /products

Query parameters, all optional:

| Parameter  | Type                                            | Default  | Meaning                                            |
| ---------- | ----------------------------------------------- | -------- | -------------------------------------------------- |
| `search`   | text, 1 to 100 characters                       | none     | Matches the name or the description, ignoring case |
| `category` | category slug                                   | none     | Only products of this category                     |
| `minPrice` | whole number, in cents                          | none     | Minimum price                                      |
| `maxPrice` | whole number, in cents                          | none     | Maximum price, not below `minPrice`                |
| `sort`     | `newest`, `price_asc`, `price_desc`, `name_asc` | `newest` | Order of the results                               |
| `page`     | whole number from 1                             | 1        | Page number                                        |
| `limit`    | whole number from 1 to 50                       | 12       | Products per page                                  |

Response:

    {
      "data": [
        {
          "id": "uuid",
          "name": "Nova X1 Smartphone",
          "slug": "nova-x1-smartphone",
          "description": "...",
          "priceCents": 69900,
          "stock": 25,
          "imageUrl": "https://...",
          "createdAt": "2026-10-29T12:00:00.000Z",
          "category": { "id": "uuid", "name": "Smartphones", "slug": "smartphones" }
        }
      ],
      "pagination": { "page": 1, "limit": 12, "total": 30, "totalPages": 3 }
    }

Only active products are returned. Inactive products never appear.

### GET /products/:slug

Returns `{ "data": { ...product } }`, or 404 `Product not found` (also for inactive products).

## Categories (public)

### GET /categories

Returns `{ "data": [ { "id", "name", "slug", "productCount" } ] }`, sorted by name. `productCount` counts active products only.

## Wishlist (logged in users)

All wishlist routes need a session. The user id always comes from the session, never from the request.

| Method | Path                   | Purpose                                                                                       |
| ------ | ---------------------- | --------------------------------------------------------------------------------------------- |
| GET    | `/wishlist`            | My saved products, newest first. Inactive products are hidden                                 |
| POST   | `/wishlist/:productId` | Save a product. Safe to repeat. 404 for an unknown or inactive product, 400 for an invalid id |
| DELETE | `/wishlist/:productId` | Remove a product from my wishlist. Safe to repeat, answers 204                                |

`GET /wishlist` returns `{ "data": [ { "addedAt": "...", "product": { ...product } } ] }`.

## Orders (logged in users)

All order routes need a session. The user id always comes from the session, never from the request.

| Method | Path                 | Purpose                                                                  |
| ------ | -------------------- | ------------------------------------------------------------------------ |
| POST   | `/orders`            | Create a cash on delivery order. Rate limited (30 per 15 minutes per IP) |
| GET    | `/orders`            | My 50 newest orders                                                      |
| GET    | `/orders/:id`        | One of my orders. 404 if it does not exist or is not mine                |
| POST   | `/orders/:id/cancel` | Cancel my pending order and restore the stock                            |

`POST /orders` body:

    {
      "items": [{ "productId": "uuid", "quantity": 2 }],
      "shipping": {
        "name": "Demo Customer",
        "phone": "+212 600 000 000",
        "address": "12 Example Street",
        "city": "Casablanca",
        "postalCode": "20000",
        "country": "Morocco"
      }
    }

Prices, names and stock are never accepted from the client, the server reads them from the database. A quantity is 1 to 10, and an order has 1 to 50 lines.

Errors: 400 invalid body, 401 not logged in, 404 unknown or inactive product (or order), 409 not enough stock (or an order that is not pending).

## Payments

| Method | Path                         | Access      | Purpose                                                                                                                                                                |
| ------ | ---------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/payments/checkout-session` | Logged in   | Create a card order and a Stripe Checkout session. Same body as `POST /orders`. Returns `{ "data": { "orderId", "url" } }`, the browser must go to `url`. Rate limited |
| POST   | `/payments/webhook`          | Stripe only | Receives Stripe events. Needs a valid `Stripe-Signature` header, answers 400 otherwise                                                                                 |

Errors of the checkout session route: 400 invalid body, 401 not logged in, 404 unknown or inactive product, 409 not enough stock, 502 the payment service is unavailable (the order is cancelled and the stock restored).

An order becomes `PAID` only through a verified `checkout.session.completed` webhook with the right amount. Opening the success page never changes an order.

## Admin (admins only)

Every route under `/admin` needs a logged in admin: 401 for visitors, 403 for customers. Lists accept `page` (from 1) and `limit` (1 to 100, default 20) and answer `{ "data": [...], "pagination": {...} }`.

| Method | Path                         | Purpose                                                                                                |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| GET    | `/admin/products`            | All products, active or not. Filters: `search`, `status` (`all`, `active`, `inactive`)                 |
| POST   | `/admin/products`            | Create a product. JSON or `multipart/form-data` with an optional `image` file. Slug made by the server |
| PATCH  | `/admin/products/:id`        | Update some fields, and/or replace the image                                                           |
| DELETE | `/admin/products/:id`        | Deactivate the product (204). It is never deleted                                                      |
| GET    | `/admin/orders`              | All orders with the buyer. Filter: `status`                                                            |
| PATCH  | `/admin/orders/:id/status`   | Body `{ "status": "SHIPPED" }` or `{ "status": "DELIVERED" }`                                          |
| GET    | `/admin/users`               | Users with their number of orders. Filter: `search`                                                    |
| PATCH  | `/admin/users/:id/role`      | Body `{ "role": "USER" }` or `{ "role": "ADMIN" }`. Not for your own account                           |
| GET    | `/admin/stats`               | `revenueCents`, `salesCount`, `pendingCount`, `usersCount`, `lowStockCount`                            |
| GET    | `/admin/stats/sales?days=30` | One entry per day (UTC) with `date`, `revenueCents` and `orders`. `days` from 7 to 90                  |
| GET    | `/admin/inventory`           | Products by stock, lowest first. Filter: `status` (`all`, `low`, `out`)                                |
| PATCH  | `/admin/inventory/:id`       | Body `{ "stock": 12 }`, a whole number from 0                                                          |

Image rules: one file in the field `image`, JPEG, PNG or WebP (checked by the real content of the file), at most 2 MB. Errors: 400 invalid input or image, 404 not found, 409 an order status change that is not allowed.
