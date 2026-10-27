# 🔐 9.2 JWT Authentication

> **JWT (JSON Web Token)** là chuẩn RFC 7519 để truyền thông tin xác thực giữa các bên dưới dạng JSON, được ký số để đảm bảo toàn vẹn.
> JWT không phải là "storage" — nó là **transport mechanism** cho identity claims. Token không có giá trị gì nếu không được ký đúng.

```
┌─────────────────────────────────────────────────────────────┐
│                    JWT STRUCTURE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   header.payload.signature                                  │
│   ─────── ────────── ──────────────                         │
│   Base64  Base64    HMACSHA256 / RSA / ES256               │
│                                                             │
│   Ví dụ (decode được — JWT KHÔNG phải encryption!):        │
│   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9                   │
│   .eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJyb2xlIjoiYWRtaW4ifQ  │
│   .SflKxwLJSeCKkMdp168dKZqmOw~9czqfOECvUTp2ZI               │
│                                                             │
│   Decode payload:                                           │
│   { "sub": "1234567890", "name": "John", "role": "admin" } │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> ⚠️ **Quan trọng:** JWT là **signed** (ký), không phải **encrypted** (mã hóa). Bất kỳ ai cũng có thể decode payload (base64url decode). Chỉ signature mới đảm bảo tính toàn vẹn — server cần verify signature trước khi trust payload.

---

## 📐 JWT Structure chi tiết

| Phần | Nội dung | Ví dụ | Đặc điểm |
|------|----------|-------|----------|
| **Header** | Algorithm + token type | `{"alg":"HS256","typ":"JWT"}` | Xác định cách ký |
| **Payload** | Claims (dữ liệu) | `{"sub":"123","role":"admin","exp":1700000000}` | Chứa thông tin về entity |
| **Signature** | Ký bằng secret/key | HMACSHA256(base64(header)+base64(payload), secret) | Đảm bảo token không bị sửa |

```
┌─ Header ──────────────────────────────────────────┐
│ { "alg": "HS256", "typ": "JWT" }                  │
│ • alg: thuật toán ký (HS256, RS256, ES256)       │
│ • typ: luôn là "JWT"                              │
├─ Payload ─────────────────────────────────────────┤
│ { "sub": "user-123", "role": "admin",             │
│   "iat": 1700000000, "exp": 1700086400 }          │
│ • sub: subject (ai là token này)                  │
│ • iat: issued at (thời gian tạo)                  │
│ • exp: expiration (thời gian hết hạn)             │
│ • custom claims: role, permissions, etc.          │
├─ Signature ───────────────────────────────────────┤
│ HMACSHA256(                                        │
│   base64Url(header) + "." + base64Url(payload),   │
│   "YOUR_256_BIT_SECRET"                            │
│ )                                                  │
│ • Đảm bảo: token không bị sửa sau khi sign        │
│ • Nếu sửa 1 byte → signature invalid              │
└────────────────────────────────────────────────────┘
```

---

## 🔑 Claims (Payload) — Standard vs Custom

| Claim | Full name | Mô tả | Bắt buộc? | Ví dụ |
|-------|-----------|-------|-----------|-------|
| `iss` | Issuer | Người phát hành token | ❌ | `"auth.example.com"` |
| `sub` | Subject | Chủ thể token (user ID) | ✅ (recommended) | `"user-123"` |
| `aud` | Audience | Đối tượng nhận token | ❌ | `"api.example.com"` |
| `exp` | Expiration | Thời điểm hết hạn (unix timestamp) | ✅ (best practice) | `1700086400` |
| `nbf` | Not Before | Thời điểm có hiệu lực | ❌ | `1700000000` |
| `iat` | Issued At | Thời điểm tạo | ❌ | `1700000000` |
| `jti` | JWT ID | ID duy nhất cho token (chống replay) | ❌ | `"a1b2c3d4"` |

```typescript
// Ví dụ payload đầy đủ
{
  "sub": "usr_8f7g6h5j",
  "role": "admin",
  "permissions": ["read:users", "write:orders"],
  "iss": "auth.example.com",
  "aud": "api.example.com",
  "iat": 1700000000,
  "exp": 1700086400,   // 24 hours later
  "nbf": 1700000000,
  "jti": "tok_9x8y7z6w"
}
```

> 💡 **Golden rule:** Không bao giờ lưu sensitive data trong JWT payload (password hash, PII, credit card). Payload là base64 — decode được bởi bất kỳ ai. Dùng payload cho **identifier** (user ID, role), không cho **secret**.

---

## 💻 TypeScript Implementation

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// ─────────────────────────────────────────────
// Configuration — secrets from environment!
// ─────────────────────────────────────────────
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;   // HS256 (symmetric)
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!; // HS256
const ACCESS_TOKEN_EXPIRES = '15m';    // Short-lived
const REFRESH_TOKEN_EXPIRES = '7d';    // Longer-lived, rotated

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface UserPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─────────────────────────────────────────────
// ✅ Generate Access Token (short life)
// ─────────────────────────────────────────────
function generateAccessToken(payload: UserPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
    issuer: 'auth.example.com',
    audience: 'api.example.com',
  });
}

// ─────────────────────────────────────────────
// ✅ Generate Refresh Token (longer life, stored in DB)
// ─────────────────────────────────────────────
function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
}

// ─────────────────────────────────────────────
// ✅ Verify Access Token
// ─────────────────────────────────────────────
function verifyAccessToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET, {
      algorithms: ['HS256'],     // Explicitly specify allowed algorithms
      issuer: 'auth.example.com',
      audience: 'api.example.com',
    }) as UserPayload;
  } catch {
    return null; // invalid, expired, or wrong signature
  }
}

// ─────────────────────────────────────────────
// ✅ Verify Refresh Token
// ─────────────────────────────────────────────
function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET, {
      algorithms: ['HS256'],
    }) as { userId: string };
  } catch {
    return null;
  }
}
```

