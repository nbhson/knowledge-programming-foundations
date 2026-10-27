# 🛡️ 9.6 Helmet & Security Headers

> **Security HTTP Headers** là các headers gửi từ server đến client (browser) để bật các tính năng bảo mật tích hợp sẵn của trình duyệt.
>
> **Tại sao cần?** Browser mặc định KHÔNG đảm bảo an toàn cho bạn — chúng được design cho usability, không security. Server PHẢI tự bảo vệ mình bằng cách set headers đúng.

```
┌─────────────────────────────────────────────────────────────┐
│       WHY SECURITY HEADERS?                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser mặc định KHÔNG đảm bảo an toàn cho bạn:            │
│  - Cho phép clickjacking (iframe embed)                    │
│  - Cho phép XSS dễ dàng (không hạn chế script source)      │
│  - Cho phép MIME sniffing (executing CSS as JS)            │
│  - Không enforce HTTPS (http:// works fine)                │
│  - Cho phép cross-origin data access (CORS permissive)     │
│  - Gửi full URL làm referrer đến third-party sites         │
│                                                             │
│  → Server PHẢI tự bảo vệ mình bằng cách set headers đúng.    │
│  → Headers này là "instruction" cho browser:                │
│    "Đây là rules bảo mật cho trang của tôi."                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Các Security Headers Quan Trọng

| Header | Giá trị khuyến nghị | Mục đích | Trình duyệt support |
|--------|---------------------|----------|-------------------|
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains; preload` | Enforce HTTPS, chặn SSL stripping | Tất cả các browsers hiện đại |
| **Content-Security-Policy** | `default-src 'self'` | Chặn XSS bằng control nguồn script/style | Tất cả các browsers hiện đại |
| **X-Content-Type-Options** | `nosniff` | Chặn MIME sniffing (browser không tự guess content-type) | Tất cả |
| **X-Frame-Options** | `DENY` hoặc `SAMEORIGIN` | Chặn clickjacking (iframe embed) | Tất cả (legacy) |
| **Frame-Ancestors** | `'none'` hoặc `'self'` | CSP version của X-Frame-Options | Modern browsers |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Kiểm soát thông tin gửi qua Referer header | Tất cả các browsers hiện đại |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=()` | Giới hạn browser features | Modern browsers |
| **Cache-Control** | `no-store` (cho sensitive endpoints) | Chặn cache sensitive response | Tất cả |
| **Cross-Origin-Opener-Policy** | `same-origin` | Isolate browsing context | Modern browsers |
| **Cross-Origin-Resource-Policy** | `same-origin` | Chặn cross-origin resource access | Modern browsers |
| **Cross-Origin-Embedder-Policy** | `require-corp` | Chặn load cross-origin resources nếu thiếu COOP | Modern browsers |

```
┌─────────────────────────────────────────────────────────────┐
│           HEADER EXPLANATIONS                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HSTS (Strict-Transport-Security):                          │
│  → Báo browser: "Domain này CHỈ qua HTTPS,                │
│     nhớ trong max-age giây, kể cả subdomains."             │
│  → Ngăn SSL stripping attack (Downgrade HTTPS→HTTP)        │
│  → Có thể preload vào browser (hstspreload.org)            │
│                                                             │
│  CSP (Content-Security-Policy):                             │
│  → Báo browser: "Chỉ load script/style/img từ nguồn này."  │
│  → Ngăn inline script execution (major XSS defense)        │
│  → Có report-uri/report-to để monitoring violations        │
│                                                             │
│  X-Content-Type-Options: nosniff:                           │
│  → Báo browser: "Đừng guess content-type, dùng header nói."│
│  → Ngăn MIME confusion attacks (CSS bị parse như JS)     │
│                                                             │
│  X-Frame-Options / Frame-Ancestors:                         │
│  → Báo browser: "Đừng cho trang khác embed mình trong      │
│     iframe."                                                │
│  → Ngăn clickjacking (transparent iframe overlay)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🍷 Helmet.js Config

Helmet là middleware Express phổ biến nhất set security headers tự động.

