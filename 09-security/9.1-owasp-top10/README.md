# 🛡️ 9.1 OWASP Top 10

> **OWASP Top 10** là danh sách 10 lỗ hổng bảo mật web nghiêm trọng nhất, được OWASP công bố định kỳ (cập nhật lần gần nhất: 2021).

```
┌─────────────────────────────────────────────────────────┐
│              OWASP TOP 10 — 2021                         │
├──────┬───────────────────────────┬───────────────────────┤
│  #   │  Lỗ hổng                  │  Tác động              │
├──────┼───────────────────────────┼───────────────────────┤
│ A01  │ Broken Access Control     │ Truy cập trái phép    │
│ A02  │ Cryptographic Failures    │ Rò rỉ dữ liệu nhạy cảm│
│ A03  │ Injection                 │ Thực thi mã độc       │
│ A04  │ Insecure Design           │ Kiến trúc yếu         │
│ A05  │ Security Misconfiguration │ Cấu hình sai          │
│ A06  │ Vulnerable Components     │ Thư viện cũ/lỗ hổng   │
│ A07  │ Authentication Failures   │ Đánh cắp tài khoản    │
│ A08  │ Software/Data Integrity   │ Xâm phạm toàn vẹn     │
│ A09  │ Logging & Monitoring      │ Không phát hiện tấn công│
│ A10  │ SSRF                      │ Server gửi request độc│
└──────┴───────────────────────────┴───────────────────────┘
```

---

## A01 — Broken Access Control (Kiểm soát truy cập yếu)

**Mô tả:** Người dùng có thể truy cập tài nguyên thuộc về người khác hoặc thực hiện hành vi không được ủy quyền.

```
❌ Tấn công:
   GET /api/orders/123        → User A xem đơn hàng của User B
   GET /api/admin/users       → User thường truy cập trang admin
   PUT /api/users/role        → Self-elevation thành admin

✅ Phòng chống:
   - Kiểm tra authorization MỌI request
   - Sử dụng RBAC/ABAC
   - Không trust vào client-side check
```

```typescript
// ❌ BAD — Không kiểm tra quyền
app.get('/api/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order); // User nào cũng xem được!
});

// ✅ GOOD — Kiểm tra ownership
app.get('/api/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(order);
});
```

---

## A02 — Cryptographic Failures (Thất bại mã hóa)

**Mô tả:** Dữ liệu nhạy cảm (password, token, PII) không được mã hóa đúng cách, để plaintext hoặc dùng thuật toán yếu.

```
❌ Lưu password plaintext:
   INSERT INTO users (email, password) VALUES ('a@b.com', '123456')

❌ Dùng MD5/SHA1 cho hash:
   hash('123456') → е10adc3949ba59abbe56e057f20f883e  (dễ reverse)

✅ Dùng bcrypt/argon2 với salt:
   bcrypt.hash('123456', 12) → $2b$12$K... (rất khó reverse)
```

```typescript
import bcrypt from 'bcrypt';

// ❌ BAD
const password = req.body.password;
db.save({ password }); // plaintext!

// ✅ GOOD
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
db.save({ password: hashedPassword });

// Verify
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

---

## A03 — Injection (Tiêm nhiễm)

**Mô tả:** Dữ liệu không tin cậy được gửi vào interpreter (SQL, OS command, LDAP, XXE…).

```
❌ SQL Injection:
   query = "SELECT * FROM users WHERE id = '" + userId + "'"
   userId = "1' OR '1'='1"
   → SELECT * FROM users WHERE id = '1' OR '1'='1' (trả về TẤT CẢ!)

✅ Parameterized query:
   db.query("SELECT * FROM users WHERE id = ?", [userId])
   → userId luôn được escape tự động
```

```typescript
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

// ❌ BAD — string concat
const getUserBad = async (id: string) => {
  return sql`SELECT * FROM users WHERE id = '${id}'`;
};

