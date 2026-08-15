# 🌐 Lớp 11: Networking & APIs (Mạng & Giao Tiếp)

> **Networking** là nền tảng giúp các hệ thống **giao tiếp với nhau** qua mạng,
> còn **API** là **hợp đồng giao tiếp** giữa các thành phần phần mềm.

---

## 📑 Mục Lục

- [1. Tổng Quan](#1-tổng-quan)
- [2. Mô Hình Mạng](#2-mô-hình-mạng)
- [3. Giao Thức Mạng Quan Trọng](#3-giao-thức-mạng-quan-trọng)
- [4. API Styles](#4-api-styles)
- [5. API Design Best Practices](#5-api-design-best-practices)
- [6. Authentication & Authorization](#6-authentication--authorization)
- [7. Real-time Communication](#7-real-time-communication)
- [8. So Sánh Tổng Hợp](#8-so-sánh-tổng-hợp)
- [9. Tài Nguyên Tham Khảo](#9-tài-nguyên-tham-khảo)

---

## 1. Tổng Quan

### Networking là gì?

Networking trong phần mềm là việc **truyền dữ liệu giữa các máy tính** thông qua các giao thức chuẩn hóa. Mọi ứng dụng hiện đại đều phụ thuộc vào networking.

### API là gì?

API (Application Programming Interface) là **giao diện giao tiếp** cho phép các phần mềm tương tác với nhau mà không cần biết chi tiết implementation bên trong.

### Tại sao quan trọng?

| Vai trò | Ý nghĩa |
|---------|----------|
| **Kết nối** | Cho phép microservices, frontend-backend giao tiếp |
| **Tích hợp** | Kết nối với dịch vụ third-party (payment, email, map...) |
| **Mở rộng** | Cho phép scale hệ thống qua network |
| **Bảo mật** | Kiểm soát ai được truy cập gì qua API |

---

## 2. Mô Hình Mạng

### OSI Model (7 Layers)

```
┌─────────────────────────────────┐
│ 7. Application  (HTTP, FTP)     │ ← Lập trình viên thường ở đây
│ 6. Presentation (SSL/TLS, JPEG) │
│ 5. Session      (NetBIOS)       │
│ 4. Transport    (TCP, UDP)      │ ← Quan trọng cho networking
│ 3. Network      (IP, ICMP)      │
│ 2. Data Link    (Ethernet, WiFi)│
│ 1. Physical     (Cable, Radio)  │
└─────────────────────────────────┘
```

### TCP/IP Model (4 Layers)

```
┌──────────────────────────┐
│ Application (HTTP, DNS)  │
│ Transport   (TCP, UDP)   │
│ Internet    (IP)         │
│ Link        (Ethernet)   │
└──────────────────────────┘
```

### TCP vs UDP

| Tiêu chí | TCP | UDP |
|-----------|-----|-----|
| **Connection** | Connection-oriented | Connectionless |
| **Reliability** | Guaranteed delivery | Best-effort |
| **Ordering** | Ordered | Unordered |
| **Speed** | Chậm hơn | Nhanh hơn |
| **Use case** | Web, email, file transfer | Video streaming, gaming, DNS |
| **Header size** | 20-60 bytes | 8 bytes |

---

## 3. Giao Thức Mạng Quan Trọng

### HTTP/HTTPS

```
Client                          Server
  │                               │
  │──── GET /api/users ──────────▶│
  │     Host: api.example.com     │
  │     Authorization: Bearer xxx │
  │                               │
  │◀─── 200 OK ──────────────────│
  │     Content-Type: app/json    │
  │     {"users": [...]}          │
```

**HTTP Methods:**

| Method | Mục đích | Idempotent | Safe |
|--------|----------|------------|------|
| `GET` | Đọc resource | ✅ | ✅ |
| `POST` | Tạo resource | ❌ | ❌ |
| `PUT` | Thay thế toàn bộ resource | ✅ | ❌ |
| `PATCH` | Cập nhật một phần | ❌ | ❌ |
| `DELETE` | Xóa resource | ✅ | ❌ |

**HTTP Status Codes:**

| Range | Ý nghĩa | Ví dụ |
|-------|----------|-------|
| `1xx` | Informational | 101 Switching Protocols |
| `2xx` | Success | 200 OK, 201 Created, 204 No Content |
| `3xx` | Redirection | 301 Moved, 304 Not Modified |
| `4xx` | Client Error | 400 Bad Request, 401, 403, 404, 429 |
| `5xx` | Server Error | 500 Internal, 502 Bad Gateway, 503 |

### HTTP/2 vs HTTP/3

| Feature | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---------|----------|--------|--------|
| **Multiplexing** | ❌ | ✅ | ✅ |
| **Header compression** | ❌ | HPACK | QPACK |
| **Transport** | TCP | TCP | QUIC (UDP) |
| **Server Push** | ❌ | ✅ | ✅ |
| **Head-of-line blocking** | Có | Có (TCP level) | Không |

### DNS (Domain Name System)

```
Browser → DNS Resolver → Root Server → TLD Server → Authoritative Server
                                                          │
                                                     IP Address
                                                          │
Browser ◀─────────────────────────────────────────────────┘
```

**Loại DNS Record:**

| Record | Mục đích | Ví dụ |
|--------|----------|-------|
| `A` | Domain → IPv4 | example.com → 93.184.216.34 |
| `AAAA` | Domain → IPv6 | example.com → 2606:2800:... |
| `CNAME` | Alias | www.example.com → example.com |
| `MX` | Mail server | example.com → mail.example.com |
| `TXT` | Text data | SPF, DKIM records |
| `NS` | Name server | example.com → ns1.example.com |

---

## 4. API Styles

### REST (Representational State Transfer)

```
# Resource-based URLs
GET    /api/v1/users          # List users
GET    /api/v1/users/123      # Get user 123
POST   /api/v1/users          # Create user
PUT    /api/v1/users/123      # Update user 123
DELETE /api/v1/users/123      # Delete user 123

# Nested resources
GET    /api/v1/users/123/orders         # User's orders
GET    /api/v1/users/123/orders/456     # Specific order
```

**REST Maturity Model (Richardson):**

| Level | Tên | Mô tả |
|-------|-----|--------|
| 0 | The Swamp of POX | Một endpoint, dùng POST cho mọi thứ |
| 1 | Resources | Nhiều URI, nhưng chỉ dùng POST |
| 2 | HTTP Verbs | Dùng đúng GET/POST/PUT/DELETE + status codes |
| 3 | HATEOAS | Hypermedia links trong response |

### GraphQL

```graphql
# Query - Chỉ lấy đúng data cần
query {
  user(id: "123") {
    name
    email
    orders(last: 5) {
      id
      total
      items {
        name
        price
      }
    }
  }
}

# Mutation
mutation {
  createUser(input: { name: "Son", email: "son@example.com" }) {
    id
    name
  }
}

# Subscription (real-time)
subscription {
  orderCreated(userId: "123") {
    id
    total
  }
}
```

| Ưu điểm | Nhược điểm |
|----------|------------|
| Lấy đúng data cần (no over-fetching) | Phức tạp hơn REST |
| Một endpoint duy nhất | Caching khó hơn |
| Strongly typed schema | N+1 query problem |
| Real-time với Subscription | File upload phức tạp |

### gRPC (Google Remote Procedure Call)

```protobuf
// Protocol Buffers definition
syntax = "proto3";

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (stream User);
  rpc CreateUser(CreateUserRequest) returns (User);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}

message GetUserRequest {
  string id = 1;
}
```

| Ưu điểm | Nhược điểm |
|----------|------------|
| Rất nhanh (binary serialization) | Không human-readable |
| Strongly typed | Browser support hạn chế |
| Bi-directional streaming | Debugging khó hơn |
| Code generation tự động | Tooling ít hơn REST |

### So Sánh API Styles

| Tiêu chí | REST | GraphQL | gRPC |
|-----------|------|---------|------|
| **Format** | JSON/XML | JSON | Protocol Buffers |
| **Transport** | HTTP | HTTP | HTTP/2 |
| **Schema** | Optional (OpenAPI) | Required (SDL) | Required (Proto) |
| **Performance** | Tốt | Tốt | Xuất sắc |
| **Learning curve** | Thấp | Trung bình | Cao |
| **Best for** | Public APIs | Flexible queries | Microservices |

---

## 5. API Design Best Practices

### URL Convention

```
✅ Tốt:
GET  /api/v1/users
GET  /api/v1/users/123/orders
GET  /api/v1/users?status=active&page=1&limit=20

❌ Tránh:
GET  /api/v1/getUsers
GET  /api/v1/user_orders/123
GET  /api/v1/users/get-active
```

### Pagination

```json
// Offset-based
GET /api/users?page=2&limit=20

{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Cursor-based (tốt hơn cho large datasets)
GET /api/users?cursor=eyJpZCI6MTAwfQ&limit=20

{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIwfQ",
    "hasMore": true
  }
}
```

### Error Response Format

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

### Versioning Strategies

| Strategy | Ví dụ | Ưu/Nhược |
|----------|-------|----------|
| **URL Path** | `/api/v1/users` | Rõ ràng nhất, phổ biến nhất |
| **Query Param** | `/api/users?version=1` | Flexible nhưng dễ quên |
| **Header** | `Accept: application/vnd.api.v1+json` | Clean URL nhưng ẩn |
| **Content Negotiation** | `Accept: application/json;version=1` | Chuẩn HTTP nhưng phức tạp |

### Rate Limiting

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1609459200
Retry-After: 60
```

---

## 6. Authentication & Authorization

### Các Phương Thức Xác Thực

```
┌──────────────────────────────────────────────────┐
│              Authentication Methods               │
├──────────┬──────────┬──────────┬────────────────┤
│ API Key  │  OAuth2  │   JWT    │  Basic Auth     │
│          │          │          │                 │
│ Simple   │ Delegated│ Stateless│  Username/Pass  │
│ Header/  │ Access   │ Token    │  Base64 encoded │
│ Query    │ Flow     │ Based    │                 │
└──────────┴──────────┴──────────┴────────────────┘
```

### JWT (JSON Web Token)

```
Header.Payload.Signature

Header:  {"alg": "HS256", "typ": "JWT"}
Payload: {"sub": "123", "name": "Son", "exp": 1609459200}
Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

### OAuth 2.0 Flow

```
User ──▶ Client App ──▶ Authorization Server
                              │
                         ◀── Auth Code
                              │
Client App ──▶ Token Endpoint ──▶ Access Token + Refresh Token
                                        │
Client App ──▶ Resource Server ─────────┘
              (with Access Token)
```

| Grant Type | Use Case |
|------------|----------|
| **Authorization Code** | Web apps (server-side) |
| **Authorization Code + PKCE** | Mobile/SPA apps |
| **Client Credentials** | Machine-to-machine |
| **Device Code** | Smart TV, IoT |

---

## 7. Real-time Communication

### WebSocket

```
Client                    Server
  │                         │
  │── HTTP Upgrade ────────▶│
  │◀─ 101 Switching ───────│
  │                         │
  │◀═══ Full Duplex ══════▶│  ← Bi-directional
  │◀═══ Connection ═══════▶│
  │                         │
  │── Close Frame ─────────▶│
  │◀─ Close Frame ──────────│
```

### Server-Sent Events (SSE)

```
Client                    Server
  │                         │
  │── GET /events ─────────▶│
  │◀─ text/event-stream ───│
  │                         │
  │◀── data: event 1 ──────│  ← Server → Client only
  │◀── data: event 2 ──────│
  │◀── data: event 3 ──────│
```

### So Sánh Real-time Patterns

| Tiêu chí | WebSocket | SSE | Long Polling | Short Polling |
|-----------|-----------|-----|--------------|---------------|
| **Direction** | Bi-directional | Server→Client | Server→Client | Client→Server |
| **Protocol** | WS/WSS | HTTP | HTTP | HTTP |
| **Connection** | Persistent | Persistent | Semi-persistent | New each time |
| **Overhead** | Thấp | Thấp | Trung bình | Cao |
| **Browser support** | Tốt | Tốt | Mọi nơi | Mọi nơi |
| **Best for** | Chat, gaming | Notifications, feeds | Compatibility | Simple updates |

---

## 8. So Sánh Tổng Hợp

### Khi nào dùng gì?

```
                    ┌─────────────────────────┐
                    │    Chọn API Style        │
                    └────────┬────────────────┘
                             │
                    ┌────────▼────────────┐
                    │ Public API cho       │──▶ REST
                    │ nhiều đối tượng?     │
                    └────────┬────────────┘
                             │ Không
                    ┌────────▼────────────┐
                    │ Frontend cần        │──▶ GraphQL
                    │ flexible queries?   │
                    └────────┬────────────┘
                             │ Không
                    ┌────────▼────────────┐
                    │ Microservices cần   │──▶ gRPC
                    │ high performance?   │
                    └────────┬────────────┘
                             │ Không
                    ┌────────▼────────────┐
                    │ Real-time updates?  │──▶ WebSocket/SSE
                    └─────────────────────┘
```

### Networking Checklist

```
✅ Sử dụng HTTPS cho mọi production API
✅ Implement proper authentication (OAuth2/JWT)
✅ Rate limiting để bảo vệ server
✅ API versioning từ đầu
✅ Consistent error format
✅ Pagination cho list endpoints
✅ CORS configuration đúng
✅ Request/Response logging
✅ API documentation (OpenAPI/Swagger)
✅ Health check endpoints
✅ Timeout và retry strategies
✅ Circuit breaker pattern
```

---

## 9. Tài Nguyên Tham Khảo

### 📚 Sách

| Sách | Tác giả |
|------|---------|
| *RESTful Web APIs* | Leonard Richardson |
| *Designing Data-Intensive Applications* | Martin Kleppmann |
| *HTTP: The Definitive Guide* | David Gourley |
| *Web Scalability for Startup Engineers* | Artur Ejsmont |

### 🔗 Online Resources

- [MDN Web Docs - HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [REST API Tutorial](https://restfulapi.net/)
- [GraphQL Official](https://graphql.org/learn/)
- [gRPC Official](https://grpc.io/docs/)
- [OAuth 2.0 Simplified](https://www.oauth.com/)

### 📺 Video

- [Hussein Nasser - Networking](https://www.youtube.com/c/HusseinNasser-software-engineering)
- [ByteByteGo - System Design](https://www.youtube.com/c/ByteByteGo)

---

> 💡 **Tip**: Hiểu networking và API design là kỹ năng **bắt buộc** cho mọi lập trình viên hiện đại. API là **cầu nối** giữa mọi hệ thống — thiết kế tốt sẽ giúp hệ thống **dễ sử dụng, dễ mở rộng, và an toàn**.