/**
 * 5.4 Security Techniques — Tổng quan các kỹ thuật bảo mật cốt lõi
 *
 * Minh họa nhanh 4 kỹ thuật chính (chi tiết ở từng leaf 5.4.1-5.4.5):
 * - JWT: tạo + xác thực token chữ ký HMAC
 * - XSS: escape + sanitize input trước khi hiển thị
 * - CSRF: token + SameSite chống request giả mạo
 * - Password: hashing với salt (PBKDF2) — không lưu plaintext
 */

import { createHash, pbkdf2Sync, randomBytes, createHmac, timingSafeEqual } from "node:crypto";

// ──────────────────────────── Password hashing ──────────────────────────────
interface SecurityHashResult {
  salt: string;
  hash: string;
}

function hashPasswordWithSalt(password: string): SecurityHashResult {
  const salt = randomBytes(8).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10_000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function verifyPasswordWithSalt(password: string, stored: SecurityHashResult): boolean {
  const candidate = pbkdf2Sync(password, stored.salt, 10_000, 32, "sha256").toString("hex");
  return candidate === stored.hash;
}

// ──────────────────────────────── JWT mini ──────────────────────────────────
interface JwtMiniClaims {
  sub: string;
  role: string;
  exp: number;
}

function createSignedToken(claims: JwtMiniClaims, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function verifySignedToken(token: string, secret: string, nowSeconds: number): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const expected = createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest();
  const actual = Buffer.from(parts[2] ?? "", "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  const claims = JSON.parse(Buffer.from(parts[1] ?? "", "base64url").toString("utf8")) as JwtMiniClaims;
  return nowSeconds < claims.exp;
}

// ──────────────────────────────── XSS mini ──────────────────────────────────
function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return input.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

// ──────────────────────────────── CSRF mini ─────────────────────────────────
class SecurityCsrfManager {
  private readonly tokens = new Set<string>();

  issue(): string {
    const token = randomBytes(16).toString("hex");
    this.tokens.add(token);
    return token;
  }

  validate(token: string | null): boolean {
    return token !== null && this.tokens.has(token);
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Security Techniques Demo ===");
console.log("");

console.log("1️⃣ Password hashing với salt (không lưu plaintext):");
const storedPassword = hashPasswordWithSalt("mySecret123!");
console.log(`   salt = ${storedPassword.salt}`);
console.log(`   hash (PBKDF2) = ${storedPassword.hash.slice(0, 32)}...`);
console.log(`   Verify đúng  : ${verifyPasswordWithSalt("mySecret123!", storedPassword)}`);
console.log(`   Verify sai   : ${verifyPasswordWithSalt("wrong", storedPassword)}`);
console.log(`   SHA-256("mySecret123!") = ${createHash("sha256").update("mySecret123!").digest("hex").slice(0, 16)}...`);
console.log("");

console.log("2️⃣ JWT mini — ký + verify chữ ký HMAC, kiểm tra hết hạn:");
const secret = "security-demo-secret";
const now = Math.floor(Date.now() / 1000);
const token = createSignedToken({ sub: "u-1", role: "admin", exp: now + 3600 }, secret);
console.log(`   Token = ${token.slice(0, 60)}...`);
console.log(`   Verify token hợp lệ      : ${verifySignedToken(token, secret, now)}`);
const forged = createSignedToken({ sub: "u-1", role: "admin", exp: now - 10 }, secret);
console.log(`   Verify token ĐÃ HẾT HẠN : ${verifySignedToken(forged, secret, now)}`);
console.log(`   Verify với secret SAI    : ${verifySignedToken(token, "wrong-secret", now)}`);
console.log("");

console.log("3️⃣ XSS — escape HTML input của user:");
const malicious = `<script>alert('hack')</script>`;
console.log(`   Input gốc : ${malicious}`);
console.log(`   Escaped   : ${escapeHtml(malicious)}`);
console.log("");

console.log("4️⃣ CSRF — token phải hợp lệ mới được xử lý:");
const csrf = new SecurityCsrfManager();
const goodToken = csrf.issue();
const fakeToken = "attacker-token";
console.log(`   Request kèm token hợp lệ   → cho phép: ${csrf.validate(goodToken)}`);
console.log(`   Request kèm token giả lập  → chặn    : ${csrf.validate(fakeToken)}`);
console.log("");

console.log("✅ Security có nhiều lớp: hashing password với salt, JWT ký chuẩn, escape XSS, CSRF token — kết hợp thành phòng thủ chiều sâu. Chi tiết xem các leaf 5.4.1 → 5.4.5.");
export {};