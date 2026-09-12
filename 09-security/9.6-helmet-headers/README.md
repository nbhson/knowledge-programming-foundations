# 🛡️ 9.6 Helmet & Security Headers

> **Security HTTP Headers** là các headers gửi từ server đến client để bật các tính năng bảo mật trình duyệt.

```
┌─────────────────────────────────────────────────────────────┐
│       WHY SECURITY HEADERS?                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser mặc định KHÔNG đảm bảo an toàn cho bạn:            │
│  - Cho phép clickjacking (iframe embed)                    │
│  - Cho phép XSS dễ dàng                                    │
│  - Cho phép MIME sniffing                                  │
│  - Không enforce HTTPS                                     │
│                                                             │
│  → Server PHẢI tự保护自己的 bằng cách set headers đúng.    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Các Security Headers Quan Trọng

| Header | Giá trị khuyến nghị | Mục đích |
|--------|---------------------|----------|
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains` | Enforce HTTPS |
| **Content-Security-Policy** | `default-src 'self'` | Chặn XSS |
| **X-Content-Type-Options** | `nosniff` | Chặn MIME sniffing |
| **X-Frame-Options** | `DENY` hoặc `SAMEORIGIN` | Chặn clickjacking |
| **X-XSS-Protection** | `0` (deprecated, dùng CSP) | — |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Kiểm soát referrer |
| **Permissions-Policy** | `camera=(), microphone=()` | Giới hạn browser features |
| **Cache-Control** | `no-store` (cho sensitive data) | Chặn cache sensitive response |

---

## 🍷 Helmet.js Config

```typescript
import helmet from 'helmet';
import express from 'express';

const app = express();

// ✅ Default — bật TẤT CẢ security headers
app.use(helmet());

// ✅ Custom — tinh chỉnh từng header
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https://images.example.com'],
        connectSrc: ["'self'", 'wss://api.example.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      'payment-org': 'self',
    },
  })
);
```

---

## 🔍 Deep Dive: Content Security Policy (CSP)

CSP là header mạnh nhất chống XSS. Nó kiểm soát nguồn tải script, style, image...

```
┌─────────────────────────────────────────────────────────────┐
│           CSP DIRECTIVE REFERENCE                           │
├───────────────────┬─────────────────────────────────────────┤
│ default-src       │ Fallback cho tất cả directives khác    │
│ script-src        │ JavaScript nguồn                       │
│ style-src         │ CSS nguồn                              │
│ img-src           │ Hình ảnh nguồn                         │
│ connect-src       │ Fetch/XHR/WebSocket đích               │
│ font-src          │ Font nguồn                             │
│ object-src        │ <object>, <embed> nguồn                │
│ media-src         │ <audio>, <video> nguồn                 │
│ frame-src         │ <iframe> nguồn                         │
│ child-src         │ Workers, nested iframes                │
│ base-uri          │ <base> URL                             │
│ form-action       │ <form> action                          │
│ frame-ancestors   │ Trang nào có thể embed mình (替代 X-Frame)│
│ block-all-mixed-content│ Chặn mixed content (HTTP+HTTPS)   │
└───────────────────┴─────────────────────────────────────────┘
```

```typescript
// CSP Levels
const CSP_STRICT = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"], // Không cho inline script!
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"], // Không iframe nào embed được
  },
};

const CSP_BALANCED = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://cdn.example.com'],
    styleSrc: ["'self'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https://images.example.com'],
    connectSrc: ["'self'", 'https://api.example.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
};
```

### ⚠️ Inline Script &nonce/hash

Nếu cần inline script, dùng nonce hoặc hash:

```html
<!-- Server set nonce trong CSP header -->
Content-Security-Policy: script-src 'nonce-abc123' 'self'

<!-- Client dùng cùng nonce -->
<script nonce="abc123">
  console.log('inline script OK');
</script>
```

```typescript
// Express + helmet với nonce động
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

## ✅ Security Headers Checklist

```
┌─────────────────────────────────────────────────────────┐
│  □ HSTS (Strict-Transport-Security)                    │
│  □ CSP (Content-Security-Policy)                        │
│  □ X-Content-Type-Options: nosniff                      │
│  □ X-Frame-Options: DENY or SAMEORIGIN                  │
│  □ Referrer-Policy                                      │
│  □ Permissions-Policy (camera, mic, etc.)               │
│  □ Cache-Control: no-store (cho sensitive endpoints)    │
│  □ Cross-Origin-Opener-Policy                           │
│  □ Cross-Origin-Resource-Policy                         │
│  □ Cross-Origin-Embedder-Policy                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Verification

Kiểm tra headers bằng curl:
```bash
curl -I https://example.com
```

Hoặc dùng công cụ online:
- [securityheaders.com](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)

---

## 📚 Tài liệu tham khảo

- 📖 [Helmet.js Docs](https://helmetjs.xyz/)
- 📖 [MDN HTTP Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- 📖 [CSP Cheat Sheet](https://content-security-policy.com/)

---

⏭️ Bạn đã hoàn thành nhóm này! ➜ [10. Database](../../10-database/README.md)
