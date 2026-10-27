# 🔐 9.5 Encryption

> **Encryption** là quá trình biến đổi dữ liệu thành dạng không thể đọc được nếu không có khóa giải mã. Khác với hashing (one-way), encryption là two-way — có thể hoàn nguyên nếu có key.
>
> **Quy tắc vàng:** Không bao giờ tự implement cryptographic algorithm. Dùng thư viện trưởng thành (libsodium, crypto-js, node:crypto).

```
┌─────────────────────────────────────────────────────────────┐
│              ENCRYPTION TYPES                               │
├──────────────────────┬──────────────────────────────────────┤
│ Symmetric (Đối xứng) │ Asymmetric (Bất đối xứng)             │
├──────────────────────┼──────────────────────────────────────┤
│  1 khóa (shared)     │  2 khóa (public + private)           │
│  Nhanh (~GB/s)       │  Chậm hơn (~KB/s)                    │
│  AES-256-GCM         │  RSA-2048/4096                       │
│  ChaCha20-Poly1305   │  ECDSA (P-256, P-384)               │
│  dùng cho: data at   │  Ed25519 (signature fast)            │
│            rest,     │                                      │
│            bulk      │  Dùng cho: key exchange, digital     │
│                      │            signatures, HTTPS/TLS     │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 📐 Symmetric Encryption (AES-256-GCM)

**Cơ chế:** Cùng một khóa (key) dùng cho cả encrypt và decrypt. Nhanh, phù hợp cho dữ liệu lớn.

```
┌─────────────────────────────────────────────────────────────┐
│             SYMMETRIC ENCRYPTION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Alice (encrypt)                   Bob (decrypt)            │
│    │                                  │                       │
│    │  ┌──────────────────────┐       │                       │
│    │  │  Key (shared secret) │───────┤  (cùng key, gửi an  │
│    │  │  256-bit (32 bytes)  │       │   toàn qua key       │
│    │  └──────────────────────┘       │   exchange hoặc       │
│    │                                 │   pre-shared)        │
│    │                                 │                       │
│    │── Plaintext + key ────────────►│  Ciphertext           │
│    │   → AES-256-GCM                │  (random-looking)     │
│    │                                 │                       │
│    │◄── Ciphertext + key ───────────│  Plaintext            │
│    │   AES-256-GCM decrypt          │  (giống ban đầu)      │
│    │                                 │                       │
│    └── Additional: IV (12 bytes)    │                       │
│       + Auth Tag (16 bytes) ────────┘                       │
│                                                             │
│  IV (Initialization Vector): random per-encryption,         │
│  không cần secret, gửi kèm ciphertext.                      │
│  Auth Tag: đảm bảo ciphertext không bị tampering.           │
└─────────────────────────────────────────────────────────────┘
```

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';  // GCM = Galois/Counter Mode (authenticated)
const KEY_SIZE = 32;              // 256 bits
const IV_SIZE = 12;               // 96 bits (recommended for GCM)
const AUTH_TAG_LENGTH = 16;       // 128 bits

// ✅ Encrypt — returns ciphertext + iv + authTag (packed together)
function encrypt(plaintext: string, key: Buffer): {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
} {
  const iv = randomBytes(IV_SIZE);          // Random IV mỗi lần encrypt
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'buffer');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();      // 16 bytes authentication tag

  return { ciphertext: encrypted, iv, authTag };
}

// ✅ Decrypt — verifies auth tag (detect tampering)
function decrypt(
  ciphertext: Buffer,
  iv: Buffer,
  authTag: Buffer,
  key: Buffer
): string {
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);             // Verify integrity first

  let decrypted = decipher.update(ciphertext, 'buffer', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Key generation — MUST be cryptographically random
const key = randomBytes(KEY_SIZE);          // 32 bytes = 256 bits

// Usage
const plaintext = 'Sensitive patient record #12345';
const { ciphertext, iv, authTag } = encrypt(plaintext, key);
console.log('Ciphertext (hex):', ciphertext.toString('hex'));
console.log('IV (hex):', iv.toString('hex'));
console.log('AuthTag (hex):', authTag.toString('hex'));

const decrypted = decrypt(ciphertext, iv, authTag, key);
console.log('Decrypted:', decrypted);      // "Sensitive patient record #12345"
```

