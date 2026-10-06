/**
 * 9.8 Password Hashing — bcrypt/argon2 khái niệm, salt/pepper, mô phỏng bằng node:crypto scrypt
 *
 * Minh họa (CHỈ dùng node built-in, không deps ngoài):
 * - hashPassword: salt ngẫu nhiên + scrypt (cố tình chậm).
 * - verify: scrypt lại + timingSafeEqual.
 * - So sánh với MD5 (nhanh → dễ crack) để thấy khác biệt.
 *
 * Chạy: npx ts-node examples/index.ts
 */
import { scryptSync, randomBytes, timingSafeEqual, createHash } from "node:crypto";

// ─────────────────────────── Hash/verify ───────────────────────────
function hashPassword(password: string, pepper: string): string {
  const salt = randomBytes(16).toString("hex");
  // N=16384, r=8, p=1: ~100ms — cố tình chậm để chống brute-force
  const key = scryptSync(pepper + password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString("hex")}`;
}

function verifyPassword(password: string, pepper: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const salt = parts[4];
  const expected = Buffer.from(parts[5], "hex");
  const actual = scryptSync(pepper + password, salt, 64, { N: 16384, r: 8, p: 1 });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected); // so sánh hằng thời gian
}

// MD5 minh họa cái SAI (chỉ cho demo, KHÔNG dùng cho password)
function md5(s: string): string {
  return createHash("md5").update(s).digest("hex");
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Password Hashing Demo (node:crypto scrypt) ===\n");
  const pepper = "server-side-pepper-tu-KMS";

  console.log("1️⃣ Cùng password, hash 2 lần (salt ngẫu nhiên → khác nhau):");
  const h1 = hashPassword("MatKhauManh123!", pepper);
  const h2 = hashPassword("MatKhauManh123!", pepper);
  console.log(`   ${h1.slice(0, 44)}...`);
  console.log(`   ${h2.slice(0, 44)}...`);
  console.log(`   → khác nhau: ${h1 !== h2 ? "✅ (rainbow table vô dụng)" : "❌"}`);

  console.log("\n2️⃣ Verify:");
  console.log(`   đúng password → ${verifyPassword("MatKhauManh123!", pepper, h1) ? "✅" : "❌"}`);
  console.log(`   sai password  → ${verifyPassword("sai-pass", pepper, h1) ? "❌" : "⛔ từ chối"}`);
  console.log(`   sai pepper    → ${verifyPassword("MatKhauManh123!", "pepper-sai", h1) ? "❌" : "⛔ từ chối (DB leak alone chưa đủ)"}`);

  console.log("\n3️⃣ Vì sao KHÔNG dùng MD5/SHA cho password:");
  const t0 = Date.now();
  for (let i = 0; i < 10000; i++) md5(`guess-${i}`);
  console.log(`   MD5: 10.000 hash trong ${Date.now() - t0}ms (GPU làm hàng TỶ/s → brute-force dễ)`);
  console.log(`   scrypt: 1 hash ~100ms → 10.000 hash ≈ 17 phút trên cùng máy`);

  console.log("\n✅ Bài học: production dùng argon2id/bcrypt; demo này dùng scrypt built-in. Luôn salt + pepper + timing-safe compare.");
}

main();

export {};
