import { timingSafeEqual } from "node:crypto";

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** HTTP basic auth for the back office. */
export function requireAdmin(req, res, next) {
  const user = process.env.ADMIN_USER ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "kiosk";
  const [scheme, encoded] = String(req.headers.authorization ?? "").split(" ");
  if (scheme === "Basic" && encoded) {
    const [u, ...rest] = Buffer.from(encoded, "base64").toString().split(":");
    if (safeEqual(u, user) && safeEqual(rest.join(":"), password)) return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Corner Kiosk admin"').status(401).send("Authentication required");
}
