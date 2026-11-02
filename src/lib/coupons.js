import { coupons } from "./store.js";

export class CouponError extends Error {}

/** Looks up a code typed by a customer and checks it can be used today. */
export function findUsableCoupon(code, subtotalPence, now = new Date()) {
  const coupon = coupons.find(String(code ?? "").trim());
  if (!coupon) throw new CouponError("Sorry, we don't recognise that code.");

  if (subtotalPence < coupon.minSpendPence) {
    throw new CouponError(`${coupon.code} needs a minimum spend of £${(coupon.minSpendPence / 100).toFixed(2)}.`);
  }
  if (isExpired(coupon, now)) {
    throw new CouponError(`${coupon.code} has expired.`);
  }
  return coupon;
}

/** Discount in pence that a coupon gives on the given priced lines. */
export function discountFor(coupon, lines) {
  if (!coupon) return 0;
  const eligible = lines.filter((l) => !coupon.category || l.category === coupon.category);
  const base = eligible.reduce((sum, l) => sum + l.lineTotalPence, 0);
  switch (coupon.kind) {
    case "percent":
      return Math.round((base * coupon.value) / 100);
    case "fixed":
      return Math.min(coupon.value, base);
    default:
      return 0;
  }
}

/** Codes can be used until the end of their expiry date. */
export function isExpired(coupon, now = new Date()) {
  if (!coupon.expiresOn) return false;
  return new Date(coupon.expiresOn) < now;
}
