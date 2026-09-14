# 🔗 5.10.1 REST API Design (Thiết Kế REST API)

> **REST (Representational State Transfer)** là phong cách thiết kế API theo **resource** — mỗi tài nguyên có URL riêng và được thao tác bằng **đúng HTTP method** + **status code chuẩn**.

---

## 🎯 Nguyên tắc cốt lõi

```
GET    /api/books        → danh sách (200)
GET    /api/books/:id    → chi tiết (200 / 404)
POST   /api/books        → tạo mới (201)
PUT    /api/books/:id    → cập nhật toàn bộ (200 / 404)
DELETE /api/books/:id    → xóa (204 / 404)
```

| HTTP Method | Ý nghĩa | Idempotent? |
|-------------|---------|-------------|
| **GET** | Đọc dữ liệu, không đổi trạng thái | ✅ |
| **POST** | Tạo tài nguyên mới | ❌ |
| **PUT** | Thay thế toàn bộ tài nguyên | ✅ |
| **PATCH** | Cập nhật một phần | ✅ |
| **DELETE** | Xóa tài nguyên | ✅ |

> 💡 **Quy ước:** URL chỉ chứa danh từ (resource) số nhiều, KHÔNG có động từ (`/api/books` thay vì `/api/getBooks`).

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class MiniRestRouter {
  private routes = new Map<string, MiniHandler>();

  register(method: MiniMethod, path: string, handler: MiniHandler): void {
    this.routes.set(`${method} ${path}`, handler);
  }

  dispatch(method: MiniMethod, path: string, body?: Record<string, unknown>): MiniResult {
    for (const [routeKey, handler] of this.routes) {
      const [routeMethod, routePath] = routeKey.split(" ");
      if (routeMethod !== method) continue;
      const params = this.match(routePath, path);
      if (params !== null) return handler(params, body);
    }
    return { status: 404, data: { error: "Not Found" } };
  }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🌍 **Universal** | Bất kỳ client nào cũng gọi được (HTTP + JSON) |
| 🚀 **HTTP cache** | Cache tại CDN/proxy dễ dàng |
| 🧩 **Đơn giản** | Resource + method + status — dễ hiểu |

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📦 **Over-fetching** | Client nhận cả object dù chỉ cần 1 field |
| 🔗 **Under-fetching** | Cần gọi nhiều request để có đủ dữ liệu |
| 📈 **Nhiều endpoints** | Số URL tăng theo số resource |

---

## 🔗 Liên quan

- **5.10.2 GraphQL** — Giải pháp cho over/under-fetching
- **5.10.3 gRPC** — Hiệu năng cao hơn cho microservices
- **11.2 REST API** — Bản đầy đủ hơn về REST

---

## 📚 Tài liệu tham khảo

- 📖 [RESTful API Design](https://restfulapi.net/)
- 📖 [MDN HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.10.1-rest-api
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.10.2 GraphQL](../5.10.2-graphql/README.md)