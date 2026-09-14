# 🔩 5.10.3 gRPC (Thiết Kế API gRPC)

> **gRPC** là khung RPC hiệu năng cao từ Google — dùng **Protocol Buffers (binary)** thay JSON, chạy trên **HTTP/2**, hỗ trợ **streaming** nhiều chiều.

---

## 🎯 Cấu trúc

```
Service định nghĩa bằng .proto:

  service BookService {
    rpc GetBook (GetBookRequest) returns (Book);
    rpc WatchBooks (WatchRequest) returns (stream Book);
  }

4 kiểu gọi (call type):
  • Unary        : 1 request → 1 response
  • Server stream: 1 request → nhiều response
  • Client stream: nhiều request → 1 response
  • Bidi stream  : cả 2 chiều đều là stream
```

| Đặc điểm | gRPC |
|----------|------|
| Payload | Protobuf (binary, nhỏ & nhanh) |
| Giao thức | HTTP/2 |
| Streaming | ✅ Có sẵn |
| Codegen | Client/server sinh tự động từ `.proto` |

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// proto string làm hợp đồng
const PROTO_SOURCE = `
service BookService {
  rpc GetBook (GetBookRequest) returns (Book);
  rpc WatchBooks (WatchRequest) returns (stream Book);
}
`;

// Mini channel mô phỏng unary + server-streaming
class MiniGrpcChannel {
  unary(service: string, method: string, request: Record<string, unknown>): unknown {
    const handler = this.server.findHandler(service, method);
    return handler(request);
  }

  serverStream(service: string, method: string, request: Record<string, unknown>): void {
    const stream = this.server.findHandler(service, method)(request) as unknown[];
    for (const item of stream) {
      console.log(`📦 ${JSON.stringify(item)}`);
    }
  }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| ⚡ **Hiệu năng cao** | Binary payload, HTTP/2 multiplexing |
| 📜 **Contract cứng** | `.proto` sinh code cả 2 phía |
| 🔄 **Streaming** | Phù hợp feed, telemetry, chat |

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🔍 **Khó debug** | Binary không đọc được như JSON |
| 🕸️ **Không browser-native** | Cần **grpc-web** proxy |
| 💀 **Không cache-friendly** | gRPC không tận dụng HTTP cache |

---

## 🔗 Liên quan

- **5.10.1 REST API** — API chung cho client ngoài
- **5.10.2 GraphQL** — Chỉ 1 endpoint JSON
- **1.2 Microservices** — gRPC thường dùng inter-service

---

## 📚 Tài liệu tham khảo

- 📖 [gRPC Basics](https://grpc.io/docs/what-is-grpc/)
- 📖 [gRPC Concepts](https://grpc.io/docs/what-is-grpc/introduction/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.10.3-grpc
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.10.4 Pagination](../5.10.4-pagination/README.md)