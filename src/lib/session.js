import { randomBytes } from "node:crypto";
import { emptyCart } from "./cart.js";

const COOKIE = "kiosk.sid";
const MAX_AGE_S = 60 * 60 * 24 * 14;
const sessions = new Map();

function readCookie(header, name) {
  for (const part of String(header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/** Minimal cookie session kept in memory (fine for a single-process shop). */
export function sessionMiddleware(req, res, next) {
  let id = readCookie(req.headers.cookie, COOKIE);
  if (!id || !sessions.has(id)) {
    id = randomBytes(18).toString("base64url");
    sessions.set(id, { cart: emptyCart(), flash: [], customerEmail: null });
    res.cookie(COOKIE, id, { httpOnly: true, sameSite: "lax", maxAge: MAX_AGE_S * 1000 });
  }
  req.session = sessions.get(id);
  next();
}

export function flash(req, type, message) {
  req.session.flash.push({ type, message });
}

export function takeFlash(req) {
  const messages = req.session.flash;
  req.session.flash = [];
  return messages;
}