```typescript
import helmet from 'helmet';
import express from 'express';

const app = express();

// ✅ Default — bật TẤT CẢ security headers với giá trị mặc định an toàn
app.use(helmet());
// Sets: Content-Security-Policy, Cross-Origin-Opener-Policy,
//        Strict-Transport-Security, X-Content-Type-Options,
//        X-Frame-Options, Referrer-Policy, etc.

// ✅ Custom — tinh chỉnh từng header theo nhu cầu app
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https://images.example.com'],
        connectSrc: ["'self'", 'https://api.example.com', 'wss://ws.example.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],              // Cấm <object>, <embed>
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],              // Cấm iframe
        workerSrc: ["'self'"],
        childSrc: ["'self'"],
        upgradeInsecureRequests: [],        // Auto upgrade HTTP → HTTPS
        blockAllMixedContent: true,
      },
    },
    hsts: {
      maxAge: 31536000,                   // 1 năm
      includeSubDomains: true,
      preload: true,                      // Đăng ký hstspreload.org
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permissionsPolicy: {
      camera: [],                         // Cấm camera
      microphone: [],                     // Cấm microphone
      geolocation: [],                    // Cấm geolocation
      'payment-org': 'self',              // Chỉ same-origin mới được payment
      'fullscreen': 'self',
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    dnsPrefetchControl: { allow: false },  // Cấm pre-resolve DNS
    ieNoOpen: true,                       // X-Download-Options: noopen
    noSniff: true,                        // X-Content-Type-Options: nosniff
    originAgentCluster: { clause: '?cls' }, // Cross-Origin-Opener-Policy
    permittedCrossDomainPolicies: { policy: 'none' },
    ieNoOpen: true,
  })
);
```

---

## 🔍 Deep Dive: Content Security Policy (CSP)

CSP là header mạnh nhất chống XSS. Nó kiểm soát nguồn tải script, style, image, font...

```
┌─────────────────────────────────────────────────────────────┐
│           CSP DIRECTIVE REFERENCE                           │
├───────────────────┬─────────────────────────────────────────┤
│ default-src       │ Fallback cho tất cả directives khác    │
│ script-src        │ JavaScript nguồn (including inline)    │
│ style-src         │ CSS nguồn (including inline styles)    │
│ img-src           │ Hình ảnh nguồn (src, background)       │
│ connect-src       │ Fetch/XHR/WebSocket đích               │
│ font-src          │ Font nguồn (@font-face)                │
│ object-src        │ <object>, <embed> nguồn                │
│ media-src         │ <audio>, <video> nguồn                 │
│ frame-src         │ <iframe> nguồn                         │
│ child-src         │ Workers, nested iframes                │
│ base-uri          │ <base> URL giới hạn                    │
│ form-action       │ <form> action giới hạn                 │
│ frame-ancestors   │ Trang nào có thể embed mình            │
│ manifest-src      │ Web app manifest nguồn                 │
│ block-all-mixed-content │ Chặn mixed content              │
│ upgrade-insecure- │ Tự động upgrade HTTP→HTTPS requests   │
│   requests                                        │
└───────────────────┴─────────────────────────────────────────┘
```

### CSP Levels —.fromString strict đến lenient

```typescript
// Level 1: STRICT — maximum protection, may break some functionality
const CSP_STRICT = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],           // Không cho inline script!
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],      // data: cho SVG inline
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],      // Không iframe nào embed được
    formAction: ["'self'"],
    baseUri: ["'self'"],
  },
};

// Level 2: BALANCED — practical for most apps
const CSP_BALANCED = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://cdn.example.com'],
    styleSrc: ["'self'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https://images.example.com'],
    connectSrc: ["'self'", 'https://api.example.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: [],
  },
};

// Level 3: LENIENT — legacy apps, gradual rollout
const CSP_LENIENT = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.example.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:*'],
    connectSrc: ["'self'", 'https:*'],
    fontSrc: ["'self'", 'https:*'],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
};
```

> ⚠️ **`'unsafe-inline'` trong scriptSrc là anti-pattern** — nó vô hiệu hóa phần lớn lợi ích của CSP. Nếu cần inline script, dùng **nonce** hoặc **hash** thay thế.

