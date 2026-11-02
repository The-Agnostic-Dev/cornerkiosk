import { products } from "./store.js";

export const DELIVERY_FEE_PENCE = 399;
export const FREE_DELIVERY_THRESHOLD_PENCE = 4000;

export function deliveryFee(method, goodsPence, coupon) {
  if (method === "collect") return 0;
  if (coupon?.kind === "delivery") return 0;
  if (goodsPence > FREE_DELIVERY_THRESHOLD_PENCE) return 0;
  return DELIVERY_FEE_PENCE;
}

export function priceLines(cart) {
  return cart.items
    .map((item) => {
      const product = products.byId(item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        unitPence: product.pricePence,
        qty: item.qty,
        stock: product.stock,
        lineTotalPence: product.pricePence * item.qty,
      };
    })
    .filter(Boolean);
}

/** Works out everything the basket and checkout pages show. */
export function priceCart(cart) {
  const lines = priceLines(cart);
  const subtotalPence = lines.reduce((sum, l) => sum + l.lineTotalPence, 0);
  const discountPence = Math.min(cart.coupon?.discountPence ?? 0, subtotalPence);
  const goodsPence = subtotalPence - discountPence;
  const deliveryPence = lines.length ? deliveryFee(cart.deliveryMethod, goodsPence, cart.coupon) : 0;
  return {
    lines,
    itemCount: lines.reduce((n, l) => n + l.qty, 0),
    subtotalPence,
    discountPence,
    couponCode: cart.coupon?.code ?? null,
    deliveryPence,
    totalPence: goodsPence + deliveryPence,
  };
}
