import { products } from "./store.js";
import { categories } from "./seed.js";

export const PER_PAGE = 9;
const SNAPSHOT_TTL_MS = 10 * 60 * 1000;

// The shop front is read far more often than stock or prices change, so the
// listing works from a snapshot of active products that is rebuilt when stale.
let snapshot = null;

function activeProducts() {
  if (!snapshot || Date.now() - snapshot.takenAt > SNAPSHOT_TTL_MS) {
    snapshot = {
      takenAt: Date.now(),
      items: products
        .all()
        .filter((p) => p.active)
        .map((p) => ({ ...p })),
    };
  }
  return snapshot.items;
}

export function invalidateCatalogue() {
  snapshot = null;
}

export function categoryBySlug(slug) {
  return categories.find((c) => c.slug === slug);
}

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  "price-asc": (a, b) => a.pricePence - b.pricePence,
  "price-desc": (a, b) => b.pricePence - a.pricePence,
};

export function listProducts({ category, q, sort = "name", page = 1 } = {}) {
  let items = activeProducts();
  if (category) items = items.filter((p) => p.category === category);

  const term = (q ?? "").trim().toLowerCase();
  if (term) {
    items = items.filter((p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
  }

  items = [...items].sort(SORTS[sort] ?? SORTS.name);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(Math.max(1, Number.parseInt(page, 10) || 1), pageCount);
  const start = (current - 1) * PER_PAGE;

  return {
    items: items.slice(start, start + PER_PAGE),
    total,
    page: current,
    pageCount,
  };
}

export function stockLabel(product) {
  if (product.stock <= 0) return "Out of stock";
  if (product.stock <= 5) return `Only ${product.stock} left`;
  return "In stock";
}
