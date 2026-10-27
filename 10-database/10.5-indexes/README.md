# 📊 10.5 Database Indexes

> **Index** là cấu trúc dữ liệu giúp tăng tốc độ truy vấn bằng cách giảm số lượng hàng phải quét. Nhưng index không phải miễn phí — mỗi index là **chi phí write** (mỗi INSERT/UPDATE phải duy trì index entry) và **storage overhead**. Chọn index đúng chỗ, đúng cách là nghệ thuật balancing read vs write performance.

---

## 🎯 Index hoạt động như thế nào?

```
┌─────────────────────────────────────────────────────────────┐
│           INDEX vs NO INDEX — Step counting                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ KHÔNG có index (Full Table Scan):                       │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐               │
│  │ 1 │ 3 │ 5 │ 2 │ 8 │ 4 │ 7 │ 6 │ 9 │ 0 │  ← 10 rows     │
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘               │
│  Tìm giá trị 7: cần đọc TẤT CẢ 10 rows                       │
│  O(n) — linear scan, chậm khi table lớn                     │
│                                                             │
│  ✅ Có index (B-tree Search):                               │
│  ┌────┐      ┌────┐      ┌────┐                            │
│  │  0 │──┐   │  4 │──┐   │  8 │──┐                        │
│  └────┘  │   └────┘  │   └────┘  │                       │
│      ┌────┴──┐   ┌────┴──┐   ┌────┴──┐                    │
│      │  1,2,3│   │  5,6,7│   │  9,10 │                    │
│      └───────┘   └───────┘   └───────┘                    │
│  Tìm giá trị 7: chỉ đi 3 node (root → internal → leaf)      │
│  O(log n) — logarithmic, nhanh khi table lớn                │
│                                                             │
│  Với 1 triệu rows:                                           │
│  • Full scan: ~1,000,000 row reads                          │
│  • B-tree index: ~20 node reads (log2(1M) ≈ 20)             │
│  • Speedup: ~50,000x faster for this query                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**B-tree (Balanced Tree)** là cấu trúc index mặc định vì:
- Cân bằng: tất cả leaf nodes ở cùng depth → guaranteed O(log n)
- Hỗ trợ range queries: `WHERE id > 100 AND id < 200` duyệt theo thứ tự leaf
- Hỗ trợ ORDER BY: leaf nodes đã sorted → tránh extra sort step
- Tự rebalance khi insert/delete → maintain balance invariant

---

## 📐 Types of Indexes — Khi nào dùng loại nào?

| Type | Cấu trúc | Tốc độ | Dùng cho | Không dùng cho |
|------|----------|--------|----------|----------------|
| **B-tree** | Cây cân bằng đa nhánh | O(log n) | Default, most queries (=, <, >, BETWEEN, ORDER BY) | Chỉ equality trên low-cardinality columns |
| **Hash** | Hash table | O(1) | Equality only (=) | Range queries, ORDER BY, partial index |
| **GIN** | Generalized Inverted Index | O(log n) | Full-text search, JSONB, arrays, hstore | Simple scalar columns |
| **GiST** | Generalized Search Tree | O(log n) | Geospatial (PostGIS), range types, full-text | Simple lookups — overkill |
| **BRIN** | Block Range Index | O(n/k) | Very large tables (>1GB) với sequential data | Random access patterns |
| **Partial** | B-tree WHERE clause | O(log n) trên subset | High-selectivity subsets (active users, pending orders) | General purpose |
| **Composite** | Multi-column B-tree | O(log n) | Multi-column WHERE/ORDER BY | Single-column queries (leftmost prefix rule) |
| **Covering** | Index + INCLUDE columns | O(log n) | Queries that only need indexed columns | Wide tables where included cols are large |
| **Expression** | Index on function result | O(log n) | Case-insensitive search, computed fields | Columns with volatile expressions |

### Detailed explanations

**B-tree (Mặc định):**
```sql
-- Tạo mặc định cho PRIMARY KEY và UNIQUE constraint
CREATE INDEX idx_users_email ON users(email);
-- Tối ưu cho: WHERE email = ?, WHERE email > ?, ORDER BY email
-- KHÔNG tối ưu cho: WHERE email LIKE '%son%' (leading wildcard)
```

**Hash (PostgreSQL only):**
```sql
CREATE INDEX idx_users_role_hash ON users USING hash(role);
-- Chỉ dùng cho = operator: WHERE role = 'admin'
-- KHÔNG dùng được cho: >, <, LIKE, ORDER BY
-- Ưu điểm: nhỏ hơn B-tree, nhanh hơn cho equality
-- Nhược điểm: không support partial index, không serializable
```

**GIN (PostgreSQL):**
```sql
-- Full-text search
CREATE INDEX idx_posts_content_gin ON posts USING gin(to_tsvector('english', content));

