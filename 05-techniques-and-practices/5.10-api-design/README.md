# 🔌 5.10 API Design (Thiết Kế API)

> **API Design** là nghệ thuật thiết kế interface cho application — REST, GraphQL, gRPC... Một API được thiết kế tốt giảm 50%+ lượng bug integration, tăng tốc development client lên gấp 3 lần, và quyết định khả năng scale hệ thống.

---

## 📚 Mục Lục

| # | Protocol | Đặc Điểm |
|---|----------|----------|
| 5.10.1 | [REST API](#5101-rest-api) | Resource-based, HTTP methods |
| 5.10.2 | [GraphQL](#5102-graphql) | Query language, flexible data fetching |
| 5.10.3 | [gRPC](#5103-grpc) | High-performance RPC over HTTP/2 |
| 5.10.4 | [Pagination](#5104-pagination) | Phân trang kết quả |

---

## 5.10.1 REST API

**Resource-oriented, stateless, uses HTTP methods.** REST (Representational State Transfer) là kiến trúc API phổ biến nhất trên web, dựa trên 4 nguyên tắc: resource identification, manipulation through representations, self-descriptive messages, và stateless communication.

### Resource Model & HTTP Semantics

```
GET    /api/users           → 200 OK: Danh sách users (list)
POST   /api/users           → 201 Created: Tạo user mới (create)
GET    /api/users/:id       → 200 OK: Lấy user theo ID (read single)
PUT    /api/users/:id       → 200 OK: Cập nhật TOÀN BỘ resource (replace)
PATCH  /api/users/:id       → 200 OK: Cập nhật MỘT PHẦN resource (partial update)
DELETE /api/users/:id       → 204 No Content: Xóa user (delete)
```

**HTTP Method Semantics (quan trọng):**

| Method | Safe? | Idempotent? | Nghĩa | Ví dụ |
|--------|-------|-------------|-------|-------|
| `GET` | ✅ | ✅ | Đọc dữ liệu | `GET /users/123` |
| `POST` | ❌ | ❌ | Tạo resource mới | `POST /users` |
| `PUT` | ❌ | ✅ | Thay thế toàn bộ | `PUT /users/123` → nếu gọi 2 lần vẫn ra cùng state |
| `PATCH` | ❌ | ❌ | Sửa một phần | `PATCH /users/123` với `{ email: "new@mail.com" }` |
| `DELETE` | ❌ | ✅ | Xóa resource | `DELETE /users/123` |

> 📌 **Safe** = không làm thay đổi server state. **Idempotent** = gọi N lần = kết quả như gọi 1 lần.

### Express REST API (complete example)

```typescript
import express, { Request, Response } from 'express';
import { UserService } from './services/user.service';

const app = express();
app.use(express.json());

const userService = new UserService();

// GET /api/users — list with optional filter & pagination
app.get('/api/users', async (req: Request, res: Response) => {
  const { page = 1, limit = 10, role } = req.query;
  const users = await userService.findAll({
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    where: role ? { role } : undefined,
  });
  res.json(users);
});

// POST /api/users — create new
app.post('/api/users', async (req: Request, res: Response) => {
  const user = await userService.create(req.body);
  res.status(201).json(user); // 201 = Created
});

// GET /api/users/:id — get single
app.get('/api/users/:id', async (req: Request, res: Response) => {
  const user = await userService.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT /api/users/:id — replace entirely
app.put('/api/users/:id', async (req: Request, res: Response) => {
  const user = await userService.update(req.params.id, req.body);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/users/:id — partial update
app.patch('/api/users/:id', async (req: Request, res: Response) => {
  const user = await userService.partialUpdate(req.params.id, req.body);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// DELETE /api/users/:id
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  const deleted = await userService.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'User not found' });
  res.status(204).end(); // 204 = No Content
});
```

### REST Best Practices

| Practice | Why it matters | Bad example | Good example |
|----------|----------------|-------------|--------------|
| **Plural nouns** | Consistent mental model | `/api/user` | `/api/users` |
| **Nested resources** | Represent hierarchy | `GET /api/getUserOrders` | `GET /api/users/123/orders` |
| **Status codes** | Client reacts appropriately | `200` for everything | `201` create, `404` not found, `409` conflict |
| **Versioning** | Breaking changes don't break clients | `/api/users` | `/api/v1/users` hoặc header `Accept: application/vnd.api.v1+json` |
| **Idempotency keys** | Retry-safe POST | `POST /payments` | `POST /payments` với header `Idempotency-Key: uuid-v4` |
| **HATEOAS** (optional) | Self-discoverable API | `{ id: 1, name: "John" }` | `{ id: 1, name: "John", _links: { self: "/users/1", orders: "/users/1/orders" } }` |

### Common REST Mistakes

```
❌ Verb trong URL:   GET /api/getUsers, POST /api/createUser
✅ Đúng:             GET /api/users, POST /api/users

❌ Resource không nhất quán: /api/User, /api/customerList
✅ Đúng:                /api/users, /api/customers

❌ Không dùng status code: luôn trả 200 kể cả lỗi
✅ Đúng:                200, 201, 400, 401, 403, 404, 409, 500

❌ Deep nesting (>2 levels): GET /api/users/1/orders/2/items/3/reviews
✅ Đúng:                 GET /api/orders/2/items/3/reviews (chỉ nest 1 level)
```

✅ **Ưu điểm:** Đơn giản, cache-friendly (HTTP cache native), universal (mọi ngôn ngữ/framework đều hiểu), documentable (OpenAPI/Swagger auto-generated).
❌ **Nhược điểm:** Over-fetching (client nhận nhiều dữ liệu không cần), under-fetching (cần nhiều endpoint cho 1 view), nhiều endpoints cho complex objects.

---

## 5.10.2 GraphQL

**Client yêu cầu chính xác cái nó cần.** GraphQL là query language do Facebook xây dựng (2015), cho phép client định nghĩa cấu trúc response thay vì server định nghĩa cứng. Một endpoint duy nhất (`/graphql`) xử lý mọi truy vấn.

### Core Concepts

- **Query**: đọc dữ liệu (tương đương GET)
- **Mutation**: ghi dữ liệu (tương đương POST/PUT/PATCH)
- **Schema**: định nghĩa types, queries, mutations — contract giữa server và client
- **Resolver**: hàm xử lý mỗi field trong query
- **Introspection**: client tự khám phá schema tại runtime

### Schema Definition (typeDefs)

```graphql
# Types
type User {
  id: ID!
  name: String!
  email: String!
  role: UserRole!
  posts: [Post!]!        # Relation — client tự chọn fetch hay không
  createdAt: DateTime!
}

enum UserRole {
  ADMIN
  USER
  MODERATOR
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!          # Resolver sẽ fetch author riêng
  tags: [Tag!]!
}

type Tag {
  id: ID!
  name: String!
}

# Input types cho mutation
input CreateUserInput {
  name: String!
  email: String!
  role: UserRole = USER
}

input UpdateUserInput {
  name: String
  email: String
  role: UserRole
}

# Queries
type Query {
  users: [User!]!
  user(id: ID!): User
  posts(limit: Int = 10, offset: Int = 0): [Post!]!
  searchPosts(query: String!): [Post!]!
}

# Mutations
type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}
```

### Resolvers Implementation

```typescript
import { createServer } from '@apollo/server';

const typeDefs = /* GraphQL */ `
  type User { id: ID! name: String! email: String! posts: [Post!]! }
  type Query { users: [User!]! user(id: ID!): User }
  type Mutation { createUser(name: String!, email: String!): User! }
`;

const resolvers = {
  Query: {
    users: () => db.users.findMany(),
    user: (_parent, { id }) => db.users.findById(id),
  },
  Mutation: {
    createUser: (_parent, { name, email }) => {
      return db.users.create({ name, email });
    },
  },
  // Nested resolver — fix N+1 với DataLoader
  User: {
    posts: (user) => db.posts.findMany({ where: { authorId: user.id } }),
  },
};
```

### Client Query (GraphQL)

```graphql
# Client chọn đúng field cần — không over-fetching
query GetUserInfo($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts(first: 5) {
      title
      createdAt
    }
  }
}

# Variables
{ "id": "abc123" }
```

**Response (chỉ field được request):**
```json
{
  "data": {
    "user": {
      "id": "abc123",
      "name": "John",
      "email": "john@example.com",
      "posts": [
        { "title": "Hello World", "createdAt": "2024-01-15T10:00:00Z" }
      ]
    }
  }
}
```

### GraphQL vs REST: N+1 Problem & DataLoader

```typescript
// ❌ N+1: 1 query lấy users + N query riêng cho mỗi user's posts
const resolvers = {
  User: {
    posts: (user) => db.posts.findMany({ where: { userId: user.id } }),
  },
};

// ✅ DataLoader: batch + cache trong 1 request cycle
import { DataLoader } from 'dataloader';

const userPostLoader = new DataLoader(async (userIds: string[]) => {
  // 1 query cho N users thay vì N queries
  return Promise.all(
    userIds.map(id => db.posts.findMany({ where: { userId: id } }))
  );
});

const resolvers = {
  User: {
    posts: (user) => userPostLoader.load(user.id),
  },
};
```

✅ **Ưu điểm:** Không over-fetching, 1 endpoint, strong typing tự document, client-controlled shaping, caching at field level.
❌ **Nhược điểm:** Cache phức tạp (HTTP cache không áp dụng được), N+1 queries, query complexity attack (client yêu cầu recursion rất sâu), debugging khó hơn REST.

---

## 5.10.3 gRPC

**High-performance RPC với Protobuf.** gRPC là framework RPC do Google phát triển, dùng HTTP/2 làm transport và Protocol Buffers (Protobuf) làm serialization format. Tốc độ cao nhờ binary format + multiplexed streams.

### Protobuf Definition

```protobuf
syntax = "proto3";

package user;

// Service definition — tập hợp RPC methods
service UserService {
  // Unary RPC: 1 request → 1 response
  rpc GetUser (GetUserRequest) returns (User);
  
  // Server streaming: 1 request → nhiều response (realtime feed)
  rpc ListUsers (ListUsersRequest) returns (stream User);
  
  // Client streaming: nhiều request → 1 response (batch upload)
  rpc BatchCreateUsers (stream CreateUserRequest) returns (BatchCreateResponse);
  
  // Bidirectional streaming: both sides send many messages (chat, live sync)
  rpc LiveSync (stream SyncEvent) returns (stream SyncEvent);
}

// Messages = structured data types
message GetUserRequest {
  string id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  repeated string roles = 4;        // repeated = array
  int64 created_at = 5;             // timestamp
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;            // pagination cursor
}

message ListUsersResponse {
  repeated User users = 1;
  string next_page_token = 2;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}

message BatchCreateResponse {
  repeated User created_users = 1;
  int32 success_count = 2;
  int32 failed_count = 3;
}
```

### TypeScript gRPC Server

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { UserServiceService } from './proto/user_grpc_pb';
import { GetUserRequest, User } from './proto/user_pb';

// Load proto file
const packageDefinition = protoLoader.loadSync('protos/user.proto');
const protoGrpc = grpc.loadPackageDefinition(packageDefinition) as any;

// Implementation
const userServiceImpl: UserServiceService = {
  getUser(call: grpc.ServerUnaryCall<GetUserRequest, User>, callback: grpc.sendUnaryData<User>) {
    const userId = call.request.getId();
    const user = db.users.findById(userId);
    if (!user) {
      callback({ code: grpc.status.NOT_FOUND, details: 'User not found' });
      return;
    }
    callback(null, user);
  },
  
  listUsers(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const users = db.users.findAll();
    callback(null, { users });
  },
};

// Start server
const server = new grpc.Server();
server.addService(protoGrpc.user.UserService.service, userServiceImpl);
server.bindAsync('0.0.0.0:50051', grpc.credentials.createInsecure(), () => {
  server.start();
});
```

### gRPC vs REST vs GraphQL (comparison)

| | REST | GraphQL | gRPC |
|---|------|---------|------|
| **Transport** | HTTP/1.1 (hoặc HTTP/2) | HTTP/1.1 + JSON | HTTP/2 multiplexed |
| **Serialization** | JSON (text) | JSON (text) | Protobuf (binary) |
| **Schema** | Optional (OpenAPI) | Required (GraphQL SDL) | Required (.proto files) |
| **Generated code** | Optional | Optional (Apollo codegen) | **Required** (proto → TS/Java/Go) |
| **Latency** | ~5–50ms/request | ~5–50ms/request | **~1–5ms/request** |
| **Bandwidth** | Cao (text JSON) | Cao (text JSON) | **Thấp** (binary ~1/3 size) |
| **Caching** | HTTP native (easy) | Cache phức tạp (need Apollo Client cache) | Không cache được (binary stream) |
| **Debugging** | curl/Postman dễ | GraphiQL/Playground | Cần grpcurl/Inspector |
| **Best for** | Public APIs, mobile/web clients | Complex UIs, mobile data optimization | Inter-service (backend-to-backend), real-time streaming |

✅ **Ưu điểm:** Tốc độ cực cao (binary + HTTP/2), strongly typed từ .proto, generated code cho 15+ languages, native streaming support.
❌ **Nhược điểm:** Binary format khó debug (cần tool chuyên dụng), vendor lock-in về ecosystem, không cache-friendly, learning curve cao hơn REST.

> 💡 **Lưu ý:** gRPC **không phải** để thay REST cho public API. Nó sinh ra cho **internal service-to-service communication**. REST + JSON vẫn là king cho public/consumer-facing APIs vì HTTP cache và browser native support.

---

## 5.10.4 Pagination

**Phân trang kết quả lớn.** Khi dataset > vài trăm records, phải pagination để tránh tải toàn bộ vào memory và giảm latency. Có 3 strategies chính:

### 1. Offset-based (page/limit)

```typescript
// Query SQL tương đương: SELECT * FROM posts LIMIT 10 OFFSET 20
app.get('/api/posts', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    db.posts.findMany().skip(offset).limit(limit),
    db.posts.count(),
  ]);

  res.json({
    data: posts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});
```

**Vấn đề offset:** Khi data thay đổi giữa các page requests (record mới thêm/xóa), ta có thể **trùng hoặc bỏ sót records**. Performance giảm phi tuyến khi page lớn vì database phải scan và discard `offset` rows.

### 2. Cursor-based (keyset pagination)

```typescript
// Query SQL tương đương: SELECT * FROM posts WHERE id < :cursor ORDER BY id DESC LIMIT 10
app.get('/api/posts', async (req: Request, res: Response) => {
  const cursor = req.query.cursor as string | undefined;
  const limit = 10;

  const query = cursor
    ? { id: { $lt: cursor } }
    : {};

  const posts = await db.posts
    .findMany(query)
    .sort({ id: 'desc' as const })
    .limit(limit + 1); // +1 để check hasMore

  const hasMore = posts.length > limit;
  const data = posts.slice(0, limit);
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  res.json({
    data,
    meta: { nextCursor, hasMore, limit },
  });
});
```

**Tại sao cursor tốt hơn:** `SELECT ... WHERE id < 123 LIMIT 10` dùng indexed seek → O(log n) thay vì O(offset + limit). Performance ổn định bất kể page position.

### Offset vs Cursor — Decision Table

| | Offset (page/limit) | Cursor (keyset) |
|---|---|---|
| **Performance** | Giảm khi page lớn (scan + discard) | Luôn O(log n) với indexed cursor |
| **Skip records risk** | Có — data thay đổi giữa requests | Không — dựa trên value đã thấy |
| **Random access** | `page=50` = dễ | `cursor=xyz` = chỉ có thể next/prev |
| **Total count** | Dễ (`SELECT COUNT(*)`) | Khó (phải query riêng) |
| **UI pattern** | Số trang (1, 2, 3... Last) | "Load more" / infinite scroll |
| **Phù hợp nhất** | Dashboard admin, search results | Social feed, chat history, logs |

### 5.10.5 Pagination (Continued) — Range-based (alternative)

```typescript
// Alternative: fetch by [from, to] timestamp range
app.get('/api/logs', async (req: Request, res: Response) => {
  const from = req.query.from as string;  // ISO timestamp
  const to = req.query.to as string;      // ISO timestamp
  const limit = 50;

  const logs = await db.logs.findMany({
    where: { timestamp: { gte: from, lt: to } },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  const nextFrom = logs.length > 0 ? logs[logs.length - 1].timestamp : null;

  res.json({ data: logs, meta: { nextFrom, hasMore: logs.length === limit } });
});
```

Range-based phù hợp khi dữ liệu đã có timestamp tự nhiên (logs, events, stock prices) và muốn query "last N minutes/hours".

---

## 🎯 Khi nào dùng API type nào?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Public-facing consumer API (web/mobile) | **REST** hoặc **GraphQL** | Browser/native app support, HTTP caching, developer experience |
| Mobile app với bandwidth hạn chế | **GraphQL** | Client chọn đúng field → tiết kiệm data, giảm payload 40–70% |
| Internal microservice communication | **gRPC** | Tốc độ + strongly typed + streaming không cần HTTP overhead |
| Real-time data (chat, live feed, stock ticker) | **gRPC streaming** hoặc **GraphQL subscriptions** | gRPC bidirectional stream hoặc GraphQL WS subscription |
| Admin dashboard cần nhiều query shapes | **GraphQL** | 1 endpoint, client tự compose query phức tạp |
| Simple CRUD app (internal tool) | **REST** | Quick to implement, easy to debug, zero learning curve |
| API với 3rd party integrations (partners) | **REST + OpenAPI** | Chuẩn industry, Swagger UI tự động document, partner dễ integrate |

---

## 🧭 So sánh API types (expanded)

| | REST | GraphQL | gRPC |
|---|------|---------|------|
| **Format** | JSON (text) | JSON (text) | Protobuf (binary) |
| **Queries** | Multiple endpoints | Single endpoint (`/graphql`) | Multiple methods (`UserService.GetUser`) |
| **Over-fetching** | Có (phải nhận toàn bộ object) | Không (client chọn field) | Không (proto field selection) |
| **Under-fetching** | Có (cần nhiều endpoint) | Không (nested query) | Có (mỗi method 1 response shape) |
| **Caching** | HTTP cache native (easy) | Application cache (Apollo Client) | Không — streaming binary |
| **Performance** | Good | Good | **Excellent** — binary, multiplexed |
| **Schema evolution** | Breaking (add field to endpoint) | Non-breaking (add new field/query) | Breaking nếu xoá field trong .proto |
| **Learning curve** | Thấp | Trung bình (SDL + resolvers + DataLoader) | Cao (.proto syntax, gRPC concepts) |
| **Tooling** | curl, Postman, Swagger | GraphiQL, Apollo Studio, Insomnia | grpcurl, Bazel, generated stubs |
| **Best for** | Public APIs, CRUD apps | Mobile, complex UIs, multi-client | Backend services, real-time, high-throughput |
| **Industry example** | Twitter REST API, GitHub API | GitHub GraphQL API, Shopify Storefront API | gRPC everywhere in Google, Netflix inter-service |

---

## 🔗 Liên quan

- **1.1 Monolithic** — Monolith thường dùng REST nội bộ
- **1.2 Microservices** — Microservices có thể dùng gRPC inter-service
- **5.6 Error Handling** — Circuit breaker, retry trong distributed API calls

---

## 📚 Tài liệu tham khảo

- 📖 [RESTful API Design](https://restfulapi.net/)
- 📖 [GraphQL Spec](https://spec.graphql.org/)
- 📖 [gRPC Basics](https://grpc.io/docs/what-is-grpc/)
- 📖 [Designing APIs with GraphQL](https://graphql.org/learn/)
- 📖 [HTTP Caching Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

## ⏭️ Bài tiếp theo

→ [5.11 Deployment & Infrastructure](../5.11-deployment-infra/README.md)
