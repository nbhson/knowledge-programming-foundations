# 🏛️ 28.3 Architecture Decision Records (ADR — Lưu Trữ Quyết Định Kiến Trúc)

> **ADR = biên bản ngắn ghi lại QUYẾT ĐỊNH KIẾN TRÚC và TẠI SAO.**
> 6 tháng sau không ai nhớ vì sao chọn PostgreSQL thay MongoDB — ADR là nơi tra.
> Mỗi ADR ngắn (1 trang), tồn tại trong repo, có trạng thái.

---

## 🧠 Cấu Trúc ADR Chuẩn

```markdown
# ADR-014: Dùng PostgreSQL thay MongoDB cho đơn hàng

## Ngày: 2026-10-28
## Trạng thái: Accepted (hoặc: Proposed / Deprecated / Superseded by ADR-020)

## Bối cảnh (Context)
Đơn hàng cần transaction đa bảng (order + payment + inventory).
MongoDB 4.0 có multi-doc transaction nhưng DX hạn chế, team thiếu kinh nghiệm.

## Quyết định (Decision)
Dùng PostgreSQL 16 + Prisma ORM.

## Lý do (Rationale)
- ACID transaction mạnh — tài chính không chịu được dữ liệu lệch
- Team có kinh nghiệm SQL
- Prisma hỗ trợ cả 2 (migration path về sau nếu cần)

## Hệ quả (Consequences)
- (+) ACID mạnh, query phức tạp dễ
- (+) team đã có kinh nghiệm SQL
- (-) cần migration discipline — schema thay đổi là code + review
- (-) lược đồ cứng hơn Mongo — thêm field = migration

## Lựa chọn đã cân nhắc
- MongoDB: linh hoạt schema, nhưng thiếu kinh nghiệm transaction của team
- DynamoDB: phù hợp nếu cần scale khủng, hiện tại over-engineering
```

---

## 🎯 Khi Nào Viết ADR?

| Nên viết | Không cần |
|---|---|
| Chọn framework/DB/ngôn ngữ | Tên biến, format code |
| Design pattern quan trọng | Refactor nhỏ (extract method) |
| Trade-off lớn (sợi cost vs latency) | Fix bug rõ ràng |
| Quyết định khó đảo ngược | Chi tiết implementation nội bộ |

---

## 💡 Bẫy Thường Gặp

1. **ADR quá dài** — 1-2 trang là đủ; ghi quyết định + lý do chính, không viết sách.
2. **ADR không trạng thái** — Proposed? Accepted? Deprecated? Trạng thái rõ, và ADR cũ KHÔNG xóa — đánh dấu Deprecated/Superseded.
3. **Chỉ ghi quyết định, không ghi lựa chọn bị loại** — sau 6 tháng không nhớ vì sao không dùng X. Luôn ghi các phương án đã cân nhắc + tại sao bỏ.

---

*Leaf thuộc [Lớp 28 — Documentation & ADR](../README.md)*