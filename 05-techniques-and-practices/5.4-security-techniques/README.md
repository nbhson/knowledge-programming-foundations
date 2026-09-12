# ⚙️ 5.4 Security Techniques (Kỹ Thuật Bảo Mật)

> **Security** là bảo vệ ứng dụng khỏi **tấn công, rò rỉ dữ liệu, truy cập trái phép**. "Security is not a feature, it's a mindset."

```
Chi phí bảo mật vs chi phí sửa lỗi:
  Thiết kế bảo mật từ đầu  → $1
  Sửa sau khi bị hack      → $1000+ + mất uy tín
```

---

## 🔐 JWT Authentication (JSON Web Token)

**Mô tả:** Token không trạng thái xác thực user, bao gồm 3 phần: Header.Payload.Signature.

```
┌─────────────────────────────────────────┐
│  JWT Structure:                         │
│  header.payload.signature               │
│  ├─ Base64(header)                      │
│  ├─ Base64(payload)                     │
│  └─ HMACSHA256(base64Header +          │
│              "." + base64Payload,      │
│              secret)                    │
└─────────────────────────────────────────┘
```

```typescript
import jwt from 'jsonwebtoken';

// Generate token
function generateToken(user: { id: string; role: string }): string {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

// Verify token
function verifyToken(token: string): any {
  return jwt.verify(token, process.env.JWT_SECRET!);
}

// Middleware protect route
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

⚠️ **Lưu ý:** Không lưu JWT trong localStorage (XSS risk), prefer HTTP-only cookies.

---

## 🔑 OAuth 2.0

**Mô tả:** Cơ chế ủy quyền cho phép app truy cập tài nguyên user mà không cần password.

```
OAuth 2.0 Flow (Authorization Code):

Client App          Authorization Server          Resource Server
     │                      │                          │
     │  1. Redirect to login │                          │
     │─────────────────────▶│                          │
     │                      │                          │
     │  2. User approves     │                          │
     │◀─────────────────────│                          │
     │                      │                          │
     │  3. Auth Code         │                          │
     │◀─────────────────────│                          │
     │                      │                          │
     │  4. Exchange code for │                          │
     │     access token      │                          │
     │─────────────────────▶│                          │
     │                      │                          │
     │  5. Access Token      │                          │
     │◀─────────────────────│                          │
     │                      │                          │
     │  6. Request resource  │                          │
     │─────────────────────────────────────────────────▶│
     │                      │                          │
     │  7. Resource data     │                          │
     │◀─────────────────────────────────────────────────│
```

```typescript
// Basic OAuth 2.0 token exchange
async function exchangeCodeForToken(code: string): Promise<OAuthToken> {
  const response = await fetch('https://auth.provider.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:3000/callback',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    }),
  });
  return response.json();
}
```

---

## 🛡️ XSS Prevention (Cross-Site Scripting)

**Mô tả:** Tấn công chèn mã độc vào trang web qua input chưa sanitize.

```
❌ VULNERABLE: Render raw HTML từ user input
<div dangerouslySetInnerHTML={{ __html: userInput }} />

✅ PROTECTED: Escape output / dùng sanitized HTML
<div>{userInput}</div>                          // Tự động escape
<div dangerouslySetInnerHTML={{ __html: sanitize(input) }} />
```

```typescript
// HTML Sanitization
import DOMPurify from 'dompurify';

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
  });
}

// Content-Security-Policy (CSP) header
const csp = "default-src 'self'; script-src 'self' 'nonce-abc123';";
res.setHeader('Content-Security-Policy', csp);
```

---

## 🔄 CSRF Protection

**Mô tả:** Cross-Site Request Forgery — attacker khiến user thực hiện hành động không muốn.

```
CSRF Attack Flow:
  Victim (logged in)        Attacker Site
       │                          │
       │   1. Victim visits       │
       │      attacker site       │
       │◀─────────────────────────│
       │                          │
       │   2. Hidden form submits │
       │      transfer request    │
       │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ▶│
       │      (with cookies)      │
       │                          │
       ▼                          │
  Bank processes transfer ❌      │
```

```typescript
// CSRF Token Approach
import csurf from 'csurf';

const csrfProtection = csurf({ cookie: true });

app.get('/transfer', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.post('/transfer', csrfProtection, (req, res) => {
  // req.csrfToken() must match
  const { amount, to } = req.body;
  // process transfer...
});
```

```typescript
// SameSite Cookie (modern approach)
res.cookie('session', sessionId, {
  sameSite: 'strict', // or 'lax'
  httpOnly: true,
  secure: true,
});
```

---

## 📋 OWASP Top 10

```
┌──────────────────────────────────────────────────────┐
│  OWASP Top 10 (2021) — 10漏洞 quan trọng nhất       │
├──────────────────────────────────────────────────────┤
│  1. Injection        → Parameterized queries         │
│  2. Broken Auth      → MFA, rate limiting            │
│  3. Sensitive Data   → Encryption, HTTPS             │
│  4. XXE              → Disable external entities     │
│  5. Broken Access    → Deny by default               │
│  6. Security Misconfig→ Default configs              │
│  7. XSS              → Escape output, CSP            │
│  8. Insecure Deser.  → Type validation               │
│  9. Known Vulns      → Update dependencies           │
│ 10. Insufficient Log → Audit logging                 │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Security Checklist

| Checklist | Technique | Tool |
|-----------|-----------|------|
| Password hashing | bcrypt, argon2 | `bcrypt.hash(password, 12)` |
| Input validation | Zod, Joi, class-validator | `z.string().email()` |
| SQL injection | Parameterized queries | Prisma, TypeORM |
| XSS | Escape output, CSP | DOMPurify, helmet |
| CSRF | Token, SameSite cookie | csurf, cookie options |
| Rate limiting | Limit requests/time | express-rate-limit |
| HTTPS | TLS/SSL | Let's Encrypt |
| Secrets | Environment variables | dotenv, secret managers |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| API cần xác thực user | ✅ JWT + HTTP-only cookie |
| Login bằng social | ✅ OAuth 2.0 |
| Form chấp nhận HTML input | ✅ XSS sanitization |
| State-changing endpoints | ✅ CSRF protection |
| Xử lý dữ liệu nhạy cảm | ✅ Encryption at rest |
| Public-facing app | ✅ OWASP Top 10 review |

---

## 🔗 Liên quan

- **5.5 State Management** — Secure state handling
- **5.10 API Design** — Secure API patterns

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- 📖 [JWT.io](https://jwt.io/introduction)
- 📖 [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

## ⏭️ Bài tiếp theo

→ [5.5 State Management](./5.5-state-management/README.md)
