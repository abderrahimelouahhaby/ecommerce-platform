# UI notes

Decisions I will follow while building the interface, so the app looks consistent.

## Pages and main sections

- Home: hero banner, category cards, featured products
- Shop: search bar, filters (category, price), sort select, product grid, pagination
- Product details: image, name, price, stock status, description, add to cart button, wishlist heart
- Cart: item list with quantity controls, order summary, checkout button
- Checkout: shipping form, payment method (card or cash on delivery), order summary
- Orders: list of my orders, order details with status badge
- Wishlist: grid of saved products
- Login and register: one centered card form
- Admin: sidebar, dashboard (stat cards and sales chart), products, orders, users, inventory

## Style rules

- Mobile first: design for a phone screen, then add rules for tablet and desktop
- Components from shadcn/ui, styled with Tailwind, neutral color theme with one accent color
- Light and dark theme, switch in the navbar
- Spacing with the Tailwind scale only (4, 6, 8, 12, 16), no random pixel values
- Rounded corners and soft borders on cards and inputs
- Prices always formatted as USD, for example $19.99

## States every page needs

- Loading: skeleton placeholders, not a blank screen
- Empty: a short message and a button (empty cart, empty wishlist, no orders)
- Error: a clear message and a retry button
- Success and failure feedback with toasts

## Accessibility basics

- Every input has a label
- Every image has alt text
- Buttons and links can be used with the keyboard and show a focus outline
- Enough contrast between text and background