### ⚠️ GCM mode — tại sao quan trọng?

AES-GCM là **authenticated encryption** — vừa Confidentiality (bí mật) vừa Integrity (toàn vẹn). Nếu 1 byte ciphertext bị sửa, decrypt sẽ throw error thay vì trả về garbage.

| Mode | Confidentiality | Integrity | Recommended? |
|------|----------------|-----------|-------------|
| AES-ECB | ✅ | ❌ | ❌ Cấm dùng (pattern leak) |
| AES-CBC | ✅ | ❌ (cần HMAC riêng) | ⚠️ Được nhưng không preferred |
| AES-GCM | ✅ | ✅ (built-in) | ✅ Preferred cho hầu hết cases |
| AES-CCM | ✅ | ✅ | ✅ Good alternative |

---

## 📐 Asymmetric Encryption (RSA / ECC)

**Cơ chế:** Dùng cặp key — public key (công khai) để encrypt, private key (bí mật) để decrypt. Chậm hơn symmetric nhưng giải quyết vấn đề key exchange.

```
┌─────────────────────────────────────────────────────────────┐
│           ASYMMETRIC: Key Pair                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Public Key (khóa công khai)      Private Key (khóa bí mật) │
│  ├── Gửi cho bất kỳ ai            ├── Chỉ chủ sở hữu mới có │
│  ├── Dùng để ENCRYPT data         ├── Dùng để DECRYPT       │
│  ├── Dùng để VERIFY signature     ├── Dùng để SIGN          │
│  └── Ai cũng có thể đọc data     └── Giữ bí mật tuyệt đối  │
│                                                             │
│  Encrypt:  plaintext + public_key  → ciphertext             │
│  Decrypt:  ciphertext + private_key → plaintext             │
│                                                             │
│  Sign:     data + private_key    → signature                │
│  Verify:   data + signature +    → true/false              │
│             public_key                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```typescript
import { generateKeyPair, publicEncrypt, privateDecrypt } from 'crypto';

// Generate RSA key pair (2048-bit minimum)
const { publicKey, privateKey } = await generateKeyPair('rsa', {
  modulusLength: 2048,                       // Minimum 2048, prefer 4096
  publicKeyEncoding: {
    type: 'spki',                           // Subject Public Key Info
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',                          // PKCS #8 format
    format: 'pem',
    cipher: 'aes-256-cbc',                  // Encrypt private key with passphrase
    passphrase: 'strong-passphrase-here',
  },
});

