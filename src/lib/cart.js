import { products } from "./store.js";
import { discountFor, findUsableCoupon } from "./coupons.js";
import { priceLines } from "./pricing.js";

export class CartError extends Error {}

export function emptyCart() {
  return { items: [], coupon: null, deliveryMethod: "delivery" };
}

export function addItem(cart, productId, rawQty) {
  const product = products.byId(productId);
  if (!product || !product.active) throw new CartError("That product isn't available.");
  const qty = Number.parseInt(rawQty ?? "1", 10);
  if (!Number.isInteger(qty) || qty < 1) throw new CartError("Please choose a quantity of 1 or more.");

  const existing = cart.items.find((i) => i.productId === product.id);
  const already = existing?.qty ?? 0;
  if (already + qty > product.stock) {
    throw new CartError(
      product.stock === 0 ? `${product.name} is out of stock.` : `Sorry, we only have ${product.stock} of ${product.name}.`,
    );
  }
  if (existing) existing.qty += qty;
  else cart.items.push({ productId: product.id, qty });
  return product;
}

export function updateQuantity(cart, productId, rawQty) {
  const item = cart.items.find((i) => i.productId === Number(productId));
  if (!item) throw new CartError("That item is no longer in your basket.");
  const qty = Number.parseInt(rawQty, 10);
  if (Number.isNaN(qty)) throw new CartError("Please enter a number.");
  if (qty === 0) return removeItem(cart, productId);

  const product = products.byId(item.productId);
  if (qty > product.stock) throw new CartError(`Sorry, we only have ${product.stock} of ${product.name}.`);
  item.qty = qty;
}

export function removeItem(cart, productId) {
  cart.items = cart.items.filter((i) => i.productId !== Number(productId));
  if (cart.items.length === 0) cart.coupon = null;
}

export function applyCoupon(cart, code) {
  const lines = priceLines(cart);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalPence, 0);
  const coupon = findUsableCoupon(code, subtotal);
  cart.coupon = {
    code: coupon.code,
    kind: coupon.kind,
    description: coupon.description,
    discountPence: discountFor(coupon, lines),
  };
  return cart.coupon;
}

export function removeCoupon(cart) {
  cart.coupon = null;
}

export function cartQuantity(cart) {
  return cart.items.length;
}
