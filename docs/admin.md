# Admin area

## Access

- The whole `/api/admin` router is mounted behind `requireAuth` and `requireAdmin`. Every route added to it is protected automatically.
- A test goes through every admin route and checks 401 for visitors and 403 for customers. A new admin route must be added to that list.
- The role is read from the database on every request, so a promotion or a demotion is effective at once.
- An admin cannot change their own role, so the shop cannot lose its last admin by accident.
- The first admin is created by the seed script from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Images

- Images are uploaded to Cloudinary. The database keeps the image address (`imageUrl`) and the Cloudinary id (`imagePublicId`, never sent to clients).
- One file in the field `image`, at most 2 MB, kept in memory.
- The real type is checked from the first bytes of the file (JPEG, PNG or WebP). The file name and the content type sent by the browser are ignored. SVG and GIF are refused.
- Cloudinary also limits the formats and scales big images down to 1200 x 1200 pixels.
- If saving a product fails after an upload, the image is removed. When an image is replaced, the old one is removed after the update succeeded.

## Setting up Cloudinary

1. Create a free account at cloudinary.com.
2. Copy the cloud name, the API key and the API secret of the dashboard into `server/.env` as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.

Placeholder values let the server start. Only uploading an image needs the real keys. The tests use a fake upload.

## Rules

- Products are never deleted. They are deactivated (`isActive = false`), because orders keep pointing to them.
- A product slug is created by the server from the name, and does not change when the name changes.
- Orders move forward only: `PAID` (card) or `PENDING` (cash on delivery) to `SHIPPED`, then `DELIVERED`. A cash order becomes `PAID` when it is delivered. An admin cannot mark an order as paid or cancelled by hand.
- A status change includes the current status in the database filter, so two admins acting at the same time cannot overwrite each other.
- A sale is an order with the status `PAID`, `SHIPPED` or `DELIVERED`. Revenue is the sum of their totals. Pending and cancelled orders do not count.
- Low stock means 5 or less.
- Every sensitive action writes an audit line in the logs (`Admin action`, with the admin id, the action and the target).

## Known limits

- Sales per day are grouped in the application, which is fine for a small shop. A big shop should group in SQL.
- Days are counted in UTC.
- The stock set in the inventory replaces the current number, even if orders were placed a moment before.
