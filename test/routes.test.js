import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

process.env.PAYMENT_LATENCY_MS = "0";
const { createApp } = await import("../src/app.js");

describe("shop pages", () => {
  const app = createApp();

  it("shows the catalogue", async () => {
    const res = await request(app).get("/").expect(200);
    assert.match(res.text, /All products/);
    assert.match(res.text, /Bananas \(5 pack\)/);
  });

  it("shows a product page", async () => {
    const res = await request(app).get("/products/sourdough-loaf").expect(200);
    assert.match(res.text, /Baked fresh every morning/);
    assert.match(res.text, /£2\.95/);
  });

  it("returns 404 for unknown products", async () => {
    await request(app).get("/products/caviar").expect(404);
  });
});

describe("basket and checkout", () => {
  const app = createApp();
  const agent = request.agent(app);

  before(async () => {
    await agent.get("/");
  });

  it("adds a product to the basket", async () => {
    await agent.post("/cart/items").type("form").send({ productId: 12, qty: 1 }).expect(302);
    const res = await agent.get("/cart").expect(200);
    assert.match(res.text, /Sourdough loaf/);
    assert.match(res.text, /class="grand-total"><td>Total<\/td><td class="num">£6\.94/);
  });

  it("rejects an unknown discount code", async () => {
    await agent.post("/cart/coupon").type("form").send({ code: "NOPE" }).expect(302);
    const res = await agent.get("/cart");
    assert.match(res.text, /don(&#39;|')t recognise that code/);
  });

  it("asks for missing checkout details", async () => {
    const res = await agent.post("/checkout").type("form").send({ name: "", email: "x" }).expect(422);
    assert.match(res.text, /Please enter your name/);
  });

  it("places an order and empties the basket", async () => {
    const res = await agent
      .post("/checkout")
      .type("form")
      .send({ name: "Ann Lee", email: "ann@example.com", deliveryMethod: "collect", cardNumber: "4242424242424242" })
      .expect(303);
    assert.match(res.headers.location, /^\/orders\/\d+\?placed=1$/);
    const order = await agent.get(res.headers.location).expect(200);
    assert.match(order.text, /Your order has been placed/);
    assert.match(order.text, /Total paid<\/td><td class="num">£2\.95/);
    const cart = await agent.get("/cart");
    assert.match(cart.text, /Your basket is empty/);
  });

  it("declines the test decline card", async () => {
    await agent.post("/cart/items").type("form").send({ productId: 6, qty: 1 });
    const res = await agent
      .post("/checkout")
      .type("form")
      .send({ name: "Ann Lee", email: "ann@example.com", deliveryMethod: "collect", cardNumber: "4000000000000002" })
      .expect(402);
    assert.match(res.text, /card was declined/);
  });
});

describe("admin", () => {
  const app = createApp();
  const auth = "Basic " + Buffer.from("admin:kiosk").toString("base64");

  it("requires a password", async () => {
    await request(app).get("/admin/products").expect(401);
  });

  it("lists products", async () => {
    const res = await request(app).get("/admin/products").set("Authorization", auth).expect(200);
    assert.match(res.text, /Laundry capsules/);
  });

  it("validates the product form", async () => {
    const res = await request(app)
      .post("/admin/products/1")
      .set("Authorization", auth)
      .type("form")
      .send({ name: "Bananas", category: "fruit-veg", price: "free", stock: "10" })
      .expect(422);
    assert.match(res.text, /Enter a price in pounds/);
  });

  it("saves product changes", async () => {
    await request(app)
      .post("/admin/products/2")
      .set("Authorization", auth)
      .type("form")
      .send({ name: "Braeburn apples (6 pack)", description: "Crisp", category: "fruit-veg", price: "1.99", stock: "20", active: "on" })
      .expect(302);
    const res = await request(app).get("/products/braeburn-apples-6-pack").expect(200);
    assert.match(res.text, /£1\.99/);
  });
});
