# 🌐 28.2 API Documentation (Tài Liệu API)

> **API doc là hợp đồng với người dùng ngoài.** Không rõ = support team trả lời
> cùng 1 câu hỏi 100 lần. Chuẩn ngành: OpenAPI (Swagger) — spec máy đọc được,
> sinh docs + SDK + mock server tự động.

---

## 💻 Code Ví Dụ

```yaml
# ===== OpenAPI 3.1: hợp đồng mô tả API =====
openapi: 3.1.0
info:
  title: Order API
  version: 2.0.0
paths:
  /orders/{id}:
    get:
      summary: Lấy chi tiết đơn hàng
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, pattern: "^ORD-\\d+$" }
      responses:
        "200":
          description: Chi tiết đơn hàng
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Order" }
        "404":
          description: Không tìm thấy
components:
  schemas:
    Order:
      type: object
      required: [id, status]
      properties:
        id: { type: string }
        total: { type: number, format: "double" }  # tiền → dùng integer cents tốt hơn!
        status: { type: string, enum: [pending, paid, shipped, cancelled] }
```

```typescript
// ===== Sync code ↔ docs: sinh docs từ code =====
// NestJS: decorator → OpenAPI tự động
@ApiProperty({ example: "ORD-1", description: "Mã đơn hàng" })
id: string;
// Swagger UI cập nhật theo code — docs không bao giờ lệch

// ===== Docs cần những gì? (mỗi endpoint) =====
// 1. Mục đích 1 câu   2. Method + path + auth
// 3. Request: params, body schema + VÍ DỤ
// 4. Response: success + MỖI lỗi có thể xảy ra
// 5. Rate limit, pagination, error codes
```

---

## ⚠️ Bẫy Thường Gặp

1. **Docs viết tay riêng biệt với code** — code đổi, docs sai. Sinh docs từ code (OpenAPI, TypeDoc).
2. **Không có ví dụ request/response** — description nói không bằng ví dụ chạy được.
3. **Error response không tài liệu hóa** — client chỉ biết 200, không biết 409 nghĩa gì. Đầy đủ 4xx/5xx.
4. **Version API không ghi trong docs** — "API này trả gì?" trả lời phải theo version cụ thể.
5. **SDK auto-gen lệch schema** — schema đổi nhưng SDK cũ còn dùng → build CI phải fail khi lệch.

---

*Leaf thuộc [Lớp 28 — Documentation & ADR](../README.md)*