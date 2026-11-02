# Corner Kiosk

The online shop for Corner Kiosk, a neighbourhood convenience store in Leeds. Customers browse
the catalogue by category, search, add things to a basket, use discount codes and check out for
delivery or click & collect. Staff manage prices, stock and visibility from a small back office.

Server-rendered with Express 5 and EJS on Node 22. No database: products, coupons and orders live
in memory and are reseeded on every start, so the shop is usable straight away.

## Running it

```bash
npm install
npm start                 # http://localhost:5105
npm run dev               # same, restarts on file changes
```

Or with Docker:

```bash
docker compose up --build
```

Configuration (see `.env.example`):

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `PORT` | `5105` | HTTP port |
| `ADMIN_USER` / `ADMIN_PASSWORD` | `admin` / `kiosk` | basic auth for `/admin` |
| `PAYMENT_LATENCY_MS` | `600` | response time of the sandbox payment provider |

## Tests

```bash
npm test
```

Uses the built-in `node:test` runner with supertest for the HTTP routes. Takes a second or two.

## Where things are

```
src/
  server.js            starts the HTTP server
  app.js               Express setup, view locals, route mounting
  routes/
    shop.js            catalogue (category, search, sort, pages) and product pages
    cart.js            basket, quantities, discount codes
    checkout.js        checkout form and order placement
    orders.js          order history and order details
    admin.js           back office product list and edit form
  lib/
    store.js, seed.js  in-memory data and demo content
    catalog.js         listing, search, pagination, stock labels
    cart.js            basket operations
    coupons.js         discount code rules
    pricing.js         basket totals and delivery charges
    orders.js          checkout validation and order creation
    payments.js        sandbox card authorisation
    session.js         cookie session and flash messages
    auth.js            back office basic auth
views/                 EJS templates (partials/ for header, footer, pagination, product card)
public/                stylesheet and a little progressive-enhancement JavaScript
test/                  node:test suites
```

## Shop rules

- Prices are stored in pence and shown in pounds.
- Delivery is £3.99, free on orders of £40 or more (after discounts). Click & collect is free.
- One discount code per basket. Codes are not case sensitive.

| Code | Gives |
| ---- | ----- |
| `WELCOME10` | 10% off |
| `FIVEOFF` | £5 off when you spend £25 |
| `SNACKS20` | 20% off snacks |
| `FREEDEL` | free delivery on orders over £10 |
| `FLASH15` | 15% off, valid until the end of today (always "today" in the demo data) |
| `SPRING5` | expired |

- Payments use a sandbox: any 16 digit card number is accepted, numbers ending `0002` are declined.
- Customers see their orders on **Orders** after checking out, or by entering their email there.
  Demo history exists for `sam.taylor@example.com`.
