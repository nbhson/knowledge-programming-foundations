# 🔗 9.3 OAuth 2.0

> **OAuth 2.0** là framework ủy quyền (authorization framework) cho phép ứng dụng truy cập tài nguyên của user mà **không cần password**.
> Khác với JWT (transport layer), OAuth 2.0 là **protocol delegation** — user cấp quyền cho third-party app mà không chia sẻ credential.

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
│  Flow cơ bản:                                             │
│  1. Client redirect user đến Auth Server                  │
│  2. User login + consent (grants permission)              │
│  3. Auth Server redirect back với authorization code      │
│  4. Client exchange code + client_secret → access token   │
│  5. Client dùng access token gọi Resource Server          │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 📋 Các OAuth 2.0 Flows

| Flow | Mục đích | Bảo mật | Khi nào dùng |
|------|----------|---------|-------------|
| **Authorization Code** | Web app (server-side) | ✅ Cao — token qua server | Backend có server, lưu client_secret được |
| **Authorization Code + PKCE** | Mobile / SPA | ✅ Cao — chống code interception | Không có server để lưu secret (public client) |
| **Client Credentials** | Service-to-service | ✅ Cho machine-to-machine | Backend API gọi backend API, không có user context |
| **Implicit** | ❌ Deprecated | ❌ Yếu — token trong URL | **Không dùng** — RFC 9207 chính thức deprecate |
| **Resource Owner Password** | ❌ Không khuyến nghị | ❌ Chia sẻ password | **Tránh** — user nên dùng OAuth thay vì cho app password |

### Phân biệt "Public Client" vs "Confidential Client"

| | Public Client | Confidential Client |
|---|---|---|
| **Ví dụ** | Mobile app, SPA (React/Vue) | Web server (Node.js, Python backend) |
| **Có thể lưu secret?** | ❌ Không (code có thể reverse) | ✅ Có (server-side) |
| **Flow bắt buộc** | Authorization Code + PKCE | Authorization Code |
| **Risk** | Code interception | Client secret leakage |

---

## 🔐 Flow 1: Authorization Code (Web App)

Flow truyền thống — token trao đổi server-to-server, user không bao giờ nhìn thấy token.

```
Client (web app)              Auth Server              Resource Server
      │                            │                          │
      │── 1. Auth Request ────────►│                          │
      │   ?response_type=code      │                          │
      │   &client_id=abc123        │                          │
      │   &redirect_uri=https://   │                          │
      │     myapp.com/callback     │                          │
      │   &scope=read:profile      │                          │
      │                            │                          │
      │◄── 2. Login + Consent ─────│                          │
      │── 3. Authenticate ────────►│                          │
      │                            │                          │
      │◄── 4. Redirect with code ──│                          │
      │   /callback?code=AUTH_CODE │                          │
      │                            │                          │
      │── 5. Exchange Token ───────►│                          │
      │   POST /token              │                          │
      │   code=AUTH_CODE           │                          │
      │   grant_type=authorization │                          │
      │   code   +client_id        │                          │
      │        +client_secret      │                          │
      │        +redirect_uri       │                          │
      │                            │                          │
      │◄── 6. Access Token ────────│                          │
      │   + Refresh Token          │                          │
      │                            │                          │
      │── 7. Call API ────────────────────────────────────────►│
      │   Authorization: Bearer ACCESS_TOKEN                   │
      │                            │                          │
```

```typescript
// Exchange authorization code for tokens
interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;     // seconds until expiry
  refresh_token: string;
  scope: string;
}

async function exchangeCodeForToken(
  code: string,
  clientId: string,
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

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json() as Promise<TokenResponse>;
}
```

---

## 📱 Flow 2: Authorization Code + PKCE (Mobile / SPA)

**PKCE** (Proof Key for Code Exchange) — ngăn attack đổi authorization code giữa đường.

### PKCE Attack scenario (không có PKCE)

```
1. Client khởi tạo auth request, gửi code_challenge
2. Auth Server gửi authorization code về redirect_uri
3. ❌ Attacker intercept code từ redirect URL
4. Attacker exchange code → access token (trước Client)
5. Client exchange cùng code → fail (code đã dùng)
```

### PKCE Defense

```
PKCE adds a cryptographic "proof" that only the original client
can exchange the code for a token.
```

```
1. Client tạo code_verifier (random string, 43-128 chars)
2. Client tính code_challenge = BASE64URL(SHA256(verifier))
3. Gửi auth request với code_challenge
4. Auth Server lưu code_challenge
5. Client nhận authorization code
6. Client exchange code + code_verifier
7. Auth Server: SHA256(verifier) === code_challenge? → match = OK
```

