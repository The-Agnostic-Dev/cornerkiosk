const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/** Formats an integer number of pence as pounds, e.g. 1249 -> "£12.49". */
export function formatMoney(pence) {
  return gbp.format(pence / 100);
}

/** Parses a pounds amount typed by a person ("2.49", "£2.49") into pence. */
export function parsePounds(input) {
  const cleaned = String(input ?? "").trim().replace(/^£/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}
