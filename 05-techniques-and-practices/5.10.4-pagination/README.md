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

## ❌ BAD — thêm 1 case: offset sâu + sort không ổn định

```typescript
// ❌ BAD — page 1000 với limit 10 = skip 9990 rows (càng sâu càng chậm) + sort theo
// createdAt trùng nhau → thêm/xóa 1 item làm trang sau trùng/lặp với trang trước
async function listBad(page: number): Promise<Book[]> {
  return db.books.orderBy("createdAt").offset((page - 1) * 10).limit(10);
}

// ✅ GOOD — cursor ổn định (id duy nhất, sort cố định) + limit trần
async function listGood(afterId: number | null, limit: number): Promise<Book[]> {
  const safeLimit = Math.min(limit, 100); // trần page-size chống client đòi 1 triệu rows
  return db.books.where("id >", afterId ?? 0).orderBy("id").limit(safeLimit);
}
```

> 2 lỗi kinh điển: **offset càng sâu càng chậm** (DB vẫn phải đọc + bỏ rows đã skip) và **sort không duy nhất** (timestamp trùng → item nhảy trang). Feed động luôn dùng cursor trên cột unique + sort cố định.

---

## ⚖️ Trade-off: offset vs cursor vs keyset (mở rộng bảng chính)

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| Admin cần nhảy tới page 42, tổng số trang | ✅ Offset (+ `COUNT`) | UX cần số trang; dữ liệu tĩnh, ít |
| Feed/chat realtime, thêm/xóa liên tục | ✅ Cursor/keyset | Ổn định, không skip sâu |
| Export toàn bộ / sync job | ✅ Cursor duyệt hết | Không lệch khi dữ liệu đổi giữa chừng |
| Dữ liệu nhỏ (< 1000 rows) | ⚖️ Cái nào cũng được | Ưu tiên đơn giản (offset) |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| `limit` không trần | `?limit=1000000` → OOM/server treo | `Math.min(limit, MAX)` + default khi thiếu |
| Cursor encode chứa dữ liệu nhạy cảm | Base64 giải được → lộ `userId`/filter nội bộ | Cursor chỉ chứa con trỏ (id/timestamp), ký HMAC nếu cần chống giả |
| Quên `hasMore`/`nextCursor` | Client không biết khi nào hết, fetch thừa vòng lặp vô hạn | Contract trang luôn có 3 trường: `data`, `nextCursor`, `hasMore` |
| Đổi sort giữa chừng (mới nhất ↔ cũ nhất) | Cursor cũ vô nghĩa, client lặp/thiếu | Cursor gắn với 1 sort cố định; đổi sort = reset cursor |

---

## ✅ Checklist khi review

- [ ] `limit` có trần + giá trị default?
- [ ] Feed động dùng cursor trên cột unique + sort cố định?
- [ ] Response đủ `data`/`nextCursor`/`hasMore`?
- [ ] Cursor không lộ dữ liệu nhạy cảm?
- [ ] Offset sâu có giới hạn page tối đa hoặc cảnh báo perf?

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
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.11 Deployment & Infrastructure](../5.11-deployment-infra/README.md)