### ⚠️ Critical: Algorithm Confusion Attack

```typescript
// ❌ DANGER — không specify algorithms = attacker có thể swap HS256 → none
jwt.verify(token, SECRET);  // Vulnerable!

// ✅ SAFE — explicitly constrain
jwt.verify(token, SECRET, {
  algorithms: ['HS256'],   // Chỉ chấp nhận HS256
});
```

---

## 🔄 Refresh Token Flow

Access token ngắn hạn (15 phút) + Refresh token dài hạn (7 ngày) = balance giữa security và UX.

```
Client                          Server                      Database
  │                               │                              │
  │── 1. Login (email/password) ──►│                              │
  │                               │── 2. Verify password (bcrypt) │
  │                               │◄── 3. User found             │
  │                               │                              │
  │◄── 4. Access Token (15min) ───│                              │
  │◄── 5. Refresh Token (7days) ──│── 6. Store refresh token     │
  │     + Set httpOnly cookie     │   in DB (token + userId)     │
  │                               │                              │
  │── 7. Access Token expired ────►│                              │
  │     POST /api/auth/refresh    │                              │
  │     { refreshToken }          │                              │
  │                               │── 8. Verify refresh token    │
  │                               │── 9. Check token in DB       │
  │                               │     (revoked? used already?) │
  │◄── 10. New Access Token ──────│                              │
  │◄── 11. New Refresh Token ─────│── 12. Delete old, store new  │
  │     (rotation!)               │   (prevent reuse attack)     │
```

