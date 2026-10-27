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
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

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

## 🧭 1NF → 3NF Nhanh (Mỗi dạng 1 quy tắc)

| Dạng | Quy tắc để pass | Ví dụ vi phạm | Cách fix |
|---|---|---|---|
| **1NF** | Mỗi cell = 1 giá trị nguyên tử | `tags = "vue,react"` hoặc `phone_numbers[]` | Tách bảng riêng `tags`, 1 row/tag |
| **2NF** | 1NF + không partial dependency (cột phụ thuộc 1 phần khóa) | Bảng `(order_id, product_id, product_name)` — product_name phụ thuộc product_id, không phải order_id | Tách `products(product_id, name)` + `order_items(order_id, product_id)` |
| **3NF** | 2NF + không transitive dependency (A→B→C) | `users(user_id, city_id, city_name)` — city_name phụ thuộc city_id, không phải user_id | Tách `cities(city_id, name)` |
| **BCNF** | 3NF + mọi determinant phải là candidate key | Bảng `(student, subject, teacher)` — teacher→subject, nhưng teacher không phải key | Tách bảng riêng, mỗi quan hệ là 1 bảng |

> Tóm: **1NF = atomic**, **2NF = toàn khóa**, **3NF = không gián tiếp**, **BCNF = khóa là duy nhất đường đi**.

---

## ⚖️ Khi nào chủ động denormalize

**Đừng normalize thái quá rồi JOIN 10 bảng để đọc 1 row.** Denormalize có chủ đích khi:

| Tín hiệu | Hành động |
|---|---|
| Read-heavy (90% reads, 10% writes) + reporting/analytics | Thêm `denormalized_orders_view` hoặc `price_at_buy` snapshot column |
| Query đơn (dashboard) cần 5+ JOINs, latency > 200ms dù có index | Materialized view hoặc trigger giữ đồng bộ |
| Nhiều AGGREGATE (SUM, COUNT) bị JOIN block | Bảng `order_summary(user_id, total_orders, total_spent)` cập nhật trigger |
| Reporting tách biệt (OLAP) khỏi transactional (OLTP) | Star schema, bảng fact + dimension — đây là design khác, không phải "lỗi" 3NF |

**Nguyên tắc:** ghi rõ lý do + migration plan + migration (sau đó mới implement).

---

## 📋 Checklist Review Schema

- [ ] Mỗi bảng có primary key rõ ràng?
- [ ] 1NF: không comma-separated, không array trong cell?
- [ ] 2NF: cột nào phụ thuộc 1 phần khóa composite → tách?
- [ ] 3NF: cột nào phụ thuộc cột không-phải-khóa → tách?
- [ ] FK giữa bảng có index (đặc biệt cột FK dùng trong JOIN)?
- [ ] Bảng có column trùng lặp ở > 1 chỗ (dấu hiệu cần tách)?
- [ ] Có bảng nào cần denormalize chủ đích (read-heavy, reporting)?
- [ ] Ghi rõ lý do denormalize + migration strategy chưa?

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
npx tsx examples/index.ts
```

Demo: bảng 0NF đầy trùng lặp → tách 1NF/2NF/3NF từng bước → đếm anomaly trước/sau.

---

## ⏭️ Bài tiếp theo

→ [10.8 ACID & Isolation](../10.8-acid-isolation/README.md)
