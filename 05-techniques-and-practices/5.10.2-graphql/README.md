# 🔷 5.10.2 GraphQL (Thiết Kế API GraphQL)

> **GraphQL** là query language cho API: **1 endpoint duy nhất**, client tự chọn **chính xác field** cần — hết over-fetching/under-fetching của REST.

---

## 🎯 Cấu trúc

```
1 endpoint:  POST /graphql

Query:       { user(id: "1") { id name } }
              └─ root field ─┘ └─ selection set ─┘

Thành phần:
  • Schema    : định nghĩa type + field (SDL)
  • Resolver  : hàm trả dữ liệu cho từng field
  • Selection : client chọn field, server trả đúng phần đó
```

| Khái niệm | Vai trò |
|-----------|---------|
| **Schema** | Hợp đồng dữ liệu: `type User { id, name, posts }` |
| **Resolver** | `user: (parent, args) => data` |
| **Query** | Đọc dữ liệu (giống GET) |
| **Mutation** | Thay đổi dữ liệu (giống POST/PUT/DELETE) |
| **Argument** | Tham số truyền vào field: `user(id: "1")` |

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class MiniGqlEngine {
  private resolvers = new Map<string, MiniGqlResolver>();

  add(name: string, resolver: MiniGqlResolver): void {
    this.resolvers.set(name, resolver);
  }

  execute(query: string): Record<string, unknown> {
    const roots = new MiniGqlParser(query).parse();
    const out: Record<string, unknown> = {};
    for (const root of roots) {
      out[root.name] = this.resolveField(root, undefined);
    }
    return out;
  }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **No over-fetching** | Client chỉ nhận đúng field yêu cầu |
| 📉 **1 endpoint** | Không phình to list URL như REST |
| 🔤 **Strong typing** | Schema là hợp đồng rõ ràng |

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧠 **Cache phức tạp** | Không tận dụng HTTP cache như REST |
| 🐢 **N+1 queries** | Resolver lồng nhau có thể gọi DB nhiều lần |
| 📚 **Học curve cao** | Cần hiểu schema + resolver + client tooling |

---

## 🔗 Liên quan

- **5.10.1 REST API** — Tiền đề để so sánh
- **11.3 GraphQL** — Bản đầy đủ hơn (Apollo Server, subscriptions)

---

## 📚 Tài liệu tham khảo

- 📖 [GraphQL Spec](https://spec.graphql.org/)
- 📖 [GraphQL Learn](https://graphql.org/learn/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.10.2-graphql
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.10.3 gRPC](../5.10.3-grpc/README.md)