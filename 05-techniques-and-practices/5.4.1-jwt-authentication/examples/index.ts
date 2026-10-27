/**
 * 5.4.1 JWT Authentication — Tự encode/verify JWT bằng node:crypto
 *
 * Minh họa vòng đời JWT (RFC 7519):
 * - Base64Url encode header + payload
 * - Ký signature bằng HMAC-SHA256
 * - Verify chữ ký + kiểm tra exp (hết hạn)
 * - Token bị sửa / secret sai / hết hạn → verify thất bại
 */

import { createHmac, timingSafeEqual } from "node:crypto";

// ─────────────────────────────── Helpers ────────────────────────────────────
function base64UrlEncode(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(part: string): string {
  return Buffer.from(part, "base64url").toString("utf8");
}

// ──────────────────────────────── JWT class ─────────────────────────────────
interface JwtTokenHeader {
  alg: "HS256";
  typ: "JWT";
}

interface JwtTokenPayload {
  sub: string;
  name: string;
  role: "user" | "admin";
  iat: number;
  exp: number;
}

type JwtVerifyResult =
  | { ok: true; payload: JwtTokenPayload }
  | { ok: false; reason: string };

class JwtToken {
  static create(payload: JwtTokenPayload, secret: string): string {
    const header: JwtTokenHeader = { alg: "HS256", typ: "JWT" };
    const headerPart = base64UrlEncode(JSON.stringify(header));
    const payloadPart = base64UrlEncode(JSON.stringify(payload));
    const signature = createHmac("sha256", secret)
      .update(`${headerPart}.${payloadPart}`)
      .digest("base64url");
    return `${headerPart}.${payloadPart}.${signature}`;
  }

  static verify(token: string, secret: string): JwtVerifyResult {
    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false, reason: "Cấu trúc token sai" };

    const [headerPart, payloadPart, signaturePart] = parts;
    const expected = createHmac("sha256", secret)
      .update(`${headerPart}.${payloadPart}`)
      .digest();

    const actual = Buffer.from(signaturePart ?? "", "base64url");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return { ok: false, reason: "Chữ ký không khớp — token bị chỉnh sửa hoặc secret sai" };
    }

    const payload = JSON.parse(base64UrlDecode(payloadPart ?? "")) as JwtTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) return { ok: false, reason: "Token đã hết hạn (expired)" };

    return { ok: true, payload };
  }

  static inspect(token: string): void {
    const parts = token.split(".");
    console.log(`   Header    : ${parts[0]}`);
    console.log(`   Payload   : ${parts[1]}`);
    console.log(`   Signature : ${parts[2]?.slice(0, 20)}...`);
    console.log(`   ├─ header  (decode): ${base64UrlDecode(parts[0] ?? "")}`);
    console.log(`   └─ payload (decode): ${base64UrlDecode(parts[1] ?? "")}`);
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== JWT Authentication Demo ===");
console.log("");

const JWT_SECRET = "my-ultra-secret-key";
const nowSeconds = Math.floor(Date.now() / 1000);

console.log("1️⃣ Tạo JWT (header.payload.signature):");
const validPayload: JwtTokenPayload = {
  sub: "user-42",
  name: "Nguyen Son",
  role: "admin",
  iat: nowSeconds,
  exp: nowSeconds + 3600,
};
const validToken = JwtToken.create(validPayload, JWT_SECRET);
JwtToken.inspect(validToken);
console.log("");

console.log("2️⃣ Verify token hợp lệ:");
const check = JwtToken.verify(validToken, JWT_SECRET);
if (check.ok) {
  console.log(`   ✅ Xin chào ${check.payload.name} (role: ${check.payload.role})`);
} else {
  console.log(`   ❌ ${check.reason}`);
}
console.log("");

console.log("3️⃣ Attacker SỬA payload (đổi role thành admin khi chưa có quyền):");
const parts = validToken.split(".");
const forgedPayload = base64UrlEncode(
  JSON.stringify({ ...validPayload, role: "user", name: "Attacker" })
);
const forgedToken = `${parts[0]}.${forgedPayload}.${parts[2]}`;
const checkForged = JwtToken.verify(forgedToken, JWT_SECRET);
if (!checkForged.ok) console.log(`   ❌ ${checkForged.reason}`);
console.log("");

console.log("4️⃣ Token ĐÃ HẾT HẠN (exp trong quá khứ):");
const expiredToken = JwtToken.create(
  { ...validPayload, exp: nowSeconds - 60 },
  JWT_SECRET
);
const checkExpired = JwtToken.verify(expiredToken, JWT_SECRET);
if (!checkExpired.ok) console.log(`   ❌ ${checkExpired.reason}`);
console.log("");

console.log("5️⃣ Verify bằng secret SAI:");
const checkWrongSecret = JwtToken.verify(validToken, "wrong-secret");
if (!checkWrongSecret.ok) console.log(`   ❌ ${checkWrongSecret.reason}`);
console.log("");

console.log("✅ JWT = chữ ký HMAC bảo đảm toàn vẹn (không sửa được payload) + exp quản lý hết hạn. Server chỉ cần secret để verify, không cần lưu session.");
export {};