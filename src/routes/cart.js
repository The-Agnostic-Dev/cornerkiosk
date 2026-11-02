import { Router } from "express";
import { addItem, applyCoupon, CartError, removeCoupon, removeItem, updateQuantity } from "../lib/cart.js";
import { CouponError } from "../lib/coupons.js";
import { priceCart, FREE_DELIVERY_THRESHOLD_PENCE } from "../lib/pricing.js";
import { flash } from "../lib/session.js";

const router = Router();

const back = (req, fallback = "/cart") => {
  const target = req.body?.returnTo;
  return typeof target === "string" && target.startsWith("/") && !target.startsWith("//") ? target : fallback;
};

router.get("/", (req, res) => {
  res.render("cart", {
    title: "Your basket",
    totals: priceCart(req.session.cart),
    coupon: req.session.cart.coupon,
    freeDeliveryFrom: FREE_DELIVERY_THRESHOLD_PENCE,
  });
});

router.post("/items", (req, res) => {
  try {
    const product = addItem(req.session.cart, req.body.productId, req.body.qty);
    flash(req, "success", `Added ${product.name} to your basket.`);
  } catch (err) {
    if (!(err instanceof CartError)) throw err;
    flash(req, "error", err.message);
  }
  res.redirect(back(req, "/"));
});

router.post("/items/:productId", (req, res) => {
  try {
    if (req.body.action === "remove") removeItem(req.session.cart, req.params.productId);
    else updateQuantity(req.session.cart, req.params.productId, req.body.qty);
  } catch (err) {
    if (!(err instanceof CartError)) throw err;
    flash(req, "error", err.message);
  }
  res.redirect("/cart");
});

router.post("/coupon", (req, res) => {
  try {
    if (req.body.action === "remove") {
      removeCoupon(req.session.cart);
    } else {
      const coupon = applyCoupon(req.session.cart, req.body.code);
      flash(req, "success", `${coupon.code} applied: ${coupon.description}.`);
    }
  } catch (err) {
    if (!(err instanceof CouponError)) throw err;
    flash(req, "error", err.message);
  }
  res.redirect("/cart");
});

export default router;
