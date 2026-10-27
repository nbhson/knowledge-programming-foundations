# 🔒 Lớp 9: Security (Bảo Mật Phần Mềm)

> **Security** là **hàng rào bảo vệ** ứng dụng khỏi các cuộc tấn công, rò rỉ dữ liệu và lỗ hổng.
> Bảo mật không phải tính năng — **bảo mật là yêu cầu bắt buộc**.
> Không có security = bạn đang đợi bị tấn công, không phải phòng ngừa.

---

## 📚 Mục lục — Bài học chi tiết

| Bài | Chủ đề | Mô tả |
|-----|--------|-------|
| [9.1 OWASP Top 10](9.1-owasp-top10/README.md) | 10 lỗ hổng bảo mật web phổ biến | Checklist + mô phỏng SQLi, XSS, CSRF, SSRF... |
| [9.2 JWT Authentication](9.2-jwt-authentication/README.md) | Xác thực bằng JWT | Header/payload/signature, verify, expiry |
| [9.3 OAuth 2.0](9.3-oauth2/README.md) | Ủy quyền bằng token | Authorization Code flow, access/refresh token |
| [9.4 XSS & CSRF](9.4-xss-csrf/README.md) | Tấn công client-side | Sanitize input, SameSite, CSRF token |
| [9.5 Encryption](9.5-encryption/README.md) | Mã hóa & hashing | AES-256-GCM, SHA-256, salt |
| [9.6 Helmet & Security Headers](9.6-helmet-headers/README.md) | HTTP security headers | CSP, HSTS, danh sách header bảo mật |
| [9.7 SQL Injection](9.7-sql-injection/README.md) | Khai thác & phòng chống | Payloads phổ biến, vulnerable vs safe query builder |
| [9.8 Password Hashing](9.8-password-hashing/README.md) | Băm mật khẩu | bcrypt/argon2 khái niệm, salt/pepper, scrypt với node:crypto |
| [9.9 Secrets Management](9.9-secrets-management/README.md) | Quản lý bí mật | Vault/KMS khái niệm, rotation, env loader + redaction |
| [9.10 mTLS & Zero Trust](9.10-mtls-zero-trust/README.md) | Không tin bất cứ ai | mTLS handshake, zero-trust principles + policy check |

---

## ▶️ Chạy ví dụ (bài 9.7–9.10)

```bash
cd 09-security/9.7-sql-injection && npx tsx examples/index.ts
cd 09-security/9.8-password-hashing && npx tsx examples/index.ts
cd 09-security/9.9-secrets-management && npx tsx examples/index.ts
cd 09-security/9.10-mtls-zero-trust && npx tsx examples/index.ts
```

---

## 📑 Mục Lục

