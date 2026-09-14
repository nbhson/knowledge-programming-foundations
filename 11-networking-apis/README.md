# 🌐 Lớp 11: Networking & APIs (Mạng & Giao Tiếp)

> **Networking** là nền tảng giúp các hệ thống **giao tiếp với nhau** qua mạng,
> còn **API** là **hợp đồng giao tiếp** giữa các thành phần phần mềm.
> Hiểu networking và API design là kỹ năng **bắt buộc** cho mọi lập trình viên hiện đại — vì mọi hệ thống phân tán đều giao tiếp qua network, và API là ngôn ngữ của sự giao tiếp đó.

---

## 📚 Mục lục

| # | Chủ đề | Giải thích | Link |
|---|--------|-----------|------|
| 11.1 | **HTTP Basics** | Request/response, HTTP methods, status codes, headers, body | [→ 11.1](11.1-http-basics/README.md) |
| 11.2 | **REST API** | Resource-based URL, CRUD với đúng method + status, HATEOAS | [→ 11.2](11.2-rest-api/README.md) |
| 11.3 | **GraphQL** | Schema, resolver, query selection, mutation, subscription | [→ 11.3](11.3-graphql/README.md) |
| 11.4 | **WebSockets** | Kết nối full-duplex, broadcast event, SSE, real-time patterns | [→ 11.4](11.4-websockets/README.md) |
| 11.5 | **REST Clients** | fetch/axios, interceptors, timeout, retry, error handling | [→ 11.5](11.5-rest-clients/README.md) |
| 11.6 | **Rate Limiting** | Token bucket, sliding window, 429 + Retry-After | [→ 11.6](11.6-rate-limiting/README.md) |

---

## 📑 Mục Lục

