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

## ❌ BAD — thêm 1 case: đổi .proto breaking mà không version service

```protobuf
// ❌ BAD — sửa field đang dùng, client cũ chết lặng lẽ
message Book {
  int32 id = 1;
  // string title = 2;        // xóa field đang dùng!
  string name = 2;             // đổi tên = đổi field mới với client cũ (không tương thích)
}

// ✅ GOOD — chỉ thêm field mới (optional), không tái dùng số field đã xóa
service BookService {
  rpc GetBook (GetBookRequest) returns (Book);   // giữ nguyên
  rpc GetBookV2 (GetBookRequest) returns (BookV2); // API mới = service/method mới
}
message Book {
  int32 id = 1;
  string title = 2;            // giữ, đánh deprecated nếu cần
  string subtitle = 3;         // thêm mới luôn an toàn (client cũ bỏ qua)
}
```

> Luật vàng protobuf: **không đổi số field, không đổi kiểu, không tái dùng số đã xóa**. Muốn breaking → version service mới, giữ service cũ chạy song song.

---

## ⚖️ Trade-off: gRPC vs REST (5.10.1) vs GraphQL (5.10.2)

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| Microservices nội bộ gọi nhau dày | ✅ gRPC | Nhanh, contract cứng, streaming |
| API public cho browser/bên thứ 3 | ⚖️ REST/GraphQL | gRPC cần grpc-web proxy, khó debug binary |
| Cần cache HTTP/CDN | ⚖️ REST | gRPC POST binary không cache được |
| Team đa ngôn ngữ (Go/Python/Java/TS) | ✅ gRPC | Sinh client/server từ 1 `.proto` |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Tái dùng số field đã xóa | Client cũ đọc nhầm dữ liệu mới vào field cũ | Giữ số field là `reserved`: `reserved 2;` |
| Không deadline/timeout | 1 service treo kéo cả chuỗi treo theo | Mọi call đều có deadline + retry có budget |
| Lỗi trả về string chung chung | Caller không phân biệt retry được/không | Dùng status code chuẩn (NOT_FOUND, UNAVAILABLE, INVALID_ARGUMENT...) |
| Payload quá to trong 1 unary call | OOM, timeout | Chia trang/streaming; giới hạn `maxReceiveMessageSize` |

---

## ✅ Checklist khi review

- [ ] `.proto` chỉ thêm field mới (không đổi số/kiểu, có `reserved` khi xóa)?
- [ ] Breaking change đi kèm version service mới?
- [ ] Mọi call có deadline + retry policy?
- [ ] Error dùng status code chuẩn (không string tự chế)?
- [ ] Payload lớn đã chia trang/streaming?

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
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.10.4 Pagination](../5.10.4-pagination/README.md)