# 🌐 11.1 HTTP Basics (Nền Tảng HTTP)

> **HTTP (Hypertext Transfer Protocol)** là giao thức truyền tải tài nguyên web — nền tảng của mọi API và ứng dụng mạng. Ra đời 1991 tại CERN, HTTP đã phát triển từ phiên bản đơn giản (1.0) qua nhiều lần cải tiến (1.1, 2.0, 3.0) để đáp ứng nhu cầu web hiện đại: tốc độ, bảo mật, và hiệu quả.

---

## 🎯 HTTP hoạt động như thế nào?

HTTP là **request-response protocol** — client gửi request, server trả về response. Mỗi request độc lập (stateless), không có state được giữ giữa các request. Tuy nhiên, HTTP hiện đại sử dụng **persistent connections** (HTTP/1.1+) để tái sử dụng TCP connection cho nhiều request, giảm latency.

```
┌──────────┐         HTTP Request          ┌──────────┐
│  Client   │ ──────────────────────────▶  │  Server  │
│  (Browser │                              │  (API)   │
│  / Fetch) │                              │          │
└──────────┘ ◀──────────────────────────  └──────────┘
                HTTP Response (Status + Headers + Body)

HTTP Message structure:
┌─────────────────────────────────────┐
│ Request Line: METHOD /path HTTP/ver │
│ Header1: value1                      │
│ Header2: value2                      │
│ ...                                  │
│ (blank line)                         │
│ Body (optional)                      │
└─────────────────────────────────────┘

Response:
┌─────────────────────────────────────┐
│ HTTP/ver STATUS_CODE Reason         │
│ Header1: value1                      │
│ Header2: value2                      │
│ ...                                  │
│ (blank line)                         │
│ Body (JSON, HTML, image, etc.)       │
└─────────────────────────────────────┘
```

---

## 11.1.1 HTTP Methods (Phương Thức) — Semantic meaning

HTTP methods có **semantic meaning** — mỗi method nói cho server biết **ý định** của client, không chỉ "làm gì đó". Điều này quan trọng cho caching, security, và API design.

| Method | Mục Đích | Idempotent? | Safe? | HTTP Semantic |
|--------|----------|-------------|-------|---------------|
| **GET** | Đọc dữ liệu, không side effects | ✅ | ✅ | Retrieve representation of resource |
| **POST** | Tạo tài nguyên mới, có side effects | ❌ | ❌ | Submit payload to be processed |
| **PUT** | Thay thế toàn bộ resource tại URI | ✅ | ❌ | Idempotent full replacement |
| **PATCH** | Cập nhật một phần resource | ❌ | ❌ | Partial update (may not be idempotent) |
| **DELETE** | Xóa resource tại URI | ✅ | ❌ | Remove resource representation |
| **HEAD** | Giống GET nhưng không có body | ✅ | ✅ | Get metadata only |
| **OPTIONS** | Truy vấn supported methods | ✅ | ✅ | CORS preflight, API discovery |

**Idempotent** = nhiều requests cùng lúc = 1 request có cùng effect. PUT và DELETE idempotent: gọi 10 lần `DELETE /api/users/1` = xóa user 1 (lần đầu thành công, lần sau 404). POST không idempotent: gọi 10 lần `POST /api/users` = tạo 10 users.

**Safe** = method không thay đổi server state. GET, HEAD, OPTIONS safe — chúng chỉ đọc. POST, PUT, PATCH, DELETE unsafe — chúng thay đổi dữ liệu.

### Why this matters for API design:

```
✅ GOOD: Use GET for reading, POST for creating
GET    /api/users      → list users (safe, cacheable)
POST   /api/users      → create user (not safe, not cacheable)

❌ BAD: Use GET for creating data
GET    /api/create-user?name=John → violates HTTP semantics, 
                                    GET should be safe and idempotent
```

---

## 11.1.2 Status Codes (Mã Trạng Thái) — Interpretation guide

Status codes chia thành 5 classes, mỗi class nói cho client biết **category of result**:

