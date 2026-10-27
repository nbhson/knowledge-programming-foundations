# ✍️ 26.4 Digital Signatures & Certificates (Chữ Ký Số & Chứng Chỉ)

> **Chữ ký số = "không thể chối bỏ" (non-repudiation)**: dùng private key KÝ,
> ai cũng dùng public key ĐỂ KIỂM CHỨNG mà không thể giả mạo. Khác mã hóa
> (bí mật) — signing chứng minh AI đã tạo/nhận message này.

> Liên quan: `26.2-symmetric-asymmetric` (asymmetric là nền tảng), `11.9-tls-handshake`
> (TLS dùng certificate), `26.1-hashing` (hash được ký, không phải toàn bộ message).

---

## 🎯 Vấn Đề

```
KÝ SỐ:
  Alice ký H(message) bằng private_key_A → signature
  Ai cũng dùng public_key_A kiểm tra → biết Alice ký (không ai giả được)
  → Không encrypt — ai cũng đọc được message (không bí mật)

KHÁC MÃ HÓA:
  Mã hóa: encrypt(message, public_key_B) → chỉ B đọc
  Ký:     sign(hash(message), private_key_A) → ai cũng xác minh là A ký
```

---

## 💻 Code Ví Dụ

```typescript
import { createSign, createVerify, publicKeyFromCert } from "node:crypto";
import { readFileSync } from "node:fs";

// ===== Ký và xác minh message =====
const privateKey = readFileSync("private.pem");
const publicKey  = readFileSync("public.pem");

const message = "Tôi cam kết thanh toán 1.000.000 VND cho Sơn";
const sign = createSign("SHA256");
sign.update(message);
sign.end();
const signature = sign.sign(privateKey, "base64");

// Xác minh:
const verify = createVerify("SHA256");
verify.update(message);
verify.end();
const ok = verify.verify(publicKey, signature, "base64");
console.log(ok); // true — Alice không chối bỏ được

// ===== Điều gì được ký? — KHÔNG phải toàn bộ message! =====
const H = createHash("sha256").update(message).digest(); // ký hash, không ký message
// Lý do: RSA 2048-bit chỉ mã hóa ~245 bytes; hash SHA-256 = 32 bytes → ký nhanh
// Nếu message dài: ký hash 32 bytes, không phải MB dữ liệu

// ===== Certificate và PKI: ai chứng minh public key thuộc về ai? =====
// Vấn đề: Ai đó giả mạo public key — "Đây là public key của ngân hàng!"
// Giải pháp: Certificate = public key + identity + chữ ký của CA
//   CA (Certificate Authority) đã được browser/system tin tưởng sẵn
//   CA ký: "public_key của github.com = ..." → browser verify = CA trustworthy → OK

// TLS handshake thực chất:
//  1. Server gửi certificate (public key + domain + CA signature)
//  2. Browser verify CA signature → public key thật sự của server
//  3. Dùng public key để trao đổi session key (hybrid encryption)
```

---

## ⚖️ Chữ Ký Số vs Mã Hóa

| | Mã hóa | Chữ ký số |
|---|---|---|
| Mục đích | bí mật | xác thực + không chối bỏ |
| Dùng key | public key người nhận | private key người gửi |
| Ai đọc | chỉ người nhận | ai cũng xác minh được |
| Ví dụ | HTTPS (sau handshake), email mã hóa | code signing, JWT, document signing |

---

## ⚠️ Bẫy Thường Gặp

1. **Dùng certificate tự ký (self-signed) trên production internet** — browser không tin, MitM có thể tạo cert giả. Chỉ dùng self-signed cho internal/dev.
2. **Không verify certificate chain** — chỉ kiểm tra cert có đúng domain, không kiểm tra CA chain → MitM với cert giả. Thư viện TLS làm sẵn, đừng tự viết.
3. **Private key lưu trong git** — không bao giờ. Dùng HSM (hardware security module), vault, hoặc cloud KMS (xem 9.9).
4. **Không kiểm tra certificate hết hạn** — cert hết hạn → TLS fail. Auto-renew (Let's Encrypt + certbot).
5. **JWT không verify signature** — attack: tạo JWT với algorithm "none" hoặc dùng public key làm HMAC key. Luôn verify signature.

---

## 📝 Bài Tập Tự Vấn

1. JWT RS256: quy trình verify token từ A đến B — 4 bước?
2. GitHub webhook signature verification: HMAC-SHA256 với secret — bạn đang dùng signing hay encryption?
3. Let's Encrypt: quy trình chứng minh domain thuộc về bạn (HTTP/DNS challenge)?

---

*Leaf thuộc [Lớp 26 — Cryptography Advanced](../README.md)*
