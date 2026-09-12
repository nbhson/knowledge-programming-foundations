# 🔐 9.5 Encryption

> **Encryption** là quá trình biến đổi dữ liệu thành dạng không thể đọc được nếu không có khóa giải mã.

```
┌─────────────────────────────────────────────────────────────┐
│              ENCRYPTION TYPES                               │
├──────────────────────┬──────────────────────────────────────┤
│ Symmetric (Đối xứng) │ Asymmetric (Bất đối xứng)             │
├──────────────────────┼──────────────────────────────────────┤
│  1 khóa (shared)     │  2 khóa (public + private)           │
│  Nhanh               │  Chậm hơn                            │
│  AES-256, ChaCha20   │  RSA, ECC, Ed25519                  │
│  Dùng cho: data at   │  Dùng cho: key exchange, digital    │
│            rest      │            signatures                 │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 📐 Symmetric Encryption (AES-256-GCM)

```
┌─────────────────────────────────────────────────────────────┐
│             SYMMETRIC ENCRYPTION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Alice                     Bob                              │
│    │                        │                               │
│    │  Key (shared) ←────────┤                               │
│    │                        │                               │
│    │── Encrypt(plaintext) ──►│   plaintext + key → ciphertext│
│    │                        │                               │
│    │◄── Ciphertext ──────────│   ciphertext + key → plaintext│
│    │                        │                               │
└─────────────────────────────────────────────────────────────┘
```

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_SIZE = 32; // 256 bits
const IV_SIZE = 12;  // 96 bits for GCM

// ✅ Encrypt
function encrypt(plaintext: string, key: Buffer): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = randomBytes(IV_SIZE);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'buffer');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { ciphertext: encrypted, iv, authTag };
}

// ✅ Decrypt
function decrypt(
  ciphertext: Buffer,
  iv: Buffer,
  authTag: Buffer,
  key: Buffer
): string {
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'buffer', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Usage
const key = randomBytes(KEY_SIZE);
const { ciphertext, iv, authTag } = encrypt('Secret message', key);
const plaintext = decrypt(ciphertext, iv, authTag, key);
console.log(plaintext); // "Secret message"
```

---

## 📐 Asymmetric Encryption (RSA)

```
┌─────────────────────────────────────────────────────────────┐
│           ASYMMETRIC: Key Pair                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Public Key (khóa công khai)      Private Key (khóa bí mật) │
│  ├── Gửi cho bất kỳ ai            ├── Chỉ chủ sở hữu mới có │
│  ├── Dùng để ENCRYPT              ├── Dùng để DECRYPT       │
│  └── Ai cũng có thể đọc           └── Giữ bí mật tuyệt đối  │
│                                                             │
│  Encrypt:  plaintext + public_key  → ciphertext             │
│  Decrypt:  ciphertext + private_key → plaintext             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```typescript
import { generateKeyPair, encrypt as rsaEncrypt, decrypt as rsaDecrypt } from 'crypto';

// Generate key pair
const { publicKey, privateKey } = await generateKeyPair('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Encrypt với public key
const plaintext = 'Sensitive data';
const encrypted = rsaEncrypt(
  Buffer.from(plaintext, 'utf8'),
  publicKey
);
console.log(encrypted.toString('base64'));

// Decrypt với private key
const decrypted = rsaDecrypt(privateKey, encrypted);
console.log(decrypted.toString('utf8')); // "Sensitive data"
```

---

## 🔥 Password Hashing (bcrypt / argon2)

**Lưu ý quan trọng:** KHÔNG dùng encryption để lưu password — dùng HASHING (one-way).

```
┌─────────────────────────────────────────────────────────────┐
│            HASHING vs ENCRYPTION                            │
├───────────────────────┬─────────────────────────────────────┤
│ Hashing               │ Encryption                        │
├───────────────────────┼─────────────────────────────────────┤
│ One-way (không giải   │ Two-way (có thể giải)               │
│  mã được)             │                                  │
│ Dùng cho password     │ Dùng cho data nhạy cảm              │
│ bcrypt, argon2, sha256│ AES, RSA                           │
└───────────────────────┴─────────────────────────────────────┘
```

```typescript
import bcrypt from 'bcrypt';
import argon2 from 'argon2';

const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────
// ✅ BCRYPT (phổ biến, ổn định)
// ─────────────────────────────────────────────
async function hashPasswordBcrypt(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPasswordBcrypt(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─────────────────────────────────────────────
// ✅ ARGON2 (mới hơn, chống GPU attack tốt hơn)
// ─────────────────────────────────────────────
async function hashPasswordArgon2(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id, // variant tốt nhất
    memoryCost: 65536,     // 64 MB
    timeCost: 3,           // 3 iterations
    parallelism: 4,
  });
}

async function verifyPasswordArgon2(
  password: string,
  hash: string
): Promise<boolean> {
  return argon2.verify(hash, password);
}

// Usage
const hashed = await hashPasswordBcrypt('mySecureP@ssw0rd!');
const isValid = await verifyPasswordBcrypt('mySecureP@ssw0rd!', hashed);
console.log(isValid); // true
```

---

## 🆚 So sánh Hashing Algorithms

| Algorithm | Tốc độ | Chống GPU/ASIC | Khuyến nghị |
|-----------|--------|----------------|-------------|
| **bcrypt** | Trung bình | ✅ Tốt | ✅ Phổ biến, ổn định |
| **argon2id** | Chậm hơn | ✅ Tốt nhất | ✅ Tốt nhất ( winning of PHC ) |
| **scrypt** | Chậm | ✅ Tốt | ⚠️ Khó cấu hình |
| **PBKDF2** | Chậm | ⚠️ Trung bình | ⚠️ Tiêu chuẩn nhưng không tối ưu |
| **MD5/SHA1** | Nhanh | ❌ Yếu | ❌ CẤM dùng cho password |
| **SHA-256** | Nhanh | ❌ Yếu | ❌ Không đủ chậm |

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- 📖 [RFC 5116 — AES-GCM](https://tools.ietf.org/html/rfc5116)
- 📖 [Argon2 Official](https://github.com/P-H-C/phc-winner-argon2)

---

⏭️ Bài tiếp theo → [9.6 Helmet & Security Headers](../9.6-helmet-headers/README.md)