### Nonce-based CSP (cho inline scripts)

```html
<!-- Server set nonce động trong CSP header mỗi request -->
Content-Security-Policy: script-src 'self' 'nonce-aFZk3x9sK2mN'

<!-- Client dùng cùng nonce cho inline script được phép -->
<script nonce="aFZk3x9sK2mN">
  // inline script OK — server đã approve nonce này
  initializeApp();
</script>

<script>
  // inline script BLOCKED — không có nonce
  evilCode();
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
      scriptSrc: [
        "'self'",
        // Dynamic nonce from request handler
        ({ nonce }) => `'nonce-${nonce.value}'`,
      ],
      // Style có thể cần nonce riêng (nếu có inline style)
      styleSrc: [
        "'self'",
        ({ nonce }) => `'nonce-${nonce.value}'`,
      ],
    },
  })
);

// Template:
// <script nonce="<%= cspNonce %>">...</script>
```

---

## 🚨 CSP Violation Reporting

CSP có thể report vi phạm thay vì chỉ block — hữu ích cho monitoring và gradual rollout.

```typescript
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      reportUri: '/api/csp-report',        // Endpoint nhận violation report
    },
  })
);

// Report endpoint
app.post('/api/csp-report', (req, res) => {
  const report = req.body;
  // Log violation cho monitoring
  console.warn('[CSP Violation]', {
    uri: report['document-uri'],
    violatedDirective: report['violated-directive'],
    blockedURI: report['blocked-uri'],
    lineNumber: report['line-number'],
  });
  res.status(204).end();  // No content
});
```

---

## ✅ Security Headers Checklist

```
┌─────────────────────────────────────────────────────────┐
│  □ HSTS (Strict-Transport-Security)                    │
│     → max-age≥31536000, includeSubDomains, preload     │
│  □ CSP (Content-Security-Policy)                       │
│     → default-src 'self', block inline scripts         │
│  □ X-Content-Type-Options: nosniff                     │
│  □ X-Frame-Options: DENY hoặc Frame-Ancestors: 'none' │
│  □ Referrer-Policy: strict-origin-when-cross-origin    │
│  □ Permissions-Policy (camera=(), microphone=())       │
│  □ Cache-Control: no-store (cho sensitive endpoints)   │
│  □ Cross-Origin-Opener-Policy: same-origin             │
│  □ Cross-Origin-Resource-Policy: same-origin           │
│  □ Cross-Origin-Embedder-Policy: require-corp          │
│  □ Không expose server version (Server header)         │
│  □ Không expose X-Powered-By: Express                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Verification — Kiểm tra headers

### Dùng curl

```bash
# Xem tất cả response headers
curl -I https://example.com

# Hoặc verbose hơn
curl -v https://example.com 2>&1 | grep -i "^<"
```

### Dùng công cụ online

| Công cụ | Link | Đánh giá |
|---------|------|----------|
| **securityheaders.com** | https://securityheaders.com | A-F grading, chi tiết |
| **Mozilla Observatory** | https://observatory.mozilla.org | Deep scan, best practices |
| **Headers.js.org** | https://headers.js.org | Visual guide |

### Kiểm tra programmatically

```typescript
import request from 'supertest';

it('should set security headers', async () => {
  const res = await request(app).get('/');
  
  expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
  expect(res.headers['x-content-type-options']).toBe('nosniff');
  expect(res.headers['x-frame-options']).toBe('DENY');
  expect(res.headers['content-security-policy']).toBeDefined();
  expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(res.headers['permissions-policy']).toBeDefined();
});
```

---

## 📚 Tài liệu tham khảo

- 📖 [Helmet.js Docs](https://helmetjs.xyz/)
- 📖 [MDN HTTP Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- 📖 [CSP Quick Reference](https://content-security-policy.com/)
- 📖 [HSTS Preload List](https://hstspreload.org/)
- 📖 [OWASP Secure Headers Project](https://github.com/OWASP/secure-headers)

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.6-helmet-headers
npx ts-node examples/index.ts
```

---

⏭️ Bạn đã hoàn thành nhóm này! ➜ [10. Database](../../10-database/README.md)
