# 🔏 26.2 Symmetric & Asymmetric Encryption (Mã Hóa Đối Xứng & Bất Đối Xứng)

> **Encryption = HOÀN LẠI ĐƯỢC** (≠ hashing). Dùng để bảo vệ dữ liệu LƯU TRỮ
> (disk, DB) hoặc TRUYỀN TIN (TLS, message). Khác nhau: symmetric = 1 key,
> asymmetric = key pair (công khai/bí mật).

> Liên quan: `26.1-hashing` (≠ hashing — encryption đảo ngược được), `26.4-digital-signatures`
> (asymmetric signing), `11.9-tls-handshake` (TLS = symmetric + asymmetric).

---

## 🎯 Vấn Đề

```
MÃ HÓA ĐỐI XỨNG (1 key cho cả 2 bên):
  encrypt(plaintext, key) → ciphertext
  decrypt(ciphertext, key) → plaintext
  → Nhanh, dùng cho data lớn (AES)
  → Vấn đề: key phải trao cho nhau trước (key exchange)

MÃ HÓA BẤT ĐỐI XỨNG (key pair):
  encrypt(plaintext, public_key)  → chỉ private_key giải mã
  sign(data, private_key)          → ai cũng verify bằng public_key
  → Chậm, dùng trao đổi key + chữ ký số
  → Không cần secret channel ban đầu
```

---

## 💻 Code Ví Dụ

```typescript
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

// ===== AES-256-GCM: symmetric encryption chuẩn hiện đại =====
const KEY = randomBytes(32);           // AES-256 → key 32 bytes
const IV  = randomBytes(12);           // GCM mode: IV 12 bytes mỗi lần mã hóa
const cipher = createCipheriv("aes-256-gcm", KEY, IV);
let enc = cipher.update("thẻ tín dụng: 4111-1111-1111-1111", "utf8", "hex");
enc += cipher.final("hex");
const authTag = cipher.getAuthTag();  // tag xác thực — LƯU CÙNG ciphertext
console.log({ enc, iv: IV.toString("hex"), tag: authTag.toString("hex") });

// Decrypt:
const [IV_in, tag_in] = [IV_hex, tag_hex];
const decipher = createDecipheriv("aes-256-gcm", KEY, Buffer.from(IV_in, "hex"));
decipher.setAuthTag(Buffer.from(tag_in, "hex"));  // xác thực trước khi giải mã
console.log(decipher.update(enc, "hex", "utf8") + decipher.final("utf8"));

// ⚠️ GCM mode bắt buộc có auth tag — dùng AES-CBC (mà không HMAC) là lỗ hổng phổ biến

// ===== RSA: asymmetric — mã hóa nhỏ, ký số =====
import { generateKeyPairSync, privateEncrypt, publicDecrypt, sign, verify } from "node:crypto";
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
// Mã hóa: ai cũng mã hóa bằng public key
const enc = privateEncrypt(privateKey, Buffer.from("tin nhắn nhỏ")).toString("base64");
// Chỉ người giữ private key mới đọc được — phù hợp trao đổi symmetric key, không dữ liệu lớn

// ===== Hybrid: RSA bảo vệ AES key =====
const aesKey = randomBytes(32);                         // 1. tạo symmetric key
const encKey = publicEncrypt(publicKey, aesKey);        // 2. mã hóa key bằng RSA
const encData = createCipheriv("aes-256-gcm", aesKey, IV); // 3. mã hóa data bằng AES
// → nhanh (AES) + an toàn (RSA exchange) + không cần key trước (TLS dùng cách này)

// ===== Khi nào dùng symmetric vs asymmetric? =====
const use = {
  "Lưu file riêng tư trên disk": "AES-256-GCM",         // 1 key, nhanh
  "Trao đổi key qua internet": "RSA/Hybrid (RSA + AES)", // khởi tạo kênh
  "Mã hóa thông điệp cho người cụ thể": "RSA (public encrypt)", // ai đó mã hóa cho mình
  "Chữ ký số (non-repudiation)": "RSA/ECDSA + hash",     // 26.4
};
```

---

## ⚖️ Symmetric vs Asymmetric

| Tiêu chí | Symmetric (AES) | Asymmetric (RSA/ECC) |
|---|---|---|
| Tốc độ | rất nhanh | chậm (100-1000x) |
| Key | 1 key (chia sẻ bí mật) | key pair (công khai) |
| Dùng cho | data lớn, lưu trữ | trao đổi key, ký số |
| Rủi ro lớn nhất | key bị lộ | private key bị lộ |

---

## ⚠️ Bẫy Thường Gặp

1. **AES-ECB** (mode mặc định nhiều lib) — cùng plaintext → cùng ciphertext → lộ pattern. Dùng **GCM** hoặc **CBC** + HMAC.
2. **IV tái sử dụng** — bảo mật GCM sụp nếu IV lặp lại. Luôn random mỗi lần mã hóa.
3. **Trao đổi symmetric key qua mạng không mã hóa** — eavesdropper đọc được key → toàn bộ fail. Dùng key exchange có authentication.
4. **RSA với key quá nhỏ** — RSA-512 đã bị phá năm 1999, RSA-1024 không còn an toàn. Dùng RSA-2048+ hoặc chuyển sang ECC (ECDSA).
5. **Không verify auth tag sau giải mã** — thiếu bước này, attacker sửa ciphertext → decrypt ra gì đó. Luôn check auth tag.
6. **Padding Oracle** — dùng block cipher mà không xác thực (CBC không có tag) → attack padding. Luôn dùng AEAD (GCM, ChaCha20-Poly1305).

---

## 📝 Bài Tập Tự Vấn

1. Giải thích Diffie-Hellman: 2 bên trao đổi shared secret mà không gửi key qua mạng?
2. Vì sao TLS dùng hybrid (asymmetric để trao key + symmetric để mã hóa dữ liệu)?
3. Tại sao GCM auth tag phải được kiểm tra trước khi trả plaintext cho user?

---

*Leaf thuộc [Lớp 26 — Cryptography Advanced](../README.md)*