| Nhóm | Ý Nghĩa | Ví Dụ | Client Action |
|------|---------|-------|---------------|
| **1xx** | Informational | 100 Continue, 101 Switching Protocols | rarely used in practice |
| **2xx** | Thành công | 200 OK, 201 Created, 204 No Content | proceed normally |
| **3xx** | Chuyển hướng | 301 Moved Permanently, 304 Not Modified | follow redirect or use cache |
| **4xx** | Lỗi client | 400, 401, 403, 404, 409, 422, 429 | fix the request |
| **5xx** | Lỗi server | 500, 502, 503, 504 | retry with backoff, report to ops |

### Critical status codes to master:

```
200 OK              → Success (GET, PUT, PATCH)
201 Created         → Resource created successfully (POST)
204 No Content      → Success but no body to return (DELETE, sometimes PATCH)
301 Moved Permanently → Resource permanently moved to new URL
304 Not Modified     → Resource unchanged, use cached version
400 Bad Request      → Malformed syntax, cannot parse
401 Unauthorized     → Missing or invalid authentication
403 Forbidden        → Authenticated but not authorized for this resource
404 Not Found        → Resource does not exist
409 Conflict         → Resource conflict (e.g., duplicate username)
422 Unprocessable Entity → Valid syntax but semantic errors (validation failed)
429 Too Many Requests → Rate limit exceeded
500 Internal Error   → Server encountered unexpected condition
502 Bad Gateway      → Upstream server returned invalid response
503 Service Unavailable → Server temporarily overloaded or maintenance
504 Gateway Timeout  → Upstream server did not respond in time
```

### Client vs Server error — How to handle differently:

```typescript
const response = await fetch('/api/users/1');

if (response.ok) {
  // 2xx: success
  const user = await response.json();
  console.log(user);
} else if (response.status === 404) {
  // 4xx: client error — don't retry, fix the request
  console.log('User not found — check the ID');
} else if (response.status === 401) {
  // 401: redirect to login, then retry
  router.push('/login');
} else if (response.status === 429) {
  // 429: respect Retry-After header, implement backoff
  const retryAfter = response.headers.get('Retry-After');
  setTimeout(() => retryRequest(), parseInt(retryAfter) * 1000);
} else if (response.status >= 500) {
  // 5xx: server error — retry with exponential backoff
  await exponentialBackoff(() => fetch('/api/users/1'));
} else {
  console.error(`Unexpected error: ${response.status} ${response.statusText}`);
}
```

> 📌 **Misconception:** "4xx là lỗi của client, 5xx là lỗi của server" — sự thật: 4xx thường do **invalid input** (client code bug hoặc user mistake), 5xx thường do **server bug hoặc overload**. Nhưng cũng có ngoại lệ: 403 (Forbidden) là server nói "your permission is insufficient", 429 (Too Many Requests) là server enforcing rate limit.

---

## 11.1.3 Headers (Tiêu Đề) — The metadata layer

Headers là key-value pairs gửi kèm request/response, cung cấp **metadata** về message. Chúng không phải part của body — chúng là "thông tin về thông tin".

```typescript
// Request headers — client telling server what it wants/sends
const requestHeaders: Record<string, string> = {
  // Content negotiation
  'Content-Type': 'application/json',      // What we're sending
  'Accept': 'application/json',            // What we want back

  // Authentication
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...',

  // Caching control
  'Cache-Control': 'no-cache',             // Don't use cached response
  'If-None-Match': '"abc123"',             // Conditional request (ETag)

  // Request tracking
  'X-Request-ID': 'req_abc123',            // Correlation ID for logging
  'X-Forwarded-For': '192.168.1.1',        // Original client IP (proxy)

  // CORS
  'Origin': 'https://app.example.com',     // Cross-origin request
  'Access-Control-Request-Method': 'POST', // Preflight request
};

// Response headers — server telling client about the response
const resHeaders = new Headers(response.headers);
console.log(resHeaders.get('Content-Type'));    // "application/json; charset=utf-8"
console.log(resHeaders.get('ETag'));            // '"abc123"' — cache validator
console.log(resHeaders.get('Cache-Control'));   // "max-age=3600, public"
console.log(resHeaders.get('Set-Cookie'));      // "session=xyz; Path=/; HttpOnly; Secure"
console.log(resHeaders.get('Retry-After'));     // "60" — seconds to wait (429 response)
```