- [1. Tổng Quan — Networking & API là gì?](#1-tổng-quan--networking--api-là-gì)
- [2. Mô Hình Mạng — OSI & TCP/IP](#2-mô-hình-mạng--osi--tcpip)
- [3. Giao Thức Mạng Quan Trọng](#3-giao-thức-mạng-quan-trọng)
- [4. API Styles — REST vs GraphQL vs gRPC](#4-api-styles--rest-vs-graphql-vs-grpc)
- [5. API Design Best Practices](#5-api-design-best-practices)
- [6. Authentication & Authorization](#6-authentication--authorization)
- [7. Real-time Communication](#7-real-time-communication)
- [8. So Sánh Tổng Hợp — Khi nào dùng cái gì?](#8-so-sánh-tổng-hợp--khi-nào-dùng-cái-gì)
- [9. Tài Nguyên Tham Khảo](#9-tài-nguyên-tham-khảo)

---

## 1. Tổng Quan — Networking & API là gì?

### Networking là gì?

Networking trong phần mềm là việc **truyền dữ liệu giữa các máy tính** thông qua các giao thức chuẩn hóa. Mỗi request từ browser đến server đi qua hàng chục bước: DNS lookup → TCP handshake → TLS negotiation → HTTP request → routing → server processing → response → TCP teardown. Hiểu chuỗi này giúp debug hiệu quả hơn nhiều so với "request gửi đi, không thấy response".

**Tại sao networking quan trọng với developer?**
- Debug latency: request chậm do DNS? TCP? TLS? Network? Server processing?
- Design for failure: network không đáng tin — timeout, retry, circuit breaker là bắt buộc
- Security: HTTPS, CORS, CSP, CSRF token — mọi thứ đều dựa trên hiểu biết networking
- Performance: HTTP/2 multiplexing, HTTP/3 QUIC, connection pooling — tối ưu được cái gì?

### API là gì?

API (Application Programming Interface) là **hợp đồng giao tiếp** giữa các thành phần phần mềm. Nó định nghĩa **cái gì** client có thể yêu cầu và **cấu trúc response** sẽ như thế nào, không định nghĩa **làm thế nào** server thực hiện. API tốt = clear contract, predictable behavior, comprehensive error handling.

**API ≠ endpoint.** API là tập hợp các endpoints + rules + semantics. Một REST API có thể có 50 endpoints nhưng là 1 API vì chia sẻ cùng conventions, error format, auth mechanism.

---

## 2. Mô Hình Mạng — OSI & TCP/IP

### OSI Model (7 Layers) — Abstract reference model

```
┌─────────────────────────────────┐
│ 7. Application  (HTTP, FTP)     │ ← Lập trình viên thường ở đây
│   ─── User-facing protocols    │
├─────────────────────────────────┤
│ 6. Presentation (SSL/TLS, JPEG) │ ← Encryption, compression, formatting
│   ─── Data representation      │
├─────────────────────────────────┤
│ 5. Session      (NetBIOS)       │ ← Connection management
│   ─── Establish/maintain/session│
├─────────────────────────────────┤
│ 4. Transport    (TCP, UDP)      │ ← End-to-end reliability
│   ─── Segmentation, flow control│
├─────────────────────────────────┤
│ 3. Network      (IP, ICMP)      │ ← Routing, addressing
│   ─── Logical addressing (IP)  │
├─────────────────────────────────┤
│ 2. Data Link    (Ethernet, WiFi)│ ← Physical addressing
│   ─── MAC addresses, frames    │
├─────────────────────────────────┤
│ 1. Physical     (Cable, Radio)  │ ← Bits over medium
│   ─── Electrical, optical signals│
└─────────────────────────────────┘
```

### TCP/IP Model (4 Layers) — Practical model

```
┌──────────────────────────┐
│ Application (HTTP, DNS)  │ ← Protocol stacks (TLS + HTTP)
│ Transport   (TCP, UDP)   │ ← Segment creation, reliability
│ Internet    (IP)         │ ← Packet routing
│ Link        (Ethernet)   │ ← Frame transmission
└──────────────────────────┘
```

### TCP vs UDP — Two fundamental transport philosophies

| Tiêu chí | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |
|-----------|-------------------------------------|------------------------------|
| **Connection** | Connection-oriented (3-way handshake: SYN → SYN-ACK → ACK) | Connectionless (send and forget) |
| **Reliability** | Guaranteed delivery — retransmit lost packets | Best-effort — packets may be lost, duplicated, out-of-order |
| **Ordering** | Ordered — packets delivered in sequence | Unordered — no guarantee of sequence |
| **Flow control** | Yes — sliding window, congestion control | No — sender sends at its own pace |
| **Speed** | Chậm hơn (overhead: handshake, ACK, retransmit, congestion control) | Nhanh hơn (minimal overhead, 8-byte header vs 20-60 bytes) |
| **Header size** | 20-60 bytes | 8 bytes |
| **Use case** | Web (HTTP), email (SMTP), file transfer (FTP), database connections | Video streaming, online gaming, DNS queries, VoIP, IoT sensors |
| **Error handling** | Receiver sends ACK, sender retransmits on timeout | Sender has no feedback, application handles errors |

**Khi nào dùng UDP?**
- Real-time applications where latency matters more than reliability (video call, online game)
- Applications that implement their own reliability layer (QUIC on top of UDP for HTTP/3)
- Broadcast/multicast scenarios (DHCP, DNS, streaming)
- Simple request-response where losing one packet is acceptable (DNS lookup)

**Khi nào dùng TCP?**
- Everything else. HTTP, HTTPS, database queries, file transfers — TCP's reliability is worth the overhead.
- When data integrity is critical (banking, e-commerce, API calls)

---

## 3. Giao Thức Mạng Quan Trọng

### HTTP/HTTPS — The protocol of the web

HTTP (Hypertext Transfer Protocol) là giao thức application-layer cho web. Phiên bản hiện tại phổ biến: HTTP/1.1 (1999), HTTP/2 (2015), HTTP/3 (2020,基于 QUIC/UDP).

```
Client                          Server
  │                               │
  │──── GET /api/users HTTP/1.1 ─▶│
  │     Host: api.example.com     │
  │     Authorization: Bearer xxx │
  │     Accept: application/json  │
  │     Connection: keep-alive    │
  │                               │
  │◀─── HTTP/1.1 200 OK ─────────│
  │     Content-Type: application/json│
  │     Cache-Control: max-age=3600 │
  │     X-Request-Id: req_abc123   │
  │     {"users": [...]}           │
  │                               │
  │──── (same connection, next request) ──▶
```

**HTTP Methods — Semantic meaning (not just CRUD mapping):**

| Method | Mục đích | Idempotent? | Safe? | Semantics |
|--------|----------|-------------|-------|-----------|
| `GET` | Đọc resource, không side effects | ✅ | ✅ | Retrieve representation |
| `POST` | Tạo resource mới, có side effects | ❌ | ❌ | Submit payload for processing |
| `PUT` | Thay thế toàn bộ resource tại URI | ✅ | ❌ | Idempotent full replacement |
| `PATCH` | Cập nhật một phần resource | ❌ | ❌ | Partial update (not idempotent) |
| `DELETE` | Xóa resource tại URI | ✅ | ❌ | Remove resource |
| `HEAD` | Giống GET nhưng không có body | ✅ | ✅ | Get metadata only |
| `OPTIONS` | Truy vấn supported methods | ✅ | ✅ | CORS preflight, API discovery |
| `TRACE` | Diagnostic loopback | ✅ | ✅ | Debug (rarely used) |

**Idempotent** = many identical requests have same effect as one. PUT và DELETE idempotent (gọi 10 lần xóa = gọi 1 lần xóa). POST không idempotent (gọi 10 lần create = 10 records).

**Safe** = method không thay đổi server state. GET và HEAD safe. POST, PUT, PATCH, DELETE unsafe.

### HTTP Status Codes — Categories

| Range | Ý nghĩa | Ví dụ | Khi nào nhận được |
|-------|----------|-------|-------------------|
| `1xx` | Informational | 100 Continue, 101 Switching Protocols | Rare in practice |
| `2xx` | Success | 200 OK, 201 Created, 204 No Content | Request thành công |
| `3xx` | Redirection | 301 Moved Permanently, 304 Not Modified | Resource moved/unchanged |
| `4xx` | Client Error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests | Client gửi request sai |
| `5xx` | Server Error | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable | Server gặp lỗi |

**Client vs Server error phân biệt quan trọng:**
- 4xx → Client cần sửa request (validation error, missing auth, resource not found)
- 5xx → Server có bug hoặc quá tải (không phải lỗi client, client nên retry với backoff)

### HTTP/2 vs HTTP/3 — Evolution

| Feature | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---------|----------|--------|--------|
| **Multiplexing** | ❌ One request at a time per connection | ✅ Multiple requests over single connection | ✅ Better multiplexing |
| **Header compression** | ❌ Send full headers every time | ✅ HPACK — compress headers | ✅ QPACK — better for streaming |
| **Transport** | TCP | TCP | QUIC (over UDP) |
| **Server Push** | ❌ | ✅ (deprecated in favor of client prefetch) | ✅ |
| **Head-of-line blocking** | Có (TCP level) | Có (TCP level) | Không (QUIC handles per-stream) |
| **Connection setup** | 3-way TCP + 2-way TLS = ~3 RTTs | 3-way TCP + 2-way TLS = ~3 RTTs | 0-RTT possible (connection resumption) |
| **Migration** | Hard (TCP connection breaks on IP change) | Same as HTTP/1.1 | Easy (QUIC is connection-less) |

**Head-of-line blocking explained:** Trong HTTP/2 trên TCP, nếu 1 packet lost, TẤT CẢ streams bị block直到 packet được retransmit. HTTP/3 chuyển sang UDP (QUIC) giải quyết bằng per-stream retransmission — packet loss ảnh hưởng chỉ 1 stream, không phải tất cả.

### DNS (Domain Name System) — Từ hostname đến IP

```
Browser typed: https://api.example.com/users
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Browser cache check (hosts file, DNS cache)            │
│  2. OS DNS resolver (recursive resolver)                    │
│  3. Root DNS server (.com TLD server)                       │
│  4. TLD DNS server (.com authoritative)                     │
│  5. Authoritative DNS server (example.com nameserver)       │
│  6. Returns IP: 93.184.216.34                              │
│  7. Browser caches result (TTL-based)                       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  DNS Record Types                                          │
├────────┬───────────────────────────────────────────────────┤
│  A     │ Domain → IPv4 address                             │
│  AAAA  │ Domain → IPv6 address                             │
│  CNAME │ Alias → Another domain                            │
│  MX    │ Mail exchange server                              │
│  TXT   │ Text records (SPF, DKIM, verification)            │
│  NS    │ Nameserver delegation                             │
│  SRV   │ Service location (port, priority)                 │
│  PTR   │ Reverse DNS (IP → domain)                         │
└────────┴───────────────────────────────────────────────────┘
```

**DNS TTL (Time To Live):** mỗi record có TTL (ví dụ 300 = 5 phút). Browser/resolver cache result until TTL expires. Low TTL = faster propagation khi đổi DNS, nhưng more queries → slower resolution. High TTL = faster resolution, nhưng slower propagation.

---

## 4. API Styles — REST vs GraphQL vs gRPC

### REST (Representational State Transfer) — Resource-based architecture

REST là **philosophy** (not protocol) về thiết kế networked applications, đưa ra bởi Roy Fielding năm 2000. Sáu constraints định nghĩa RESTful API:

1. **Client-Server separation** — UI/logic và data storage tách biệt
2. **Statelessness** — mỗi request self-contained, server không lưu client state
3. **Cacheability** — response phải tự mô tả cacheable hay không
4. **Uniform interface** — resource identification, manipulation through representations, self-descriptive messages, HATEOAS
5. **Layered system** — client không biết trực tiếp hay không trực tiếp connect đến server
6. **Code on demand** (optional) — server có thể truyền executable code (JavaScript)

```
# Resource-based URLs — nouns not verbs
GET    /api/v1/users          # List users (collection)
GET    /api/v1/users/123      # Get user 123 (resource)
POST   /api/v1/users          # Create user (create new resource)
PUT    /api/v1/users/123      # Replace user 123 entirely
PATCH  /api/v1/users/123      # Partial update user 123
DELETE /api/v1/users/123      # Delete user 123

# Nested resources — relationship expressed in URL hierarchy
GET    /api/v1/users/123/orders         # User's orders
GET    /api/v1/users/123/orders/456     # Specific order
POST   /api/v1/users/123/orders         # Create order for user

# Filtering via query params — NOT URL path
GET    /api/v1/users?status=active&page=1&limit=20&sort=-createdAt
GET    /api/v1/orders?date[gte]=2024-01-01&status=in_progress

# Sub-resources (actions)
POST   /api/v1/users/123/reset-password  # Action on resource
```

**REST Maturity Model (Richardson):**
- Level 0: POX (The Swamp) — single endpoint `/api`, everything via POST
- Level 1: Resources — multiple URIs but only POST used
- Level 2: HTTP Verbs — proper GET/POST/PUT/DELETE + status codes
- Level 3: HATEOAS — hypermedia links in responses guide navigation

Most "REST APIs" are Level 2. Level 3 (true HATEOAS) is rare in practice because it increases client complexity significantly.

### GraphQL — Single endpoint, precise queries

GraphQL là **query language** (not REST alternative per se) đưa ra bởi Facebook 2012, open-sourced 2015. Ý tưởng cốt lõi: **client declares what data it needs, server returns exactly that**.

```graphql
# Query — read data (equivalent to GET)
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts(first: 5, orderBy: createdAt_DESC) {
      id
      title
      createdAt
      author {
        name
      }
      comments(first: 3) {
        id
        text
      }
    }
  }
}

# Mutation — write data (equivalent to POST/PUT/PATCH/DELETE)
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
    createdAt
  }
}

mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
  updateOrder(id: $id, status: $status) {
    id
    status
    updatedAt
  }
}

# Subscription — real-time events (equivalent to WebSocket)
subscription OnOrderCreated($userId: ID!) {
  orderCreated(userId: $userId) {
    id
    total
    status
  }
}
```

| Ưu điểm | Nhược điểm |
|----------|------------|
| Exactly one endpoint (`/graphql`) — no URL sprawl | Steeper learning curve (schema, resolvers, directives) |
| No over-fetching — client selects fields | No HTTP cache (must implement manual caching) |
| No under-fetching — one query gets nested data | N+1 query problem (resolver-level,需 DataLoader) |
| Strongly typed schema — self-documenting | File upload awkward (multipart on GraphQL complex) |
| Real-time with Subscription | Complex pagination (cursor-based, not offset) |
| Evolution without versioning — add fields, don't break | Query complexity/depth limits needed (DoS prevention) |

### gRPC — High-performance RPC over HTTP/2

gRPC (Google Remote Procedure Call) là framework RPC sử dụng Protocol Buffers cho serialization và HTTP/2 cho transport. Designed cho **internal microservices communication** where performance matters.

```protobuf
// protocolbuffers definition
syntax = "proto3";

package user;

service UserService {
  // Unary RPC — request/response
  rpc GetUser(GetUserRequest) returns (User);
  // Server streaming — 1 request, many responses
  rpc ListUsers(ListUsersRequest) returns (stream User);
  // Client streaming — many requests, 1 response
  rpc BulkCreateUsers(stream CreateUserRequest) returns (BulkCreateResponse);
  // Bidirectional streaming
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  UserStatus status = 4;
  google.protobuf.Timestamp created_at = 5;
}

enum UserStatus {
  UNKNOWN = 0;
  ACTIVE = 1;
  SUSPENDED = 2;
}

message GetUserRequest {
  string id = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
  UserStatus status = 3;
}
```

| Ưu điểm | Nhược điểm |
|----------|------------|
| Very fast (binary protobuf, HTTP/2 multiplexing) | Not human-readable (binary wire format) |
| Strongly typed — compile-time safety | Browser support requires gRPC-Web (extra layer) |
| Bi-directional streaming native | Debugging harder (binary vs JSON) |
| Auto code generation (many languages) | Less flexible schema evolution |
| Built-in service discovery (with Envoy/Linkerd) | Tooling ecosystem smaller than REST |

### So Sánh Tổng Hợp

| Tiêu chí | REST | GraphQL | gRPC |
|-----------|------|---------|------|
| **Format** | JSON/XML | JSON | Protocol Buffers (binary) |
| **Transport** | HTTP/1.1 or HTTP/2 | HTTP/1.1 or HTTP/2 | HTTP/2 mandatory |
| **Schema** | Optional (OpenAPI/Swagger) | Required (SDL) | Required (.proto file) |
| **Endpoints** | Nhiều (one per resource) | 1 (`/graphql`) | Nhiều (one per service method) |
| **Performance** | Good | Good | Excellent (binary, HTTP/2) |
| **Caching** | Native HTTP cache | Manual (Apollo, UrQL) | None (binary, not cacheable) |
| **Learning curve** | Thấp | Trung bình | Cao |
| **Best for** | Public APIs, mobile/web clients | Flexible frontend requirements | Internal microservices, mobile SDKs |
| **Tooling** | Swagger/OpenAPI, Postman | Apollo Studio, GraphiQL | Buf, grpcurl, protoc |

> 📌 **Decision rule:** REST cho public APIs (broad compatibility). GraphQL cho complex frontend (mobile + web need different data shapes). gRPC cho internal microservices (performance + type safety). Bạn có thể dùng CẢ 3 — REST/public, gRPC/internal, GraphQL/mobile-specific.

---

## 5. API Design Best Practices

### URL Convention — Nouns not verbs

```
✅ GOOD — plural nouns, kebab-case, version prefix
GET    /api/v1/users
GET    /api/v1/users/123
GET    /api/v1/users/123/orders
POST   /api/v1/orders
GET    /api/v1/orders?status=pending&limit=20

❌ BAD — verbs in URL, camelCase, no versioning
GET    /api/v1/getUsers
GET    /api/v1/user/123
GET    /api/v1/Get_User_Order
GET    /api/users (no version!)
```

### Pagination — Offset vs Cursor

```json
// Offset-based (simple, bad for deep pages)
GET /api/users?page=2&limit=20

{
  "data": [{"id": "21", "name": "..."}],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Cursor-based (stable, good for infinite scroll)
GET /api/users?cursor=eyJpZCI6MTAwfQ&limit=20

{
  "data": [{"id": "101", "name": "..."}],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIwfQ",
    "hasMore": true
  }
}
```

**Cursor pagination tại sao tốt hơn:** offset-based bị chậm khi page lớn (database phải scan và skip N rows). Cursor-based `WHERE id > last_seen_id LIMIT 20` luôn O(log n) stable — không phụ thuộc total row count.

### Error Response Format — Consistency is key

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      },
      {
        "field": "age",
        "message": "Must be between 0 and 150"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Error code strategy:**
- Client errors (4xx): `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`
- Server errors (5xx): `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `UPSTREAM_TIMEOUT`
- Business errors: `INSUFFICIENT_FUNDS`, `ORDER_ALREADY_SHIPPED`, `USER_SUSPENDED`

### Versioning Strategies

| Strategy | Ví dụ | Ưu/Nhược |
|----------|-------|----------|
| **URL Path** | `/api/v1/users` | Rõ ràng nhất, phổ biến nhất, SEO-friendly |
| **Query Param** | `/api/users?version=1` | Flexible nhưng dễ quên, không explicit |
| **Header** | `Accept: application/vnd.api.v1+json` | Clean URL nhưng ẩn, hard to discover |
| **Content Negotiation** | `Accept: application/json;version=1` | Chuẩn HTTP nhưng phức tạp implement |

> 💡 **Practice:** URL path versioning (`/api/v1/`) là lựa chọn an toàn nhất. Bắt đầu từ v1 ngay từ đầu — đừng defer versioning. Khi breaking change xảy ra, tạo v2 chứ không sửa v1.

### CORS (Cross-Origin Resource Sharing) — Security policy

```typescript
// Express CORS configuration
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allow cookies + Authorization header
  maxAge: 86400,     // Preflight cache 24h
}));

// Why CORS matters:
// Browser enforces Same-Origin Policy by default.
// CORS headers tell browser "this origin is allowed to make cross-origin requests".
// Without proper CORS config, frontend on port 3000 cannot call API on port 4000.
```

---

## 6. Authentication & Authorization

### Authentication Methods — Xác thực ai là ai

```
┌──────────────────────────────────────────────────┐
│           Authentication Methods                  │
├──────────┬──────────┬──────────┬─────────────────┤
│ API Key  │  OAuth2  │   JWT    │  Basic Auth     │
│          │          │          │                 │
│ Simple   │ Delegated│ Stateless│  Username/Pass  │
│ Header/  │ Access   │ Token    │  Base64 encoded │
│ Query    │ Flow     │ Based    │  (deprecated)   │
└──────────┴──────────┴──────────┴─────────────────┘
```

### JWT (JSON Web Token) — Structure & Flow

```
┌─────────────────────────────────────────────────────────────┐
│  JWT Structure: Header.Payload.Signature                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Header:  {"alg": "HS256", "typ": "JWT"}                   │
│           Base64Url encoded                                 │
│                                                             │
│  Payload: {"sub": "123", "name": "Son", "role": "admin",   │
│            "iat": 1704067200, "exp": 1704153600}           │
│           Base64Url encoded                                 │
│           ⚠️ NEVER store sensitive data (password, PII)     │
│                                                             │
│  Signature: HMACSHA256(                                    │
│    base64Url(header) + "." + base64Url(payload),            │
│    SECRET_KEY                                              │
│  )                                                         │
│           Server-side verify using same secret              │
│                                                             │
│  Full token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzd…  │
└─────────────────────────────────────────────────────────────┘
```

```typescript
// JWT generation (server-side)
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { sub: user.id, role: user.role },   // payload
  process.env.JWT_SECRET!,              // secret
  { expiresIn: '7d' }                  // options
);

// JWT verification (middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
// decoded: { sub: '123', role: 'admin', iat: 1704067200, exp: 1704153600 }
```

**JWT best practices:**
- Short expiry (15min–7d), use refresh tokens for long sessions
- Never store sensitive data in payload (it's base64-encoded, not encrypted)
- Use RS256 (asymmetric) for distributed systems, HS256 (symmetric) for single-server
- Verify signature on EVERY request — never trust client-provided tokens
- Implement token blacklist/revoke for logout (or use short expiry + refresh rotation)

### OAuth 2.0 — Delegated authorization

```
User ──▶ Client App (frontend/mobile) ──▶ Authorization Server (Auth0, Firebase)
                                  │
                                  │ ◀── Auth Code (redirect back)
                                  │
                          Client App ──▶ Token Endpoint ──▶ Access Token + Refresh Token
                                                          │
                                                  Client App ──▶ Resource Server (API)
                                                  (with Access Token in Authorization header)
```

| Grant Type | Use Case | Security |
|------------|----------|----------|
| **Authorization Code** | Web apps (server-side) | Highest — code exchanged for tokens server-to-server |
| **Authorization Code + PKCE** | Mobile/SPA apps | High — Proof Key for Code Exchange prevents auth code interception |
| **Client Credentials** | Machine-to-machine (service accounts) | Medium — no user involved, just app identity |
| **Device Code** | Smart TV, IoT, CLI tools | Medium — user completes auth on another device |

**PKCE flow (Mobile/SPA):**
1. Client generates code_verifier (random string)
2. Client computes code_challenge = base64url(SHA256(code_verifier))
3. Auth request includes code_challenge
4. Auth server returns auth code
5. Token request includes code_verifier
6. Server verifies code_verifier matches code_challenge
7. Server returns access token + refresh token

> 📌 **Misconception:** OAuth 2.0 là "authentication" — sự thật OAuth 2.0 là **authorization** framework. Nó cho phép app access resources on behalf of user, không xác thực user identity. Dùng OpenID Connect (OIDC) overlay cho authentication.

---

## 7. Real-time Communication

### WebSocket — Full-duplex persistent connection

```
WebSocket Handshake:
Client                    Server
  │                         │
  │── GET /ws/chat HTTP/1.1─▶│
  │   Host: example.com     │
  │   Upgrade: websocket    │
  │   Connection: Upgrade   │
  │   Sec-WebSocket-Key: x3JJ...  │
  │   Sec-WebSocket-Version: 13   │
  │                         │
  │◀── 101 Switching Protocols──│
  │   Upgrade: websocket    │
  │   Connection: Upgrade   │
  │   Sec-WebSocket-Accept: HSm...  │
  │                         │
  │◀═════ Full Duplex ═════▶│  ← Both sides can send anytime
  │◀═════ Persistent ══════▶│     No more request/response cycle
  │                         │
  │── [close frame] ───────▶│
  │◀── [close frame] ───────│
```

**WebSocket vs HTTP polling comparison:**
- HTTP polling: client asks "any new messages?" every N seconds → high latency, wasted bandwidth
- WebSocket: server pushes immediately → low latency, efficient bandwidth
- SSE (Server-Sent Events): one direction (server→client) over HTTP → simpler, auto-reconnect built-in

### SSE (Server-Sent Events) — One-way push

```typescript
// Server — stream events to client
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const interval = setInterval(() => {
    const data = JSON.stringify({ time: new Date().toISOString(), value: Math.random() });
    res.write(`event: update\ndata: ${data}\n\n`);  // SSE format: event type + data
  }, 1000);

  req.on('close', () => clearInterval(interval));  // Clean up on disconnect
});

// Client — EventSource API
const es = new EventSource('/stream');
es.addEventListener('update', (e) => {
  console.log(JSON.parse(e.data));
});
es.onerror = () => console.error('SSE connection error');
// Auto-reconnects on disconnect (unlike WebSocket)
```

### So Sánh Real-time Patterns

| Tiêu chí | WebSocket | SSE | Long Polling | Short Polling |
|-----------|-----------|-----|--------------|---------------|
| **Direction** | Bi-directional | Server→Client only | Server→Client | Both (but request-driven) |
| **Protocol** | WS/WSS (separate from HTTP) | HTTP (text/event-stream) | HTTP | HTTP |
| **Connection** | Persistent single connection | Persistent single connection | Semi-persistent (new conn per request) | New connection each time |
| **Overhead** | Thấp (handshake once) | Thấp (HTTP headers) | Trung bình (new TCP+TLS each poll) | Cao (full request each poll) |
| **Browser support** | Tốt (95%+) | Tốt (95%+) | Mọi nơi | Mọi nơi |
| **Auto-reconnect** | Manual (write reconnect logic) | Browser built-in | Manual | Manual |
| **Binary data** | ✅ | ❌ (text only) | ✅ (as request body) | ✅ |
| **Best for** | Chat, gaming, collaborative editing | Notifications, live scores, stock feeds | Legacy browser support | Simple status checks |

> 💡 **Khi nào dùng gì?**
> - WebSocket: cần bidirectional communication (chat, collaborative doc, gaming)
> - SSE: chỉ cần server→client push (notifications, live updates, stock prices)
> - Long polling: fallback khi WebSocket không available (very old browsers, restricted networks)
> - Short polling: simplest approach, acceptable khi updates infrequent (status dashboard)

---

## 8. So Sánh Tổng Hợp — Khi nào dùng cái gì?

### Decision tree — Chọn API style

```
                     ┌─────────────────────────┐
                     │   Chọn API Style        │
                     └────────┬────────────────┘
                              │
                     ┌────────▼────────────┐
               ┌────▶│ Public API cho      │────▶ REST
               │     │ nhiều đối tượng?    │
               │     └────────┬────────────┘
               │              │ Không
         ┌─────▼─────┐   ┌───▼────────────┐
         │ Mobile/   │   │ Frontend cần   │────▶ GraphQL
         │ Complex   │   │ flexible       │
         │ UI needs? │   │ queries?       │
         └─────┬─────┘   └───┬────────────┘
               │             │ Không
         ┌─────▼─────┐   ┌───▼────────────┐
         │ Internal  │   │ Microservices  │────▶ gRPC
         │ service   │   │ cần high perf? │
         │ comm?     │   └───┬────────────┘
         └─────┬─────┘       │ Không
               │      ┌─────▼─────┐
               └─────▶│ Real-time │────▶ WebSocket/SSE
                      │ updates? │
                      └──────────┘
```

### Networking Checklist — Production-ready

```
✅ Sử dụng HTTPS cho MỌI production API (không phải option)
✅ Implement proper authentication (OAuth2/JWT with short expiry)
✅ Rate limiting để bảo vệ server khỏi abuse/DDoS
✅ API versioning từ ngày đầu (URL path /api/v1/...)
✅ Consistent error format across所有 endpoints
✅ Pagination cho list endpoints (cursor preferred for large datasets)
✅ CORS configuration đúng (restricted origins, not wildcard *)
✅ Request/Response logging với requestId correlation
✅ API documentation (OpenAPI/Swagger cho REST, Apollo Studio cho GraphQL)
✅ Health check endpoints (/healthz, /readyz)
✅ Timeout và retry strategies (exponential backoff + jitter)
✅ Circuit breaker pattern cho external service calls
✅ Structured logging (JSON format) cho easier log aggregation
✅ Metrics: request count, latency p50/p95/p99, error rate, active connections
```

---

## 9. Tài Nguyên Tham Khảo

### 📚 Sách

| Sách | Tác giả | Tại sao đọc |
|------|---------|-------------|
| *RESTful Web APIs* | Leonard Richardson, Mike Amundsen | Richardson maturity model, HATEOAS deep dive |
| *Designing Data-Intensive Applications* | Martin Kleppmann | Network consistency, replication, CAP theorem |
| *HTTP: The Definitive Guide* | David Gourley et al. | Complete HTTP protocol reference |
| *Web Scalability for Startup Engineers* | Artur Ejsmont | Practical scaling patterns |
| *Building Microservices* | Sam Newman | API gateway, service communication patterns |

### 🔗 Online Resources

- [MDN Web Docs - HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) — Complete HTTP reference
- [REST API Tutorial](https://restfulapi.net/) — REST best practices
- [GraphQL Official](https://graphql.org/learn/) — Language spec and guides
- [gRPC Official](https://grpc.io/docs/) — Documentation and tutorials
- [OAuth 2.0 Simplified](https://www.oauth.com/) — Practical OAuth guide
- [CORS W3C Spec](https://fetch.spec.whatwg.org/#http-cors-protocol) — CORS specification

### 📺 Video

- [Hussein Nasser - Networking](https://www.youtube.com/c/HusseinNasser-software-engineering) — Network deep dives
- [ByteByteGo - System Design](https://www.youtube.com/c/ByteByteGo) — API design patterns
- [TechWorld with Nana - HTTP/2 & HTTP/3](https://www.youtube.com/watch?v=aMDFyChVIro) — Protocol evolution

---

> 💡 **Tip:** Hiểu networking và API design là kỹ năng **bắt buộc** cho mọi lập trình viên hiện đại. API là **cầu nối** giữa mọi hệ thống — thiết kế tốt sẽ giúp hệ thống **dễ sử dụng, dễ mở rộng, và an toàn**.
>
> Đừng chọn công nghệ vì "trendy" — chọn vì nó giải quyết đúng bài toán. REST cho public API, GraphQL cho complex UI, gRPC cho internal services, WebSocket cho real-time. Có thể dùng **tất cả cùng lúc** trong cùng hệ thống.