```typescript
import { createHash } from 'crypto';

// Generate PKCE codes
function generateCodeVerifier(): string {
  // Random string 43-128 characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < 64; i++) {
    verifier += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return verifier;
}

function generateCodeChallenge(verifier: string): string {
  // S256 method (recommended by RFC 7636)
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
authUrl.searchParams.set('code_challenge_method', 'S256');  // always S256
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('scope', 'read:profile write:posts');
authUrl.searchParams.set('state', generateRandomState());  // CSRF protection

// After redirect back:
const authCode = new URL(callbackUrl).searchParams.get('code');
const tokens = await exchangeCodeForToken(authCode!, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, verifier);
// Pass verifier during exchange — server compares SHA256(verifier) with stored challenge
```

> 💡 **Lưu ý:** PKCE bắt buộc cho public clients (mobile, SPA) theo OAuth 2.1 draft. Không có PKCE = code interception risk.

---

## ⚙️ Flow 3: Client Credentials (Service-to-Service)

Dùng khi máy chủ gọi máy chủ, không có user context. Perfect cho microservices communication.

```typescript
// Machine-to-machine auth (no user involved)
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
  const data = await res.json() as { access_token: string; expires_in: number };
  return data.access_token;
}

// Usage: service-to-service call
async function callInternalApi(token: string) {
  const res = await fetch('https://api.internal.com/data', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
```

---

## 🎯 Khi nào dùng flow nào?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Web app có backend server | Authorization Code | Server lưu client_secret an toàn, token không lộ trên client |
| SPA / React / Vue | Authorization Code + PKCE | Không có server để lưu secret → bắt buộc PKCE |
| Mobile app (iOS/Android) | Authorization Code + PKCE | App có thể bị reverse engineering → PKCE chống code interception |
| Backend → Backend API | Client Credentials | Không cần user context, machine-to-machine auth đơn giản hơn |
| Legacy app (❌ tránh) | Implicit | Đã deprecated trong RFC 9207, token lộ trong URL |

**Decision tree:**
```
Có user context?
├─ Không → Client Credentials
└─ Có → App có lưu secret an toàn không?
    ├─ Có (server-side) → Authorization Code
    └─ Không (public client) → Authorization Code + PKCE
```

---

## ✅ OAuth 2.0 vs OpenID Connect (OIDC)

| | OAuth 2.0 | OpenID Connect (OIDC) |
|---|-----------|----------------------|
| **Mục đích** | Authorization (ủy quyền truy cập) | Authentication (xác thực identity) + Authorization |
| **Response** | Access token | ID Token (JWT) + Access token |
| **User info** | Không có endpoint chuẩn | Có `/userinfo` endpoint |
| **Dùng cho** | API access (read/write data) | User login (SSO, identity verification) |
| **Base** | OAuth 2.0 framework | Extension của OAuth 2.0 |

```
OIDC = OAuth 2.0 + ID Token (JWT chứa thông tin user) + /userinfo endpoint

ID Token payload example:
{
  "sub": "user-123",
  "name": "Nguyễn Văn A",
  "email": "a@example.com",
  "email_verified": true,
  "iss": "https://auth.example.com",
  "aud": "my-app-client-id",
  "exp": 1700086400,
  "iat": 1700000000
}
```

> 💡 **Thực tế:** Hầu hết "login với Google/GitHub/Facebook" chính là OIDC, không phải OAuth 2.0 thuần. Bạn nhận được ID Token (JWT) chứ không chỉ access token.

---

## 🔒 Security Considerations

| Risk | Attack | Mitigation |
|------|--------|------------|
| **Auth code interception** | Attacker capture code from URL | PKCE (code_challenge + code_verifier) |
| **Open redirect** | Redirect to evil.com after consent | Validate redirect_uri against whitelist |
| **State parameter missing** | CSRF via auth flow | Always generate and validate state parameter |
| **Weak scope** | Requesting excessive permissions | Request minimal scope needed |
| **Token in URL** | Token泄露 trong referer logs | Use Authorization header, not URL param |
| **Implicit flow** | Token in hash fragment | Deprecated — don't use |

```
✅ Security checklist:
□ Dùng Authorization Code + PKCE cho public clients
□ Validate redirect_uri against registered list
□ Always use state parameter (CSRF protection)
□ Request minimal scope (principle of least privilege)
□ Store tokens securely (httpOnly cookie cho refresh, memory cho access)
□ Validate ID Token signature + exp + iss + aud
□ Use HTTPS for ALL OAuth endpoints
□ Token expiry: short-lived access token, rotate refresh token
```

---

## 📚 Tài liệu tham khảo

- 📖 [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- 📖 [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/)
- 📖 [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- 📖 [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- 📖 [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.3-oauth2
npx ts-node examples/index.ts
```

---

⏭️ Bài tiếp theo → [9.4 XSS & CSRF](../9.4-xss-csrf/README.md)
