# 🔒 Lớp 9: Security (Bảo Mật Phần Mềm)

> **Security** là **hàng rào bảo vệ** ứng dụng khỏi các cuộc tấn công, rò rỉ dữ liệu và lỗ hổng.
> Bảo mật không phải tính năng — **bảo mật là yêu cầu bắt buộc**.

---

## 📑 Mục Lục

| STT | Chủ đề | Mô tả |
|-----|--------|-------|
| 1 | [OWASP Top 10](#1-owasp-top-10) | 10 lỗ hổng bảo mật phổ biến nhất |
| 2 | [Authentication & Authorization](#2-authentication--authorization) | Xác thực và phân quyền |
| 3 | [Cryptography Basics](#3-cryptography-basics) | Mã hóa, hashing, signing |
| 4 | [Secure Coding Practices](#4-secure-coding-practices) | Viết code an toàn |
| 5 | [API Security](#5-api-security) | Bảo mật API |
| 6 | [Infrastructure Security](#6-infrastructure-security) | Bảo mật hạ tầng |

---

## 1. OWASP Top 10

> 10 lỗ hổng bảo mật web phổ biến nhất, được OWASP cập nhật định kỳ.

### 📋 Danh sách OWASP Top 10 (2021)

| # | Lỗ hổng | Mô tả | Ví dụ |
|---|---------|-------|-------|
| A01 | **Broken Access Control** | Người dùng truy cập tài nguyên không được phép | Thay đổi ID trong URL để xem dữ liệu người khác |
| A02 | **Cryptographic Failures** | Dữ liệu nhạy cảm không được mã hóa đúng | Lưu password dạng plaintext |
| A03 | **Injection** | Dữ liệu không tin cậy được gửi vào interpreter | SQL Injection, XSS, Command Injection |
| A04 | **Insecure Design** | Thiết kế hệ thống thiếu threat modeling | Không có rate limiting cho API |
| A05 | **Security Misconfiguration** | Cấu hình sai hoặc mặc định | Debug mode bật trên production |
| A06 | **Vulnerable Components** | Sử dụng thư viện có lỗ hổng đã biết | Dependency cũ chưa được patch |
| A07 | **Auth Failures** | Xác thực và quản lý session yếu | Brute force password, session fixation |
| A08 | **Data Integrity Failures** | Không kiểm tra tính toàn vẹn dữ liệu | Insecure deserialization |
| A09 | **Logging Failures** | Log không đủ, không giám sát | Không phát hiện được tấn công |
| A10 | **SSRF** | Server gửi request đến URL do attacker kiểm soát | Đọc metadata cloud instance |

### 🔍 Chi tiết Injection (A03)

```
❌ SQL Injection:
   query = "SELECT * FROM users WHERE id = '" + userInput + "'"
   → userInput = "1' OR '1'='1"
   → SELECT * FROM users WHERE id = '1' OR '1'='1'  (trả về TẤT CẢ users!)

✅ Parameterized Query:
   query = "SELECT * FROM users WHERE id = ?"
   db.execute(query, [userInput])
   → userInput luôn được xử lý như DATA, không phải CODE
```

---

## 2. Authentication & Authorization

> **Authentication (AuthN)** = "Bạn là ai?"
> **Authorization (AuthZ)** = "Bạn được làm gì?"

### 🔑 Các phương thức Authentication

```
┌─────────────────────────────────────────────────┐
│           AUTHENTICATION METHODS                │
├─────────────────────────────────────────────────┤
│                                                 │
│  📧 Password-based                              │
│  ├── Bcrypt / Argon2 hashing                   │
│  ├── Salt + Pepper                              │
│  └── Password policies                          │
│                                                 │
│  🔐 Token-based                                 │
│  ├── JWT (JSON Web Token)                       │
│  ├── OAuth 2.0 / OpenID Connect                 │
│  └── API Keys                                   │
│                                                 │
│  📱 Multi-Factor (MFA)                           │
│  ├── TOTP (Google Authenticator)                │
│  ├── SMS/Email OTP                              │
│  └── Hardware Keys (FIDO2/WebAuthn)             │
│                                                 │
│  🔗 Single Sign-On (SSO)                        │
│  ├── SAML 2.0                                   │
│  └── OpenID Connect                             │
└─────────────────────────────────────────────────┘
```

### 🛡️ Authorization Models

| Model | Mô tả | Khi nào dùng |
|-------|--------|-------------|
| **RBAC** | Role-Based Access Control | Hệ thống có roles rõ ràng (Admin, User, Editor) |
| **ABAC** | Attribute-Based Access Control | Quyền dựa trên thuộc tính (department, location, time) |
| **ACL** | Access Control List | Quyền cụ thể trên từng resource |
| **ReBAC** | Relationship-Based Access Control | Quyền dựa trên quan hệ (owner, member, viewer) |

### 📊 JWT Flow

```
Client                    Server                    Auth Service
  │                         │                           │
  │── 1. Login (email/pw) ──►│                           │
  │                         │── 2. Verify credentials ──►│
  │                         │◄── 3. User valid ──────────│
  │◄── 4. JWT Token ────────│                           │
  │                         │                           │
  │── 5. Request + JWT ─────►│                           │
  │                         │── 6. Verify JWT signature  │
  │                         │── 7. Check claims (exp, role)
  │◄── 8. Response ─────────│                           │
```

---

## 3. Cryptography Basics

> Nền tảng mã hóa cần biết cho lập trình viên.

### 🔐 Các loại mã hóa

```
┌─────────────────────────────────────────────────────────────┐
│                    CRYPTOGRAPHY                             │
├──────────────────┬──────────────────┬───────────────────────┤
│   Hashing        │  Symmetric       │  Asymmetric           │
│   (One-way)      │  (Cùng key)      │  (Cặp key)            │
├──────────────────┼──────────────────┼───────────────────────┤
│ • MD5 (❌ weak)  │ • AES-256        │ • RSA                 │
│ • SHA-256        │ • ChaCha20       │ • ECDSA               │
│ • SHA-3          │ • 3DES (❌ old)  │ • Ed25519             │
│ • Bcrypt ✅      │                  │                       │
│ • Argon2 ✅      │                  │                       │
├──────────────────┼──────────────────┼───────────────────────┤
│ Dùng cho:        │ Dùng cho:        │ Dùng cho:             │
│ • Password hash  │ • Encrypt data   │ • HTTPS/TLS           │
│ • File checksum  │ • Database       │ • Digital signatures   │
│ • Data integrity │ • File encrypt   │ • Key exchange         │
└──────────────────┴──────────────────┴───────────────────────┘
```

### ⚠️ Quy tắc vàng

```
1. KHÔNG BAO GIỜ tự implement crypto algorithm
2. KHÔNG dùng MD5/SHA1 cho password
3. LUÔN dùng Bcrypt/Argon2 cho password hashing
4. LUÔN dùng TLS/HTTPS cho data in transit
5. LUÔN dùng AES-256 cho data at rest
6. Key phải được quản lý riêng (KMS, Vault)
```

---

## 4. Secure Coding Practices

> Các nguyên tắc viết code an toàn.

### ✅ Input Validation

```
┌──────────────────────────────────────────────┐
│          INPUT VALIDATION LAYERS             │
├──────────────────────────────────────────────┤
│                                              │
│  Layer 1: Client-side (UX only, NOT secure!) │
│  ├── HTML5 validation                        │
│  └── JavaScript checks                      │
│                                              │
│  Layer 2: API Gateway / WAF                  │
│  ├── Rate limiting                           │
│  ├── Request size limits                     │
│  └── Basic pattern matching                  │
│                                              │
│  Layer 3: Server-side (REQUIRED!)            │
│  ├── Whitelist validation                    │
│  ├── Type checking                           │
│  ├── Range/length validation                 │
│  ├── Regex pattern matching                  │
│  └── Sanitization (encode output)            │
│                                              │
│  Layer 4: Database                           │
│  ├── Parameterized queries                   │
│  ├── Stored procedures                       │
│  └── Column constraints                      │
└──────────────────────────────────────────────┘
```

### 🛡️ Secure Coding Checklist

| Hạng mục | Thực hành | Anti-pattern |
|----------|-----------|-------------|
| **Input** | Validate & sanitize mọi input | Trust user input |
| **Output** | Encode output theo context (HTML, JS, URL) | Render raw HTML |
| **Error** | Log chi tiết, response generic | Expose stack trace cho user |
| **Secret** | Dùng env vars / secret manager | Hardcode trong source code |
| **Dependency** | Scan CVE, pin versions | Dùng `*` trong dependency version |
| **Session** | Secure, HttpOnly, SameSite cookies | Store session trong localStorage |
| **File Upload** | Validate type, scan malware, rename | Serve file trực tiếp từ upload dir |

---

## 5. API Security

> Bảo mật cho REST API, GraphQL và các endpoints.

### 🔒 API Security Checklist

```
┌─────────────────────────────────────────────────┐
│            API SECURITY LAYERS                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  🌐 Transport Layer                             │
│  ├── HTTPS only (TLS 1.2+)                     │
│  ├── HSTS headers                               │
│  └── Certificate pinning (mobile)               │
│                                                 │
│  🔑 Authentication                              │
│  ├── OAuth 2.0 + PKCE                           │
│  ├── API Key rotation                           │
│  └── Mutual TLS (service-to-service)            │
│                                                 │
│  🚦 Rate Limiting                               │
│  ├── Per-user rate limits                       │
│  ├── Global rate limits                         │
│  └── Adaptive throttling                        │
│                                                 │
│  📋 Input/Output                                │
│  ├── Request validation (JSON Schema)           │
│  ├── Response filtering (không leak data)       │
│  └── Pagination limits                          │
│                                                 │
│  📝 Logging & Monitoring                        │
│  ├── Audit log mọi mutation                     │
│  ├── Anomaly detection                          │
│  └── Real-time alerting                         │
└─────────────────────────────────────────────────┘
```

### 🔐 Security Headers

```
# Essential HTTP Security Headers:
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (deprecated, dùng CSP)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 6. Infrastructure Security

> Bảo mật ở tầng hạ tầng, network và cloud.

### 🏗️ Defense in Depth

```
┌─────────────────────────────────────────────────┐
│              DEFENSE IN DEPTH                   │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Physical Security                      │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  Network Security               │    │    │
│  │  │  ┌─────────────────────────┐    │    │    │
│  │  │  │  Application Security   │    │    │    │
│  │  │  │  ┌─────────────────┐    │    │    │    │
│  │  │  │  │  Data Security  │    │    │    │    │
│  │  │  │  └─────────────────┘    │    │    │    │
│  │  │  └─────────────────────────┘    │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### ☁️ Cloud Security Best Practices

| Lĩnh vực | Thực hành |
|-----------|-----------|
| **Identity** | IAM least privilege, MFA bắt buộc, service accounts riêng |
| **Network** | VPC, private subnets, security groups, no public DB |
| **Data** | Encrypt at rest + in transit, backup encryption |
| **Compute** | Hardened images, auto-patching, no SSH to production |
| **Monitoring** | CloudTrail/audit logs, SIEM integration |
| **Secrets** | AWS KMS / HashiCorp Vault, rotate regularly |

---

## 🗺️ Lộ Trình Học Security

```
                    SECURITY LEARNING PATH
                    
Level 1 (Junior):
├── OWASP Top 10 awareness
├── Input validation & sanitization
├── Password hashing (Bcrypt)
├── HTTPS everywhere
└── Không hardcode secrets

Level 2 (Mid):
├── JWT / OAuth 2.0 implementation
├── RBAC / ABAC design
├── Security headers configuration
├── Dependency vulnerability scanning
└── Secure code review

Level 3 (Senior):
├── Threat modeling (STRIDE, DREAD)
├── Penetration testing basics
├── Infrastructure as Code security
├── Incident response planning
└── Compliance (SOC2, GDPR, PCI-DSS)

Level 4 (Expert):
├── Custom WAF rules
├── Zero Trust Architecture
├── Security architecture design
├── Red team / Blue team exercises
└── Security culture & training programs
```

---

## 📚 Tài Liệu Tham Khảo

| Nguồn | Link |
|-------|------|
| OWASP Top 10 | https://owasp.org/Top10/ |
| OWASP Cheat Sheet Series | https://cheatsheetseries.owasp.org/ |
| CWE Top 25 | https://cwe.mitre.org/top25/ |
| NIST Cybersecurity Framework | https://www.nist.gov/cyberframework |
| The Web Application Hacker's Handbook | Dafydd Stuttard & Marcus Pinto |

---

> 💡 **Ghi nhớ**: "Security is not a feature — it's a requirement. Every line of code is a potential attack surface." — Mọi dòng code đều là bề mặt tấn công tiềm ẩn.