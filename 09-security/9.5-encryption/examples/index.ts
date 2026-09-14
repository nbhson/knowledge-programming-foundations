/**
 * 9.5 Encryption — AES-256-GCM, SHA-256, hashing với salt
 *
 * Minh họa (chỉ dùng node:crypto - built-in):
 * - Hashing một-chiều (SHA-256) và lưu trữ password an toàn với salt
 * - Mã hóa đối xứng AES-256-GCM (encrypt / decrypt kèm auth tag)
 *
 * ⚠️ Trong thực tế lưu password hãy dùng bcrypt/argon2; AES-GCM ở đây
 * để minh họa mã hóa dữ liệu (data at rest).
 */

import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  pbkdf2Sync,
} from "node:crypto";

// ─────────────────────────── SHA-256 Hashing ───────────────────────────────
function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

// ─────────────────────── Password hashing với salt ─────────────────────────
interface PasswordHash {
  salt: string;
  hash: string;
}

// Thực hiện nhiều vòng PBKDF2 (chậm → khó brute force) với salt ngẫu nhiên
function hashPasswordWithSalt(password: string): PasswordHash {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function verifyPasswordWithSalt(
  password: string,
  stored: PasswordHash
): boolean {
  const candidate = pbkdf2Sync(
    password,
    stored.salt,
    100_000,
    32,
    "sha256"
  ).toString("hex");
  return candidate === stored.hash;
}

// ────────────────────────── AES-256-GCM ─────────────────────────────────────
const AES_ALGO = "aes-256-gcm";
const AES_KEY_SIZE = 32; // 256 bit
const AES_IV_SIZE = 12; // 96 bit cho GCM

interface AesCiphertext {
  iv: string;
  ciphertext: string;
  authTag: string;
}

function aesEncrypt(plaintext: string, key: Buffer): AesCiphertext {
  const iv = randomBytes(AES_IV_SIZE);
  const cipher = createCipheriv(AES_ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  console.log(`   🔑 IV: ${iv.toString("hex")}`);
  return {
    iv: iv.toString("hex"),
    ciphertext: encrypted.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

function aesDecrypt(enc: AesCiphertext, key: Buffer): string {
  const decipher = createDecipheriv(
    AES_ALGO,
    key,
    Buffer.from(enc.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(enc.authTag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(enc.ciphertext, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

// ─────────────────── Giả lập tấn công dictionary attack ────────────────────
function simulateDictionaryAttack(storedHash: string): string | null {
  const guesses = ["123456", "password", "hello123", "mySecureP@ssw0rd!"];
  for (const guess of guesses) {
    if (sha256Hex(guess) === storedHash) return guess;
  }
  return null;
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Encryption Demo ===");
console.log("");

console.log("1️⃣ SHA-256 (hashing một chiều):");
const message = "Hello, security!";
const hash1 = sha256Hex(message);
const hash2 = sha256Hex(message);
console.log(`   "${message}" → ${hash1}`);
console.log(`   Deterministic? ${hash1 === hash2} (cùng input → cùng output)`);
console.log("");
console.log("   ❌ SHA-256 nhanh → dính dictionary attack:");
console.log(`   SHA-256("123456") = ${sha256Hex("123456")}`);
const cracked = simulateDictionaryAttack(sha256Hex("123456"));
console.log(`   → Bị tìm ra trong từ điển: "${cracked}"`);
console.log("");

console.log("2️⃣ Hash password VỚI salt (PBKDF2, 100k vòng):");
const stored = hashPasswordWithSalt("mySecureP@ssw0rd!");
console.log(`   salt: ${stored.salt}`);
console.log(`   hash: ${stored.hash.slice(0, 40)}...`);
const verifyOk = verifyPasswordWithSalt("mySecureP@ssw0rd!", stored);
const verifyBad = verifyPasswordWithSalt("wrong-password", stored);
console.log(`   Verify đúng password  → ${verifyOk}`);
console.log(`   Verify sai password   → ${verifyBad}`);
console.log("");

console.log("3️⃣ AES-256-GCM (mã hóa đối xứng data at rest):");
const aesKey = randomBytes(AES_KEY_SIZE); // trong thực tế lấy từ KMS/Key Vault
console.log(`   🔑 AES key: ${aesKey.toString("hex")}`);
const secretData = "Số tài khoản: 123-456-789; balance: 1.000.000 VND";
console.log(`   Plaintext : ${secretData}`);
const encrypted = aesEncrypt(secretData, aesKey);
console.log(`   Ciphertext: ${encrypted.ciphertext.slice(0, 40)}...`);
console.log(`   Auth tag  : ${encrypted.authTag}`);
const decrypted = aesDecrypt(encrypted, aesKey);
console.log(`   Decrypt   : ${decrypted}`);
console.log("");

console.log("4️⃣ Giải mã với key SAI (tampered):");
const tampered = { ...encrypted, ciphertext: encrypted.ciphertext.slice(0, -2) + "ff" };
try {
  aesDecrypt(tampered, aesKey);
  console.log("   ⚠️ Không ném lỗi? (không nên xảy ra)");
} catch (error) {
  console.log(`   ❌ Decrypt thất bại: ${(error as Error).message}`); // GCM auth thất bại
}
console.log("");

console.log("✅ Hashing (một chiều) cho password với salt; AES-256-GCM (hai chiều) cho dữ liệu nhạy cảm + auth tag chống chỉnh sửa. Không bao giờ tự viết thuật toán mã hóa.");
export {};