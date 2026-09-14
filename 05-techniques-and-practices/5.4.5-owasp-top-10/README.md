# 📋 5.4.5 OWASP Top 10 (10 Lỗ Hỏng Bảo Mật Nghiêm Trọng Nhất)

> **OWASP Top 10** là danh sách 10 lỗ hổng bảo mật phổ biến và nguy hiểm nhất, được cập nhật định kỳ bởi Open Web Application Security Project.

---

## 🎯 Vấn đề

```
Thống kê 2023:
├─ 78% ứng dụng có ít nhất 1 lỗ hổng bảo mật
├─ Chi phí trung bình cho 1 breach: $4.45 triệu USD
└─ 68% tấn công exploit được lỗ hổng trong OWASP Top 10
```

---

## 📊 OWASP Top 10 (2021)

```
┌────┬──────────────────────────────────────────────────────────┐
│ #  │ Vulnerability                                            │
├────┼──────────────────────────────────────────────────────────┤
│ 01 │ Broken Access Control                                    │
│ 02 │ Cryptographic Failures                                   │
│ 03 │ Injection                                                │
│ 04 │ Insecure Design                                          │
│ 05 │ Security Misconfiguration                                │
│ 06 │ Vulnerable and Outdated Components                     │
│ 07 │ Authentication and Session Management Failures         │
│ 08 │ Software and Data Integrity Failures                   │
│ 09 │ Security Logging and Monitoring Failures               │
│ 10 │ Server-Side Request Forgery (SSRF)                     │
└────┴──────────────────────────────────────────────────────────┘
```

---

## 💻 Chi tiết từng loại

### #1 Broken Access Control

**Nguyên nhân:** Không kiểm tra quyền truy cập đúng cách.

```typescript
// ❌ BAD: Chỉ check authenticated, không check authorization
app.get('/api/users/:id/admin', async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(user); // Anyone can access any user's data!
});

// ✅ GOOD: Check both auth AND authorization
app.get('/api/users/:id/admin', authMiddleware, async (req, res) => {
  const currentUser = req.user;
  const targetUser = await getUser(req.params.id);

  if (currentUser.id !== targetUser.id && currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(targetUser);
});
```

### #2 Cryptographic Failures

**Nguyên nhân:** Dữ liệu nhạy cảm không được mã hóa.

```typescript
// ❌ BAD: Lưu password plain text
db.users.save({ name: 'John', password: '123456' });

// ✅ GOOD: Hash password với bcrypt
const hashedPassword = await bcrypt.hash('123456', 12);
db.users.save({ name: 'John', passwordHash: hashedPassword });

// ✅ GOOD: Encrypt sensitive data
const encryptedSSN = encrypt(user.ssn, encryptionKey);
```

### #3 Injection

**Nguyên nhân:** User input được gắn vào query/command trực tiếp.

```typescript
// ❌ BAD: SQL Injection
const sql = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD: Parameterized query
const sql = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(sql, [email]);

// ❌ BAD: Command Injection
exec(`git clone ${userInput}`);

// ✅ GOOD: Validate/sanitize input
const safeInput = userInput.replace(/[;&|`$]/g, '');
exec(`git clone ${safeInput}`);
```

### #4 Insecure Design

**Nguyên nhân:** Thiết kế thiếu security considerations.

```
❌ THIẾU THIẾT KẾ:
  - Không có rate limiting → Brute force dễ dàng
  - Không có audit log → Không trace được attack
  - Default admin account → Easy target

✅ THIẾT KẾ AN TOÀN:
  - Rate limiting per IP/user
  - Audit logging cho mọi action
  - No default credentials
  - Security by design từ đầu
```

### #5 Security Misconfiguration

**Nguyên nhân:** Default config, lỗi cấu hình, dư thừa features.

```typescript
// ❌ BAD: Default config
app.use(cors()); // Allow all origins
app.use(express.json()); // No size limit
console.log(error.stack); // Leak stack trace in prod

// ✅ GOOD: Hardened config
app.use(cors({ origin: process.env.ALLOWED_ORIGINS }));
app.use(express.json({ limit: '1mb' }));
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal error' }); // No stack leak
});
```

---

## ✅ Ưu điểm của OWASP Top 10

| Ưu điểm | Giải thích |
|---------|------------|
| 📚 Standard reference | Hướng dẫn bảo mật được công nhận toàn cầu |
| 🎯 Prioritize issues | Biết đâu là vấn đề quan trọng nhất |
| 🛡️ Prevention guide | Có giải pháp cho mỗi vulnerability |
| 🔄 Regular updates | Cập nhật theo xu hướng attack mới |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách xử lý |
|------------|------------|
| 🔴 Không phải checklist đầy đủ | Kết hợp với security audit |
| 🟡 Focus web apps | Bổ sung bằng OWASP ASVS |
| 🟡 Static guidance | Context-dependent application |

---

## 🎯 Khi nào cần关注 OWASP?

| Stage | Action |
|-------|--------|
| **Design** | Threat modeling, secure architecture |
| **Development** | Secure coding practices, code review |
| **Testing** | SAST, DAST, penetration testing |
| **Deployment** | Security headers, config hardening |
| **Monitoring** | Logging, alerting, incident response |

---

## 🔗 Liên quan

- **5.4.1 JWT** — Authentication best practices
- **5.4.3 XSS Prevention** — Prevents injection attacks
- **5.4.4 CSRF Protection** — Prevents unauthorized actions

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP Top 10 2021](https://owasp.org/Top10/)
- 📖 [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- 📖 [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.4.5-owasp-top-10
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.5 State Management](../5.5-state-management/README.md)
