/**
 * 9.2 JWT Authentication — Tự viết header / payload / signature
 *
 * Minh họa toàn bộ vòng đời của một JWT (RFC 7519):
 * - Base64Url encode header + payload
 * - Ký signature bằng HMAC-SHA256 (node:crypto)
 * - Ghép thành JWT chuỗi "header.payload.signature"
 * - Verify (signature + exp) và xử lý token bị chỉnh sửa / hết hạn
 *
 * Lưu ý: đây là bản mô phỏng để học — trong thực tế hãy dùng thư viện
 * đã kiểm chứng như `jsonwebtoken` / `jose`.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

// ────────────────────────────── Base64Url ──────────────────────────────────
function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(part: string): string {
  return Buffer.from(part, "base64url").toString("utf8");
}

// ────────────────────────────── Types ──────────────────────────────────────
interface JwtHeader {
  alg: "HS256";
  typ: "JWT";
}

interface JwtClaims {
  sub: string;
  name: string;
  role: "user" | "admin";
  iat: number; // issued at (giây)
  exp: number; // expiration (giây)
}

type JwtVerifyResult =
  | { ok: true; claims: JwtClaims }
  | { ok: false; reason: string };

// ────────────────────────────── JWT functions ──────────────────────────────
const JWT_SECRET = "super-secret-key-256bit!";

function createJwt(claims: JwtClaims): string {
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };

  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(claims));

  const signingInput = `${headerPart}.${payloadPart}`;
  const signature = createHmac("sha256", JWT_SECRET)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
}

// Tách 3 phần và in ra cấu trúc
function inspectJwt(token: string): void {
  const [headerPart, payloadPart, signaturePart] = token.split(".");
  console.log(`   Header    : ${headerPart}`);
  console.log(`   Payload   : ${payloadPart}`);
  console.log(`   Signature : ${signaturePart?.slice(0, 24)}...`);
  console.log(`   ├─ header  (decode) : ${base64UrlDecode(headerPart ?? "")}`);
  console.log(`   ├─ payload (decode) : ${base64UrlDecode(payloadPart ?? "")}`);
}

function verifyJwt(token: string, secret: string): JwtVerifyResult {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "Cấu trúc token sai" };

  const [headerPart, payloadPart, signaturePart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;

  // Re-sign với secret để so sánh — nếu payload/header bị sửa → signature khác
  const expected = createHmac("sha256", secret).update(signingInput).digest();

  const actual = Buffer.from(signaturePart ?? "", "base64url");
  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    return { ok: false, reason: "Signature không hợp lệ (token đã bị sửa?)" };
  }

  const claims = JSON.parse(
    base64UrlDecode(payloadPart ?? "")
  ) as JwtClaims;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds >= claims.exp) {
    return { ok: false, reason: "Token đã hết hạn (expired)" };
  }

  return { ok: true, claims };
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== JWT Authentication Demo ===");
console.log("");

const nowSeconds = Math.floor(Date.now() / 1000);

console.log("1️⃣ Tạo JWT (header + payload + signature HS256):");
const validClaims: JwtClaims = {
  sub: "user-123",
  name: "Nguyen Son",
  role: "admin",
  iat: nowSeconds,
  exp: nowSeconds + 3600, // hết hạn sau 1 giờ
};
const validToken = createJwt(validClaims);
inspectJwt(validToken);
console.log("");

console.log("2️⃣ Verify token hợp lệ:");
const checkValid = verifyJwt(validToken, JWT_SECRET);
if (checkValid.ok) {
  console.log(`   ✅ Hợp lệ — xin chào ${checkValid.claims.name} (role: ${checkValid.claims.role})`);
}
console.log("");

console.log("3️⃣ Token bị attacker sửa payload (đổi name):");
const [h, , s] = validToken.split(".");
const forgedPayload = base64UrlEncode(
  JSON.stringify({ ...validClaims, name: "Attacker", role: "user" })
);
const forgedToken = `${h}.${forgedPayload}.${s}`;
const checkForged = verifyJwt(forgedToken, JWT_SECRET);
if (!checkForged.ok) console.log(`   ❌ ${checkForged.reason}`);
console.log("");

console.log("4️⃣ Token hết hạn (exp trong quá khứ):");
const expiredClaims: JwtClaims = {
  ...validClaims,
  exp: nowSeconds - 60, // hết hạn 60 giây trước
};
const expiredToken = createJwt(expiredClaims);
const checkExpired = verifyJwt(expiredToken, JWT_SECRET);
if (!checkExpired.ok) console.log(`   ❌ ${checkExpired.reason}`);
console.log("");

console.log("5️⃣ Verify với secret sai:");
const checkWrongSecret = verifyJwt(validToken, "wrong-secret!");
if (!checkWrongSecret.ok) console.log(`   ❌ ${checkWrongSecret.reason}`);
console.log("");

console.log("✅ JWT = signature đảm bảo toàn vẹn (không sửa được), exp đảm bảo hết hạn đúng lúc — server CHỈ cần secret để verify, không cần lưu session.");
export {};