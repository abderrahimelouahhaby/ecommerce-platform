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
