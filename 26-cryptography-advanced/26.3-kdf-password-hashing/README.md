# 🔑 26.3 KDF & Password Hashing (Hàm Dẫn Xuất Key & Băm Mật Khẩu)

> **Password ≠ key mật mã.** Mật khẩu người yếu (6-12 ký tự, có quy luật), key mật mã
> ngẫu nhiên (256 bit). KDF biến password → key an toàn bằng cách CỐ Ý CHẬM
> để chống brute force.

> Liên quan: `26.2-symmetric-asymmetric` (key này dùng cho mã hóa), `9.8-password-hashing`
> ( OWASP guide), `20.3-floating-point-precision` (bcrypt cost parameter).

---

## 🎯 Vấn Đề

```
SHA-256("password123") = 60 phần tỷ lần/giây trên RTX 4090
bcrypt("password123", cost=12) = 0.3 lần/giây trên RTX 4090
→ bcrypt chậm hơn 200 TRIỆU LẦN — attacker chậm đến mức không khả thi
```

Password hash KHÁC hash thường: cần SLOW + SALT, không phải FAST + COLLISION RESISTANCE.

---

## 🧠 PBKDF2 vs bcrypt vs argon2

```
PBKDF2  — cổ điển, dùng HMAC lặp lại — an toàn nhưng RAM-hardness thấp
          → FPGA/ASIC brute force dễ dàng
bcrypt  — cost parameter (4-31), tự đặt thời gian — kinh điển nhất (1999)
          → vẫn an toàn, nhưng memory thấp
argon2  — hiện đại nhất (winner Password Hashing Competition 2015)
          → chống GPU/ASIC bằng memory-hard + time-hard + parallelism
          → argon2id: hybrid, dùng cho mật khẩu, mới nhất
```

---

## 💻 Code Ví Dụ

```typescript
import { randomBytes, pbkdf2Sync } from "node:crypto";
import bcrypt from "bcrypt";
import argon2 from "argon2";

// ===== bcrypt: kinh điển, dễ dùng, vẫn an toàn =====
const hashPassword = async (pw: string) =>
  bcrypt.hash(pw, 12);          // cost=12 → ~300ms trên CPU hiện đại
const verifyPassword = async (pw: string, hash: string) =>
  bcrypt.compare(pw, hash);       // so sánh timing-safe tự động

// Lưu: hash đã salt trong DB. Login: hash(input) =? stored hash → timing-safe compare

// ===== argon2: hiện đại, khuyến nghị mới nhất =====
const hashArgon2 = async (pw: string) =>
  argon2.hash(pw, {
    type: argon2.argon2id,       // hybrid: resistance tốt nhất
    memoryCost: 65536,           // 64MB RAM (khó GPU/ASIC)
    timeCost: 3,                 // số vòng
    parallelism: 4,              // số luồng
  });

// ===== PBKDF2: khi bcrypt/argon2 không có sẵn =====
const salt = randomBytes(32);
const key = pbkdf2Sync("password", salt, 100000, 64, "sha512");
// SHA-512 + 100k vòng — vẫn an toàn nhưng "memory-weak"
// Nếu dùng PBKDF2: memory giới hạn 1-2MB, không chống GPU mạnh

// ===== Derive key cho mã hóa từ password: KHÔNG dùng bcrypt =====
import { scryptSync } from "node:crypto";
const key = scryptSync("userPassword", "randomSalt", 32);
// scrypt: memory-hard KDF — dùng KHI CẦN KEY (không phải password storage)
```

---

## ⚖️ Các Phương Pháp

| Kỹ thuật | Memory | GPU resistance | Khuyến nghị |
|---|---|---|---|
| PBKDF2+SHA512 | thấp | yếu | fallback khi không có gì khác |
| bcrypt | trung bình | trung bình | ổn cho legacy |
| scrypt | cao | tốt | khi cần key (không phải password) |
| argon2id | rất cao | rất tốt | khuyến nghị mới nhất |

---

## ⚠️ Bẫy Thường Gặp

1. **Dùng SHA-256 trực tiếp cho password** — GPU 200 triệu lần/giây, password yếu die trong vài phút.
2. **Dùng SHA-256 khi đổi tên thành "sha256crypt"** — không có salt, không có slow. Nghèo nàn.
3. **Cost quá thấp** — bcrypt cost=10 (2010) → 2026 đã quá thấp. Đặt sao cho ~250ms trên máy attacker, nhưng <500ms trên server bạn.
4. **Salt cố định cho mọi user** — rainbow table. Mỗi user phải có salt RIÊNG, random.
5. **Sai mục đích:** bcrypt cho key derivation (scrypt/scrypt), scrypt cho password (argon2). Đúng người đúng việc.
6. **Lưu salt riêng bảng** — salt = random, có thể công khai, nhưng PHẢI có trong hash để verify lại.

---

## 📝 Bài Tập Tự Vấn

1. Người dùng đổi password: bcrypt hash mới hay dùng lại salt cũ?
2. bcrypt cost=14 vs argon2id: thời gian thực trên server, thời gian attacker's GPU?
3. Tại sao "memory-hard" quan trọng trong KDF?

---

*Leaf thuộc [Lớp 26 — Cryptography Advanced](../README.md)*
