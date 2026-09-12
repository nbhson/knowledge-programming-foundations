# 🔌 5.10 API Design (Thiết Kế API)

> **API Design** là nghệ thuật thiết kế interface cho application — REST, GraphQL, gRPC...

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

**Resource-oriented, stateless, uses HTTP methods.**

```
GET    /api/users       → Danh sách users
POST   /api/users       → Tạo user mới
GET    /api/users/:id   → Lấy user theo ID
PUT    /api/users/:id   → Cập nhật toàn bộ
PATCH  /api/users/:id   → Cập nhật một phần
DELETE /api/users/:id   → Xóa user
```

```typescript
// Express REST API
app.get('/api/users', async (req, res) => {
  const users = await userService.findAll();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
});

app.get('/api/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});
```

✅ **Ưu điểm:** Đơn giản, cache-friendly, universal
❌ **Nhược điểm:** Over-fetching/under-fetching, nhiều endpoints

---

## 5.10.2 GraphQL

**Client запрос exactly what it needs.**

```graphql
# Query
query GetUsers {
  users {
    id
    name
    email
    posts {
      title
      createdAt
    }
  }
}

# Mutation
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}
```

```typescript
import { createServer } from '@apollo/server';

const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }
  
  type Query {
    users: [User!]!
    user(id: ID!): User
  }
  
  type Mutation {
    createUser(name: String!, email: String!): User!
  }
`;

const resolvers = {
  Query: {
    users: () => db.users.findMany(),
    user: (_, { id }) => db.users.findById(id),
  },
  Mutation: {
    createUser: (_, { name, email }) => db.users.create({ name, email }),
  }
};
```

✅ **Ưu điểm:** Không over-fetching, strong typing, 1 endpoint
❌ **Nhược điểm:** Cache phức tạp, N+1 queries

---

## 5.10.3 gRPC

**High-performance RPC với Protobuf.**

```protobuf
// user.proto
syntax = "proto3";

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser (CreateUserRequest) returns (User);
}

message GetUserRequest {
  string id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

```typescript
// TypeScript client
import { UserServiceClient } from './proto/user_pb_service';
import { GetUserRequest } from './proto/user_pb';

const client = new UserServiceClient(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

client.getUser(new GetUserRequest().setId('123'), (err, response) => {
  console.log(response.getName());
});
```

✅ **Ưu điểm:** Fast (binary), generated code, streaming
❌ **Nhược điểm:** Binary format khó debug, không cache-friendly

---

## 5.10.4 Pagination

**Phân trang kết quả lớn.**

```typescript
// Offset-based pagination
app.get('/api/posts', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    db.posts.findMany().skip(offset).limit(limit),
    db.posts.count()
  ]);

  res.json({
    data: posts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Cursor-based pagination (better for large datasets)
app.get('/api/posts', async (req, res) => {
  const cursor = req.query.cursor as string;
  const limit = 10;

  const query = cursor
    ? { id: { $lt: cursor } }
    : {};

  const posts = await db.posts.findMany(query)
    .sort({ id: 'desc' })
    .limit(limit + 1); // +1 để check hasNext

  const hasMore = posts.length > limit;
  const data = posts.slice(0, limit);
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  res.json({ data, nextCursor, hasMore });
});
```

**Offset vs Cursor:**
| | Offset | Cursor |
|---|--------|--------|
| Performance | Giảm khi page lớn | Luôn ổn định |
| Skip records | Có thể skip nếu data thay đổi | Không |
| Phù hợp | Dashboard, admin panel | Social feed, real-time |

---

## 🧭 So sánh API types

| | REST | GraphQL | gRPC |
|---|------|---------|------|
| Format | JSON | JSON | Protobuf (binary) |
| Queries | Multiple endpoints | Single endpoint | Multiple methods |
| Over-fetching | Có | Không | Không |
| Caching | HTTP cache | Cache phức tạp | Không |
| Performance | Good | Good | Excellent |
| Learning curve | Thấp | Trung bình | Cao |
| Best for | Public APIs | Mobile apps | Microservices |

---

## 🔗 Liên quan

- **1.1 Monolithic** — Monolith thường dùng REST
- **1.2 Microservices** — Microservices có thể dùng gRPC inter-service

---

## 📚 Tài liệu tham khảo

- 📖 [RESTful API Design](https://restfulapi.net/)
- 📖 [GraphQL Spec](https://spec.graphql.org/)
- 📖 [gRPC Basics](https://grpc.io/docs/what-is-grpc/)

---

## ⏭️ Bài tiếp theo

→ [5.11 Deployment & Infrastructure](../5.11-deployment-infra/README.md)
