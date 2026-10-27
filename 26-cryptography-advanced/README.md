# 🔐 Lớp 26: Cryptography Advanced (Mật Mã Học Nâng Cao)

> **Cryptography là "toán học bảo mật"** — đi xa hơn OWASP checklist: hiểu TẠI SAO
> hash này an toàn, hash kia đã lỗi thời, signature xác thực gì, TLS certify ai.
> Làm sai 1 tham số (IV tái dùng, mode ECB) = toàn bộ hệ thống sụp.

> Liên quan: `09-security` (bảo mật ứng dụng), `20.2-bit-manipulation` (bit là nền),
> `20.1-discrete-mathematics` (số nguyên tố, mô-đun), `9.5-encryption` (cơ bản).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 26.1 | Hashing | SHA-2/3, tính chất, bảng băm bảo mật | [26.1-hashing](26.1-hashing/README.md) |
| 26.2 | Symmetric & Asymmetric Encryption | AES, RSA, ECC, mode thao tác | [26.2-symmetric-asymmetric](26.2-symmetric-asymmetric/README.md) |
| 26.3 | KDF & Password Hashing | bcrypt, argon2, salt | [26.3-kdf-password-hashing](26.3-kdf-password-hashing/README.md) |
| 26.4 | Digital Signatures & Certificates | ký số, PKI, CA | [26.4-digital-signatures](26.4-digital-signatures/README.md) |

---

## 📖 Tổng Quan

```
┌───────────────────────────────────────────────────────────┐
│  HASHING        một chiều — kiểm tra toàn vẹn, password    │
│  SYMMETRIC      AES — nhanh, cả 2 bên dùng chung 1 key      │
│  ASYMMETRIC     RSA/ECC — key pair, trao đổi key + ký số    │
│  KDF            password → key chậm có chủ đích             │
│  SIGNATURE      hash + asymmetric = không chối bỏ được       │
│  TLS            kết hợp tất cả: kênh an toàn trên internet   │
└───────────────────────────────────────────────────────────┘
```

---

## 🎯 Quy Tắc Số 1: Đừng Tự Chế Crypto

```
❌ "Em nghĩ ra thuật toán mã hóa riêng"  → chưa được phân tích = chưa an toàn
✅ Dùng thư viện chuẩn, mode chuẩn, tham số chuẩn
   (libsodium, WebCrypto, Node crypto) và ĐỌC DOCS về tham số
"Mọi người đều tự nghĩ mình là cryptographer. Đừng tin chính mình."
```

---

## 🔗 Liên Kết Chéo

- **Ứng dụng cụ thể:** `9.2-jwt-authentication`, `9.5-encryption`, `9.7-sql-injection`
- **Secret management:** `9.9-secrets-management`
- **Toán học nền:** `20.1-discrete-mathematics`, `20.2-bit-manipulation`

---

## 📖 Tài Nguyên Tham Khảo

- *Serious Cryptography* — Jean-Philippe Aumasson (cân bằng lý thuyết & thực hành)
- *Cryptographic Engineering*, RFC documents
- OWASP Cryptographic Storage Cheat Sheet
