import { addDays, todayISO } from "./dates.js";

export const categories = [
  { slug: "fruit-veg", name: "Fruit & Veg" },
  { slug: "dairy", name: "Dairy & Eggs" },
  { slug: "bakery", name: "Bakery" },
  { slug: "drinks", name: "Drinks" },
  { slug: "snacks", name: "Snacks" },
  { slug: "cupboard", name: "Food Cupboard" },
  { slug: "household", name: "Household" },
];

// [name, category, price in pence, stock, description]
const rows = [
  ["Bananas (5 pack)", "fruit-veg", 95, 40, "Fairtrade bananas, ripe and ready."],
  ["Braeburn apples (6 pack)", "fruit-veg", 189, 25, "Crisp, sweet and sharp British apples."],
  ["Vine tomatoes 500g", "fruit-veg", 175, 18, "Sweet tomatoes on the vine."],
  ["Baby spinach 200g", "fruit-veg", 135, 4, "Washed and ready to eat."],
  ["Red onions 1kg", "fruit-veg", 99, 30, "Mild and sweet, great raw or roasted."],
  ["Whole milk 2L", "dairy", 165, 35, "Fresh British whole milk."],
  ["Semi-skimmed milk 1L", "dairy", 99, 28, "Fresh British semi-skimmed milk."],
  ["Free range eggs (12)", "dairy", 349, 12, "Large free range eggs."],
  ["Mature cheddar 400g", "dairy", 375, 15, "Rich and tangy West Country cheddar."],
  ["Greek style yoghurt 500g", "dairy", 149, 0, "Thick and creamy natural yoghurt."],
  ["Salted butter 250g", "dairy", 229, 20, "Creamy salted butter."],
  ["Sourdough loaf", "bakery", 295, 8, "Baked fresh every morning."],
  ["Wholemeal bread 800g", "bakery", 135, 22, "Soft sliced wholemeal."],
  ["All butter croissants (4)", "bakery", 199, 3, "Flaky, golden, all butter."],
  ["Crumpets (6)", "bakery", 89, 16, "Toast them, butter them."],
  ["Sparkling water 6 x 500ml", "drinks", 300, 14, "Lightly sparkling spring water."],
  ["Orange juice 1L", "drinks", 210, 19, "Smooth, not from concentrate."],
  ["Cola 4 x 330ml", "drinks", 425, 24, "Classic cola cans."],
  ["Ground coffee 227g", "drinks", 500, 30, "Medium roast, smooth and nutty."],
  ["English breakfast tea (80)", "drinks", 289, 26, "Strong everyday tea bags."],
  ["Oat drink 1L", "drinks", 185, 17, "Barista edition, foams well."],
  ["Ginger beer 750ml", "drinks", 135, 10, "Fiery traditional ginger beer."],
  ["Apple juice 1L", "drinks", 165, 13, "Cloudy pressed apple juice."],
  ["Lemonade 2L", "drinks", 129, 21, "Cloudy, refreshing lemonade."],
  ["Still water 6 x 1.5L", "drinks", 270, 9, "Natural mineral water."],
  ["Sea salt crisps 150g", "snacks", 225, 33, "Hand cooked sea salt crisps."],
  ["Milk chocolate bar 100g", "snacks", 150, 45, "Smooth milk chocolate."],
  ["Salted peanuts 200g", "snacks", 115, 27, "Roasted and salted."],
  ["Digestive biscuits 400g", "snacks", 129, 23, "The classic dunker."],
  ["Basmati rice 1kg", "cupboard", 249, 16, "Fragrant long grain rice."],
  ["Spaghetti 500g", "cupboard", 85, 38, "Durum wheat pasta."],
  ["Chopped tomatoes 400g", "cupboard", 65, 50, "Italian chopped tomatoes."],
  ["Baked beans 415g", "cupboard", 99, 42, "In a rich tomato sauce."],
  ["Washing up liquid 450ml", "household", 129, 15, "Cuts through grease."],
  ["Toilet roll (9 pack)", "household", 600, 11, "Soft and strong 3 ply."],
  ["Laundry capsules (24)", "household", 750, 6, "Bio capsules, 24 washes."],
];

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function seedProducts() {
  return rows.map(([name, category, pricePence, stock, description], i) => ({
    id: i + 1,
    slug: slugify(name),
    name,
    category,
    pricePence,
    stock,
    description,
    active: true,
  }));
}

export function seedCoupons(today = todayISO()) {
  return [
    { code: "WELCOME10", kind: "percent", value: 10, description: "10% off your order", expiresOn: null, minSpendPence: 0 },
    { code: "FIVEOFF", kind: "fixed", value: 500, description: "£5 off when you spend £25", expiresOn: null, minSpendPence: 2500 },
    { code: "SNACKS20", kind: "percent", value: 20, category: "snacks", description: "20% off snacks", expiresOn: null, minSpendPence: 0 },
    { code: "FREEDEL", kind: "delivery", value: 0, description: "Free delivery", expiresOn: null, minSpendPence: 1000 },
    { code: "FLASH15", kind: "percent", value: 15, description: "15% off, today only", expiresOn: today, minSpendPence: 0 },
    { code: "SPRING5", kind: "fixed", value: 500, description: "£5 off (spring offer)", expiresOn: addDays(today, -150), minSpendPence: 2000 },
  ];
}

export function seedOrders(products, today = todayISO()) {
  const byName = (n) => products.find((p) => p.name === n);
  const make = (id, daysAgo, email, name, items, method) => {
    const lines = items.map(([n, qty]) => {
      const p = byName(n);
      return { productId: p.id, name: p.name, unitPence: p.pricePence, qty, lineTotalPence: p.pricePence * qty };
    });
    const subtotalPence = lines.reduce((s, l) => s + l.lineTotalPence, 0);
    const deliveryPence = method === "collect" || subtotalPence >= 4000 ? 0 : 399;
    return {
      id: id,
      number: `CK-${String(1000 + id)}`,
      email,
      customerName: name,
      address: method === "collect" ? "" : "12 Elm Row, Leeds LS6 2AB",
      deliveryMethod: method,
      lines,
      subtotalPence,
      discountPence: 0,
      couponCode: null,
      deliveryPence,
      totalPence: subtotalPence + deliveryPence,
      status: daysAgo > 1 ? "Delivered" : "Preparing",
      createdAt: new Date(`${addDays(today, -daysAgo)}T10:30:00Z`).toISOString(),
    };
  };
  return [
    make(1, 9, "sam.taylor@example.com", "Sam Taylor", [["Whole milk 2L", 2], ["Sourdough loaf", 1], ["Free range eggs (12)", 1]], "delivery"),
    make(2, 4, "sam.taylor@example.com", "Sam Taylor", [["Ground coffee 227g", 2], ["Toilet roll (9 pack)", 1], ["Cola 4 x 330ml", 2]], "delivery"),
    make(3, 1, "priya.n@example.com", "Priya Natarajan", [["Bananas (5 pack)", 1], ["Crumpets (6)", 2]], "collect"),
  ];
}
