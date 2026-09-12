# 🔌 11.2 REST API Design (Thiết Kế API RESTful)

> **REST (Representational State Transfer)** là phong cách thiết kế API dựa trên HTTP methods và resources.

---

## 🎯 Nguyên Tắc RESTful

```
┌─────────────────────────────────────────────────────────────┐
│  REST Principles                                           │
│                                                             │
│  1. Resource-based URLs                                    │
│     ✅ /api/users/123                                      │
│     ❌ /api/getUser?id=123                                 │
│                                                             │
│  2. Use HTTP methods correctly                             │
│     GET /api/users      → list                             │
│     POST /api/users     → create                           │
│     PUT /api/users/1    → update full                      │
│     PATCH /api/users/1  → update partial                   │
│     DELETE /api/users/1 → delete                           │
│                                                             │
│  3. Stateless — mỗi request độc lập                         │
│                                                             │
│  4. Return proper status codes                              │
│     2xx = success, 4xx = client error, 5xx = server error  │
│                                                             │
│  5. JSON as default format                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 11.2.1 Resource Naming (Đặt Tên Resource)

```
✅ GOOD — plural nouns, lowercase, hyphens
GET    /api/users
GET    /api/users/123
GET    /api/users/123/orders
POST   /api/orders

❌ BAD — verbs in URL, camelCase, underscores
GET    /api/getUsers
GET    /api/user/123
GET    /api/Get_User_Order
```

---

## 11.2.2 Request/Response Format

```typescript
// Request — filtering, sorting, pagination
GET /api/users?status=active&page=1&limit=10&sort=-createdAt

// Response — consistent structure
{
  "data": [
    { "id": "1", "name": "John", "email": "john@example.com" }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "error": null
}

// Error response — consistent format
{
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email đã tồn tại",
    "details": [
      { "field": "email", "message": "Email này đã được sử dụng" }
    ]
  }
}
```

---

## 11.2.3 Express.js REST API Example

```typescript
import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// In-memory store (replace with database)
let users: User[] = [];
let nextId = 1;

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// GET /api/users — danh sách users
app.get('/api/users', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const start = (page - 1) * limit;

  res.json({
    data: users.slice(start, start + limit),
    meta: { page, limit, total: users.length }
  });
});

// GET /api/users/:id — chi tiết user
app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  }
  res.json({ data: user });
});

// POST /api/users — tạo mới
app.post('/api/users', (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name và email là bắt buộc' } });
  }

  const user: User = { id: String(nextId++), name, email, createdAt: new Date() };
  users.push(user);

  res.status(201).json({ data: user });
});

// PATCH /api/users/:id — cập nhật một phần
app.patch('/api/users/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;

  res.json({ data: user });
});

// DELETE /api/users/:id — xóa
app.delete('/api/users/:id', (req: Request, res: Response) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  users.splice(index, 1);
  res.status(204).send();
});
```

---

## 11.2.4 HATEOAS (Hypermedia as the Engine of Application State)

**Mỗi response chứa link đến các action liên quan:**

```typescript
{
  "data": {
    "id": "1",
    "name": "John",
    "email": "john@example.com",
    "_links": {
      "self": { "href": "/api/users/1" },
      "orders": { "href": "/api/users/1/orders" },
      "update": { "href": "/api/users/1", "method": "PATCH" },
      "delete": { "href": "/api/users/1", "method": "DELETE" }
    }
  }
}
```

---

## 🧭 So Sánh REST vs GraphQL

| Feature | REST | GraphQL |
|---------|------|---------|
| Endpoints | Nhiều | 1 (`/graphql`) |
| Over-fetching | Có thể xảy ra | Không |
| Caching | HTTP cache | Cache phức tạp hơn |
| Learning curve | Thấp | Trung bình |
| Best for | Public APIs | Internal/microservices |

---

## 🔗 Liên Quan

- **11.1 HTTP Basics** — Nền tảng HTTP methods
- **11.3 GraphQL** — Alternative cho REST

---

## 📚 Tài Liệu Tham Khảo

- 📖 [REST API Tutorial](https://restfulapi.net/)
- 📖 [MDN — HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)

---

## ⏭️ Bài Tiếp Theo

→ [11.3 GraphQL](../11.3-graphql/README.md)
