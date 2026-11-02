import { Router } from "express";
import { categoryBySlug, listProducts, stockLabel } from "../lib/catalog.js";
import { coupons, products } from "../lib/store.js";
import { todayISO } from "../lib/dates.js";

const router = Router();

router.get("/", (req, res) => {
  const { category, q, sort = "name", page } = req.query;
  const result = listProducts({ category, q, sort, page });
  const promo = coupons.all().find((c) => c.expiresOn === todayISO());
  res.render("catalog", {
    title: q ? `Search: ${q}` : (categoryBySlug(category)?.name ?? "All products"),
    category: categoryBySlug(category),
    q: q ?? "",
    sort,
    ...result,
    promo,
    stockLabel,
  });
});

router.get("/products/:slug", (req, res, next) => {
  const product = products.bySlug(req.params.slug);
  if (!product || !product.active) return next();
  res.render("product", { title: product.name, product, category: categoryBySlug(product.category), stockLabel });
});

export default router;
