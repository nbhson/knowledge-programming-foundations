# 🔐 5.4.1 JWT Authentication (JSON Web Token)

> **JWT** là chuẩn mở RFC 7519 để truyền thông tin xác thực giữa các bên dưới dạng JSON, an toàn và gọn nhẹ.

---

## 🎯 Vấn đề

HTTP là giao thức **không trạng thái** — mỗi request đều phải xác thực lại. Giải pháp cookie/session gặp vấn đề với API phân tán:

```
❌ Cookie + Session (truyền thống)
Server lưu session → phải truy xuất server → không scale được
Browser gửi cookie → CORS phức tạp → mobile app khó dùng
```

```
✅ JWT (giải pháp)
Token tự chứa đủ thông tin → server không cần lưu state
Client gửi trong header → works mọi platform (web, mobile, IoT)
```

---

## 🧩 Cấu trúc JWT

JWT gồm 3 phần, ngăn cách bởi dấu `.`:

```
┌────────────────────────────────────────────────────────┐
│  Header.Payload.Signature                              │
│                                                        │
│  Header:    { "alg": "HS256", "typ": "JWT" }           │
│  Payload:   { "sub": "1234567890", "name": "John",    │
│              "iat": 1516239022 }                       │
│  Signature: HMACSHA256(                                │
│    base64UrlEncode(header) + "." +                     │
│    base64UrlEncode(payload),                           │
│    secret_key)                                         │
└────────────────────────────────────────────────────────┘
```

**Decode từ terminal:**
```bash
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" | base64 -d
# {"alg":"HS256","typ":"JWT"}
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET_KEY = process.env.JWT_SECRET!;
const EXPIRES_IN = '7d';

// ===== TẠO TOKEN sau khi đăng nhập =====
async function login(email: string, password: string): Promise<string> {
  const user = await findUserByEmail(email);
  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) throw new Error('Sai mật khẩu');

  // Tạo token với payload tối thiểu
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: EXPIRES_IN }
  );

  return token;
}

// ===== MIDDLEWARE KIỂM TRA TOKEN =====
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Cần cung cấp token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    (req as any).user = decoded; // Gắn user vào request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn' });
    }
    return res.status(403).json({ error: 'Token không hợp lệ' });
  }
}

// ===== SỬ DỤNG =====
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const token = await login(email, password);
  res.json({ token });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({ id: user.userId, email: user.email, role: user.role });
});
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🌐 **Stateless** | Server không cần lưu session → dễ scale |
| 🔒 **An toàn** | Chữ ký số phát hiện token bị giả mạo |
| 📱 **Đa nền tảng** | Works trên web, mobile, IoT |
| ⚡ **Nhanh** | Không cần query database để xác thực |
| 🔗 **Cross-domain** | Dùng được cho microservices |

---

## ⚠️ Nhược điểm & Cảnh báo

| Nhược điểm | Cách phòng tránh |
|------------|------------------|
| 🔴 **Token lớn** (~200-300 bytes) | Chỉ lưu thông tin cần thiết trong payload |
| 🔴 **Không revoke được** | Dùng blacklist/short expiry + refresh token |
| 🔴 **Lưu localStorage = XSS risk** | Dùng HTTP-only cookie |
| 🔴 **Secret yếu** | Dùng key mạnh, rotate định kỳ |

---

## 🎯 Khi nào dùng JWT?

| Scenario | Khuyến nghị |
|----------|-------------|
| API cho web + mobile app | ✅ JWT + Refresh Token |
| Single-page application | ✅ JWT trong HTTP-only cookie |
| Microservices nội bộ | ✅ JWT hoặc mTLS tùy ngữ cảnh |
| Backend-for-frontend | ✅ JWT + short expiry |
| Admin panel nội bộ | ⚠️ Session cookie có thể phù hợp hơn |

---

## 🔗 Liên quan

- **5.4.2 OAuth 2.0** — JWT thường dùng trong OAuth flow
- **5.4.3 XSS Prevention** — Tránh lưu JWT trong localStorage
- **5.4.4 CSRF Protection** — JWT + CSRF token = bảo vệ toàn diện

---

## 📚 Tài liệu tham khảo

- 📖 [JWT.io — Introduction](https://jwt.io/introduction)
- 📖 [RFC 7519 — JSON Web Token](https://tools.ietf.org/html/rfc7519)
- 📖 [Node.js JWT Guide](https://auth0.com/docs/secure/tokens/jwt)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.4.1-jwt-authentication
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.4.2 OAuth 2.0](../5.4.2-oauth-2.0/README.md)
