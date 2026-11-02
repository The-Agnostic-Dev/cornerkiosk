import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { sessionMiddleware, takeFlash } from "./lib/session.js";
import { cartQuantity } from "./lib/cart.js";
import { formatMoney } from "./lib/money.js";
import { formatDateTime } from "./lib/dates.js";
import { categories } from "./lib/seed.js";
import shopRoutes from "./routes/shop.js";
import cartRoutes from "./routes/cart.js";
import checkoutRoutes from "./routes/checkout.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function createApp() {
  const app = express();
  app.set("view engine", "ejs");
  app.set("views", path.join(root, "views"));
  app.disable("x-powered-by");

  app.use(express.static(path.join(root, "public"), { maxAge: "1h" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(sessionMiddleware);

  app.locals.money = formatMoney;
  app.locals.formatDateTime = formatDateTime;
  app.locals.categories = categories;

  app.use((req, res, next) => {
    res.locals.cartCount = cartQuantity(req.session.cart);
    res.locals.flash = takeFlash(req);
    res.locals.path = req.path;
    res.locals.query = req.query;
    next();
  });

  app.use(shopRoutes);
  app.use("/cart", cartRoutes);
  app.use("/checkout", checkoutRoutes);
  app.use("/orders", orderRoutes);
  app.use("/admin", adminRoutes);

  app.get("/healthz", (_req, res) => res.json({ ok: true }));

  app.use((req, res) => {
    res.status(404).render("error", { title: "Page not found", message: "We couldn't find that page." });
  });

  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).render("error", { title: "Something went wrong", message: "Please try again in a moment." });
  });

  return app;
}
