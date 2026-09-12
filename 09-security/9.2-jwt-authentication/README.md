# 🔐 9.2 JWT Authentication

> **JWT (JSON Web Token)** là chuẩn RFC 7519 để truyền thông tin xác thực giữa các bên dưới dạng JSON, được ký số để đảm bảo toàn vẹn.

```
┌─────────────────────────────────────────────────────────────┐
│                    JWT STRUCTURE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   header.payload.signature                                  │
│   ─────── ────────── ──────────────                         │
│   Base64  Base64    HMACSHA256 / RSA                          │
│                                                             │
│   Ví dụ:                                                    │
│   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9                   │
│   .eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJyb2xlIjoiYWRtaW4ifQ  │
│   .SflKxwLJSeCKkMdp168dKZqmOw~9czqfOECvUTp2ZI               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 JWT Structure chi tiết

| Phần | Nội dung | Ví dụ |
|------|----------|-------|
| **Header** | Algorithm + token type | `{"alg":"HS256","typ":"JWT"}` |
| **Payload** | Claims (dữ liệu) | `{"sub":"123","role":"admin","exp":1700000000}` |
| **Signature** | Ký bằng secret/key | HMACSHA256(base64(header)+base64(payload), secret) |

```
┌─ Header ──────────────────────────────────────────┐
│ { "alg": "HS256", "typ": "JWT" }                  │
├─ Payload ─────────────────────────────────────────┤
│ { "sub": "user-123", "role": "admin",             │
│   "iat": 1700000000, "exp": 1700086400 }          │
├─ Signature ───────────────────────────────────────┤
│ HMACSHA256(                                        │
│   base64Url(header) + "." + base64Url(payload),   │
│   "YOUR_256_BIT_SECRET"                            │
│ )                                                  │
└────────────────────────────────────────────────────┘
```

---

## 🔑 Claims (Payload)

| Claim | Mô tả | Bắt buộc? |
|-------|-------|-----------|
| `iss` (Issuer) | Người phát hành token | ❌ |
| `sub` (Subject) | Chủ thể token (user ID) | ✅ |
| `aud` (Audience) | Đối tượng nhận token | ❌ |
| `exp` (Expiration) | Thời điểm hết hạn (unix timestamp) | ✅ |
| `nbf` (Not Before) | Thời điểm có hiệu lực | ❌ |
| `iat` (Issued At) | Thời điểm tạo | ❌ |
| `jti` (JWT ID) | ID duy nhất cho token | ❌ |

---

## 💻 TypeScript Implementation

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;   // HS256
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!; // HS256
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

// ─────────────────────────────────────────────
// ✅ Generate Access Token
// ─────────────────────────────────────────────
interface UserPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

function generateAccessToken(payload: UserPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

// ─────────────────────────────────────────────
// ✅ Generate Refresh Token
// ─────────────────────────────────────────────
function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
}

// ─────────────────────────────────────────────
// ✅ Verify Token
// ─────────────────────────────────────────────
function verifyAccessToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as UserPayload;
  } catch {
    return null; // invalid or expired
  }
}

function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };
  } catch {
    return null;
  }
}
```

---

## 🔄 Refresh Token Flow

```
Client                          Server
  │                               │
  │── 1. Login (email/password) ──►│
  │                               │
  │◄── 2. Access Token (15min) ───│
  │◄── 3. Refresh Token (7days) ──│
  │                               │
  │── 4. Access Token expired ────►│
  │     POST /refresh             │
  │     { refreshToken }          │
  │                               │
  │◄── 5. New Access Token ───────│
  │◄── 6. New Refresh Token ──────│
  │     (rotate tokens!)          │
```

```typescript
// ─────────────────────────────────────────────
// ✅ Refresh Token Rotation (best practice)
// ─────────────────────────────────────────────
async function handleRefreshToken(
  refreshToken: string,
  db: Database
): Promise<{ accessToken: string; refreshToken: string }> {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) throw new Error('Invalid refresh token');

  // Check if token exists in DB (revoked?)
  const stored = await db.refreshTokens.findUnique({
    where: { token: refreshToken },
  });
  if (!stored) throw new Error('Token revoked');

  // Rotate: invalidate old, issue new
  await db.refreshTokens.delete({ where: { id: stored.id } });

  const newAccessToken = generateAccessToken({
    userId: decoded.userId,
    email: stored.email,
    role: stored.role,
  });
  const newRefreshToken = generateRefreshToken(decoded.userId);

  // Store new refresh token
  await db.refreshTokens.create({
    data: { token: newRefreshToken, userId: decoded.userId },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

---

## ⚠️ Best Practices & Anti-patterns

| ✅ GOOD | ❌ BAD |
|---------|--------|
| Access token ngắn (15-30 phút) | Token lifetime quá dài (days) |
| Refresh token xoay vòng (rotation) | Dùng lại refresh token mãi |
| Lưu refresh token trong httpOnly cookie | Lưu token trong localStorage |
| Dùng strong secret (≥256 bit) | Dùng secret yếu: `'secret'` |
| Verify `exp` claim bắt buộc | Bỏ qua exp check |
| Không lưu sensitive data trong payload | Lưu password/hash trong JWT |

```
┌─────────────────────────────────────────────┐
│           JWT SECURITY CHECKLIST            │
├─────────────────────────────────────────────┤
│ □ Sử dụng HS256/RS256 thay vì 'none'        │
│ □ Secret đủ mạnh (env var, KMS)             │
│ □ Set exp claim luôn                        │
│ □ Verify signature trên server              │
│ □ Refresh token: httpOnly + Secure cookie   │
│ □ Token rotation mỗi lần refresh            │
│ □ Blacklist token khi logout                │
│ □ Không store JWT trong localStorage        │
└─────────────────────────────────────────────┘
```

---

## 📚 Tài liệu tham khảo

- 📖 [RFC 7519 — JSON Web Token](https://tools.ietf.org/html/rfc7519)
- 📖 [jwt.io Debugger](https://jwt.io/)

---

⏭️ Bài tiếp theo → [9.3 OAuth 2.0](../9.3-oauth2/README.md)
