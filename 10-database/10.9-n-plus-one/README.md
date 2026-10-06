# 🐢 10.9 N+1 Query (Vấn Đề & Batching)

> **N+1**: 1 query lấy N parents + N query lấy children từng đứa — 1000 users = 1001 round-trips. Fix bằng **batching** (gom thành 1 query `IN (...)`) + **DataLoader** (gom + cache theo request).

---

## 🎯 Vấn đề

ORM lazy load trông tiện nhưng sinh N+1 ẩn:

```typescript
const users = await db.user.findMany({ take: 100 }); // 1 query
for (const u of users)
  u.orders = await db.order.findMany({ where: { userId: u.id } }); // +100 queries 💥
```

Local 1ms/query không thấy; production 20ms × 101 = 2 giây + cạn pool.

---

## 💻 Code ví dụ

Mô phỏng query counter: lazy (N+1) vs batch (`WHERE IN`) vs DataLoader (gom + cache).

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

let queryCount = 0;
// Lazy: mỗi user 1 query
async function ordersOf(userId: number): Promise<Order[]> {
  queryCount++; return db(`SELECT * FROM orders WHERE user_id = ${userId}`);
}
// Batch: mọi user 1 query duy nhất
async function ordersOfMany(ids: number[]): Promise<Map<number, Order[]>> {
  queryCount++; return db(`SELECT * FROM orders WHERE user_id IN (${ids.join(",")})`).then(groupBy);
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Giảm 1001 → 2 queries | 1 cho users + 1 batch cho orders — latency sập từ giây về ms |
| DataLoader thêm cache | Cùng request hỏi user 1 hai lần → chỉ query 1 lần |
| Fix ở đúng tầng | Không cần đổi schema hay thêm index — chỉ đổi cách fetch |

---

## ⚠️ Lưu Ý

- DataLoader cache **per-request**: tạo mới mỗi request, không dùng global (rò rỉ data giữa users!).
- Batch size: `IN` 10k ids có thể quá lớn — chia chunk (500–1000) khi cần.
- Phát hiện: log query count/request, alert khi > X; tool như `prisma-extension`/`dataloader` + APM.
- Đừng eager load mù (`include` tất cả quan hệ): over-fetch cũng tốn — chỉ batch cái cần.

---

## 🎯 Khi nào dùng

- Mọi API trả list kèm quan hệ (GraphQL resolver là ổ N+1 kinh điển).
- Không dùng batch khi: chỉ cần 1 parent (lấy 1 user + orders của họ — 2 queries là đủ, không cần DataLoader).

---

## 🔗 Liên quan

- **11.3 GraphQL** — resolver + DataLoader là combo chuẩn chống N+1.
- **10.5 Indexes** — cột FK (`orders.user_id`) phải có index thì batch mới nhanh.
- **10.10 Connection Pooling** — N+1 cạn pool nhanh gấp N lần.

---

## 📚 Tài liệu

- DataLoader — https://github.com/graphql/dataloader
- Shopify: Solving N+1 — https://shopify.engineering/solving-the-n-1-problem-for-graphql

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.9-n-plus-one
npx ts-node examples/index.ts
```

Demo: đếm query lazy (101) vs batch (2) vs DataLoader (2 + cache hit lần 2).

---

## ⏭️ Bài tiếp theo

→ [10.10 Connection Pooling](../10.10-connection-pooling/README.md)
