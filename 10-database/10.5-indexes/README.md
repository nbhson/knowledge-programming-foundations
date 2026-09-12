# 📊 10.5 Database Indexes

> **Index** là cấu trúc dữ liệu giúp tăng tốc độ truy vấn bằng cách giảm số lượng hàng phải quét.

```
┌─────────────────────────────────────────────────────────────┐
│           INDEX vs NO INDEX                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ KHÔNG có index (Full Table Scan):                       │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐               │
│  │ 1 │ 3 │ 5 │ 2 │ 8 │ 4 │ 7 │ 6 │ 9 │ 0 │  ← quét 10 rows│
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘               │
│  O(n) — duyệt TẤT CẢ                                        │
│                                                             │
│  ✅ Có index (B-tree Search):                               │
│  ┌────┐      ┌────┐      ┌────┐                            │
│  │  0 │──┐   │  4 │──┐   │  8 │──┐                        │
│  └────┘  │   └────┘  │   └────┘  │                       │
│      ┌────┴──┐   ┌────┴──┐   ┌────┴──┐                    │
│      │  1,2,3│   │  5,6,7│   │  9,10 │                    │
│      └───────┘   └───────┘   └───────┘                    │
│  O(log n) — chỉ đi theo nhánh                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 Types of Indexes

| Type | Cấu trúc | Tốc độ | Dùng cho |
|------|----------|--------|----------|
| **B-tree** | Cây cân bằng | O(log n) | Default, most queries |
| **Hash** | Hash table | O(1) | Equality only (=) |
| **GiST** | Generalized Search Tree | O(log n) | Full-text, geospatial |
| **GIN** | Generalized Inverted Index | O(log n) | Arrays, JSONB |
| **BRIN** | Block Range Index | O(n/k) | Very large tables, sequential data |

---

## 🛠️ Creating Indexes

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (thứ tự QUAN TRỌNG!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Partial index (chỉ index những rows符合条件)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Expressional index (index trên expression)
CREATE INDEX idx_users_name_lower ON users(lower(name));
```

```typescript
// Prisma
model User {
  id      String   @id @default(cuid())
  email   String   @unique
  name    String
  role    String   @default("user")
  createdAt DateTime @default(now())

  @@index([email])
  @@index([role, createdAt])  // composite
  @@index([createdAt], name: "idx_users_created_at")
}
```

---

## ⚠️ Common Pitfalls

```
┌─────────────────────────────────────────────────────────────┐
│           INDEX PITFALLS                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ Quá nhiều index                                        │
│  • Làm chậm INSERT/UPDATE/DELETE                          │
│  • Tăng storage                                             │
│  • Query optimizer chọn sai index                          │
│                                                             │
│  ❌ Composite index sai thứ tự                             │
│  CREATE INDEX idx(a, b) → query WHERE b=? KHÔNG dùng index │
│  (leftmost prefix rule)                                    │
│                                                             │
│  ❌ Index trên cột low-cardinality                         │
│  ví dụ: gender, boolean → query optimizer bỏ qua           │
│                                                             │
│  ❌ Không dùng index khi:                                   │
│  • Table quá nhỏ (< 1000 rows)                             │
│  • Query trả về > 10-15% table                             │
│  • Cột có quá nhiều NULL                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Query Plan Analysis

```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@test.com';

-- Kết quả:
-- Index Scan using idx_users_email on users  (cost=0.42..8.44 rows=1)
-- Actual time: 0.02..0.03 rows=1 loops=1

-- MySQL
EXPLAIN SELECT * FROM users WHERE email = 'test@test.com';

-- Sqlite
.EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'test@test.com';
```

```
┌─────────────────────────────────────────────────────────────┐
│          READ EXPLAIN OUTPUT                               │
├──────────────────┬──────────────────────────────────────────┤
│ seq_scan         │ Full table scan — CẦN index!            │
│ index_scan       │ Dùng index — tốt                        │
│ costs            │越低越好                                │
│ rows             │ Dự đoán số row trả về                   │
│ actual_rows      │ Thực tế — so sánh với dự đoán           │
│ looping          │ Số lần lặp — thấp hơn tốt               │
└──────────────────┴──────────────────────────────────────────┘
```

---

## ✅ Indexing Checklist

| Tình huống | Index |
|------------|-------|
| WHERE clause columns | ✅ Luôn index |
| JOIN columns (FK) | ✅ Luôn index |
| ORDER BY columns | ✅ Nếu table lớn |
| GROUP BY columns | ✅ Nếu table lớn |
| HIGH cardinality columns | ✅ Tốt |
| LOW cardinality columns | ❌ Không cần |
| Frequently updated columns | ⚠️ Cân nhắc (làm chậm write) |

---

## 📚 Tài liệu tham khảo

- 📖 [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- 📖 [MySQL Index Types](https://dev.mysql.com/doc/refman/8.0/en/indexes.html)
- 📖 [Explain Animated](https://explain.dalibo.com/)

---

⏭️ Bài tiếp theo → [10.6 Redis](../10.6-redis/README.md)
