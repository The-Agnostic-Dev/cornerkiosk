import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, parsePounds } from "../src/lib/money.js";
import { deliveryFee, priceCart, DELIVERY_FEE_PENCE } from "../src/lib/pricing.js";
import { discountFor, isExpired } from "../src/lib/coupons.js";
import { addItem, emptyCart, removeItem } from "../src/lib/cart.js";
import { resetStore } from "../src/lib/store.js";

describe("money", () => {
  it("formats pence as pounds", () => {
    assert.equal(formatMoney(1249), "£12.49");
    assert.equal(formatMoney(5), "£0.05");
  });

  it("parses pounds typed by staff", () => {
    assert.equal(parsePounds("2.49"), 249);
    assert.equal(parsePounds("£3"), 300);
    assert.equal(parsePounds("abc"), null);
  });
});

describe("delivery", () => {
  it("charges the standard fee on small orders", () => {
    assert.equal(deliveryFee("delivery", 1500, null), DELIVERY_FEE_PENCE);
  });
  it("is free for click and collect and well over the threshold", () => {
    assert.equal(deliveryFee("collect", 500, null), 0);
    assert.equal(deliveryFee("delivery", 6000, null), 0);
    assert.equal(deliveryFee("delivery", 1500, { kind: "delivery" }), 0);
  });
});

describe("coupons", () => {
  const lines = [
    { category: "snacks", lineTotalPence: 1000 },
    { category: "dairy", lineTotalPence: 500 },
  ];
  it("applies percentage discounts", () => {
    assert.equal(discountFor({ kind: "percent", value: 10 }, lines), 150);
  });
  it("limits category coupons to that category", () => {
    assert.equal(discountFor({ kind: "percent", value: 20, category: "snacks" }, lines), 200);
  });
  it("treats codes without an expiry date as current", () => {
    assert.equal(isExpired({ expiresOn: null }), false);
    assert.equal(isExpired({ expiresOn: "2020-01-31" }), true);
  });
  it("never discounts more than the basket", () => {
    assert.equal(discountFor({ kind: "fixed", value: 5000 }, lines), 1500);
  });
});

describe("cart", () => {
  beforeEach(() => resetStore());

  it("prices a basket", () => {
    const cart = emptyCart();
    addItem(cart, 6, 1); // Whole milk 2L, £1.65
    addItem(cart, 12, 1); // Sourdough loaf, £2.95
    const totals = priceCart(cart);
    assert.equal(totals.subtotalPence, 460);
    assert.equal(totals.deliveryPence, DELIVERY_FEE_PENCE);
    assert.equal(totals.totalPence, 460 + DELIVERY_FEE_PENCE);
  });

  it("refuses more than the stock level", () => {
    const cart = emptyCart();
    assert.throws(() => addItem(cart, 14, 4), /only have 3/);
  });

  it("refuses out of stock products", () => {
    assert.throws(() => addItem(emptyCart(), 10, 1), /out of stock/);
  });

  it("removes items", () => {
    const cart = emptyCart();
    addItem(cart, 6, 1);
    removeItem(cart, 6);
    assert.equal(priceCart(cart).lines.length, 0);
  });
});
