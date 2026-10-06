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

## ❌ BAD — thêm 1 case: động từ trong URL + status code sai

```typescript
// ❌ BAD — RPC đội lốt REST: động từ trong URL, mọi thứ 200 kể cả lỗi
router.register("GET", "/api/getBooks", listBooks);            // động từ getBooks
router.register("POST", "/api/deleteBook", deleteBook);        // POST để xóa?!
router.register("GET", "/api/books/:id", (p) => {
  const book = findBook(p.id);
  return { status: 200, data: book ?? { error: "not found" } }; // 💥 404 đội lốt 200
});

// ✅ GOOD — danh từ số nhiều + đúng method + đúng status
router.register("GET", "/api/books", listBooks);               // 200 + array
router.register("GET", "/api/books/:id", getBook);             // 200 | 404
router.register("DELETE", "/api/books/:id", deleteBook);       // 204 | 404
```

> Test nhanh: **đọc URL có đoán được resource không, đọc status có biết thành công không?** Client (và CDN cache) phụ thuộc cả 2.

---

## ⚖️ Trade-off: REST vs GraphQL (5.10.2) vs gRPC (5.10.3)

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| API public cho bên thứ 3, cần cache CDN | ✅ REST | HTTP cache + ai cũng gọi được |
| Client mobile cần ít field, tránh over-fetching | ⚖️ GraphQL | 1 request đúng field cần |
| Service-to-service nội bộ, throughput cao | ⚖️ gRPC | Binary + streaming, contract cứng |
| Team nhỏ, CRUD chuẩn | ✅ REST | Đơn giản nhất, tooling sẵn |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| `200` cho mọi response kể cả lỗi | Client/cache tưởng thành công; retry sai | Mapping lỗi chuẩn: 400 validation, 401 auth, 403 quyền, 404 thiếu, 409 conflict, 500 server |
| `PUT` vs `PATCH` lẫn lộn | Client gửi thiếu field bị ghi đè mất dữ liệu | PUT = thay toàn bộ (thiếu → null), PATCH = sửa 1 phần |
| Không versioning (`/api/...` trần) | Đổi response vỡ app cũ | `/api/v1/...`, giữ v1 khi ra v2 |
| Thiếu idempotency cho POST thanh toán | Retry mạng → trừ tiền 2 lần | Idempotency-Key header cho mọi POST tạo giao dịch |

---

## ✅ Checklist khi review

- [ ] URL chỉ danh từ số nhiều (không động từ), đúng method (GET/POST/PUT/PATCH/DELETE)?
- [ ] Status code đúng (201 tạo mới, 204 xóa, 404 thiếu, 400 validation)?
- [ ] Có versioning (`/v1`) nếu API đã public?
- [ ] POST thanh toán/đặt hàng có idempotency key?
- [ ] Error response format nhất quán (`{ error, code, details }`)?

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