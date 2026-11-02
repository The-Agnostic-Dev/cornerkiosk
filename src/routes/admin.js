import { Router } from "express";
import { requireAdmin } from "../lib/auth.js";
import { products } from "../lib/store.js";
import { parsePounds } from "../lib/money.js";
import { categories } from "../lib/seed.js";
import { stockLabel } from "../lib/catalog.js";

const router = Router();
router.use(requireAdmin);

router.get("/", (_req, res) => res.redirect("/admin/products"));

router.get("/products", (req, res) => {
  const list = [...products.all()].sort((a, b) => a.name.localeCompare(b.name));
  res.render("admin/products", { title: "Products", products: list, stockLabel, saved: req.query.saved });
});

router.get("/products/:id/edit", (req, res, next) => {
  const product = products.byId(req.params.id);
  if (!product) return next();
  res.render("admin/edit", { title: `Edit ${product.name}`, product, values: null, errors: {} });
});

function parseProductForm(body) {
  const errors = {};
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const category = String(body.category ?? "");
  const pricePence = parsePounds(body.price);
  const stock = Number(String(body.stock ?? "").trim());

  if (name.length < 2) errors.name = "Name is required.";
  if (!categories.some((c) => c.slug === category)) errors.category = "Choose a category.";
  if (pricePence === null || pricePence <= 0) errors.price = "Enter a price in pounds, e.g. 2.49";
  if (!Number.isInteger(stock) || stock < 0) errors.stock = "Stock must be a whole number, 0 or more.";

  return { errors, patch: { name, description, category, pricePence, stock, active: body.active === "on" } };
}

router.post("/products/:id", (req, res, next) => {
  const product = products.byId(req.params.id);
  if (!product) return next();

  const { errors, patch } = parseProductForm(req.body);
  if (Object.keys(errors).length) {
    return res.status(422).render("admin/edit", { title: `Edit ${product.name}`, product, values: req.body, errors });
  }
  products.update(product.id, patch);
  res.redirect(`/admin/products?saved=${product.id}`);
});

export default router;
