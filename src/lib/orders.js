import { orders, products } from "./store.js";
import { priceCart } from "./pricing.js";
import { authorise } from "./payments.js";
import { invalidateCatalogue } from "./catalog.js";
import { emptyCart } from "./cart.js";

export class CheckoutError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.fields = fields;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCheckout(body) {
  const fields = {};
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const method = body.deliveryMethod === "collect" ? "collect" : "delivery";
  const address = String(body.address ?? "").trim();

  if (name.length < 2) fields.name = "Please enter your name.";
  if (!EMAIL.test(email)) fields.email = "Please enter a valid email address.";
  if (method === "delivery" && address.length < 6) fields.address = "Please enter a delivery address.";
  return { fields, value: { name, email, method, address, cardNumber: body.cardNumber } };
}

/** Takes payment for the session's basket and turns it into an order. */
export async function placeOrder(session, body) {
  const { fields, value } = validateCheckout(body);
  if (Object.keys(fields).length) throw new CheckoutError("Please check the highlighted fields.", fields);

  const cart = session.cart;
  cart.deliveryMethod = value.method;
  const totals = priceCart(cart);
  if (totals.lines.length === 0) throw new CheckoutError("Your basket is empty.");

  for (const line of totals.lines) {
    if (line.qty > line.stock) {
      throw new CheckoutError(`Sorry, we only have ${line.stock} of ${line.name} left. Please update your basket.`);
    }
  }

  const payment = await authorise({ amountPence: totals.totalPence, cardNumber: value.cardNumber });

  for (const line of totals.lines) {
    const product = products.byId(line.productId);
    product.stock = Math.max(0, product.stock - line.qty);
  }
  invalidateCatalogue();

  const order = orders.insert({
    email: value.email,
    customerName: value.name,
    address: value.method === "collect" ? "" : value.address,
    deliveryMethod: value.method,
    lines: totals.lines.map((l) => ({
      productId: l.productId,
      name: l.name,
      unitPence: l.unitPence,
      qty: l.qty,
      lineTotalPence: l.lineTotalPence,
    })),
    subtotalPence: totals.subtotalPence,
    discountPence: totals.discountPence,
    couponCode: totals.couponCode,
    deliveryPence: totals.deliveryPence,
    totalPence: totals.totalPence,
    paymentId: payment.id,
    status: "Preparing",
    createdAt: new Date().toISOString(),
  });

  session.cart = emptyCart();
  session.customerEmail = order.email;
  return order;
}
