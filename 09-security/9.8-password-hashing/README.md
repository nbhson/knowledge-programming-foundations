# 🔑 9.8 Password Hashing (Băm Mật Khẩu)

> **Mật khẩu không bao giờ được lưu plaintext hay MD5/SHA1.** Chuẩn đúng: **bcrypt/argon2/scrypt** — hàm băm **cố tình chậm** + **salt ngẫu nhiên** mỗi user, verify bằng so sánh hằng thời gian.

---

## 🎯 Vấn đề

DB leak là "khi nào" chứ không phải "có hay không". Nếu lưu sai, 1 vụ leak = toàn bộ user mất tài khoản (và cả nơi khác vì dùng lại mật khẩu):

```
plaintext → đọc là xong 💥 | MD5 → rainbow table/GPU vài giây 💥
SHA-256 nhanh → brute-force 10 tỷ guess/s trên GPU 💥
```

Hàm hash password phải **chậm** (100ms/hash) để attacker nản mà user không thấy phiền.

---

## 💻 Code ví dụ

Mô phỏng hash-verify bằng `node:crypto` scrypt (built-in, không deps): salt ngẫu nhiên + work factor + timing-safe compare.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";

// Hash: salt ngẫu nhiên 16 bytes + scrypt(N=16384, r=8, p=1, 64 bytes)
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt); // ~100ms, cố tình chậm
  return `scrypt$${salt}$${key.toString("hex")}`; // tự chứa params để verify
}

// Verify: băm lại với salt cũ, so sánh timing-safe (chống timing attack)
function verify(password: string, stored: string): boolean {
  /* ... timingSafeEqual ... */
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Salt unique/user | Cùng mật khẩu → hash khác nhau; rainbow table vô dụng |
| Chậm có chủ đích | 100ms × 1 tỷ password = 3000 năm GPU — brute-force phá sản |
| Verify an toàn | `timingSafeEqual` tránh rò rỉ thông tin qua thời gian so sánh |

---

## ⚠️ Lưu Ý

- Production ưu tiên **argon2id** (thắng PHC 2015, kháng GPU/ASIC tốt nhất), tiếp theo bcrypt/scrypt. Demo dùng scrypt vì là Node built-in.
- **Pepper**: secret chung ở HSM/env cộng thêm vào trước khi hash — DB leak alone không đủ crack.
- Chính sách: độ dài tối thiểu (≥12 cho quan trọng), không ép ký tự phức tạp vô lý (NIST 800-63B), rate-limit + MFA chống brute-force online.
- Không bao giờ tự chế algorithm, không log password, không gửi password qua GET/log.

---

## ⚖️ So sánh bcrypt / Argon2id / scrypt

| Thuộc tính | bcrypt | Argon2id (recommend) | scrypt |
|---|---|---|---|
| **Thời gian** | O(2^r) sequential | O(memory × time) | O(N × r × p) |
| **Memory** | ~4KB (low, GPU-friendly) | Tùy chỉnh 1MB–128MB | Tùy chỉnh 16MB–1GB |
| **Kháng GPU/ASIC** | Yếu (GPU đào 1 tỷ bcrypt/s) | Khá (memory-hard ngăn GPU song song) | Khá (tương tự) |
| **Tuning** | `cost` (2^cost) tăng 2× thời gian | `memory`, `time`, `parallelism` | `N, r, p` |
| **Hỗ trợ** | Gần như mọi ngôn ngữ (built-in) | Node.js 10+, libsodium | Node built-in (crypto.scrypt) |
| **Recommend** | Legacy | ✅ **Ưu tiên cho password mới** (PHC 2015 winner) | Khi argon2 không có lib |
| **Benchmark** | ~100ms/hash (cost=12) | ~200ms/hash (argon2id, 64MB, 3 iter) | ~300ms/hash (N=16384, r=8, p=1) |

> **Argon2id** = mix of Argon2d (GPU-hard) + Argon2i (cache-hard), khuyến nghị cho mọi password mới 2026+.

## 📜 NIST 800-63B khuyến nghị thực tế (2017, cập nhật 2023)

- **Độ dài ≥ 8** (tối thiểu); **≥ 12–16** cho tài khoản quan trọng — độ dài > độ phức tạp.
- **KHÔNG** yêu cầu ký tự đặc biệt bắt buộc (người dùng chọn "Password123!" dễ đoán — thay vào đó dùng **passphrase**).
- **Blacklist password**: kiểm tra top 10,000 password phổ biến (HaveIBeenPwned API) — từ chối thay vì cảnh báo.
- **Không hints/trivia**: attacker dùng social media để guess.
- **Rate limit + MFA**: hash chậm chỉ chống offline brute-force; online brute-force cần rate-limit (`/login` → 5 lần → CAPTCHA/block).

## 🔑 Password Manager + Passkeys (Hướng 2026)

- **Password manager** (Bitwarden/1Password/KeePass): random 20+ ký tự cho mỗi site → unique, không nhớ nổi → không tái sử dụng. User chỉ nhớ 1 master password (tốt nhất dùng passphrase).
- **Passkeys (WebAuthn/FIDO2)**: thay password bằng **asymmetric key pair** — private key trong device (Yubikey/phone), public key lưu server. Không có gì để leak nên phishing/ransomware không lấy được.
- **2026 adoption**: Google, Apple, Microsoft, GitHub hỗ trợ passkey; FIDO2/WebAuthn là standard — mới hoàn toàn cho user mới (password vẫn hỗ trợ backward).
- Khi ưu tiên security: **passkey > password manager > password người tự nhớ**.

---

## 🎯 Khi nào dùng

- Mọi nơi lưu credential user: signup/login, reset password, API secret.
- Không dùng hash nhanh (MD5/SHA-*) cho password — chúng chỉ hợp cho checksum/file integrity.

---

## 🔗 Liên quan

- **9.5 Encryption** — hash (one-way) vs mã hóa (two-way): password dùng hash.
- **9.2 JWT** — sau khi verify password mới cấp token.
- **9.9 Secrets Management** — pepper và key lưu ở Vault/KMS, không hardcode.

---

## 📚 Tài liệu

- OWASP Password Storage — https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- NIST 800-63B — https://pages.nist.gov/800-63-3/sp800-63b.html
- Node crypto.scrypt — https://nodejs.org/api/crypto.html

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.8-password-hashing
npx ts-node examples/index.ts
```

Demo: hash cùng password 2 lần (khác nhau nhờ salt) → verify đúng/sai → demo MD5 bị crack tức thì để so sánh.

---

## ⏭️ Bài tiếp theo

→ [9.9 Secrets Management](../9.9-secrets-management/README.md)
