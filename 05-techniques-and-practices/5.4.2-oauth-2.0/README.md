# 🔄 5.4.2 OAuth 2.0 (Authorization Framework)

> **OAuth 2.0** là tiêu chuẩn mở cho phép ứng dụng truy cập tài nguyên của user mà không cần biết password.

---

## 🎯 Vấn đề

Trước OAuth, cách duy nhất là **chia sẻ password**:

```
❌ CŨ: Chia sẻ password
User ──password──▶ App A
User ──password──▶ App B
User ──password──▶ App C
→ Mỗi app đều có password của bạn
→ Nếu 1 app leak → Tất cả bị ảnh hưởng
```

```
✅ MỚI: OAuth 2.0 — cấp quyền giới hạn
User ──"cho phép đọc profile"──▶ App A (token giới hạn)
User ──"cho phép đăng bài"──────▶ App B (token giới hạn)
→ Mỗi app chỉ có quyền tối thiểu cần thiết
→ User có thể thu hồi token bất kỳ lúc nào
→ Google/Facebook không cần biết password của bạn
```

---

## 🧩 4 Role trong OAuth 2.0

```
┌──────────────────────────────────────────────────────────┐
│                    OAuth 2.0 Roles                       │
│                                                          │
│  Resource Owner   = Bạn (user sở hữu dữ liệu)            │
│  Client          = Ứng dụng bạn muốn truy cập (App A)    │
│  Authorization   = Máy chủ cấp token (Google Auth)       │
│                   Server                                  │
│  Resource Server  = API chứa dữ liệu (Google People API) │
└──────────────────────────────────────────────────────────┘
```

---

## 🧭 Luồng Authorization Code (Phổ biến nhất)

```
Client App         Authorize Server          Resource Server
     │                    │                        │
     │  1. Redirect       │                        │
     │     đến login      │                        │
     │───────────────────▶│                        │
     │                    │                        │
     │  2. User login     │                        │
     │     và approve     │                        │
     │◀───────────────────│                        │
     │                    │                        │
     │  3. Authorization  │                        │
     │     Code           │                        │
     │◀───────────────────│                        │
     │                    │                        │
     │  4. Exchange code  │                        │
     │     → Access Token │                        │
     │───────────────────▶│                        │
     │                    │                        │
     │  5. Access Token   │                        │
     │◀───────────────────│                        │
     │                    │                        │
     │  6. Request API    │                        │
     │     với token      │                        │
     │─────────────────────────────────────────────▶│
     │                    │                        │
     │  7. Dữ liệu        │                        │
     │◀─────────────────────────────────────────────│
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ===== CẤU HÌNH =====
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

// ===== BƯỚC 1: Tạo URL redirect =====
function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline', // Để lấy refresh token
    prompt: 'consent'       // Luôn hỏi user (dùng khi cần refresh)
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ===== BƯỚC 2: Exchange code lấy token =====
async function exchangeCodeForToken(code: string): Promise<OAuthTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json() as TokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  };
}

// ===== BƯỚC 3: Gọi API với token =====
async function getGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.json();
}
```

---

## 📋 Các Grant Types

| Grant Type | Dùng khi | Độ an toàn |
|-----------|----------|-----------|
| **Authorization Code** | Web app có server | 🟢 Cao (có server-side) |
| **Authorization Code + PKCE** | Mobile/SPA | 🟢 Cao (chống interception) |
| **Implicit** | ❌ Đã deprecated | 🔴 Thấp |
| **Client Credentials** | Service-to-service | 🟡 Trung bình |
| **Refresh Token** | Làm mới access token | 🟢 Cao |

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔐 **Không chia sẻ password** | App chỉ nhận token, không biết pass |
| 🎛️ **Quyền giới hạn** | User chọn cấp đúng quyền cần thiết |
| 🔄 **Thu hồi dễ dàng** | Xóa token = mất quyền instantly |
| 🌐 **Standard** | Works với mọi provider (Google, GitHub, Facebook...) |
| 📱 **UX tốt** | User login 1 lần, dùng nhiều app |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách xử lý |
|------------|------------|
| 🔴 Phức tạp setup | Dùng library: Passport.js, Auth0, NextAuth |
| 🔄 Token expiry | Dùng Refresh Token |
| 🛡️ PKCE cần cho mobile/SPA | Luôn dùng PKCE cho client-side apps |
| 🔗 Provider lock-in | Abstraction layer cho auth provider |

---

## 🎯 Khi nào dùng OAuth 2.0?

| Scenario | Khuyến nghị |
|----------|-------------|
| Login bằng Google/GitHub | ✅ OAuth 2.0 + PKCE |
| Access user data từ API khác | ✅ OAuth 2.0 |
| Service-to-service auth | ⚠️JWT hoặc mTLS phù hợp hơn |
| Đơn giản login/password | ❌ JWT đơn giản hơn |

---

## 🔗 Liên quan

- **5.4.1 JWT** — Access token thường là JWT
- **5.4.3 XSS Prevention** — Bảo vệ token trong browser
- **5.4.4 CSRF Protection** — Thêm lớp bảo vệ

---

## 📚 Tài liệu tham khảo

- 📖 [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- 📖 [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- 📖 [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)

---

## ⏭️ Bài tiếp theo

→ [5.4.3 XSS Prevention](../5.4.3-xss-prevention/README.md)
