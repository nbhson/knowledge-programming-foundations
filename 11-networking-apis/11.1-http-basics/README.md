# 🌐 11.1 HTTP Basics (Nền Tảng HTTP)

> **HTTP (Hypertext Transfer Protocol)** là giao thức truyền tải tài nguyên web — nền tảng của mọi API và ứng dụng mạng.

---

## 🎯 Mô Hình Request/Response

```
┌──────────┐         HTTP Request          ┌──────────┐
│  Client   │ ──────────────────────────▶  │  Server  │
│  (Browser │                              │  (API)   │
│  / Fetch) │                              │          │
└──────────┘ ◀──────────────────────────  └──────────┘
               HTTP Response (Status + Body)
```

---

## 11.1.1 HTTP Methods (Phương Thức)

| Method | Mục Đích | Idempotent? | Safe? |
|--------|----------|-------------|-------|
| **GET** | Đọc dữ liệu | ✅ | ✅ |
| **POST** | Tạo tài nguyên mới | ❌ | ❌ |
| **PUT** | Cập nhật toàn bộ | ✅ | ❌ |
| **PATCH** | Cập nhật một phần | ❌ | ❌ |
| **DELETE** | Xóa tài nguyên | ✅ | ❌ |

```typescript
// GET — đọc dữ liệu
fetch('/api/users')
  .then(res => res.json())
  .then(users => console.log(users));

// POST — tạo mới
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

// PUT — cập nhật toàn bộ
fetch('/api/users/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 1, name: 'John Doe', email: 'john@example.com' })
});

// PATCH — cập nhật một phần
fetch('/api/users/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Johnny' })
});

// DELETE — xóa
fetch('/api/users/1', { method: 'DELETE' });
```

---

## 11.1.2 Status Codes (Mã Trạng Thái)

| Nhóm | Ý Nghĩa | Ví Dụ |
|------|---------|-------|
| **1xx** | Thông tin | 100 Continue |
| **2xx** | Thành công | 200 OK, 201 Created, 204 No Content |
| **3xx** | Chuyển hướng | 301 Moved, 304 Not Modified |
| **4xx** | Lỗi client | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| **5xx** | Lỗi server | 500 Internal Error, 502 Bad Gateway, 503 Service Unavailable |

```typescript
// Xử lý các trạng thái khác nhau
const response = await fetch('/api/users/1');

if (response.status === 200) {
  const user = await response.json();
  console.log(user);
} else if (response.status === 404) {
  console.log('User not found');
} else if (response.status === 401) {
  console.log('Unauthorized — need to login');
  router.push('/login');
} else {
  console.error(`Error: ${response.status}`);
}
```

---

## 11.1.3 Headers (Tiêu Đề)

```typescript
// Request headers
const headers = {
  'Content-Type': 'application/json',      // Loại dữ liệu gửi đi
  'Authorization': 'Bearer <token>',        // Xác thực
  'Accept': 'application/json',            // Loại dữ liệu mong nhận
  'X-Request-ID': 'abc-123',               // Theo dõi request
  'Cache-Control': 'no-cache'              // Không dùng cache
};

// Response headers
const resHeaders = new Headers(response.headers);
console.log(resHeaders.get('Content-Type'));  // "application/json"
console.log(resHeaders.get('Set-Cookie'));    // Cookie được set
```

**Common Headers:**
| Header | Mục Đích |
|--------|----------|
| `Content-Type` | Định dạng body |
| `Authorization` | Token xác thực |
| `Accept` | Client yêu cầu định dạng gì |
| `Cache-Control` | Chính sách cache |
| `Cross-Origin-*` | CORS control |
| `Set-Cookie` | Server gửi cookie về client |

---

## 11.1.4 Body (Thân Request)

```typescript
// JSON body
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', age: 30 })
});

// Form body (multipart)
const formData = new FormData();
formData.append('name', 'John');
formData.append('avatar', fileInput.files[0]);

fetch('/api/users', {
  method: 'POST',
  body: formData
});

// Raw text body
fetch('/api/data', {
  method: 'POST',
  body: '<xml>data</xml>',
  headers: { 'Content-Type': 'text/xml' }
});
```

---

## 11.1.5 Fetch API vs Axios

| Feature | Fetch (native) | Axios |
|---------|---------------|-------|
| Bundle size | 0 (built-in) | ~13KB |
| Auto JSON parse | ❌ (`res.json()`) | ✅ |
| Request interceptors | ❌ | ✅ |
| Response interceptors | ❌ | ✅ |
| Timeout | Manual | `timeout: 3000` |
| CSRF protection | Manual | ✅ (XSRF-TOKEN) |
| Browser support | IE11 ❌ | ✅ |

```typescript
// Fetch native
const res = await fetch('/api/users', { method: 'GET' });
const data = await res.json();

// Axios
const { data } = await axios.get('/api/users');
```

---

## 🔗 Liên Quan

- **11.2 REST API** — Ứng dụng HTTP methods cho REST design
- **11.5 REST Clients** — Client libraries nâng cao

---

## 📚 Tài Liệu Tham Khảo

- 📖 [MDN — HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- 📖 [REST API Tutorial](https://restfulapi.net/)

---

## ⏭️ Bài Tiếp Theo

→ [11.2 REST API Design](../11.2-rest-api/README.md)
