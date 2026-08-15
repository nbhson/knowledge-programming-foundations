# 🗄️ Lớp 10: Database & Data Management (Cơ Sở Dữ Liệu)

> **Database** là **trái tim lưu trữ** của mọi ứng dụng —
> nơi dữ liệu được **tổ chức, truy vấn, bảo vệ và tối ưu hóa.**

---

## 📑 Mục Lục

1. [Database Fundamentals](#1-database-fundamentals)
2. [Relational Databases (SQL)](#2-relational-databases-sql)
3. [NoSQL Databases](#3-nosql-databases)
4. [Database Design & Modeling](#4-database-design--modeling)
5. [Query Optimization](#5-query-optimization)
6. [Transactions & ACID](#6-transactions--acid)
7. [Indexing Strategies](#7-indexing-strategies)
8. [Replication & Sharding](#8-replication--sharding)
9. [Data Migration & Versioning](#9-data-migration--versioning)
10. [Caching Strategies](#10-caching-strategies)

---

## 1. Database Fundamentals

### Database là gì?

Database là hệ thống **tổ chức, lưu trữ và quản lý dữ liệu** một cách có cấu trúc, cho phép truy vấn và xử lý hiệu quả.

### Phân loại Database

| Loại | Đặc điểm | Ví dụ |
|------|-----------|-------|
| **Relational (SQL)** | Bảng, hàng, cột, quan hệ | PostgreSQL, MySQL, SQL Server |
| **Document** | JSON/BSON documents | MongoDB, CouchDB |
| **Key-Value** | Cặp key-value đơn giản | Redis, DynamoDB |
| **Column-Family** | Cột được nhóm theo family | Cassandra, HBase |
| **Graph** | Nodes & edges (quan hệ) | Neo4j, ArangoDB |
| **Time-Series** | Dữ liệu theo thời gian | InfluxDB, TimescaleDB |
| **Vector** | Embedding vectors (AI/ML) | Pinecone, Milvus, Weaviate |

---

## 2. Relational Databases (SQL)

### Khái niệm cốt lõi

```
Database → Schema → Table → Row (Record) → Column (Field)
```

### SQL Fundamentals

```sql
-- DDL (Data Definition Language)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- DML (Data Manipulation Language)
INSERT INTO users (username, email) VALUES ('nguyenson', 'son@example.com');
SELECT * FROM users WHERE created_at > '2024-01-01';
UPDATE users SET email = 'new@example.com' WHERE id = 1;
DELETE FROM users WHERE id = 1;

-- Joins
SELECT u.username, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.total > 100;

-- Aggregation
SELECT department, COUNT(*) as total, AVG(salary) as avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 50000
ORDER BY avg_salary DESC;
```

### Các loại Joins

```
INNER JOIN     → Chỉ lấy records khớp cả 2 bảng
LEFT JOIN      → Lấy tất cả bên trái + khớp bên phải
RIGHT JOIN     → Lấy tất cả bên phải + khớp bên trái
FULL OUTER JOIN → Lấy tất cả cả 2 bảng
CROSS JOIN     → Tích Descartes (mỗi row × mỗi row)
SELF JOIN      → Join bảng với chính nó
```

---

## 3. NoSQL Databases

### Document Database (MongoDB)

```javascript
// Flexible schema - mỗi document có thể khác nhau
db.users.insertOne({
    username: "nguyenson",
    email: "son@example.com",
    profile: {
        bio: "Developer",
        skills: ["JavaScript", "Python", "Go"]
    },
    posts: [
        { title: "First Post", likes: 42 }
    ]
});

// Query với nested fields
db.users.find({
    "profile.skills": "JavaScript",
    "posts.likes": { $gte: 10 }
});

// Aggregation Pipeline
db.orders.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: "$userId", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
    { $limit: 10 }
]);
```

### Key-Value Store (Redis)

```redis
SET user:1:name "Nguyen Son"
GET user:1:name

-- Data Structures
LPUSH queue:emails "email1" "email2"    -- List
SADD tags:post:1 "tech" "coding"        -- Set
ZADD leaderboard 100 "player1"          -- Sorted Set
HSET user:1 name "Son" age 25           -- Hash

-- TTL (Time To Live)
SETEX session:abc123 3600 "user_data"   -- Expires in 1 hour
```

### Khi nào chọn SQL vs NoSQL?

| Tiêu chí | SQL | NoSQL |
|-----------|-----|-------|
| **Cấu trúc dữ liệu** | Cố định, rõ ràng | Linh hoạt, thay đổi |
| **Quan hệ phức tạp** | ✅ Mạnh (JOINs) | ❌ Yếu |
| **Scale** | Vertical (chủ yếu) | Horizontal (tự nhiên) |
| **Consistency** | Strong (ACID) | Eventual (BASE) |
| **Use case** | Banking, ERP, CRM | Social, IoT, Real-time |

---

## 4. Database Design & Modeling

### Normalization (Chuẩn hóa)

```
1NF → Mỗi cell chỉ chứa 1 giá trị atomic
2NF → 1NF + Không có partial dependency
3NF → 2NF + Không có transitive dependency
BCNF → 3NF + Mọi determinant là candidate key
```

### Entity-Relationship Diagram

```
┌──────────┐     1:N     ┌──────────┐     N:M     ┌──────────┐
│  Users   │────────────▶│  Orders  │◀───────────▶│ Products │
│          │             │          │             │          │
│ id (PK)  │             │ id (PK)  │             │ id (PK)  │
│ username │             │ user_id  │    ┌────────│ name     │
│ email    │             │ total    │    │        │ price    │
└──────────┘             │ status   │    │        └──────────┘
                         └──────────┘    │
                                         ▼
                                  ┌──────────────┐
                                  │ order_items   │
                                  │ order_id (FK) │
                                  │ product_id(FK)│
                                  │ quantity      │
                                  └──────────────┘
```

### Denormalization

Khi cần **hiệu năng đọc** hơn **tính chuẩn hóa**:

```
✅ Dùng khi:
   - Read-heavy workloads (95% reads)
   - Cần giảm JOIN phức tạp
   - Reporting/Analytics

❌ Tránh khi:
   - Write-heavy workloads
   - Data consistency quan trọng
   - Dữ liệu thay đổi thường xuyên
```

---

## 5. Query Optimization

### EXPLAIN & Query Plan

```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Kết quả phân tích:
-- Seq Scan (❌ chậm)   → Full table scan
-- Index Scan (✅ nhanh) → Dùng index
-- Bitmap Scan          → Kết hợp nhiều index
-- Hash Join            → Join bằng hash table
-- Nested Loop          → Join kiểu vòng lặp
```

### Các kỹ thuật tối ưu

```
1. Indexing        → Tạo index cho cột WHERE/JOIN/ORDER BY
2. Query Rewrite   → Viết lại query hiệu quả hơn
3. Pagination      → LIMIT/OFFSET hoặc Cursor-based
4. Avoid SELECT *  → Chỉ lấy cột cần thiết
5. Batch Operations → Gộp nhiều INSERT/UPDATE
6. Connection Pool → Tái sử dụng connections
7. Read Replicas   → Tách read/write workload
```

### Pagination hiệu quả

```sql
-- ❌ Offset-based (chậm khi offset lớn)
SELECT * FROM posts ORDER BY id LIMIT 20 OFFSET 10000;

-- ✅ Cursor-based (luôn nhanh)
SELECT * FROM posts WHERE id > 10000 ORDER BY id LIMIT 20;

-- ✅ Keyset pagination
SELECT * FROM posts
WHERE (created_at, id) < ('2024-01-01', 500)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

---

## 6. Transactions & ACID

### ACID Properties

```
A - Atomicity    → Tất cả hoặc không gì cả (all-or-nothing)
C - Consistency  → Dữ liệu luôn đúng constraints
I - Isolation    → Transactions không ảnh hưởng nhau
D - Durability   → Dữ liệu đã commit không mất
```

### Transaction Isolation Levels

```
┌─────────────────────┬──────────┬──────────────────┬────────────┐
│ Level               │ Dirty    │ Non-Repeatable   │ Phantom    │
│                     │ Read     │ Read             │ Read       │
├─────────────────────┼──────────┼──────────────────┼────────────┤
│ READ UNCOMMITTED    │ ✅ Có    │ ✅ Có            │ ✅ Có      │
│ READ COMMITTED      │ ❌ Không │ ✅ Có            │ ✅ Có      │
│ REPEATABLE READ     │ ❌ Không │ ❌ Không         │ ✅ Có      │
│ SERIALIZABLE        │ ❌ Không │ ❌ Không         │ ❌ Không   │
└─────────────────────┴──────────┴──────────────────┴────────────┘

⬆️ Isolation tăng = An toàn hơn nhưng chậm hơn
```

### Ví dụ Transaction

```sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;

-- Kiểm tra constraint
IF (SELECT balance FROM accounts WHERE id = 1) < 0 THEN
    ROLLBACK;
ELSE
    COMMIT;
END IF;
```

---

## 7. Indexing Strategies

### Các loại Index

```
B-Tree Index     → Default, tốt cho =, <, >, BETWEEN, ORDER BY
Hash Index       → Chỉ tốt cho = (equality)
GIN Index        → Full-text search, JSONB, arrays
GiST Index       → Geometric data, range types
BRIN Index       → Block Range Index (dữ liệu tuần tự)
Partial Index    → Index chỉ một phần dữ liệu
Composite Index  → Index trên nhiều cột
Covering Index   → Index chứa tất cả cột cần thiết
```

### Index Best Practices

```sql
-- ✅ Index cho cột WHERE thường xuyên
CREATE INDEX idx_users_email ON users(email);

-- ✅ Composite index (thứ tự cột quan trọng!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- ✅ Partial index (chỉ index data cần thiết)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- ✅ Covering index (avoid table lookup)
CREATE INDEX idx_orders_covering ON orders(user_id) INCLUDE (total, status);

-- ❌ Tránh over-indexing (mỗi index = chi phí write)
-- ❌ Tránh index trên cột low cardinality (boolean, status ít giá trị)
-- ❌ Tránh index trên cột thường xuyên UPDATE
```

---

## 8. Replication & Sharding

### Replication (Nhân bản)

```
┌──────────┐     Sync/Async      ┌──────────┐
│  Primary │ ==================▶ │ Replica 1│  ← READ
│ (Master) │ ==================▶ │ Replica 2│  ← READ
│          │                     │ Replica 3│  ← READ
│  WRITE   │                     └──────────┘
└──────────┘

Strategies:
├── Synchronous  → Strong consistency, slower writes
├── Asynchronous → Faster writes, eventual consistency
└── Semi-sync    → Ít nhất 1 replica confirm
```

### Sharding (Phân mảnh)

```
                    ┌─────────────┐
                    │   Router    │
                    └──────┬──────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Shard 1  │ │ Shard 2  │ │ Shard 3  │
        │ A-H      │ │ I-P      │ │ Q-Z      │
        └──────────┘ └──────────┘ └──────────┘

Shard Key Strategies:
├── Range-based  → Dễ range query, dễ hotspot
├── Hash-based   → Phân bố đều, khó range query
└── Directory     → Linh hoạt, cần lookup table
```

---

## 9. Data Migration & Versioning

### Schema Migration

```
migrations/
├── 001_create_users.sql
├── 002_add_email_to_users.sql
├── 003_create_orders.sql
└── 004_add_index_orders_user_id.sql
```

### Migration Best Practices

```
✅ Forward-only migrations (tránh rollback phức tạp)
✅ Backward-compatible changes
✅ Tách deploy code và migrate schema
✅ Test migration trên staging trước
✅ Backup trước khi migrate production

❌ Tránh DROP COLUMN trên production trực tiếp
❌ Tránh ALTER TABLE lớn khi traffic cao
❌ Tránh data migration trong schema migration
```

### Zero-Downtime Migration

```
Bước 1: Thêm cột mới (nullable)
Bước 2: Code đọc/ghi cả 2 cột
Bước 3: Backfill dữ liệu cũ sang cột mới
Bước 4: Code chỉ đọc cột mới
Bước 5: Xóa cột cũ (sau khi verify)
```

---

## 10. Caching Strategies

### Cache Patterns

```
┌─────────────────────────────────────────────┐
│ Cache-Aside (Lazy Loading)                  │
│                                             │
│ App ──▶ Cache hit? ──Yes──▶ Return data     │
│              │                              │
│              No                             │
│              ▼                              │
│         DB query ──▶ Store in cache         │
│              ──▶ Return data                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Write-Through                               │
│                                             │
│ App ──▶ Write Cache ──▶ Write DB            │
│ (Đồng bộ, consistent nhưng chậm hơn)       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Write-Behind (Write-Back)                   │
│                                             │
│ App ──▶ Write Cache ──▶ Async write DB      │
│ (Nhanh hơn nhưng risk mất data)             │
└─────────────────────────────────────────────┘
```

### Cache Invalidation

```
TTL (Time-To-Live)    → Tự expire sau N giây
Event-based           → Invalidate khi data thay đổi
Version-based         → Key chứa version number
Tag-based             → Group cache bằng tags để bulk invalidate
```

### Caching Layers

```
┌─────────────────────────────────────────────────┐
│ Browser Cache (HTTP Cache-Control, ETag)        │
├─────────────────────────────────────────────────┤
│ CDN Cache (Static assets, API responses)        │
├─────────────────────────────────────────────────┤
│ Application Cache (Redis, Memcached)            │
├─────────────────────────────────────────────────┤
│ Query Cache (Prepared statements, query results)│
├─────────────────────────────────────────────────┤
│ Database Buffer Pool (InnoDB buffer pool)       │
└─────────────────────────────────────────────────┘
```

---

## 🗺️ Tổng Kết: Database Knowledge Map

```
Database & Data Management
├── Fundamentals
│   ├── SQL vs NoSQL
│   ├── ACID vs BASE
│   └── CAP Theorem
├── Design
│   ├── Normalization (1NF → BCNF)
│   ├── ER Diagrams
│   └── Denormalization
├── Performance
│   ├── Indexing (B-Tree, GIN, Partial)
│   ├── Query Optimization (EXPLAIN)
│   └── Caching (Redis, strategies)
├── Scalability
│   ├── Replication (sync/async)
│   ├── Sharding (range/hash)
│   └── Read Replicas
└── Operations
    ├── Migrations (zero-downtime)
    ├── Backup & Recovery
    └── Monitoring & Alerting
```

---

## 📚 Tài Liệu Tham Khảo

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Redis Documentation](https://redis.io/docs/)
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [Database Internals (Alex Petrov)](https://www.databass.dev/)
- [Designing Data-Intensive Applications](https://dataintensive.net/) — Martin Kleppmann

---

> 💡 **"Data is the new oil, but only if you know how to refine it."**
> — Lưu trữ dữ liệu là một chuyện, quản lý nó hiệu quả mới là nghệ thuật.