// Encrypt with PUBLIC key
const plaintext = 'Sensitive data to encrypt';
const encrypted = publicEncrypt(
  { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
  Buffer.from(plaintext, 'utf8')
);
console.log('Encrypted (base64):', encrypted.toString('base64'));

// Decrypt with PRIVATE key
const decrypted = privateDecrypt(
  { key: privateKey, passphrase: 'strong-passphrase-here', padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
  encrypted
);
console.log('Decrypted:', decrypted.toString('utf8'));  // "Sensitive data to encrypt"
```

### RSA vs ECC (Elliptic Curve)

| | RSA | ECC (Ed25519, P-256) |
|---|---|---|
| **Key size** | 2048-4096 bits | 256-384 bits |
| **Speed** | Chậm hơn (math phức tạp) | Nhanh hơn (elliptic curve math) |
| **Signature size** | Lớn (256-512 bytes) | Nhỏ (64-96 bytes) |
| **Security per bit** | Thấp hơn | Cao hơn (same security, smaller key) |
| **Use case** | Legacy, TLS certificates | Modern apps, JWT, mobile, IoT |
| **Recommended?** | ⚠️ Only if required | ✅ Preferred for new systems |

> 💡 **Thực tế:** Most modern systems dùng **Hybrid approach** — asymmetric key exchange (ECDH) để trao đổi symmetric key, sau đó symmetric encryption (AES-GCM) để encrypt data. Đây chính xác là cách TLS 1.3 hoạt động.

---

## 🔥 Password Hashing (bcrypt / argon2)

**Lưu ý quan trọng:** KHÔNG dùng encryption để lưu password — dùng **HASHING** (one-way). Password hash không thể hoàn nguyên, chỉ có thể verify bằng cách hash lại input và so sánh.

```
┌─────────────────────────────────────────────────────────────┐
│            HASHING vs ENCRYPTION                            │
├───────────────────────┬─────────────────────────────────────┤
│ Hashing               │ Encryption                        │
├───────────────────────┼─────────────────────────────────────┤
│ One-way (không giải   │ Two-way (có thể giải mã)            │
│  mã được)             │                                  │
│ Dùng cho password     │ Dùng cho data nhạy cảm (CC, PII)  │
│ bcrypt, argon2,      │ AES-256-GCM, RSA                  │
│ scrypt              │                                  │
│ Input → Hash (fixed   │ Plaintext + Key → Ciphertext      │
│   length output)      │ Ciphertext + Key → Plaintext      │
└───────────────────────┴─────────────────────────────────────┘
```

```typescript
import bcrypt from 'bcrypt';
import argon2 from 'argon2';

const BCRYPT_SALT_ROUNDS = 12;  // Cost factor — tăng khi hardware mạnh

// ─────────────────────────────────────────────
// ✅ BCRYPT (phổ biến, ổn định, battle-tested)
// ─────────────────────────────────────────────
async function hashPasswordBcrypt(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

async function verifyPasswordBcrypt(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─────────────────────────────────────────────
// ✅ ARGON2 (mới hơn, chống GPU/ASIC attack tốt nhất)
//    Winner của Password Hashing Competition 2015
// ─────────────────────────────────────────────
async function hashPasswordArgon2(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,    // Variant tốt nhất (chống both timing + side-channel)
    memoryCost: 65536,        // 64 MB memory — chống GPU parallelism
    timeCost: 3,              // 3 iterations — điều chỉnh theo hardware
    parallelism: 4,           // 4 threads
  });
}

async function verifyPasswordArgon2(
  password: string,
  hash: string
): Promise<boolean> {
  return argon2.verify(hash, password);
}

// Usage
const password = 'mySecureP@ssw0rd!';
const hashed = await hashPasswordBcrypt(password);
console.log('Hash:', hashed);  // $2b$12$K... (20+ chars, contains salt + cost)

const isValid = await verifyPasswordBcrypt(password, hashed);
console.log('Valid:', isValid);  // true

const wrong = await verifyPasswordBcrypt('wrongPassword', hashed);
console.log('Wrong:', wrong);    // false
```

---

## 🆚 So sánh Hashing Algorithms

| Algorithm | Tốc độ | Chống GPU/ASIC | Memory-hard | Khuyến nghị |
|-----------|--------|----------------|-------------|-------------|
| **bcrypt** | Trung bình | ✅ Tốt (cost factor) | ❌ Không | ✅ Phổ biến, ổn định, đủ cho đa số |
| **argon2id** | Chậm hơn | ✅ Tốt nhất | ✅ Có (memoryCost) | ✅ Tốt nhất (PHC winner), recommended cho new projects |
| **scrypt** | Chậm | ✅ Tốt | ✅ Có | ⚠️ Khó cấu hình đúng parameters |
| **PBKDF2** | Chậm | ⚠️ Trung bình (chỉ iteration) | ❌ Không | ⚠️ Tiêu chuẩn NIST nhưng không tối ưu |
| **MD5/SHA1** | Nhanh | ❌ Yếu | ❌ | ❌ CẤM dùng cho password |
| **SHA-256** | Nhanh | ❌ Yếu | ❌ | ❌ Không đủ chậm — GPU crack trong microgiây |

> 💡 **Lý do cần slow hash:** Password hash phải tính toán **chậm** — càng chậm càng tốt cho chủ, càng tệ cho attacker. Bcrypt/Argon2 có cost factor có thể điều chỉnh theo thời gian (khi hardware mạnh lên, tăng cost).

### Rainbow Table Defense: Salt

```
Plain password:     "password123"
Without salt:       MD5("password123") = "482c811da5d5b4bc6d497ffa98491e38"
                    → Attacker có rainbow table → lookup ngay

With salt:          MD5("password123" + "a8f5f167f44f4969e")
                    → Mỗi password có hash duy nhất
                    → Rainbow table vô dụng (cần 1 table per salt)

Salt requirements:
  - Minimum 16 bytes (128 bits)
  - Cryptographically random (randomBytes, not Math.random)
  - Unique per user
  - Store alongside hash (not secret)
```

---

## 🔑 Key Management — Phần quan trọng nhất

Encryption vô dụng nếu key bị leak. Key management là 80% của security.

```
┌─────────────────────────────────────────────────────────────┐
│              KEY MANAGEMENT PRINCIPLES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. KHÔNG hardcode key trong source code                    │
│  2. KHÔNG commit key vào git                                │
│  3. Sử dụng Key Management Service (KMS)                    │
│  4. Rotate keys định kỳ (90 ngày tối thiểu)                 │
│  5. Separate encryption keys per environment                │
│  6. Log key usage nhưng KHÔNG log key value                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cloud KMS examples

```typescript
// AWS KMS — encrypt data key (envelope encryption pattern)
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

const kmsClient = new KMSClient({ region: 'ap-southeast-1' });

async function encryptWithDataKey(plaintext: string, kmsKeyId: string): Promise<Buffer> {
  // 1. Generate data key (fast, symmetric)
  const dkCmd = new kmsClient.send(new GenerateDataKeyCommand({
    KeyId: kmsKeyId,
    KeySpec: 'AES_256',
  }));
  const dataKey = await kmsClient.send(dkCmd);

  // 2. Encrypt data với data key (fast, local)
  const { ciphertext, iv, authTag } = encrypt(plaintext, dataKey.Plaintext!);

  // 3. Encrypt data key với KMS (cached, expensive — only once)
  const wrappedKeyCmd = new kmsClient.send(new EncryptCommand({
    KeyId: kmsKeyId,
    Plaintext: dataKey.CiphertextBlob,
  }));
  const wrappedKey = await kmsClient.send(wrappedKeyCmd);

  // Return: wrapped key + iv + authTag + ciphertext
  // (data key itself is encrypted by KMS, never stored in plaintext)
  return Buffer.concat([wrappedKey.CiphertextBlob, iv, authTag, ciphertext]);
}
```

> 💡 **Envelope encryption pattern:** Data key (symmetric, fast) encrypt data. KMS encrypt data key (asymmetric, slow but secure). Result: fast encryption + secure key management.

---

## ✅ Security Checklist

```
□ Password: bcrypt (cost ≥ 12) hoặc argon2id (memory ≥ 64MB)
□ Data at rest: AES-256-GCM (never ECB or CBC without HMAC)
□ Data in transit: TLS 1.2+ (never plaintext HTTP)
□ Key management: KMS/Vault, rotate 90 days, never hardcode
□ Nonce/IV: cryptographically random, never reuse with same key
□ Random strings: crypto.randomBytes(), not Math.random()
□ No custom crypto: dùng thư viện trưởng thành
□ HMAC for message integrity: HMAC-SHA256
□ Certificate pinning for mobile apps (optional but recommended)
```

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- 📖 [RFC 5116 — AES-GCM](https://tools.ietf.org/html/rfc5116)
- 📖 [Argon2 Official](https://github.com/P-H-C/phc-winner-argon2)
- 📖 [NIST SP 800-132 — Recommendations for Password Storage](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf)
- 📖 [OWASP Crypto Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Chart.html)

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.5-encryption
npx ts-node examples/index.ts
```

---

⏭️ Bài tiếp theo → [9.6 Helmet & Security Headers](../9.6-helmet-headers/README.md)
