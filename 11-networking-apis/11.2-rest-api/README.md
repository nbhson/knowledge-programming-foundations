# 🔌 11.2 REST API Design (Thiết Kế API RESTful)

> **REST (Representational State Transfer)** là phong cách thiết kế API dựa trên HTTP methods và resources. Được Roy Fielding định nghĩa trong dissertation 2000, REST không phải là "chỉ dùng JSON + URL" — nó là một set của **constraints** đảm bảo API có thể scale, cache được, và dễ hiểu. Nhưng thực tế, "RESTful API" thường ám chỉ **REST-style API** — resource-based URLs với đúng HTTP methods và status codes.

---

## 🎯 Nguyên Tắc RESTful — Six constraints decoded

REST có 6 architectural constraints. Thực tế, hầu hết "REST APIs" chỉ tuân thủ 4 trong 6. Hiểu rõ từng constraint giúp bạn biết mình đang ở đâu và cần cải thiện gì:

```
┌─────────────────────────────────────────────────────────────┐
│  REST Principles — The 6 Constraints                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Client-Server Separation                                │
│     UI/logic tách khỏi data storage → independent evolution │
│     ✅ Dễ refactor frontend mà không động vào backend      │
│                                                             │
│  2. Statelessness                                           │
│     Mỗi request self-contained, server không lưu client state│
│     ✅ Scale dễ (any server handle any request)            │
│     ❌ Session data phải lưu ở client hoặc external store   │
│                                                             │
│  3. Cacheability                                            │
│     Response phải tự mô tả cacheable hay không              │
│     ✅ Giảm latency, giảm load server                       │
│     ❌ Phải thiết kế cache invalidation strategy            │
│                                                             │
│  4. Uniform Interface                                       │
│     Resource identification, manipulation via representations│
│     Self-descriptive messages, HATEOAS (optional)           │
│     ✅ Clients đơn giản, chỉ cần biết contract             │
│                                                             │
│  5. Layered System                                          │
│     Client không biết trực tiếp hay không kết nối đến server │
│     ✅ Security (firewall, load balancer, API gateway)     │
│     ✅ Caching layers (CDN, reverse proxy)                 │
│                                                             │
│  6. Code on Demand (optional)                               │
│     Server có thể truyền executable code (JavaScript)       │
│     ⚠️ Hiếm dùng trong practice — security concern         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Thực tế:** Hầu hết REST APIs đạt **Level 2** của Richardson Maturity Model (dùng đúng HTTP methods + status codes). Level 3 (HATEOAS) hiếm khi đạt vì tăng complexity cho client. Không có gì sai — Level 2 đủ cho 95% use cases.

---

## 11.2.1 Resource Naming — conventions that matter

Resource naming là phần đầu tiên client nhìn thấy — nó quyết định **discoverability** và **intuitiveness** của API.

```
✅ GOOD — plural nouns, lowercase, kebab-case, noun phrases
GET    /api/v1/users                → collection of users
GET    /api/v1/users/123            → single user resource
GET    /api/v1/users/123/orders     → sub-resource (user's orders)
POST   /api/v1/users                → create user in collection
PUT    /api/v1/users/123            → replace user 123
PATCH  /api/v1/users/123            → partial update user 123
DELETE /api/v1/users/123            → delete user 123
GET    /api/v1/orders?status=pending&page=1&limit=20

❌ BAD — verbs in URL, singular nouns, camelCase, underscores
GET    /api/v1/getUsers             → verb in URL (should be GET /users)
GET    /api/v1/user/123             → singular noun (should be plural)
GET    /api/v1/Get_User_Order       → camelCase + underscores (inconsistent)
POST   /api/v1/create-user          → verb-noun (not resource-based)
GET    /api/v1/users/123/get-orders → action in URL (should be GET /users/123/orders)
```

**Key principles:**
- **Nouns, not verbs:** URL represents *what* (resource), method represents *how* (action)
- **Plural for collections:** `/users` not `/user` — consistent with HTTP semantics
- **Kebab-case:** `/user-profiles` not `/userProfiles` or `/user_profiles` — URL standard
- **Version in path:** `/api/v1/` — explicit, easy to deprecate, no header parsing needed
- **Nested resources:** `/users/123/orders` expresses ownership relationship clearly

### Sub-resources vs Actions — When to use each

```
✅ Sub-resource (expresses relationship):
GET  /api/v1/users/123/orders        → orders belonging to user 123
POST /api/v1/users/123/orders        → create order for user 123
GET  /api/v1/users/123/orders/456    → specific order

❌ Action as URL path (violates resource-oriented design):
GET  /api/v1/users/123/get-orders    → verb in URL
POST /api/v1/users/123/search-orders → action as sub-resource

✅ Alternative: query parameters for filtering/searching:
GET  /api/v1/users?status=active&page=1&limit=20&sort=-createdAt
GET  /api/v1/orders?userId=123&status=pending&date[gte]=2024-01-01

✅ Alternative: POST to collection for complex search (when GET params insufficient):
POST /api/v1/orders/search
{
  "filters": {
    "status": "pending",
    "dateRange": { "from": "2024-01-01", "to": "2024-12-31" },
    "minTotal": 100
  },
  "page": 1,
  "limit": 20
}
```

---

## 11.2.2 Request/Response Format — consistency is professionalism

Consistent response format giúp client code đơn giản hơn rất nhiều — không cần special-case mỗi endpoint.

```typescript
// ── Success Response Pattern ─────────────────────────────
// Consistent envelope: data + meta (pagination) + error: null
{
  "data": {
    "id": "1",
    "name": "John",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "error": null
}

// List response (with pagination)
{
  "data": [
    { "id": "1", "name": "John", "email": "john@example.com" },
    { "id": "2", "name": "Jane", "email": "jane@example.com" }
  ],
  "meta": {
    "page": 1,
    "limit": 2,
    "total": 100,
    "totalPages": 50,
    "nextPage": 2,
    "prevPage": null
  },
  "error": null
}

// ── Error Response Pattern ───────────────────────────────
// Consistent error envelope: code + message + details + requestId
{
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu đầu vào không hợp lệ",
    "details": [
      {
        "field": "email",
        "message": "Email đã tồn tại trong hệ thống"
      },
      {
        "field": "name",
        "message": "Tên phải có ít nhất 2 ký tự"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// Not found error
{
  "data": null,
  "meta": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "User không tồn tại",
    "details": [],
    "requestId": "req_def456",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// Rate limit error
{
  "data": null,
  "meta": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Bạn đã vượt quá giới hạn yêu cầu",
    "details": [],
    "requestId": "req_ghi789",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Error code taxonomy — predictability helps debugging:**
```
CLIENT ERRORS (4xx):
  VALIDATION_ERROR      → Input failed validation rules
  UNAUTHORIZED          → Missing or invalid authentication
  FORBIDDEN             → Authenticated but insufficient permissions
  NOT_FOUND             → Resource does not exist
  CONFLICT              → Resource conflict (duplicate, already exists)
  UNPROCESSABLE         → Semantic error (valid syntax, invalid business state)
  RATE_LIMITED          → Too many requests

SERVER ERRORS (5xx):
  INTERNAL_ERROR        → Unexpected server condition
  SERVICE_UNAVAILABLE   → Temporarily overloaded or maintenance
  UPSTREAM_TIMEOUT      → Downstream service did not respond in time
```

---

## 11.2.3 Express.js REST API Example — Full CRUD

```typescript
import express, { Request, Response, NextFunction } from 'express';

const app = express();
app.use(express.json());

// ── Error handling middleware (must be last) ─────────────
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`${req.method} ${req.url} — ${error.message}`);
  res.status(500).json({
    data: null,
    meta: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      details: [],
      requestId: (req as any).requestId || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
});

// ── In-memory store (replace with database in production) ─
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

let users: User[] = [];
let nextId = 1;

// Generate unique request ID for tracing
app.use((req, res, next) => {
  (req as any).requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
});

// ── GET /api/users — list with pagination & filtering ────
app.get('/api/users', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sort = (req.query.sort as string) || '-createdAt';
  const search = (req.query.search as string) || '';

  let filtered = users;
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = users.filter(
      u => u.name.toLowerCase().includes(searchLower) ||
           u.email.toLowerCase().includes(searchLower)
    );
  }

  const sortBy = sort.startsWith('-') ? sort.slice(1) : sort;
  const sortOrder = sort.startsWith('-') ? -1 : 1;
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof User];
    const bVal = b[sortBy as keyof User];
    if (aVal < bVal) return -1 * sortOrder;
    if (aVal > bVal) return 1 * sortOrder;
    return 0;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  res.json({
    data: paginated,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    error: null,
  });
});

// ── GET /api/users/:id — single resource ─────────────────
app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({
      data: null, meta: null,
      error: { code: 'NOT_FOUND', message: 'User not found', details: [], requestId: (req as any).requestId, timestamp: new Date().toISOString() }
    });
  }
  res.json({ data: user, meta: null, error: null });
});

// ── POST /api/users — create new resource ────────────────
app.post('/api/users', (req: Request, res: Response) => {
  const { name, email } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      data: null, meta: null,
      error: { code: 'VALIDATION_ERROR', message: 'Tên phải có ít nhất 2 ký tự', details: [{ field: 'name', message: 'Name is required and must be at least 2 characters' }], requestId: (req as any).requestId, timestamp: new Date().toISOString() }
    });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      data: null, meta: null,
      error: { code: 'VALIDATION_ERROR', message: 'Email không hợp lệ', details: [{ field: 'email', message: 'Must be a valid email address' }], requestId: (req as any).requestId, timestamp: new Date().toISOString() }
    });
  }
  if (users.some(u => u.email === email)) {
    return res.status(409).json({
      data: null, meta: null,
      error: { code: 'CONFLICT', message: 'Email đã tồn tại', details: [{ field: 'email', message: 'This email is already registered' }], requestId: (req as any).requestId, timestamp: new Date().toISOString() }
    });
  }

  const user: User = {
    id: String(nextId++),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    createdAt: new Date(),
  };
  users.push(user);

  // 201 Created + Location header + return created resource
  res.status(201).header('Location', `/api/users/${user.id}`).json({
    data: user,
    meta: null,
    error: null,
  });
});

// ── PATCH /api/users/:id — partial update ────────────────
app.patch('/api/users/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({
      data: null, meta: null,
      error: { code: 'NOT_FOUND', message: 'User not found', details: [], requestId: (req as any).requestId, timestamp: new Date().toISOString() }
    });
  }

  const { name, email } = req.body;
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        data: null, meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'Tên không hợp lệ', details: [{ field: 'name', message: 'Name must be at least 2 characters' }], requestId: (req as any).requestId, timestamp: new Date().toISOString() }
      });
    }
    user.name = name.trim();
  }
  if (email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        data: null, meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'Email không hợp lệ', details: [{ field: 'email', message: 'Must be a valid email' }], requestId: (req as any).requestId, timestamp: new Date().toISOString() }
      });
    }
    if (users.some(u => u.email === email.toLowerCase() && u.id !== user.id)) {
      return res.status(409).json({
        data: null, meta: null,
        error: { code: 'CONFLICT', message: 'Email đã tồn tại', details: [{ field: 'email', message: 'This email is already in use' }], requestId: (req as any).requestId, timestamp: new Date().toISOString() }
      });
    }
    user.email = email.toLowerCase().trim();
  }

  res.json({ data: user, meta: null, error: null });
});

// ── DELETE /api/users/:id — soft delete (recommended) ───
app.delete('/api/users/:id', (req: Request, res: Response) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({
      data: null, meta: null,
      error: { code: 'NOT_FOUND', message: 'User not found', details: [], requestId: (req as any).requestId, timestamp: new Date().toISOString() }
    });
  }

  // Soft delete: mark as deleted instead of removing
  const deleted = users.splice(index, 1)[0];
  deleted.deletedAt = new Date();

  // 204 No Content — standard for DELETE success
  res.status(204).end();
});

app.listen(3000, () => console.log('🚀 REST API running on http://localhost:3000'));
```

---

## 11.2.4 HATEOAS (Hypermedia as the Engine of Application State)

HATEOAS là constraint khó nhất trong REST — response chứa **links** đến các resource và action liên quan, giúp client **khám phá** API mà không cần documentation.

```typescript
// Response với HATEOAS links
{
  "data": {
    "id": "1",
    "name": "John",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00Z",
    "_links": {
      "self": { "href": "/api/users/1", "method": "GET" },
      "orders": { "href": "/api/users/1/orders", "method": "GET" },
      "update": { "href": "/api/users/1", "method": "PATCH" },
      "delete": { "href": "/api/users/1", "method": "DELETE" },
      "friends": { "href": "/api/users/1/friends", "method": "GET" }
    }
  }
}

// Collection response với HATEOAS
{
  "data": [
    { "id": "1", "name": "John", "_links": { "self": { "href": "/api/users/1" } } },
    { "id": "2", "name": "Jane", "_links": { "self": { "href": "/api/users/2" } } }
  ],
  "_links": {
    "self": { "href": "/api/users?page=1" },
    "next": { "href": "/api/users?page=2" },
    "prev": null,
    "create": { "href": "/api/users", "method": "POST" }
  }
}
```

```typescript
// Helper function để thêm HATEOAS links vào response
function addLinks(data: any, baseUrl: string, actions: string[] = []): any {
  const links: Record<string, any> = {
    self: { href: baseUrl, method: 'GET' },
  };

  if (actions.includes('update')) {
    links.update = { href: baseUrl, method: 'PATCH' };
  }
  if (actions.includes('delete')) {
    links.delete = { href: baseUrl, method: 'DELETE' };
  }
  if (actions.includes('orders')) {
    links.orders = { href: `${baseUrl}/orders`, method: 'GET' };
  }

  return { ...data, _links: links };
}
```

> 💡 **Thực tế:** HATEOAS đẹp về lý thuyết nhưng hiếm khi dùng trong practice vì:
> 1. Client code phức tạp hơn (phải follow links thay vì hardcode URLs)
> 2. Tools (Postman, Swagger) không display HATEOAS links tự động
> 3. Mobile apps không muốn phụ thuộc vào server-provided URLs
>
> **Khuyến nghị:** dùng HATEOAS cho internal APIs hoặc developer portals, không phải cho public/mobile-facing APIs.

---

## 11.2.5 HTTP Semantics — Common mistakes to avoid

```
❌ Sử dụng GET cho việc tạo data:
   GET /api/create-user?name=John    → VIOLATES: GET must be safe (no side effects)
   ✅ Đúng: POST /api/users với body {name: "John"}

❌ Sử dụng POST thay vì PUT/PATCH:
   POST /api/users/123               → Không rõ intent: create? update?
   ✅ Đúng: PUT /api/users/123 (replace toàn bộ) hoặc PATCH /api/users/123 (partial)

❌ Status code 200 cho create:
   POST /api/users → 200 OK          → Không phân biệt được create vs update
   ✅ Đúng: POST /api/users → 201 Created + Location header

❌ Status code 200 cho delete:
   DELETE /api/users/123 → 200 OK    → Delete không trả về body
   ✅ Đúng: DELETE /api/users/123 → 204 No Content

❌ 404 cho validation error:
   POST /api/users {invalid: data} → 404    → Resource exists, input is invalid
   ✅ Đúng: 400 Bad Request hoặc 422 Unprocessable Entity

❌ 500 cho client error:
   GET /api/users/999 → 500         → Resource not found = server error?
   ✅ Đúng: 404 Not Found

❌ Không set Content-Type:
   POST /api/users with JSON body but no Content-Type header
   → Server không parse được body
   ✅ Đúng: luôn set Content-Type: application/json
```

---

## 🧭 So Sánh REST vs GraphQL

| Feature | REST | GraphQL |
|---------|------|---------|
| **Endpoints** | Nhiều (`/users`, `/posts`, `/orders`) | 1 (`/graphql`) |
| **Over-fetching** | Có thể xảy ra (fetch toàn bộ user → 50 fields, cần 3) | Không — client chọn đúng fields |
| **Under-fetching** | Có thể cần nhiều requests (user + posts + comments) | Không — nested query trong 1 request |
| **Caching** | HTTP cache (CDN, browser) tự động | Phải implement manual (Apollo cache, URQL) |
| **Versioning** | `/v1/users`, `/v2/users` (breaking change = new version) | Schema evolution (add field = backward compatible) |
| **Learning curve** | Thấp — ai cũng biết HTTP | Trung bình — cần học SDL, resolvers, directives |
| **Best for** | Public APIs, mobile clients, simple CRUD | Complex UIs, multiple clients with different needs |
| **Performance** | Network overhead nhiều requests | Single round-trip, nhưng resolver N+1 risk |

> 📌 **Quy tắc chọn:** REST cho public API (broad compatibility, HTTP caching, simple). GraphQL cho internal API hoặc multi-client (mobile + web + admin need different data shapes). Không có "better" — chỉ có "right tool cho bài toán".

---

## 🔗 Liên Quan

- **11.1 HTTP Basics** — Nền tảng HTTP methods, status codes, headers
- **11.3 GraphQL** — Alternative cho REST, flexible queries

---

## 📚 Tài Liệu Tham Khảo

- [REST API Tutorial](https://restfulapi.net/) — REST principles and conventions
- [MDN — HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) — HTTP specification reference
- [ Richardson Maturity Model](https://restfulapi.net Richardson-maturity-model/) — REST levels explained
- [HTTP Caching](https://web.dev/articles/http-cache) — Modern web caching strategies

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.2-rest-api
npx ts-node examples/index.ts
```

Demo bao gồm: CRUD operations với đầy đủ validation, error handling, pagination, và HATEOAS links. Chú ý cách mỗi HTTP method được dùng đúng semantics và status code phản ánh đúng kết quả.

---

## ⏭️ Bài tiếp theo

→ [11.3 GraphQL](../11.3-graphql/README.md)
