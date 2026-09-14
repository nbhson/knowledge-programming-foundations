# 📄 5.10.4 Pagination (Phân Trang)

> **Pagination** chia dữ liệu lớn thành từng trang nhỏ. Hai kiểu chính: **offset-based** (page/limit) và **cursor-based** (encode vị trí).

---

## 🎯 So sánh

| | Offset | Cursor |
|---|--------|--------|
| Tham số | `?page=3&limit=10` | `?cursor=abc...&limit=10` |
| Skip khi sâu | `(page-1)*limit` — càng sâu càng chậm | Chỉ đi tiếp từ vị trí cursor |
| Thêm/xóa item | Có thể lệch trang, trùng/lặp | Ổn định |
| Phù hợp | Dashboard, admin, danh sách tĩnh | Feed động, real-time |

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// OFFSET — skip = (page-1)*limit
class OffsetPagination {
  fetch(page: number, limit: number): OffsetPage {
    const offset = (page - 1) * limit;
    const data = this.all.slice(offset, offset + limit);
    const totalPages = Math.ceil(this.all.length / limit);
    return { page, limit, totalPages, offset, data };
  }
}

// CURSOR — encode vị trí base64, không cần skip
class CursorPagination {
  fetch(afterId: number | null, limit: number): CursorPage {
    const start = afterId === null ? 0 : this.all.findIndex((i) => i.id === afterId) + 1;
    const data = this.all.slice(start, start + limit);
    const hasMore = start + limit < this.all.length;
    const nextCursor = hasMore ? encodeCursor(data[data.length - 1].id) : null;
    return { data, nextCursor, hasMore };
  }
}
```

---

## Khi nào dùng gì?

| Nhu cầu | Chọn |
|---------|------|
| Admin panel, page số rõ ràng | ✅ Offset |
| Social feed, chat, real-time | ✅ Cursor |
| Dữ liệu lớn, cần ổn định khi thay đổi | ✅ Cursor |
| Đơn giản, dữ liệu nhỏ & tĩnh | ✅ Offset |

---

## 🔗 Liên quan

- **5.10.1 REST API** — Query params `page`/`limit`/`cursor`
- **11.6 Rate Limiting** — Giới hạn request khi fetch nhiều trang

---

## 📚 Tài liệu tham khảo

- 📖 [MDN — HTTP & URL parameters](https://developer.mozilla.org/en-US/docs/Web/HTTP)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.10.4-pagination
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.11 Deployment & Infrastructure](../5.11-deployment-infra/README.md)