// ✅ GOOD — parameterized (template literal safe with postgres)
const getUserGood = async (id: string) => {
  return sql`SELECT * FROM users WHERE id = ${id}`;
};
```

---

## A04 — Insecure Design (Thiết kế không an toàn)

**Mô tả:** Thiếu threat modeling, không xét security từ giai đoạn thiết kế.

```
⚠️ Dấu hiệu nhận biết:
   - Không có rate limiting trên login
   - Không có account lockout sau N lần fail
   - Password reset token dễ đoán
   - Không có audit log cho hành vi nhạy cảm
```

---

## A05 — Security Misconfiguration (Cấu hình sai)

```
❌ Thường gặp:
   - Debug mode bật trên production
   - Default credentials (admin/admin)
   - CORS: Access-Control-Allow-Origin: *
   - HTTP thay vì HTTPS
   - Directory listing enabled
```

---

## A06 — Vulnerable Components (Thành phần lỗi thời)

```
❌ package.json nguy hiểm:
   "express": "^4.17.1"     → có thể update lên bản có CVE
   "*": "*"                  → không pin version

✅ Giải pháp:
   - Pin versions: "express": "4.18.2"
   - Chạy `npm audit` định kỳ
   - Dùng Dependabot / Snyk tự động cảnh báo
```

---

## A07 — Authentication Failures (Yếu xác thực)

```
❌常见问题:
   - Password quá ngắn, không policy
   - Không có MFA
   - Session token lưu localStorage (bị XSS đọc)
   - Brute force không rate limit

✅ Best practices:
   - Hash password với bcrypt/argon2
   - Rate limit login endpoint
   - Enable MFA (TOTP)
   - Store session cookie: HttpOnly, Secure, SameSite=Strict
```

---

## A08 — Software & Data Integrity Failures

```
❌ Insecure deserialization:
   const data = JSON.parse(req.body.serialized);  // nếu attacker control được input
  
✅ Luôn validate schema trước khi deserialize:
   import { z } from 'zod';
   const UserSchema = z.object({ id: z.string(), name: z.string() });
   const parsed = UserSchema.parse(req.body);
```

---

## A09 — Security Logging & Monitoring Failures

```
❌ Log thiếu:
   - Không log failed login attempts
   - Không alert khi phát hiện anomaly
   - Log chứa sensitive data (password trong plain)

✅ Cần log:
   - Login success/fail (IP, user-agent)
   - Permission denied events
   - Admin actions (create/delete/modify)
   - ⚠️ KHÔNG log password/token
```

---

## A10 — Server-Side Request Forgery (SSRF)

```
❌ Attacker控制 URL:
   app.get('/fetch', async (req) => {
     const url = req.query.url;
     const res = await fetch(url);  // attacker传 http://169.254.169.254/ (cloud metadata)
   });

✅ White-list URL:
   const allowedHosts = ['api.example.com'];
   const parsed = new URL(url);
   if (!allowedHosts.includes(parsed.hostname)) throw new Error('Forbidden');
```

---

## 📊 Tổng hợp phòng chống

| Lớp | Biện pháp |
|-----|-----------|
| 🔐 **Design** | Threat modeling (STRIDE), security requirements |
| 🛡️ **Code** | Input validation, parameterized queries, output encoding |
| 🔒 **Config** | Helmets headers, CORS strict, disable debug |
| 📦 **Dependencies** | `npm audit`, dependabot, pin versions |
| 📝 **Monitoring** | Audit log, SIEM, alert on anomalies |
| 🧪 **Testing** | SAST/DAST, pen test, OWASP ZAP scan |

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP Top 10 2021](https://owasp.org/Top10/)
- 📖 [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- 📖 [CWE Top 25](https://cwe.mitre.org/top25/)

---

⏭️ Bài tiếp theo → [9.2 JWT Authentication](../9.2-jwt-authentication/README.md)