-- JSONB contains
CREATE INDEX idx_events_data_gin ON events USING gin(data);
-- Query: WHERE data @> '{"type": "click"}'

-- Array overlap
CREATE INDEX idx_tags_gin ON users USING gin(tags);
-- Query: WHERE tags && ARRAY['typescript', 'mongodb']
```

**BRIN (Block Range Index):**
```sql
-- Ideal cho tables > 1GB với data tuần tự (timestamps, auto-increment IDs)
CREATE INDEX idx_logs_timestamp_brin ON logs USING brin(created_at);
-- Index size: vài MB thay vì vài GB của B-tree
-- Trade-off: slightly slower than B-tree but much smaller footprint
```

---

## 🛠️ Creating Indexes — Thực hành

```sql
-- Single column index — most common
CREATE INDEX idx_users_email ON users(email);

-- Composite index — THỨ TỰ CỘT QUAN TRỌNG
-- Rule: equality columns first, then range columns, then ORDER BY columns
-- WHERE user_id = ? AND created_at > ? ORDER BY created_at DESC
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Unique index (alternative to @unique in Prisma)
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Partial index — index only matching rows
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
-- Small index, fast for active user queries, skip inactive users

-- Expression index — for case-insensitive search
CREATE INDEX idx_users_name_lower ON users(lower(name));
-- Query: WHERE lower(name) = lower('Alice')
-- PostgreSQL: WHERE name ILIKE 'alice%'

-- Covering index — avoid table lookup (index-only scan)
-- Query: SELECT total, status FROM orders WHERE user_id = ?
CREATE INDEX idx_orders_covering ON orders(user_id) INCLUDE (total, status);
-- Database có thể trả kết quả từ index alone, không cần đọc table heap
-- Lợi ích: giảm I/O, đặc biệt hữu ích cho wide tables

-- Multi-column with different sort directions
CREATE INDEX idx_posts_published ON posts(status, created_at DESC);
-- Status equality first (few distinct values filtered by other WHERE),
-- then created_at DESC for ordering within status group
```

```typescript
// Prisma schema — index definitions
model User {
  id      String   @id @default(cuid())
  email   String   @unique                       // Auto index (unique constraint)
  name    String
  role    String   @default("user")
  createdAt DateTime @default(now())

  @@index([email])                               // Explicit index
  @@index([role, createdAt])                     // Composite index
  @@index([createdAt], name: "idx_users_created_at")  // Named index
  @@index([name], where: "is_active = true", name: "idx_active_users_by_name")  // Partial index
}
```

### Composite Index — Leftmost Prefix Rule

```
CREATE INDEX idx(a, b, c) ON table(a, b, c);

