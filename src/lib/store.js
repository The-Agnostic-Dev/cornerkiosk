import { seedCoupons, seedOrders, seedProducts } from "./seed.js";

// Single in-memory store for the demo shop. Restarting the server reseeds it.
const state = {};

export function resetStore() {
  state.products = seedProducts();
  state.coupons = seedCoupons();
  state.orders = seedOrders(state.products);
  state.nextOrderId = state.orders.length + 1;
}
resetStore();

export const products = {
  all: () => state.products,
  byId: (id) => state.products.find((p) => p.id === Number(id)),
  bySlug: (slug) => state.products.find((p) => p.slug === slug),
  update(id, patch) {
    const product = products.byId(id);
    if (!product) return undefined;
    Object.assign(product, patch);
    return product;
  },
};

export const coupons = {
  all: () => state.coupons,
  find: (code) => state.coupons.find((c) => c.code === code),
};

export const orders = {
  all: () => state.orders,
  byId: (id) => state.orders.find((o) => o.id === Number(id)),
  forEmail: (email) => state.orders.filter((o) => o.email === email).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  insert(order) {
    const saved = { ...order, id: state.nextOrderId, number: `CK-${1000 + state.nextOrderId}` };
    state.nextOrderId += 1;
    state.orders.push(saved);
    return saved;
  },
};
