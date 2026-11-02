import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listProducts, PER_PAGE, stockLabel } from "../src/lib/catalog.js";

describe("catalogue", () => {
  it("pages through all products", () => {
    const first = listProducts({ page: 1 });
    assert.equal(first.items.length, PER_PAGE);
    assert.equal(first.pageCount, Math.ceil(first.total / PER_PAGE));
  });

  it("filters by category", () => {
    const { items } = listProducts({ category: "bakery" });
    assert.ok(items.length > 0);
    assert.ok(items.every((p) => p.category === "bakery"));
  });

  it("searches names regardless of case", () => {
    const { items } = listProducts({ q: "MILK" });
    assert.ok(items.some((p) => p.name === "Whole milk 2L"));
  });

  it("sorts by price", () => {
    const { items } = listProducts({ category: "dairy", sort: "price-asc" });
    const prices = items.map((p) => p.pricePence);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  });

  it("labels stock levels", () => {
    assert.equal(stockLabel({ stock: 0 }), "Out of stock");
    assert.equal(stockLabel({ stock: 3 }), "Only 3 left");
    assert.equal(stockLabel({ stock: 30 }), "In stock");
  });
});