Query                         Uses Index?      Giải thích
─────────────────────────────────────────────────────────────
WHERE a = ?                   ✅ Yes           First column match
WHERE a = ? AND b = ?         ✅ Yes           Leftmost prefix hoàn chỉnh
WHERE a = ? AND b = ? AND c = ? ✅ Yes        Full match
WHERE b = ?                   ❌ No            Skip first column
WHERE b = ? AND c = ?         ❌ No            Still skip first
WHERE a = ? AND c = ?         ⚠️ Partial      Only use column a
WHERE c = ?                   ❌ No            Last column only, no prefix
ORDER BY a, b, c              ✅ Yes           Matches index order
ORDER BY c, b, a              ⚠️ May use      Depends on query plan
```

> 📌 **Rule thực tế:** luôn đặt cột có **selectivity cao nhất** (nhiều giá trị riêng biệt nhất) đầu tiên trong composite index. `WHERE user_id = ? AND status = ?` nên là `(user_id, status)` chứ không phải `(status, user_id)` — user_id có selectivity cao hơn (many users) so với status (few statuses).

---

## ⚠️ Common Pitfalls — Những sai lầm phổ biến

```
┌─────────────────────────────────────────────────────────────┐
│           INDEX PITFALLS — Tránh những cái này!            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ Over-indexing (quá nhiều index)                        │
│  • Mỗi INSERT phải update TẤT CẢ indexes → write slow down  │
│  • Mỗi UPDATE trên indexed column → index rebuild           │
│  • Storage overhead tăng tuyến tính với số index            │
│  • Query optimizer có thể chọn sai index (confusion)        │
│  → Rule: index cho COLUMNS ĐƯỢC QUERY THƯỜNG XUYÊN,        │
│    không phải columns bạn MONG CÓ THỂ query                 │
│                                                             │
│  ❌ Composite index sai thứ tự                             │
│  CREATE INDEX idx(a, b) → query WHERE b=? KHÔNG dùng index  │
│  → Nhớ: leftmost prefix rule — phải có a trước mới dùng b   │
│  → Fix: reorder columns theo query pattern thực tế          │
│                                                             │
│  ❌ Index trên cột low-cardinality                         │
│  ví dụ: gender (2 values), boolean (2 values), status       │
│  → Query optimizer bỏ qua index vì nó đoán seq scan nhanh   │
│    hơn (vì kết quả sẽ trả về % lớn table)                  │
│  → ngoại lệ: partial index trên low-cardinality column       │
│    (CREATE INDEX ... WHERE gender = 'female')               │
│                                                             │
│  ❌ Không dùng index khi:                                   │
│  • Table quá nhỏ (< 1000 rows) — seq scan nhanh hơn         │
│  • Query trả về > 10-15% table — random access overhead    │
│    lớn hơn sequential read                                  │
│  • Cột có quá nhiều NULL — index entries sparse, overhead   │
│                                                             │
│  ❌ Index trên cột thường xuyên UPDATE                     │
│  • Mỗi UPDATE = index write + potential index rebuild       │
│  • High-write tables: index maintenance cost > read benefit │
│  → Rule: index columns được READ nhiều hơn WRITE            │
│                                                             │
│  ❌ Duplicate indexes                                       │
│  idx_users_email (email) và idx_users_email_copy (email)    │
│  → Hai indexes cùng function, waste storage + write cost    │
│  → Check: SELECT * FROM pg_indexes WHERE tablename = 'users';│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Query Plan Analysis — Đọc EXPLAIN như đọc mạch máu

```sql
-- PostgreSQL — Detailed execution plan with actual timing
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Kết quả mẫu (đọc từ trong ra ngoài):
-- Index Scan using idx_users_email on users  (cost=0.42..8.44 rows=1 width=60)
--   Actual time: 0.028..0.029 rows=1 loops=1
--   Index Cond: (email = 'test@example.com')
-- Planning Time: 0.150 ms
-- Execution Time: 0.085 ms
```

```
┌─────────────────────────────────────────────────────────────┐
│          READ EXPLAIN OUTPUT                               │
├──────────────────┬──────────────────────────────────────────┤
│ seq_scan         │ Full table scan — CẦN index!            │
│ index_scan       │ Dùng index — tốt                        │
│ bitmap_scan      │ Kết hợp multiple indexes — thường tốt   │
│ hash_join        │ Join bằng hash table — tốt cho large    │
│ nested_loop      │ Join vòng lặp — tốt cho small × small   │
│ sort             │ Extra sort step — có thể tránh bằng index│
│ costs            │ Càng thấp càng tốt — estimated cost units           │
│ rows             │ Estimation row count — compare với       │
│ actual_rows      │ actual để check statistics accuracy     │
│ loops            │ Số lần lặp — 1 là ideal                 │
│ filter           │ Rows removed by WHERE after scan        │
│ recheck cond     │ Index re-check condition (bitmap scan)  │
└──────────────────┴──────────────────────────────────────────┘
```

