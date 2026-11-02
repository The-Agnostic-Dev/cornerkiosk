import { randomUUID } from "node:crypto";

const LATENCY_MS = Number(process.env.PAYMENT_LATENCY_MS ?? 600);

export class PaymentError extends Error {}

/**
 * Test-mode card authorisation. Behaves like the real provider's sandbox:
 * takes a moment to answer and declines cards ending in 0002.
 */
export async function authorise({ amountPence, cardNumber }) {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  const digits = String(cardNumber ?? "").replace(/\s+/g, "");
  if (!/^\d{16}$/.test(digits)) throw new PaymentError("Please enter a 16 digit card number.");
  if (digits.endsWith("0002")) throw new PaymentError("Your card was declined.");
  return { id: `pay_${randomUUID().slice(0, 12)}`, amountPence, last4: digits.slice(-4) };
}