```typescript
// ─────────────────────────────────────────────
// ✅ Refresh Token Rotation (best practice)
// ─────────────────────────────────────────────
async function handleRefreshToken(
  refreshToken: string,
  db: Database
): Promise<TokenPair> {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) throw new Error('Invalid refresh token');

  // Check if token exists in DB (revoked? consumed?)
  const stored = await db.refreshTokens.findUnique({
    where: { token: refreshToken },
  });
  if (!stored) throw new Error('Token revoked or already used');

  // Rotate: invalidate old token (prevent replay attack)
  await db.refreshTokens.delete({ where: { id: stored.id } });

  // Issue new tokens
  const newAccessToken = generateAccessToken({
    userId: decoded.userId,
    email: stored.email,
    role: stored.role,
  });
  const newRefreshToken = generateRefreshToken(decoded.userId);

  // Store new refresh token
  await db.refreshTokens.create({
    data: {
      token: newRefreshToken,
      userId: decoded.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

---

## ⚠️ Best Practices & Anti-patterns

### Storage: Cookie vs localStorage

| | httpOnly Cookie | localStorage |
|---|---|---|
| **XSS protection** | ✅ JS không đọc được | ❌ XSS đọc được toàn bộ |
| **CSRF protection** | ❌ Browser tự gửi cookie | ✅ Không tự gửi (cần manual attach) |
| **Best combo** | httpOnly + Secure + SameSite=Strict | + CSRF token header |

```typescript
// ✅ GOOD — Set refresh token in httpOnly cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,       // JavaScript không đọc được (chống XSS)
  secure: true,         // Chỉ gửi qua HTTPS (chống MITM)
  sameSite: 'strict',   // Không gửi cross-site (chống CSRF)
  maxAge: 7 * 24 * 60 * 1000,  // 7 days
  path: '/api/auth',    // Chỉ send cho auth endpoints
});

// Access token trong Authorization header (JS đọc được, nhưng lifetime ngắn)
res.json({ accessToken });
```

### Security comparison table

| ✅ GOOD | ❌ BAD | Lý do |
|---------|--------|-------|
| Access token ngắn (15-30 phút) | Token lifetime quá dài (days) | Ngắn = giảm blast radius nếu leak |
| Refresh token xoay vòng (rotation) | Dùng lại refresh token mãi | Rotation ngăn replay attack |
| Lưu refresh token trong httpOnly cookie | Lưu token trong localStorage | localStorage đọc được bởi XSS |
| Dùng strong secret (≥256 bit, random) | Dùng secret yếu: `'secret'`, `'123456'` | Weak secret = forge token dễ dàng |
| Verify `exp` claim bắt buộc | Bỏ qua exp check | Token đã expired vẫn được accept |
| Không lưu sensitive data trong payload | Lưu password/hash trong JWT | Payload decode được — leak sensitive data |
| Specify `algorithms` trong verify | Không specify → accepts `none` | Algorithm confusion attack |
| Blacklist token khi logout | Không revoke token | Token stolen vẫn valid until exp |

```
┌─────────────────────────────────────────────┐
│           JWT SECURITY CHECKLIST            │
├─────────────────────────────────────────────┤
│ □ Sử dụng HS256/RS256 thay vì 'none'        │
│ □ Secret đủ mạnh (env var, ≥256 bit, KMS)  │
│ □ Set exp claim luôn (≤ 15min for access)  │
│ □ Verify signature + exp + iss + aud       │
│ □ Refresh token: httpOnly + Secure cookie  │
│ □ Token rotation mỗi lần refresh           │
│ □ Blacklist/revoke token khi logout        │
│ □ Không store JWT trong localStorage       │
│ □ Không lưu sensitive data trong payload   │
│ □ Explicitly specify algorithms in verify  │
└─────────────────────────────────────────────┘
```

---

## 📚 Tài liệu tham khảo

- 📖 [RFC 7519 — JSON Web Token](https://tools.ietf.org/html/rfc7519)
- 📖 [jwt.io Debugger](https://jwt.io/) — Decode & verify JWT interactively
- 📖 [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java.html)

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.2-jwt-authentication
npx ts-node examples/index.ts
```

---

⏭️ Bài tiếp theo → [9.3 OAuth 2.0](../9.3-oauth2/README.md)
