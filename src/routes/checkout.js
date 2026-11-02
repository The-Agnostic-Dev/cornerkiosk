import { Router } from "express";
import { CheckoutError, placeOrder } from "../lib/orders.js";
import { PaymentError } from "../lib/payments.js";
import { priceCart } from "../lib/pricing.js";

const router = Router();

function renderCheckout(req, res, { values = {}, errors = {}, error = null, status = 200 } = {}) {
  const cart = req.session.cart;
  if (values.deliveryMethod) cart.deliveryMethod = values.deliveryMethod === "collect" ? "collect" : "delivery";
  res.status(status).render("checkout", {
    title: "Checkout",
    totals: priceCart(cart),
    method: cart.deliveryMethod,
    values: { email: req.session.customerEmail ?? "", ...values },
    errors,
    error,
  });
}

router.get("/", (req, res) => {
  if (req.session.cart.items.length === 0) return res.redirect("/cart");
  renderCheckout(req, res);
});

// The checkout page submits with fetch (see public/app.js) so it can show a
// "processing payment" state; plain form posts still work without JavaScript.
const wantsJson = (req) => req.get("Accept")?.includes("application/json");

router.post("/", async (req, res) => {
  try {
    const order = await placeOrder(req.session, req.body);
    const next = `/orders/${order.id}?placed=1`;
    if (wantsJson(req)) return res.json({ redirect: next });
    res.redirect(303, next);
  } catch (err) {
    const status = err instanceof CheckoutError ? 422 : err instanceof PaymentError ? 402 : null;
    if (!status) throw err;
    const fields = err.fields ?? {};
    if (wantsJson(req)) return res.status(status).json({ error: err.message, fields });
    renderCheckout(req, res, { values: req.body, errors: fields, error: err.message, status });
  }
});

export default router;
