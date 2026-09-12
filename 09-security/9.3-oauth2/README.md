# 🔗 9.3 OAuth 2.0

> **OAuth 2.0** là framework ủy quyền cho phép ứng dụng truy cập tài nguyên của user mà không cần password.

```
┌───────────────────────────────────────────────────────────┐
│           OAUTH 2.0 ROLES                                 │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  🖥️  Resource Owner      = User (chở sở hữu dữ liệu)      │
│  📦  Client              = Ứng dụng muốn truy cập         │
│  🔐  Authorization Server= Cấp access token               │
│  🗄️  Resource Server     = Chứa data (API)                │
│                                                           │
│   User → Client ←→ Auth Server ←→ Resource Server         │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 📋 Các OAuth 2.0 Flows

| Flow | Mục đích | Bảo mật |
|------|----------|---------|
| **Authorization Code** | Web app (server-side) | ✅ Cao — token qua server |
| **Authorization Code + PKCE** | Mobile / SPA | ✅ Cao — chống authorization code injection |
| **Implicit** | ❌ Không dùng nữa (deprecated) | ❌ Yếu |
| **Client Credentials** | Service-to-service | ✅ Cho machine-to-machine |
| **Resource Owner Password** | ❌ Không khuyến nghị | ❌ Chia sẻ password |

---

## 🔐 Flow 1: Authorization Code (Web App)

```
Client                    Auth Server              Resource Server
  │                          │                          │
  │── 1. Auth Request ──────►│                          │
  │   ?response_type=code    │                          │
  │   &client_id=...         │                          │
  │   &redirect_uri=...      │                          │
  │                          │                          │
  │◄── 2. Login + Consent ───│                          │
  │── 3. Authorize ──────────►│                          │
  │                          │                          │
  │◄── 4. Authorization Code ─│                          │
  │   (redirect với code)    │                          │
  │                          │                          │
  │── 5. Exchange Token ─────►│                          │
  │   code + client_secret   │                          │
  │                          │                          │
  │◄── 6. Access Token ──────│                          │
  │   + Refresh Token        │                          │
  │                          │                          │
  │── 7. Call API ──────────────────────────────────────►│
  │   Authorization: Bearer  │                          │
```

```typescript
// TypeScript: Exchange authorization code for tokens
interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
}

async function exchangeCodeForToken(
  code: string,
  client id: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  const response = await fetch('https://provider.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  return response.json();
}
```

---

## 📱 Flow 2: Authorization Code + PKCE (Mobile / SPA)

**PKCE** (Proof Key for Code Exchange) — ngăn attack đổi authorization code.

```
┌─────────────────────────────────────────────────────────┐
│              PKCE FLOW                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Client tạo code_verifier (random string)             │
│  2. Client tính code_challenge = BASE64URL(SHA256(verifier))│
│  3. Gửi auth request với code_challenge                 │
│  4. Nhận authorization code                             │
│  5. Exchange code + code_verifier → access token        │
│                                                         │
│  ⚠️ Server so sánh:                                     │
│     SHA256(code_verifier) === code_challenge            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

```typescript
import { createHash } from 'crypto';

// Generate PKCE codes
function generateCodeVerifier(): string {
  return createHash('sha256')
    .update(Math.random().toString(36).slice(2))
    .digest('base64url');
}

function generateCodeChallenge(verifier: string): string {
  // S256 method (recommended)
  return createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

// Usage
const verifier = generateCodeVerifier();
const challenge = generateCodeChallenge(verifier);

// Send challenge in auth request
const authUrl = new URL('https://provider.com/oauth/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('code_challenge', challenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
```

---

## ⚙️ Flow 3: Client Credentials (Service-to-Service)

Dùng khi máy chủ gọi máy chủ, không cần user context.

```typescript
// Machine-to-machine auth
async function getServiceToken(): Promise<string> {
  const res = await fetch('https://provider.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SERVICE_CLIENT_ID,
      client_secret: SERVICE_CLIENT_SECRET,
      scope: 'api.read api.write',
    }),
  });
  const data = await res.json();
  return data.access_token;
}
```

---

## 🎯 Khi nào dùng flow nào?

| Scenario | Khuyến nghị | Lý do |
|----------|-------------|-------|
| Web app có backend server | Authorization Code | Token lưu server-side, an toàn |
| SPA / React / Vue | Authorization Code + PKCE | Không có server để lưu secret |
| Mobile app | Authorization Code + PKCE | Chống code interception |
| Backend → Backend API | Client Credentials | Không cần user context |
| Legacy app (❌ tránh) | Implicit | Đã deprecated, kém an toàn |

---

## ✅ OAuth 2.0 vs OpenID Connect

| | OAuth 2.0 | OpenID Connect (OIDC) |
|---|-----------|----------------------|
| Mục đích | Authorization | Authentication + Authorization |
| Response | Access token | ID Token (JWT) + Access token |
| User info | Không có | Có (`/userinfo` endpoint) |
| Dùng cho | API access | User login (SSO) |

```
OIDC = OAuth 2.0 + ID Token (JWT chứa thông tin user)
```

---

## 📚 Tài liệu tham khảo

- 📖 [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- 📖 [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/)
- 📖 [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)

---

⏭️ Bài tiếp theo → [9.4 XSS & CSRF](../9.4-xss-csrf/README.md)
