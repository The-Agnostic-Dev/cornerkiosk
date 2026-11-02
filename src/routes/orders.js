import { Router } from "express";
import { orders } from "../lib/store.js";

const router = Router();

router.get("/", (req, res) => {
  const email = req.session.customerEmail;
  res.render("orders", { title: "Your orders", email, orders: email ? orders.forEmail(email) : [] });
});

router.post("/lookup", (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  req.session.customerEmail = email || null;
  res.redirect("/orders");
});

router.get("/:id", (req, res, next) => {
  const order = orders.byId(req.params.id);
  // Orders are only visible to the session that placed or looked them up.
  if (!order || order.email !== req.session.customerEmail) return next();
  res.render("order", { title: `Order ${order.number}`, order, placed: req.query.placed === "1" });
});

export default router;