### EXPLAIN ANALYZE case study

```sql
-- Case 1: Missing index — seq scan trên 1 triệu rows
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 'abc123';
-- Output: Seq Scan on orders (cost=0.00..45123.00 rows=1 width=...)
--         Actual time: 234.567..234.567 rows=1 loops=1
--         Filter: (user_id = 'abc123')
--         Rows Removed by Filter: 999999
-- → CẦN: CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Case 2: After adding index — index scan
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 'abc123';
-- Output: Index Scan using idx_orders_user_id on orders
--         (cost=0.42..8.44 rows=1 width=...)
--         Actual time: 0.035..0.036 rows=1 loops=1
--         Index Cond: (user_id = 'abc123')
-- → INDEX WORKING! từ 234ms xuống 0.036ms (6500x faster)

-- Case 3: Composite index misuse — optimizer chọn seq scan
EXPLAIN ANALYZE SELECT * FROM orders WHERE created_at > '2024-01-01';
-- (có composite index (user_id, created_at))
-- Output: Seq Scan on orders — vì query chỉ dùng created_at (2nd column)
-- → CẦN: CREATE INDEX idx_orders_created_at ON orders(created_at);
--    hoặc composite (created_at, user_id) nếu query pattern đổi

-- Case 4: Statistic stale — estimate far from actual
EXPLAIN ANALYZE SELECT * FROM users WHERE role = 'admin';
-- Output: Est rows=1, Actual rows=500
-- → Statistics đã cũ — cần: ANALYZE users;
```

### Analyze command — refresh statistics

```sql
-- PostgreSQL: cập nhật statistics cho query optimizer
ANALYZE users;                        -- single table
ANALYZE;                             -- all tables in current database
ANALYZE verbose users;               -- detailed output

-- Statistics được dùng bởi optimizer để estimate row counts.
-- Sau bulk INSERT/UPDATE/DELETE, statistics có thể outdated → chạy ANALYZE.
```

---

## ✅ Indexing Checklist — Khi nào tạo index?

| Tình huống | Index? | Lý do |
|------------|-------|-------|
| WHERE clause columns (high selectivity) | ✅ Luôn index | Giảm từ O(n) xuống O(log n) |
| JOIN columns (foreign keys) | ✅ Luôn index | Join requires index on both sides |
| ORDER BY columns | ✅ Nếu table > 10k rows | Tránh filesort (extra sort step) |
| GROUP BY columns | ✅ Nếu table > 10k rows | Grouping benefit from sorted index |
| HIGH cardinality columns (email, uuid) | ✅ Tốt | Nhiều unique values → index effective |
| LOW cardinality columns (boolean, gender) | ❌ Không cần | Query optimizer sẽ bỏ qua index |
| Frequently updated columns | ⚠️ Cân nhắc | Index write overhead > read benefit |
| columns used in LIKE '%prefix' | ⚠️ Trailing wildcard | Leading wildcard = no index use |
| columns used in function calls | ⚠️ Expression index | cần CREATE INDEX ON lower(column) |

**Priority ranking:**
1. Primary Key — automatic index
2. Foreign Keys — critical for JOIN performance
3. WHERE clause high-selectivity columns
4. ORDER BY / GROUP BY columns (on large tables)
5. Composite indexes matching frequent query patterns
6. Covering indexes for read-heavy queries

---

## 📚 Tài liệu tham khảo

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [MySQL Index Types](https://dev.mysql.com/doc/refman/8.0/en/indexes.html)
- [Explain Animated](https://explain.dalibo.com/) — visualize query plans interactively
- [Use The Index, Luke](https://use-the-index-luke.com/) — free comprehensive indexing guide

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.5-indexes
npx tsx examples/index.ts
```

Demo minh họa: tạo các loại index, chạy EXPLAIN ANALYZE trước/sau khi thêm index, và so sánh execution time.

---

## ⏭️ Bài tiếp theo

→ [10.6 Redis](../10.6-redis/README.md)