**Critical headers deep dive:**

| Header | Purpose | Examples |
|--------|---------|----------|
| `Content-Type` | Media type of body | `application/json`, `multipart/form-data`, `application/x-www-form-urlencoded` |
| `Accept` | Expected response format | `application/json`, `text/html`, `application/xml` |
| `Authorization` | Authentication credential | `Bearer <token>`, `Basic <base64>` |
| `Cache-Control` | Caching directives | `no-cache`, `max-age=3600`, `private`, `public` |
| `ETag` | Entity tag (cache validator) | `W/"abc123"` (weak), `"abc123"` (strong) |
| `If-None-Match` | Conditional request with ETag | `If-None-Match: "abc123"` → 304 if unchanged |
| `Set-Cookie` | Server sets cookie | `session=abc123; Path=/; HttpOnly; Secure; SameSite=Strict` |
| `Cross-Origin-*` | CORS policy | `Access-Control-Allow-Origin: https://app.example.com` |
| `Retry-After` | When to retry (429) | `Retry-After: 60` (seconds) or `Retry-After: Mon, 01 Jan 2024 00:00:00 GMT` |
| `X-Request-ID` | Trace correlation | `req_abc123` — same ID across request→log→response |

### Security headers — bảo vệ your API

```typescript
// Add these to ALL responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',      // Prevent MIME-type sniffing
  'X-Frame-Options': 'DENY',                // Prevent clickjacking
  'X-XSS-Protection': '1; mode=block',      // XSS filter (legacy)
  'Content-Security-Policy': "default-src 'self'",  // CSP — prevent injection
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // HSTS
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Why HSTS matters:
// Without it, browser might load HTTP version of page (mixed content).
// HSTS tells browser: "ONLY use HTTPS for this domain for 1 year."
// First visit: HTTP → redirects to HTTPS.
// Subsequent visits: browser knows to use HTTPS immediately (pre-load list).
```

---

## 11.1.4 Body (Thân Request) — Serialization formats

Body chứa **payload data** — thực thể của request/response. Cách serialize body phụ thuộc vào Content-Type:

```typescript
// JSON body — most common for APIs
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com', age: 30 }),
});
// Response: Content-Type: application/json → res.json()

// Form body (url-encoded) — traditional HTML forms
fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ username: 'john', password: 'secret123' }),
});
// Body: username=john&password=secret123

// Multipart form (file upload) — binary data + metadata
const formData = new FormData();
formData.append('name', 'John');
formData.append('avatar', fileInput.files[0]);
formData.append('bio', 'Developer from Vietnam');

fetch('/api/users', {
  method: 'POST',
  body: formData,  // Content-Type set automatically with boundary
});
// Body: multipart/form-data; boundary=----WebKitFormBoundary...

// Raw text/XML body
fetch('/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'text/xml' },
  body: '<xml><user><name>John</name></user></xml>',
});

// Raw buffer (binary data, images, etc.)
const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
fetch('/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'image/png' },
  body: buffer,
});
```

### Content-Type reference

| Content-Type | Use case | Parser |
|-------------|----------|--------|
| `application/json` | API request/response (most common) | `JSON.parse()` |
| `application/x-www-form-urlencoded` | Traditional HTML forms | `URLSearchParams` |
| `multipart/form-data` | File uploads | `FormData` API |
| `text/plain` | Raw text | `res.text()` |
| `text/xml` / `application/xml` | XML APIs (legacy SOAP) | XML parser |
| `application/octet-stream` | Binary data | `res.arrayBuffer()` |
| `application/pdf` | PDF downloads | `res.blob()` |

---

## 11.1.5 Fetch API vs Axios — Client library comparison

