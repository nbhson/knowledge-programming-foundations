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

## ❌ BAD — thêm 1 case: N+1 queries trong resolver lồng nhau

```typescript
// ❌ BAD — mỗi book 1 query author: 100 books = 101 queries vào DB
const resolvers = {
  Book: {
    author: (book: Book) => db.authors.findById(book.authorId), // chạy N lần!
  },
};

// ✅ GOOD — batch bằng DataLoader: gom authorId → 1 query IN (...)
const resolvers = {
  Book: {
    author: (book: Book, _: unknown, ctx: Ctx) => ctx.authorLoader.load(book.authorId),
  },
};
// authorLoader = new DataLoader(async (ids) => db.authors.findByIds(ids)); // 100 books = 2 queries
```

> Luật vàng resolver: **không query DB trong resolver lồng nhau mà không batch**. Symptom: 1 field thêm vào query làm latency tăng tuyến tính.

---

## ⚖️ Trade-off: GraphQL vs REST (5.10.1) vs gRPC (5.10.3)

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| Client đa dạng (web/mobile/IoT) cần field khác nhau | ✅ GraphQL | Mỗi client lấy đúng phần mình cần |
| Cần HTTP cache/CDN mạnh | ⚖️ REST | GraphQL POST 1 endpoint khó cache |
| Upload file lớn / streaming realtime | ⚖️ REST/gRPC | GraphQL không sinh ra cho 2 việc này |
| Team chưa quen schema-first | ⚖️ REST | GraphQL đòi kỷ luật schema + resolver + dataloader |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| N+1 queries | Latency tăng theo số bản ghi | DataLoader batch mọi resolver lồng nhau |
| Query sâu vô hạn (`friends { friends { ... } }`) | 1 request đánh sập server | Giới hạn depth + complexity score, timeout |
| Lộ field nhạy cảm trong schema | Client query được `passwordHash` | Review schema như review API public; directive auth từng field |
| Mutation không idempotent, client retry | Tạo trùng đơn hàng | Idempotency key cho mutation tạo mới (như REST) |

---

## ✅ Checklist khi review

- [ ] Mọi resolver lồng nhau đều qua DataLoader/batch (không N+1)?
- [ ] Có giới hạn query depth/complexity?
- [ ] Schema không lộ field nhạy cảm (auth từng field)?
- [ ] Mutation tạo mới có idempotency?
- [ ] Error của resolver không lộ stack trace nội bộ?

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