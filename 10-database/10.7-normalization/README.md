# 🧹 10.7 Normalization (Chuẩn Hóa 1NF–BCNF)

> **Normalization** tách bảng để mỗi sự thật chỉ lưu ở một nơi — loại bỏ **update anomaly** (sửa một chỗ, quên chỗ khác). Chuẩn tới **3NF** rồi denormalize có chủ đích khi đọc nhiều hơn viết.

---

## 🎯 Vấn đề

Bảng chưa chuẩn lưu trùng lặp: cùng email user lặp ở 1000 orders. Đổi email → phải update 1000 rows, sót 1 row là data loạn:

```
orders(order_id, user_id, user_email, product_name, price)  ❌
→ user_email phụ thuộc user_id (không phải order_id): transitive dependency
→ product_name/price phụ thuộc product_id: partial dependency
```

---

## 💻 Code ví dụ

Minh họa tách bảng qua từng normal form + checker đơn giản.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

// ❌ 0NF: cell chứa nhiều giá trị + trùng lặp
interface Denormalized {
  orderId: number; userId: number; userEmail: string;
  productNames: string; // "áo, quần" — vi phạm 1NF (không atomic)
}

// ✅ 3NF: mỗi bảng một chủ thể, liên kết bằng FK
interface User { id: number; email: string }
interface Product { id: number; name: string; price: number }
interface Order { id: number; userId: number }           // FK → User
interface OrderItem { orderId: number; productId: number; qty: number; priceAtBuy: number }
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Không anomaly | Đổi email 1 row trong `users` — mọi order JOIN ra đều đúng |
| Tiết kiệm + nhất quán | Không lưu trùng 1000 lần; constraint FK/UNIQUE enforce ở DB |
| Schema tiến hóa được | Thêm field user không đụng bảng orders |

---

## ⚠️ Lưu Ý

- 1NF: cell atomic (không comma-separated, không array trong cột quan hệ). 2NF: không partial dependency vào 1 phần khóa. 3NF: không transitive dependency. BCNF: mọi determinant là candidate key.
- Chuẩn quá mức (5NF) → JOIN nhiều, chậm: thực tế dừng ở 3NF.
- Denormalize có chủ đích khi read-heavy: `price_at_buy` snapshot, materialized view, computed column — và ghi rõ lý do.

---

## 🎯 Khi nào dùng

- Mọi schema quan hệ mới: thiết kế 3NF trước, đo performance, rồi mới denormalize chỗ nóng.
- Không denormalize sớm vì "sợ JOIN chậm" khi chưa có số liệu.

---

## 🔗 Liên quan

- **10.1 SQL Basics** — JOIN để ráp lại các bảng đã tách.
- **10.5 Indexes** — FK + cột JOIN cần index để tách bảng không thành chậm.
- **10.9 N+1** — tách bảng + ORM lazy load = nguồn N+1 kinh điển.

---

## 📚 Tài liệu

- *Database Design for Mere Mortals* — Michael Hernandez
- PostgreSQL Normalization — https://www.postgresql.org/docs/current/ddl-constraints.html

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.7-normalization
npx ts-node examples/index.ts
```

Demo: bảng 0NF đầy trùng lặp → tách 1NF/2NF/3NF từng bước → đếm anomaly trước/sau.

---

## ⏭️ Bài tiếp theo

→ [10.8 ACID & Isolation](../10.8-acid-isolation/README.md)