| Feature | Fetch (native) | Axios |
|---------|---------------|-------|
| Bundle size | 0 KB (built-in) | ~13 KB (gzipped ~5KB) |
| Auto JSON parse | ❌ Must call `res.json()` | ✅ `response.data` is parsed |
| Request interceptors | ❌ No built-in support | ✅ Add token, log, transform |
| Response interceptors | ❌ No built-in support | ✅ Handle 401, retry, log |
| Timeout | Manual (`AbortSignal.timeout(3000)`) | `timeout: 3000` option |
| CSRF protection | Manual | ✅ Automatic XSRF-TOKEN |
| Progress tracking | Manual (ReadableStream) | ✅ `onUploadProgress`, `onDownloadProgress` |
| Browser support | IE11 ❌ (polyfill needed) | ✅ All browsers |
| TypeScript | Good (built-in types) | Excellent (well-typed) |

```typescript
// Fetch native — verbose but zero-dependency
const res = await fetch('/api/users', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` },
  signal: AbortSignal.timeout(5000),  // Timeout
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();

// Axios — cleaner syntax, interceptors, auto-transform
const { data } = await axios.get('/api/users', {
  headers: { Authorization: `Bearer ${token}` },
  timeout: 5000,
});
// data is already parsed JSON, no .json() call needed
```

**When to use which:**
- Use **fetch** when: you want zero dependencies, building for modern browsers only, simple GET/POST
- Use **Axios** when: you need interceptors (auth tokens, error handling), older browser support, progress tracking, or prefer cleaner syntax

---

## 11.1.6 HTTP Caching — Cache-Control & ETag

Caching is one of the most important performance optimization techniques. HTTP provides two mechanisms:

```typescript
// ── Cache-Control directives ─────────────────────────────
// Server sets these in response headers:

// Public: cached by any cache (browser, CDN, proxy)
// Private: cached only by browser (not CDN/proxy)
// no-cache: cache but revalidate with server before using
// no-store: do not cache at all
// max-age=N: cache for N seconds
// s-maxage=N: cache for N seconds in shared cache (CDN), overrides max-age

// Example: static asset, cached for 1 year
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// Example: API response, revalidate on each request
res.setHeader('Cache-Control', 'no-cache');

// Example: user profile, cached 5 minutes
res.setHeader('Cache-Control', 'public, max-age=300');

// ── ETag (Entity Tag) — Conditional request ──────────────
// Server assigns unique identifier to resource representation

// First request:
// GET /api/users/1
// Response: 200 OK, ETag: "abc123", Body: {...}

// Second request (client has cached version):
// GET /api/users/1
// Header: If-None-Match: "abc123"
// Response: 304 Not Modified (no body! save bandwidth)

// Server implementation:
app.get('/api/users/:id', (req, res) => {
  const user = findUser(req.params.id);
  const etag = generateETag(user);  // Usually hash of content

  // Check if client's cached version is still valid
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();  // No body, saves bandwidth
  }

  res.setHeader('ETag', etag);
  res.json(user);
});
```

**Cache invalidation challenge:** when data changes, old cached versions must be invalidated. Strategies:
1. **Short TTL** — accept stale data for a few seconds
2. **Cache busting** — change URL (e.g., `/app.hash.js`)
3. **Version in key** — cache key includes version number
4. **Webhook notification** — notify CDN/cache to purge specific URLs

---

## 🔗 Liên Quan

- **11.2 REST API** — Ứng dụng HTTP methods cho RESTful design
- **11.5 REST Clients** — Client libraries nâng cao (interceptors, retry, typed)

---

## 📚 Tài Liệu Tham Khảo

- [MDN — HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) — Comprehensive HTTP reference
- [REST API Tutorial](https://restfulapi.net/) — REST principles and conventions
- [HTTP Caching Guide](https://web.dev/articles/http-cache) — Modern web caching strategies
- [Mozilla CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) — CORS deep dive

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.1-http-basics
npx tsx examples/index.ts
```

Demo minh họa: HTTP methods, status code handling, header manipulation, body serialization, và caching headers. Chú ý cách fetch API xử lý các trường hợp 401, 404, 429 khác nhau.

---

## ⏭️ Bài tiếp theo

→ [11.2 REST API Design](../11.2-rest-api/README.md)