| STT | Chủ đề | Mô tả |
|-----|--------|-------|
| 1 | [OWASP Top 10](#1-owasp-top-10) | 10 lỗ hổng bảo mật web phổ biến nhất |
| 2 | [Authentication & Authorization](#2-authentication--authorization) | Xác thực và phân quyền |
| 3 | [Cryptography Basics](#3-cryptography-basics) | Mã hóa, hashing, signing |
| 4 | [Secure Coding Practices](#4-secure-coding-practices) | Viết code an toàn |
| 5 | [API Security](#5-api-security) | Bảo mật API |
| 6 | [Infrastructure Security](#6-infrastructure-security) | Bảo mật hạ tầng |

---

## 1. OWASP Top 10

> 10 lỗ hổng bảo mật web phổ biến nhất, được OWASP cập nhật định kỳ (cập nhật lần gần nhất: **2025**, phát hành tháng 11/2025 tại OWASP Global AppSec).

### 📋 Danh sách OWASP Top 10 (2025)

| # | Lỗ hổng | Mô tả | Ví dụ tấn công | Mức độ nghiêm trọng |
|---|---------|-------|----------------|---------------------|
| A01 | **Broken Access Control** | Người dùng truy cập tài nguyên không được phép *(SSRF đã được gộp vào đây)* | Thay đổi ID trong URL để xem dữ liệu người khác, đọc metadata cloud | 🔴 Cao |
| A02 | **Security Misconfiguration** | Cấu hình sai hoặc mặc định *(tăng từ #5)* | Debug mode bật trên production, default admin/admin | 🔴 Cao |
| A03 | **Security Misconfiguration** *(mới)* | Bao gồm các thành phần yếu, không có hardening, quyền không cần thiết | Thiếu security headers, unused features enabled | 🔴 Cao |
| A04 | **Cryptographic Failures** | Dữ liệu nhạy cảm không được mã hóa đúng *(giảm từ #2)* | Lưu password dạng plaintext, SSL offloading sai | 🔴 Cao |
| A05 | **Injection** | Dữ liệu không tin cậy được gửi vào interpreter *(giảm từ #3)* | SQL Injection, XSS, Command Injection, LDAP injection | 🔴 Cao |
| A06 | **Insecure Design** | Thiết kế hệ thống thiếu threat modeling *(giảm từ #4)* | Không có rate limiting cho API, flow xác thực yếu | 🟡 Trung bình |
| A07 | **Authentication Failures** | Xác thực và quản lý session yếu *(đổi tên)* | Brute force password, session fixation, weak password policy | 🔴 Cao |
| A08 | **Software or Data Integrity Failures** | Không kiểm tra tính toàn vẹn dữ liệu | Insecure deserialization, unsigned code, CI/CD tampering | 🟡 Trung bình |
| A09 | **Security Logging & Alerting Failures** | Log không đủ, không giám sát, không cảnh báo *(đổi tên: Monitoring → Alerting)* | Không phát hiện được tấn công, log thiếu metadata | 🟡 Trung bình |
| A10 | **Mishandling of Exceptional Conditions** *(hoàn toàn mới)* | Lỗi xử lý ngoại lệ, hệ thống "fail open" khi gặp điều kiện bất thường, trạng thái không an toàn | Error handling leak thông tin, retry storm, race condition | 🟡 Trung bình |

> 📌 **Thay đổi so với 2021:** SSRF (A10 cũ) → gộp vào A01. Vulnerable Components (#6 cũ) → mở rộng thành A03 Software Supply Chain Failures (full supply chain: dependencies, CI/CD, build, distribution). A10 hoàn toàn mới. Security Misconfiguration: #5 → #2. Cryptographic Failures: #2 → #4. Injection: #3 → #5. Insecure Design: #4 → #6. Nguồn: top10.owasp.org/2025

### 🔍 Chi tiết Injection (A03) — Ví dụ điển hình nhất

```
❌ SQL Injection (concatenation):
   query = "SELECT * FROM users WHERE id = '" + userInput + "'"
   → userInput = "1' OR '1'='1"
   → SELECT * FROM users WHERE id = '1' OR '1'='1'
   → TRẢ VỀ TẤT CẢ USERS! (bao gồm admin passwords)

   → userInput = "'; DROP TABLE users; --"
   → SELECT * FROM users WHERE id = ''; DROP TABLE users; --'
   → TABLE USERS BỊ XÓA!

✅ Parameterized Query (prepared statement):
   db.query("SELECT * FROM users WHERE id = ?", [userInput])
   → userInput luôn được xử lý như DATA, không phải CODE
   → Database escape tự động — SQL injection bất lực

✅ ORM parameterized:
   await User.findById(userInput);  // Sequelize, Prisma, TypeORM đều parameterized
```

**Thực tế Log4Shell (2021):** Một lỗ hổng RCE trong Log4j (Java logging library) cho phép execute arbitrary code qua log message. Cả industry sập — AWS, Apple, Minecraft, cloud providers đều affected. **Học được:** dependency scanning là bắt buộc.

---

## 2. Authentication & Authorization

> **Authentication (AuthN)** = "Bạn là ai?" — Xác minh identity
> **Authorization (AuthZ)** = "Bạn được làm gì?" — Xác minh permission

### 🔑 Các phương thức Authentication

```
┌─────────────────────────────────────────────────┐
│           AUTHENTICATION METHODS                │
├─────────────────────────────────────────────────┤
│                                                 │
│  📧 Password-based                              │
│  ├── Bcrypt / Argon2 hashing (lưu hash, không plaintext)
│  ├── Salt + Pepper (chống rainbow table)
│  └── Password policies (độ dài, complexity)
│                                                 │
│  🔐 Token-based                                 │
│  ├── JWT (JSON Web Token) — stateless auth
│  ├── OAuth 2.0 / OpenID Connect — delegated auth
│  └── API Keys — machine-to-machine
│                                                 │
│  📱 Multi-Factor (MFA)                          │
│  ├── TOTP (Google Authenticator, Authy) — strongest
│  ├── SMS/Email OTP — okay nhưng SIM swap risk
│  └── Hardware Keys (FIDO2/WebAuthn) — best UX+security
│                                                 │
│  🔗 Single Sign-On (SSO)                        │
│  ├── SAML 2.0 — enterprise standard
│  └── OpenID Connect — modern, JWT-based
└─────────────────────────────────────────────────┘
```

### 🛡️ Authorization Models

| Model | Mô tả | Khi nào dùng | Ví dụ |
|-------|--------|-------------|-------|
| **RBAC** | Role-Based Access Control | Hệ thống có roles rõ ràng (Admin, User, Editor) | Admin có thể delete user, User chỉ view |
| **ABAC** | Attribute-Based Access Control | Quyền dựa trên thuộc tính (department, location, time) | Chỉ HR department mới xem được salary |
| **ACL** | Access Control List | Quyền cụ thể trên từng resource | File A: owner=read/write, group=read |
| **ReBAC** | Relationship-Based Access Control | Quyền dựa trên quan hệ (owner, member, viewer) | Google Docs: owner can share, member can comment |

### 📊 JWT Flow (xem chi tiết 9.2)

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

> Nền tảng mã hóa cần biết cho lập trình viên. **Quy tắc vàng: KHÔNG tự implement crypto.**

### 🔐 Các loại mã hóa

```
┌─────────────────────────────────────────────────────────────┐
│                    CRYPTOGRAPHY                             │
├──────────────────┬──────────────────┬───────────────────────┤
│   Hashing        │  Symmetric       │  Asymmetric           │
│   (One-way)      │  (Cùng key)      │  (Cặp key)            │
├──────────────────┼──────────────────┼───────────────────────┤
│ • MD5 (❌ weak)  │ • AES-256        │ • RSA 2048+           │
│ • SHA-256        │ • ChaCha20       │ • ECDSA (P-256)       │
│ • SHA-3          │ • 3DES (❌ old)  │ • Ed25519             │
│ • Bcrypt ✅      │                  │                       │
│ • Argon2 ✅      │                  │                       │
├──────────────────┼──────────────────┼───────────────────────┤
│ Dùng cho:        │ Dùng cho:        │ Dùng cho:             │
│ • Password hash  │ • Encrypt data   │ • HTTPS/TLS           │
│ • File checksum  │ • Database       │ • Digital signatures  │
│ • Data integrity │ • File encrypt   │ • Key exchange        │
└──────────────────┴──────────────────┴───────────────────────┘
```

### ⚠️ Quy tắc vàng

```
1. KHÔNG BAO GIỜ tự implement crypto algorithm
   → Crypto là lĩnh vực chuyên sâu, sai 1 bit = cả hệ thống vỡ

2. KHÔNG dùng MD5/SHA1 cho password
   → Rainbow table sẵn có, GPU crack trong microgiây

3. LUÔN dùng Bcrypt/Argon2 cho password hashing
   → Argon2id thắng PHC (Password Hashing Competition) 2015

4. LUÔN dùng TLS/HTTPS cho data in transit
   → HTTP plaintext = mọi người đứng giữa (man-in-the-middle) đọc được

5. LUÔN dùng AES-256-GCM cho data at rest
   → GCM cung cấp cả confidentiality + integrity (authenticated encryption)

6. Key phải được quản lý riêng (KMS, Vault)
   → Hardcode key = key leak = data breach
```

---

## 4. Secure Coding Practices

> Các nguyên tắc viết code an toàn — defense in depth bắt đầu từ từng dòng code.

### ✅ Input Validation — Nhiều lớp phòng thủ

```
┌──────────────────────────────────────────────┐
│          INPUT VALIDATION LAYERS             │
├──────────────────────────────────────────────┤
│                                              │
│  Layer 1: Client-side (UX only, NOT secure!) │
│  ├── HTML5 validation (type="email")         │
│  └── JavaScript checks                      │
│  ⚠️ Client-side có thể bypass dễ dàng        │
│                                              │
│  Layer 2: API Gateway / WAF                  │
│  ├── Rate limiting (chống brute force)       │
│  ├── Request size limits                     │
│  └── Basic pattern matching                  │
│                                              │
│  Layer 3: Server-side (REQUIRED!)            │
│  ├── Whitelist validation                    │
│  ├── Type checking (TypeScript runtime)      │
│  ├── Range/length validation                 │
│  ├── Regex pattern matching                  │
│  └── Sanitization (encode output)            │
│                                              │
│  Layer 4: Database                           │
│  ├── Parameterized queries                   │
│  ├── Stored procedures                       │
│  └── Column constraints (NOT NULL, UNIQUE)  │
└──────────────────────────────────────────────┘
```

### 🛡️ Secure Coding Checklist

| Hạng mục | Thực hành | Anti-pattern | Tại sao quan trọng |
|----------|-----------|-------------|-------------------|
| **Input** | Validate & sanitize MỌI input | Trust user input | Input là attack vector số 1 |
| **Output** | Encode output theo context (HTML, JS, URL) | Render raw HTML | Context-aware encoding prevents XSS |
| **Error** | Log chi tiết internal, response generic cho user | Expose stack trace cho user | Stack trace = map cho attacker |
| **Secret** | Dùng env vars / secret manager | Hardcode trong source code | Source leak = secret leak |
| **Dependency** | Scan CVE, pin versions | Dùng `*` trong dependency version | vulnerable dependency = backdoor |
| **Session** | Secure, HttpOnly, SameSite cookies | Store session trong localStorage | localStorage đọc được bởi XSS |
| **File Upload** | Validate type, scan malware, rename | Serve file trực tiếp từ upload dir | Upload shell = server compromise |

---

## 5. API Security

> Bảo mật cho REST API, GraphQL và các endpoints — attack surface lớn nhất của modern app.

### 🔒 API Security Checklist

```
┌─────────────────────────────────────────────────┐
│            API SECURITY LAYERS                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  🌐 Transport Layer                             │
│  ├── HTTPS only (TLS 1.2+)                     │
│  ├── HSTS headers (force HTTPS)                │
│  └── Certificate pinning (mobile apps)         │
│                                                 │
│  🔑 Authentication                              │
│  ├── OAuth 2.0 + PKCE (mobile/SPA)             │
│  ├── API Key rotation (thói quen 90 ngày)      │
│  └── Mutual TLS (service-to-service mTLS)      │
│                                                 │
│  🚦 Rate Limiting                               │
│  ├── Per-user rate limits (chống brute force)  │
│  ├── Global rate limits (chống DDoS)           │
│  └── Adaptive throttling (machine learning)    │
│                                                 │
│  📋 Input/Output                                │
│  ├── Request validation (JSON Schema / Zod)    │
│  ├── Response filtering (không leak data)      │
│  └── Pagination limits (chống enumeration)     │
│                                                 │
│  📝 Logging & Monitoring                        │
│  ├── Audit log mọi mutation                    │
│  ├── Anomaly detection (login từ lạ location)  │
│  └── Real-time alerting (Splunk, Datadog)      │
└─────────────────────────────────────────────────┘
```

### 🔐 Security Headers

```
# Essential HTTP Security Headers (xem chi tiết 9.6):
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store  (cho sensitive endpoints)
```

---

## 6. Infrastructure Security

> Bảo mật ở tầng hạ tầng, network và cloud — nơi attacker thường bắt đầu nếu app layer quá khó.

### 🏗️ Defense in Depth

```
┌─────────────────────────────────────────────────┐
│              DEFENSE IN DEPTH                   │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Physical Security                      │    │
│  │  (datacenter access, badge, cameras)    │    │
│  │  ┌─────────────────────────────────┐    │    │
│  │  │  Network Security               │    │    │
│  │  │  (VPC, security groups, WAF)    │    │    │
│  │  │  ┌─────────────────────────┐    │    │    │
│  │  │  │  Application Security   │    │    │    │
│  │  │  │  (input validation,    │    │    │    │
│  │  │  │   auth, encryption)    │    │    │    │
│  │  │  │  ┌─────────────────┐    │    │    │    │
│  │  │  │  │  Data Security  │    │    │    │    │
│  │  │  │  │  (encrypt at    │    │    │    │    │
│  │  │  │  │   rest, mask)   │    │    │    │    │
│  │  │  │  └─────────────────┘    │    │    │    │
│  │  │  └─────────────────────────┘    │    │    │
│  │  └─────────────────────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Mỗi lớp là backup cho lớp dưới                 │
│  Nếu attacker vượt lớp App → gặp lớp Network    │
│  Nếu vượt Network → gặp lớp Data                │
└─────────────────────────────────────────────────┘
```

### ☁️ Cloud Security Best Practices

| Lĩnh vực | Thực hành | Lý do |
|-----------|-----------|-------|
| **Identity** | IAM least privilege, MFA bắt buộc, service accounts riêng | 69% breaches liên quan credential compromise |
| **Network** | VPC, private subnets, security groups, no public DB | Reduces attack surface dramatically |
| **Data** | Encrypt at rest (AES-256) + in transit (TLS 1.2+), backup encryption | IBM Cost of a Data Breach Report 2025: trung bình toàn cầu ~$4.4M (đỉnh $4.88M năm 2024) |
| **Compute** | Hardened images, auto-patching, no SSH to production | Unpatched VM = easy entry point |
| **Monitoring** | CloudTrail/audit logs, SIEM integration, alert on anomalous API calls | Detect breach trong minutes, not months |
| **Secrets** | AWS KMS / HashiCorp Vault, rotate regularly (90 days) | Hardcoded secrets = #1 cloud misconfig |

---

## 🗺️ Lộ Trình Học Security

```
                     SECURITY LEARNING PATH

Level 1 (Junior — "Biết nguy hiểm"):
├── OWASP Top 10 awareness (biết 10 lỗ hổng phổ biến)
├── Input validation & sanitization (luôn validate mọi input)
├── Password hashing (bcrypt/argon2, không bao giờ plaintext)
├── HTTPS everywhere (TLS cho mọi connection)
└── Không hardcode secrets (dùng env vars)

Level 2 (Mid — "Biết phòng thủ"):
├── JWT / OAuth 2.0 implementation (đúng cách, không leak token)
├── RBAC / ABAC design (phân quyền đúng ngữ cảnh)
├── Security headers configuration (helmet, CSP, HSTS)
├── Dependency vulnerability scanning (npm audit, Snyk)
└── Secure code review (biệt lỗi phổ biến)

Level 3 (Senior — "Thiết kế an toàn"):
├── Threat modeling (STRIDE, DREAD) — think like attacker
├── Penetration testing basics (burp suite, OWASP ZAP)
├── Infrastructure as Code security (Terraform scan, K8s hardening)
├── Incident response planning (detect → contain → eradicate → recover)
└── Compliance (SOC2, GDPR, PCI-DSS requirements)

Level 4 (Expert — "Kiến tạo văn hóa bảo mật"):
├── Custom WAF rules (miễn cưỡng khi các rule chuẩn không đủ)
├── Zero Trust Architecture (không tin gì, xác minh mọi thứ)
├── Security architecture design (secure by design)
├── Red team / Blue team exercises (attacker vs defender)
└── Security culture & training programs (people = first layer)
```

---

## 📚 Tài Liệu Tham Khảo

| Nguồn | Link | Ghi chú |
|-------|------|---------|
| OWASP Top 10 | https://top10.owasp.org/ | Standard reference — bản mới nhất: **2025** (phát hành 11/2025) |
| OWASP Cheat Sheet Series | https://cheatsheetseries.owasp.org/ | Practical guides |
| CWE Top 25 | https://cwe.mitre.org/top25/ | Common Weakness Enumeration |
| NIST Cybersecurity Framework | https://www.nist.gov/cyberframework | Enterprise framework |
| The Web Application Hacker's Handbook | Dafydd Stuttard & Marcus Pinto | Bible of web hacking |

---

> 💡 **Ghi nhớ:** "Security is not a feature — it's a requirement. Every line of code is a potential attack surface."
>
> **"Attacker's cost is your failure cost."** — Attacker chỉ cần tìm 1 lỗi; bạn phải sửa hết tất cả.
>
> **" Security is a process, not a product."** — Bruce Schneier
