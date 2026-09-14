# 🗄️ Lớp 10: Database & Data Management (Cơ Sở Dữ Liệu)

> **Database** là **trái tim lưu trữ** của mọi ứng dụng —
> nơi dữ liệu được **tổ chức, truy vấn, bảo vệ và tối ưu hóa.**
> Không có database, không có hệ thống nào tồn tại lâu dài — mọi tính năng đều phụ thuộc vào việc dữ liệu được ghi đúng, đọc nhanh và phục hồi an toàn.

---

## 📚 Mục lục — Bài học chi tiết

| Bài | Chủ đề | Mô tả |
|-----|--------|-------|
| [10.1 SQL Basics](10.1-sql-basics/README.md) | SQL cơ bản | SELECT/WHERE/JOIN/GROUP BY qua mini-engine tự viết |
| [10.2 MongoDB](10.2-mongodb/README.md) | Document database | Document + CRUD + aggregation pipeline |
| [10.3 Prisma ORM](10.3-prisma-orm/README.md) | ORM type-safe | schema.prisma, PrismaClient, transaction |
| [10.4 Migrations](10.4-migrations/README.md) | Quản lý schema version | Migration runner up/down, rollback |
| [10.5 Indexes](10.5-indexes/README.md) | Tối ưu truy vấn | Full-scan vs index lookup (đếm bước) |
| [10.6 Redis](10.6-redis/README.md) | Cache in-memory | SET/GET/EXPIRE, cache-aside, TTL |

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

Database là hệ thống **tổ chức, lưu trữ và quản lý dữ liệu** một cách có cấu trúc, cho phép truy vấn và xử lý hiệu quả. Nhưng sâu hơn — database là **cơ chế cam kết dữ liệu tồn tại lâu dài** (persistent storage) mà không phụ thuộc vào tiến trình nào. Khi server khởi động lại, dữ liệu trong database vẫn ở đó. Khi application restart, connection pool được tạo mới nhưng dữ liệu vẫn nguyên vẹn. Đó là lý do tại sao database là **nền tảng** chứ không phải "một tính năng phụ".

**Tại sao cần phân loại database?** Vì không có "loại tốt nhất" — mỗi loại giải quyết một tập trade-off khác nhau giữa: **consistency**, **availability**, **partition tolerance**, **query pattern**, **write throughput**, và **developer productivity**. Hiểu trade-off này là hiểu nghệ thuật chọn công cụ đúng chỗ.

### Phân loại Database

| Loại | Đặc điểm | Ví dụ | Khi nào dùng |
|------|-----------|-------|-------------|
| **Relational (SQL)** | Bảng, hàng, cột, quan hệ chặt chẽ, ACID | PostgreSQL, MySQL, SQL Server | Dữ liệu có quan hệ phức tạp, cần transaction, banking, ERP, hệ thống có schema ổn định |
| **Document** | JSON/BSON documents, schema linh hoạt | MongoDB, CouchDB | Dữ liệu bán cấu trúc, rapid prototyping, content management, IoT telemetry |
| **Key-Value** | Cặp key-value đơn giản, truy cập O(1) | Redis, DynamoDB | Cache, session store, rate limiting, leaderboard, real-time counters |
| **Column-Family** | Cột được nhóm theo family, scan hàng loạt nhanh | Cassandra, HBase | Write-heavy IoT, time-series, analytics scale lớn |
| **Graph** | Nodes & edges (quan hệ), traversal nhanh | Neo4j, ArangoDB | Social graph, recommendation, fraud detection, route finding |
| **Time-Series** | Dữ liệu theo thời gian, index theo timestamp | InfluxDB, TimescaleDB | Monitoring, metrics, IoT sensor data, financial ticks |
| **Vector** | Embedding vectors (AI/ML), cosine similarity | Pinecone, Milvus, Weaviate | Semantic search, RAG, recommendation engines, image similarity |
| **Search Engine** | Full-text search, inverted index | Elasticsearch, Solr | Log analysis, product search, content indexing, audit trail |

> 📌 **Lưu ý quan trọng:** Postgres hiện nay đã hỗ trợ JSONB, vector search (pgvector), và time-series (via TimescaleDB extension). Ranh giới giữa các loại database đang mờ dần — nhiều trường hợp bạn chỉ cần **một Postgres** là đủ.

### CAP Theorem — Ba không thể

```
                    ┌─────────────────┐
                    │   Distributed   │
                    │   Database      │
                    │                 │
              ┌─────┴─────┐    ┌─────┴─────┐
              │           │    │           │
          ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
          │  C     │   │  A    │   │  P    │
          │Consist-│   │Avail- │   │Parti- │
          │ency    │   │ability│   │tion T.│
          └───────┘   └───────┘   └───────┘
```

CAP theorem khẳng định: trong hệ thống phân tán, bạn chỉ có thể đạt **2 trong 3** tính chất:
- **C (Consistency)** — Mọi node cùng nhìn thấy dữ liệu giống hệt nhau tại mọi thời điểm
- **A (Availability)** — Mọi request đều nhận được response (có thể là lỗi, không phải stale data)
- **P (Partition Tolerance)** — Hệ thống vẫn hoạt động khi network bị chia cắt

Thực tế, **partition là điều không tránh được** →你必须 chọn giữa C và A:
- **CP systems** (PostgreSQL cluster, MongoDB with majority writes): Chọn consistency. Khi partition xảy ra, một phần hệ thống có thể không truy cập được để đảm bảo data luôn nhất quán.
- **AP systems** (Cassandra, DynamoDB, Redis cluster): Chọn availability. Khi partition xảy ra, client vẫn đọc được dữ liệu cũ (stale read) nhưng hệ thống không sập.

> ⚠️ **Hiểu lầm phổ biến:** CAP theorem KHÔNG nói "bạn chọn 1 trong 3". Nó nói rằng khi partition xảy ra (điều tất yếu trong distributed system), bạn PHẢI chọn giữa C và A. Hệ thống single-node không bị CAP constraint — đó là lý do tại sao Postgres single-instance vẫn luôn consistent.

### SQL vs NoSQL — Bảng so sánh sâu

| Tiêu chí | SQL (PostgreSQL) | NoSQL (MongoDB) | Lập luận |
|----------|------------------|------------------|----------|
| **Schema** | Định sẵn, enforce strict | Linh hoạt, per-document | SQL cứng nhắc nhưng an toàn; NoSQL linh hoạt nhưng schema drift dễ sinh bug |
| **Quan hệ** | JOIN tự nhiên | $lookup (chậm, tốn RAM) | Nếu bạn cần join thường xuyên → SQL.JOIN là feature không thay thế được |
| **Transaction** | ACID đầy đủ across tables | Multi-document ACID (4.0+) | Banking/payment = SQL bắt buộc. Logging/telemetry = NoSQL đủ |
| **Scale** | Vertical chính, read replicas | Horizontal native (sharding) | Khi dữ liệu vượt RAM + disk của 1 server → NoSQL sharding tự nhiên hơn |
| **Query pattern** | Arbitrary (WHERE, JOIN, GROUP) | Chủ yếu find-by-key, aggregate | Nếu query pattern cố định → SQL. Nếu pattern thay đổi liên tục → NoSQL |
| ** developer velocity** | Cần migration, ORM helps | Không cần schema, insert trực tiếp | Prototype nhanh → NoSQL. Dự án dài hạn cần consistency → SQL |

---

## 2. Relational Databases (SQL)

### Khái niệm cốt lõi

```
Database → Schema → Table → Row (Record) → Column (Field)
```

Nhưng sâu hơn, relational model dựa trên **lý thuyết tập hợp**: mỗi bảng là một quan hệ (relation) — một tập hợp các tuple. Mỗi ô trong bảng phải chứa **atomic value** (không thể chia nhỏ thêm). Điều này dẫn đến normalization — quá trình chuẩn hóa để loại bỏ dư thừa.

### SQL Fundamentals

```sql
-- DDL (Data Definition Language) — Định nghĩa cấu trúc
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,          -- Tự tăng, không null, là khóa chính
    username      VARCHAR(50) UNIQUE NOT NULL, -- Duy nhất, tối đa 50 ký tự
    email         VARCHAR(100) NOT NULL,
    role          VARCHAR(20) DEFAULT 'user',  -- Giá trị mặc định
    created_at    TIMESTAMP DEFAULT NOW(),     -- Tự động gán lúc insert
    updated_at    TIMESTAMP DEFAULT NOW(),
    is_active     BOOLEAN DEFAULT true
);

-- Thêm constraint thực tế
ALTER TABLE users ADD CONSTRAINT chk_username_length
    CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50);

-- Tạo index thủ công (Prisma/Knex tự tạo cho PRIMARY KEY và UNIQUE)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, is_active);

-- DML (Data Manipulation Language) — Thao tác dữ liệu
INSERT INTO users (username, email, role)
VALUES ('nguyenson', 'son@example.com', 'admin');

-- UPDATE với WHERE chính xác — luôn luôn có WHERE!
UPDATE users SET email = 'new@example.com', updated_at = NOW()
WHERE id = 1 AND is_active = true;

-- DELETE với WHERE — cảnh giác: thiếu WHERE = xóa hết bảng
DELETE FROM users WHERE id = 1;

-- SELECT nâng cao
SELECT
    u.id,
    u.username,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.total), 0) AS lifetime_value
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.is_active = true
  AND u.created_at >= '2024-01-01'
GROUP BY u.id, u.username
HAVING COUNT(o.id) > 5
ORDER BY lifetime_value DESC
LIMIT 10 OFFSET 0;
```

**Tại sao LEFT JOIN thay vì INNER JOIN?** Vì INNER JOIN chỉ trả về user đã có đơn hàng — những user chưa mua sẽ biến mất. LEFT JOIN giữ lại tất cả user, null nếu không có order. Đây là khác biệt quan trọng trong reporting.

### Các loại Joins — Minh họa hình học

```
         ┌──────────────────┐           ┌──────────────────┐
         │   Table A        │           │   Table B        │
         │  ┌──┬──┬──┬──┐  │           │  ┌──┬──┬──┬──┐  │
         │  │1│2│3│4│  │  │           │  │3│4│5│6│  │  │
         │  └──┴──┴──┴──┘  │           │  └──┴──┴──┴──┘  │
         └──────────────────┘           └──────────────────┘
                   │                           │
                   ▼                           ▼
    ┌─────────────────────────────────────────────────────┐
    │                   RESULTS                           │
    ├──────────────────┬──────────────────┬───────────────┤
    │ INNER JOIN       │ LEFT JOIN        │ FULL OUTER    │
    │ (giao nhau)      │ (tất cả A + khớp)│ (hợp của cả 2)│
    │  ┌──┬──┐        │  ┌──┬──┬──┬──┐  │  ┌──┬──┬──┬──┬─┐│
    │  │3│4│  │        │  │1│·│2│·│3│4│  │  │1│·│2│·│3│4│5│6│
    │  └──┴──┘        │  └──┴──┴──┴──┘  │  └──┴──┴──┴──┴──┘│
    └──────────────────┴──────────────────┴───────────────┘
```

```sql
-- INNER JOIN — chỉ lấy rows khớp cả 2 bảng
SELECT u.username, o.order_id, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
-- Kết quả: chỉ user nào CÓ đơn hàng

-- LEFT JOIN — giữ tất cả users, kể cả không có đơn hàng
SELECT u.username, o.order_id, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- Kết quả: tất cả user, order = NULL nếu chưa mua

-- RIGHT JOIN — ngược lại LEFT JOIN (ít dùng, thích viết lại thành LEFT)
SELECT u.username, o.order_id
FROM orders o
RIGHT JOIN users u ON o.user_id = u.id;
-- Tương đương LEFT JOIN ở trên

-- FULL OUTER JOIN — tất cả từ cả 2 bảng, null ở bên nào không khớp
SELECT u.username, o.order_id
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;
-- Kết quả: user không có order + order không có user

-- CROSS JOIN — tích Descartes (mỗi row × mỗi row) — DÙNG CẨN THẬN
SELECT u.username, p.product_name
FROM users u
CROSS JOIN products p;
-- Với 1000 users × 500 products = 500,000 rows!

-- SELF JOIN — bảng tự join với chính nó (ví dụ: employee → manager)
SELECT e.name AS employee, m.name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

### Aggregation & Window Functions

```sql
-- GROUP BY + HAVING — lọc sau khi aggregate
SELECT
    department,
    COUNT(*) AS headcount,
    AVG(salary) AS avg_salary,
    MIN(hire_date) AS first_hire,
    MAX(hire_date) AS latest_hire
FROM employees
WHERE is_active = true
GROUP BY department
HAVING COUNT(*) >= 5           -- chỉ giữ department có ≥ 5 người
   AND AVG(salary) > 50000     -- và lương trung bình > 50k
ORDER BY avg_salary DESC;

-- Window functions — tính toán trên tập con mà không group lại
SELECT
    name,
    department,
    salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS salary_rank,
    AVG(salary) OVER (PARTITION BY department) AS dept_avg_salary,
    salary - AVG(salary) OVER (PARTITION BY department) AS salary_diff_from_avg
FROM employees;
-- Kết quả: mỗi hàng vẫn hiện diện, kèm rank và diff — không mất chi tiết

-- ROW_NUMBER() vs RANK() vs DENSE_RANK()
-- ROW_NUMBER: 1,2,3,4 (không có tie)
-- RANK:       1,2,2,4 (có tie thì skip số tiếp theo)
-- DENSE_RANK: 1,2,2,3 (có tie nhưng không skip)
```

---

## 3. NoSQL Databases

### Document Database (MongoDB)

```javascript
// Document mẫu — user trong MongoDB
// Lưu ý: mỗi document có thể có cấu trúc khác nhau hoàn toàn
{
  _id: ObjectId("64a1b2c3d4e5f6a7b8c9d0e1"),
  name: "Alice",
  email: "alice@example.com",
  role: "admin",
  createdAt: ISODate("2024-01-15T08:30:00Z"),
  // Nested object — không cần JOIN
  profile: {
    avatar: "https://cdn.example.com/avatars/alice.jpg",
    bio: "Senior Developer",
    location: { city: "Hà Nội", country: "Vietnam" },
    social: { twitter: "@alice_dev", github: "alicecodes" }
  },
  // Array — lưu trực tiếp, không cần table riêng
  tags: ["typescript", "mongodb", "backend"],
  // Array of objects — embedded document
  orders: [
    { orderId: "ord_001", total: 99.99, status: "completed", items: 3 },
    { orderId: "ord_002", total: 49.50, status: "pending", items: 1 }
  ]
}
```

**Đặc điểm then chốt của Document DB:** schema là **conforming** — mỗi document trong cùng collection có thể có field khác nhau. Điều này mạnh cho rapid iteration nhưng đòi hỏi discipline khi đọc để tránh null/undefined bugs.

```javascript
// Query với nested fields — dot notation
db.users.find({
    "profile.location.city": "Hà Nội",
    "tags": "mongodb",               // array contains
    "orders.status": "completed",    // array of objects
    "orders.total": { $gte: 50 }     // array of objects
});

// Query nâng cao với operators
db.orders.find({
    createdAt: { $gte: ISODate("2024-01-01"), $lt: ISODate("2024-02-01") },
    total: { $gte: 100, $lte: 500 },
    status: { $in: ["completed", "pending"] },
    "user.id": { $ne: null }          // tồn tại field
});

// Aggregation Pipeline — sức mạnh thực sự của MongoDB
db.orders.aggregate([
    // Stage 1: Lọc sớm nhất có thể (giảm dữ liệu đi qua các stage sau)
    { $match: { status: "completed", createdAt: { $gte: ISODate("2024-01-01") } } },

    // Stage 2: Join với users collection
    { $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
    }},

    // Stage 3: Unwind array từ $lookup (vì lookup trả về array dù chỉ 1 result)
    { $unwind: "$user" },

    // Stage 4: Group theo role, aggregate doanh thu
    { $group: {
        _id: "$user.role",
        totalRevenue: { $sum: "$amount" },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: "$amount" }
    }},

    // Stage 5: Sắp xếp
    { $sort: { totalRevenue: -1 } },

    // Stage 6: Chọn cột trả về, đổi tên
    { $project: {
        _id: 0,
        role: "$_id",
        revenue: "$totalRevenue",
        count: "$orderCount",
        avgOrder: { $round: ["$avgOrderValue", 2] }
    }},

    // Stage 7: Giới hạn kết quả
    { $limit: 10 }
]);
```

> 💡 **Phép màu của Aggregation:** MongoDB $lookup từng bị coi là chậm. Phiên bản 4.2+ hỗ trợ `$lookup` với pipeline bên trong — cho phép join phức tạp hơn, filter trước khi join, và even `$graphLookup` cho recursive traversal. Hiểu aggregation pipeline là bước tiến từ "NoSQL rẻ tiền" sang "NoSQL production-ready".

### Key-Value Store (Redis)

```redis
# ── Cơ bản ───────────────────────────────────────────
SET user:1:name "Nguyen Son"          # Đặt key-value
GET user:1:name                       # Đọc giá trị
DEL user:1:name                       # Xóa

# ── Với TTL — tự động expire ────────────────────────
SETEX user:1:session 3600 "abc123token"   # Expires sau 3600 giây (1 giờ)
PEXPIRE user:1:session 3600000             # TTL tính bằng ms

# ── Batch operations ─────────────────────────────────
MSET user:1:name "Son" user:1:email "son@example.com" user:1:role "admin"
MGET user:1:name user:1:email

# ──原子操作 — quan trọng cho counter/rate-limit ──────
INCR view_count:post:123          # Tăng 1, trả về giá trị mới
INCRBY view_count:post:123 10     # Tăng 10
DECR balance:account:1            # Giảm 1
GETEX user:1:session EX 1800      # Đọc + đổi TTL cùng lúc (Redis 6.2+)

# ── Conditional set — chỉ set nếu không tồn tại ──────
SETNX lock:order:456 "processing" # Set if Not eXists — distributed lock primitive
```

**Tại sao Redis nhanh đến vậy?** Vì dữ liệu nằm **hoàn toàn trong RAM** — không có disk I/O, không có serialization phức tạp. Một lệnh SET/GET thường dưới 100 microsecond. Tuy nhiên, RAM đắt hơn disk ~100x theo dung lượng, nên Redis phù hợp cho dữ liệu **hot** (thường truy cập), không phải archive.

### Khi nào chọn SQL vs NoSQL? — Lập luận sâu

| Tình huống | SQL (PostgreSQL) | MongoDB | Lập luận |
|------------|------------------|---------|----------|
| Schema cố định, quan hệ phức tạp (ERP, banking) | ✅ Rất tốt | ❌ Không phù hợp | Quan hệ nhiều bảng + ACID transaction là bắt buộc |
| Data bán cấu trúc / linh hoạt (content, IoT) | ⚠️ JSONB giúp được | ✅ Tốt hơn | Khi structure thay đổi hàng tuần, migration SQL là gánh nặng |
| Write scale lớn, shard nhiều (social feed) | ⚠️ Khó shard | ✅ Native sharding | Shard key trong MongoDB tự động phân phối write load |
| Query JOIN phức tạp, report đa chiều | ✅ Tốt hơn | ⚠️ $lookup chậm | $lookup load toàn bộ collection vào RAM, tốn kém |
| Rapid prototyping, MVP tuần đầu | ⚠️ Cần migration | ✅ Không schema | Chạy `insertOne()` ngay, schema sẽ ổn định sau 2 tuần |
| Geospatial queries (tìm gần nhất) | ⚠️ PostGIS cần plugin | ✅ Built-in | MongoDB có $near, $geoWithin sẵn; PostGIS mạnh hơn nhưng cần cài thêm |
| Full-text search | ⚠️ TSvector cần setup | ✅ Text index | Nhưng Elasticsearch vẫn tốt hơn cả 2 cho search phức tạp |

> 📌 ** misconception phổ biến:** "NoSQL = không cần schema". Sự thật: schema không bị enforce ở DB layer nhưng **luôn tồn tại** trong business logic. MongoDB chỉ dời schema validation từ DB sang app code — và điều đó thường tệ hơn vì khó enforce đồng nhất.

---

## 4. Database Design & Modeling

### Normalization (Chuẩn hóa) — Tại sao và đến đâu?

```
1NF → Mỗi cell chỉ chứa 1 giá trị atomic (không array, không comma-separated)
      ❌ phone_numbers: "0912345678, 0987654321"
      ✅ Tách thành bảng phone_numbers(user_id, number)

2NF → 1NF + Không có partial dependency (mọi non-key column phụ thuộc TOÀN bộ primary key)
      ❌ Bảng order_items(order_id, product_id, product_name, price)
         → product_name và price chỉ phụ thuộc product_id, không phải order_id
      ✅ Tách product_name, price sang bảng products

3NF → 2NF + Không có transitive dependency (non-key column không phụ thuộc vào non-key column khác)
      ❌ Bảng orders(user_id, user_email, order_total)
         → user_email phụ thuộc user_id, không phải order_id
      ✅ Tách user_email sang bảng users

BCNF → 3NF + Mọi determinant đều là candidate key
      (Advanced: hiếm khi cần enforce trong ứng dụng thực tế)
```

**Tại sao normalization quan trọng?** Vì nó loại bỏ **update anomalies**: thêm sửa xóa dữ liệu sai vị trí dẫn đến inconsistency. Nhưng normalize quá mức (5NF+) làm JOIN nhiều → performance giảm. Quy tắc thực tế: **chuẩn đến 3NF, rồi denormalize có chủ đích** ở những chỗ đọc nhiều hơn viết.

### Entity-Relationship Diagram

```
┌──────────┐     1:N     ┌──────────┐     N:M     ┌──────────┐
│  Users   │────────────▶│  Orders  │◀───────────▶│ Products │
│          │             │          │             │          │
│ id (PK)  │             │ id (PK)  │             │ id (PK)  │
│ username │             │ user_id  │    ┌────────│ name     │
│ email    │             │ total    │    │        │ price    │
│ created_at│            │ status   │    │        └──────────┘
└──────────┘             └──────────┘    │
                                         ▼
                                  ┌──────────────┐
                                  │ order_items  │ ← Junction table cho N:M
                                  │ order_id(FK) │
                                  │ product_id(FK)│
                                  │ quantity     │
                                  │ price_at_buy │ ← Snapshot giá, không join products.price
                                  └──────────────┘
```

**Chi tiết quan trọng:** `price_at_buy` trong `order_items` là **snapshot** — giá sản phẩm tại thời điểm mua, không phải giá hiện tại. Nếu không lưu snapshot này, khi product.price thay đổi, historical order reports sẽ sai. Đây là ví dụ điển hình của **denormalization có chủ đích**.

### Denormalization — Khi nào chấp nhận?

```
✅ Dùng khi:
   - Read-heavy workloads (95% reads, 5% writes) — ví dụ: blog, product catalog
   - Cần giảm JOIN phức tạp ảnh hưởng latency (reporting dashboard)
   - Analytics/OLAP — dữ liệu đọc nhiều, write ít, aggregate sẵn
   - Mobile apps — giảm số request, tăng perceived performance

❌ Tránh khi:
   - Write-heavy workloads — mỗi write phải update nhiều nơi → race condition risk
   - Data consistency quan trọng tuyệt đối — banking, inventory chính xác
   - Dữ liệu thay đổi thường xuyên — risk stale data cao
   - Schema chưa ổn định — denormalize quá sớm = technical debt khổng lồ
```

> 💡 **Best practice:** denormalize thành **computed columns** hoặc **materialized views** — không copy-paste thủ công. PostgreSQL MATERIALIZED VIEW tự refresh theo lịch, đảm bảo source of truth duy nhất.

---

## 5. Query Optimization

### EXPLAIN & Query Plan — Đọc như đọc mạch máu

```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Kết quả mẫu (đọc từ dưới lên):
-- -> Sort  (cost=12.50..12.51 rows=1 width=60) (actual time=0.035..0.036 rows=1 loops=1)
--    -> Index Scan using idx_users_email on users  (cost=0.42..12.50 rows=1 width=60) (actual time=0.028..0.029 rows=1 loops=1)
--         Index Cond: (email = 'test@example.com')
-- Planning Time: 0.150 ms
-- Execution Time: 0.085 ms
```

**Cách đọc plan:**
- `Seq Scan` (Sequential Scan) = full table scan — ❌ xấu, cần index
- `Index Scan` = dùng index — ✅ tốt
- `Bitmap Heap Scan` + `Bitmap Index Scan` = kết hợp nhiều index, tốt cho OR conditions
- `Nested Loop` = join kiểu vòng lặp lồng — tốt cho small × small
- `Hash Join` = join bằng hash table — tốt cho large × large
- `Merge Join` = sort-then-merge — tốt cho sorted large datasets
- `Actual rows` vs `Estimated rows` lệch nhau → statistics陈旧 → chạy `ANALYZE table_name`

### Các kỹ thuật tối ưu chi tiết

```
1. Indexing              → Tạo index cho cột WHERE/JOIN/ORDER BY thường xuyên
                           Chi phí: write chậm hơn, storage tăng
                           Lợi ích: read nhanh gấp 100–10000x

2. Query Rewrite         → Viết lại query hiệu quả hơn
                           Ví dụ: subquery trong SELECT → JOIN
                           SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)
                           → EXISTS thay IN nếu chỉ kiểm tra tồn tại

3. Pagination             → LIMIT/OFFSET hoặc Cursor-based
                           OFFSET 10000 + LIMIT 20 = database phải đếm 10020 rows rồi bỏ 10000
                           Cursor-based (WHERE id > last_id LIMIT 20) = O(log n) stable

4. Avoid SELECT *         → Chỉ lấy cột cần thiết
                           SELECT * từ bảng 100 cột, 1 triệu rows = waste bandwidth + memory

5. Batch Operations       → Gộp nhiều INSERT/UPDATE
                           INSERT INTO t VALUES (1),(2),(3)... thay vì 3 lệnh riêng

6. Connection Pool        → Tái sử dụng connections
                           Mở connection mới tốn ~50–200ms (handshake TCP + auth)
                           Pool giữ 5–20 connections sẵn, giảm latency đáng kể

7. Read Replicas          → Tách read/write workload
                           Primary chịu write, replica chịu read
                           Giảm lock contention, tăng read throughput
```

### Pagination: Offset vs Cursor — Giải thích sâu

```sql
-- ❌ Offset-based — chậm dần khi page càng lớn
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 10000;
-- Database phải: sort 1 triệu rows → skip 10000 → take 20
-- Time ≈ O(n) với n = total rows, KHÔNG phụ thuộc LIMIT

-- ✅ Cursor-based (keyset pagination) — luôn ổn định
SELECT * FROM posts
WHERE created_at < '2024-01-15T10:30:00Z'   -- cursor = last seen value
ORDER BY created_at DESC
LIMIT 20;
-- Database chỉ scan 20 rows từ cursor position, dùng index
-- Time ≈ O(log n + 20), ổn định mọi page
```

```sql
-- ✅ Composite cursor — khi có ties trên cursor column
SELECT * FROM posts
WHERE (created_at, id) < ('2024-01-15', 500)
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- (created_at, id) là composite key đảm bảo unique ordering
-- Cần index: CREATE INDEX idx_posts_cursor ON posts(created_at DESC, id DESC)
```

> ⚠️ **Cảnh báo:** Offset pagination KHÔNG hoàn toàn vô dụng — nó phù hợp cho admin dashboards (biết tổng số page), social media feeds (page 1–5), nhưng **không phù hợp** cho infinite scroll hoặc page 1000+.

---

## 6. Transactions & ACID

### ACID Properties — Giải thích sâu từng chữ

```
A — Atomicity (Nguyên tử)
   → Tất cả hoặc không gì cả. Nếu 1 step fail, toàn bộ transaction rollback.
   → Implement: WAL (Write-Ahead Logging) + undo log.
   → Ví dụ: chuyển tiền A→B: trừ A + cộng B phải cùng thành công hoặc cùng fail.

C — Consistency (Nhất quán)
   → Dữ liệu luôn thỏa mãn mọi constraint (FK, UNIQUE, CHECK, NOT NULL).
   → DB engine tự enforce — bạn không cần check tay.
   → Ví dụ: không thể insert order với user_id không tồn tại trong users table.

I — Isolation (Cô lập)
   → Các transaction chạy song song không ảnh hưởng lẫn nhau.
   → Implementation khác nhau tạo ra các isolation level (xem bảng bên dưới).
   → Isolation cao = an toàn hơn nhưng slow hơn do lock/lock-free protocol.

D — Durability (Bền vững)
   → Dữ liệu đã commit không mất, kể cả crash/ngắt điện.
   → Implement: WAL (Write-Ahead Log) — ghi log trước, ghi data sau.
   → PostgreSQL: fsync() đảm bảo log đã xuống disk trước khi report "commit success".
```

### Transaction Isolation Levels — Bảng đầy đủ

```
┌─────────────────────┬──────────┬──────────────────┬────────────┬─────────────────────┐
│ Level               │ Dirty    │ Non-Repeatable   │ Phantom    │ Khi nào dùng        │
│                     │ Read     │ Read             │ Read       │                     │
├─────────────────────┼──────────┼──────────────────┼────────────┼─────────────────────┤
│ READ UNCOMMITTED    │ ✅ Có    │ ✅ Có            │ ✅ Có      │ Hiếm khi — chỉ     │
│                     │          │                  │            │ đọc stats không     │
├─────────────────────┼──────────┼──────────────────┼────────────┼─────────────────────┤
│ READ COMMITTED      │ ❌ Không │ ✅ Có            │ ✅ Có      │ Default PostgreSQL   │
│                     │          │                  │            │ — cân bằng tốc độ   │
├─────────────────────┼──────────┼──────────────────┼────────────┼─────────────────────┤
│ REPEATABLE READ     │ ❌ Không │ ❌ Không         │ ✅ Có      │ Financial report,    │
│                     │          │                  │            │ cần đọc nhất quán    │
├─────────────────────┼──────────┼──────────────────┼────────────┼─────────────────────┤
│ SERIALIZABLE        │ ❌ Không │ ❌ Không         │ ❌ Không   │ Banking core,        │
│                     │          │                  │            │ payment processing   │
└─────────────────────┴──────────┴──────────────────┴────────────┴─────────────────────┘

⬆️ Isolation tăng = An toàn hơn nhưng chậm hơn (nhiều lock hơn, deadlock risk cao hơn)
```

**Giải thích 3 hiện tượng:**
- **Dirty Read:** Đọc data chưa commit của transaction khác — nếu transaction đó rollback, bạn đọc data "ma"
- **Non-Repeatable Read:** Cùng query 2 lần trong 1 transaction, kết quả khác nhau vì transaction khác đã commit sửa đổi
- **Phantom Read:** Cùng query range 2 lần, số hàng khác nhau vì transaction khác insert thêm row mới vào range

### Ví dụ Transaction thực tế

```sql
-- Transfer money between accounts — textbook ACID example
BEGIN TRANSACTION;

-- Bước 1: Trừ tài khoản gửi
UPDATE accounts SET balance = balance - 1000 WHERE id = 1 AND balance >= 1000;
-- Kiểm tra: nếu balance < 1000, UPDATE sẽ ảnh hưởng 0 rows

-- Bước 2: Cộng tài khoản nhận
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;

-- Bước 3: Kiểm tra kết quả
-- Nếu bước 1 ảnh hưởng 0 rows → insufficient funds → rollback
IF (SELECT ROW_COUNT()) = 0 THEN
    ROLLBACK;
ELSE
    COMMIT;
END IF;

-- PostgreSQL hiện đại hơn: dùng RETURNING để get updated value
BEGIN;
WITH updated AS (
    UPDATE accounts SET balance = balance - 1000
    WHERE id = 1 AND balance >= 1000
    RETURNING balance
)
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
-- Nếu CTE không return anything → rollback tự động
COMMIT;
```

**Deadlock — Khi 2 transaction chặn nhau:**
```
Transaction A: LOCK account_1 → chờ account_2
Transaction B: LOCK account_2 → chờ account_1
→ Deadlock! Database engine tự phát hiện và rollback 1 transaction (thường là transaction ít work hơn).
→ App phải handle error "deadlock detected" và retry.
```

---

## 7. Indexing Strategies

### Các loại Index và khi nào dùng

```
B-Tree Index          → Default, tốt cho =, <, >, BETWEEN, ORDER BY
                        Tốc độ: O(log n)
                        Tạo mặc định cho PRIMARY KEY và UNIQUE constraint
                        PostgreSQL default index type

Hash Index            → Chỉ tốt cho = (equality)
                        Tốc độ: O(1) average
                        KHÔNG hỗ trợ ORDER BY, KHÔNG hỗ trợ partial index
                        PostgreSQL: CREATE INDEX ... USING hash

GIN Index             → Generalized Inverted Index
                        Dành cho: full-text search, JSONB, arrays, hstore
                        Tốc độ: O(log n) nhưng constant factor nhỏ hơn B-Tree cho這些 cases
                        PostgreSQL: CREATE INDEX ... USING gin

GiST Index            → Generalized Search Tree
                        Dành cho: geospatial (PostGIS), range types, full-text
                        Hỗ trợ nhiều operator classes khác nhau

BRIN Index            → Block Range Index
                        Dành cho: very large tables (> 1GB) với dữ liệu tuần tự
                        (ví dụ: timestamps tăng dần, IDs tăng dần)
                        Index cực nhỏ (vài MB cho 1TB table) — trade-off: scan rộng hơn

Partial Index         → Index chỉ một phần dữ liệu
                        CREATE INDEX ... WHERE condition
                        Giảm storage, tăng speed cho query có WHERE clause cố định

Composite Index       → Index trên nhiều cột
                        Thứ tự cột QUAN TRỌNG — leftmost prefix rule áp dụng
                        (a, b, c) → query WHERE a=? dùng được, WHERE b=? KHÔNG

Covering Index        → Index chứa tất cả cột query cần
                        CREATE INDEX ... INCLUDE (col1, col2)
                        Tránh "table lookup" — index seek trực tiếp trả kết quả
```

### Index Best Practices — Ví dụ thực tế

```sql
-- ✅ Index cho cột WHERE thường xuyên
CREATE INDEX idx_users_email ON users(email);

-- ✅ Composite index — thứ tự: equality trước, range sau, ORDER BY cuối cùng
-- WHERE user_id = ? AND created_at > ? ORDER BY created_at DESC
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- ✅ Partial index — chỉ index active users (thường là minority)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- ✅ Covering index — tránh table lookup cho frequent query
-- Queries like: SELECT total, status FROM orders WHERE user_id = ?
CREATE INDEX idx_orders_covering ON orders(user_id) INCLUDE (total, status);

-- ✅ Functional index — cho case-insensitive search
CREATE INDEX idx_users_name_lower ON users(lower(name));
-- Sau đó: WHERE lower(name) = lower('Alice')

-- ❌ Tránh over-indexing — mỗi index = chi phí write
-- DROP INDEX idx_users_temp; -- xóa index không dùng

-- ❌ Tránh index trên cột low-cardinality (boolean, status ít giá trị)
-- Query WHERE is_active = true sẽ trả về 90% rows → optimizer bỏ qua index

-- ❌ Tránh index trên cột thường xuyên UPDATE
-- UPDATE liên tục = index maintenance overhead cao
```

### Khi nào KHÔNG dùng index?

```
❌ Table quá nhỏ (< 1000 rows)
   → Sequential scan nhanh hơn index scan do overhead traversing B-tree

❌ Query trả về > 10–15% table rows
   → Optimizer ưu tiên seq scan thay vì random access qua index

❌ Cột có quá nhiều NULL
   → B-tree index không lưu NULL entries → index nearly useless

❌ Cột update liên tục (high-write traffic)
   → Mỗi UPDATE phải sửa index entry → write amplification

❌ Cột cardinality thấp (boolean, gender, enum 2–3 values)
   → Index sẽ trả về quá nhiều rows → optimizer chọn seq scan anyway
```

---

## 8. Replication & Sharding

### Replication (Nhân bản) — Đọc nhiều, ghi một

```
                         ┌─────────────────────────────────┐
                         │          Primary (Master)       │
                         │                                 │
                         │   WRITE ← App writes here       │
                         │   READ ← Also reads here        │
                         └──────────────┬──────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              ┌──────────┐      ┌──────────┐      ┌──────────┐
              │ Replica 1│      │ Replica 2│      │ Replica 3│
              │  READ ←  │      │  READ ←  │      │  READ ←  │
              │  App     │      │  App     │      │  App     │
              └──────────┘      └──────────┘      └──────────┘

Strategies:
├── Synchronous   → Primary chờ replica confirm trước commit
│                   Strong consistency, nhưng write latency cao
│                   Phù hợp: banking, payment — không chấp nhận data loss
├── Asynchronous  → Primary commit ngay, replica lag vài ms–s
│                   Fast writes, eventual consistency on replicas
│                   Phù hợp: social media, content — tolerate stale read
└── Semi-sync     → Ít nhất 1 replica confirm, còn lại async
                    Balance giữa consistency và performance
                    Default của MySQL 5.7+, PostgreSQL streaming replication
```

**Replication lag — vấn đề thực tế:**
```
T=0s:    App viết user.email = "new@example.com" → Primary commit ✓
T=0.5s:  Replica còn đọc "old@example.com" ← lag 0.5 giây
T=1.0s:  Replica đồng bộ xong → "new@example.com" ✓

Nếu app đọc từ replica ngay sau write → đọc được data cũ!
→ Solution: write-read routing (post-write reads về primary)
```

### Sharding (Phân mảnh) — Chia để trị

```
                         ┌─────────────┐
                         │   Router    │  ← Application hoặc proxy
                         │ (Routing    │     định lượng shard dựa trên shard key
                         │  Logic)     │
                         └──────┬──────┘
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
         ┌──────────┐   ┌──────────┐   ┌──────────┐
         │ Shard 1  │   │ Shard 2  │   │ Shard 3  │
         │ User ID  │   │ User ID  │   │ User ID  │
         │ A–H      │   │ I–P      │   │ Q–Z      │
         └──────────┘   └──────────┘   └──────────┘

Shard Key Strategies:
├── Range-based   → Dễ range query (find users A–M), dễ hotspot (shard 1 overload)
├── Hash-based    → Phân bố đều, khó range query (cần hash + range hybrid)
│                  hash(user_id) % 3 → shard index, phân bố đồng đều
└── Directory-based → Lookup table lưu mapping (shard_id, key) → flexible, cần extra read
```

**Cross-shard query — giá phải trả:**
```
✅ Single-shard query:  O(1) — query tới 1 shard
❌ Cross-shard query:   Cần scatter-gather — query tất cả shard rồi merge result
                         Latency = max(all shard latencies), bandwidth = sum(all shards)
                         → Tránh cross-shard query nếu có thể
```

> 📌 **Quy tắc sharding:** shard khi **một** database không đáp ứng được tải (CPU/disk/connection), không phải vì "sẴn sàng cho tương lai". Sharding prematurely là nguồn phức tạp vô hạn.

---

## 9. Data Migration & Versioning

### Schema Migration — Version control cho database

```
migrations/
├── 20240101000000_create_users.sql
│    -- Up: tạo bảng users
│    CREATE TABLE users (...);
│    -- Down: rollback (tùy tool)
│    DROP TABLE IF EXISTS users;
│
├── 20240115000000_add_email_to_users.sql
│    -- Up: thêm cột email
│    ALTER TABLE users ADD COLUMN email VARCHAR(255);
│    -- Down:
│    ALTER TABLE users DROP COLUMN IF EXISTS email;
│
├── 20240201000000_create_orders.sql
│    -- Up: tạo bảng orders
│    CREATE TABLE orders (...);
│    -- Down:
│    DROP TABLE IF EXISTS orders;
│
└── migration_lock.toml   ← lock file, không edit tay
```

### Migration Best Practices — Quy tắc bất di bất dịch

```
✅ LUÔN làm:
• Commit migration file CÙNG với code change trong 1 commit
• Đặt tên migration rõ ràng: 001_create_users, 002_add_email_column
• Test migration trên staging BEFORE production
• Backup database trước khi migrate production (dù migration "an toàn")
• Dùng transaction cho nhiều ALTER (PostgreSQL hỗ trợ, MySQL 8.0+ hỗ trợ)
• Migration file KHÔNG bao giờ bị sửa sau khi deploy — treat as immutable history

❌ KHÔNG bao giờ:
• Edit migration file sau khi đã commit/deploy — gây inconsistency giữa dev và prod
• Xóa migration file đã apply — phá hỏng version tracking
• Chạy migration khi có người dùng active (trừ emergency fix)
• Hardcode data trong migration (trừ seed data) — seed dùng separate script
• ALTER TABLEDROP COLUMN trên production trực tiếp — dùng zero-downtime pattern
```

### Zero-Downtime Migration — Pattern 5 bước

```
Bài toán: đổi cột email VARCHAR(100) → VARCHAR(255) WITHOUT downtime

Bước 1: Thêm cột mới (nullable)
  ALTER TABLE users ADD COLUMN email_new VARCHAR(255);
  -- Table vẫn hoạt động, column mới tồn tại song song

Bước 2: Code đọc/ghi cả 2 cột
  -- Viết: ghi BOTH email và email_new
  -- Đọc: ưu tiên email_new, fallback email (backward compatible)
  -- Deploy code này TRƯỚC khi backfill

Bước 3: Backfill dữ liệu cũ sang cột mới
  UPDATE users SET email_new = email WHERE email_new IS NULL;
  -- Chạy batch nhỏ, không block long-running queries

Bước 4: Code chỉ đọc cột mới
  -- Deploy code chỉ đọc email_new
  -- backward compatibility đã tắt

Bước 5: Xóa cột cũ (sau khi verify)
  ALTER TABLE users DROP COLUMN email;
  ALTER TABLE users RENAME COLUMN email_new TO email;
  -- Done!
```

> ⚠️ **Lưu ý:** Bước 2 và 4 là "dual-write" phase — ứng dụng phải viết đồng thời cả 2 cột. Nếu quên step này, backfill sẽ missing data từ khoảng thời gian giữa step 1 và step 3.

---

## 10. Caching Strategies

### Cache Patterns — Hiểu trade-off sâu

```
┌──────────────────────────────────────────────────────────────────────┐
│ Cache-Aside (Lazy Loading) — Phổ biến nhất                          │
│                                                                      │
│  App ──▶ Cache hit? ──Yes──▶ Return cached data (fast)             │
│              │                                                     │
│              No                                                    │
│              ▼                                                     │
│         DB query ──▶ Store in cache ──▶ Return data                │
│                                                                      │
│ ✅ Đơn giản, chỉ cache khi cần                                      │
│ ❌ Cache miss ban đầu = DB hit, cache stampede (nhiều request       │
│    cùng lúc miss → cùng query DB)                                   │
│    Mitigation: single-flight (lock + queue) cho miss đầu tiên      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Write-Through                                                        │
│                                                                      │
│  App ──▶ Write Cache ──▶ Write DB (synchronous)                    │
│                                                                      │
│ ✅ Cache luôn sync với DB                                           │
│ ❌ Write latency = max(cache write, DB write) — chậm hơn            │
│ ❌ Cache write fail = DB write thành công nhưng cache stale          │
│    → dùng cho critical data (session, config)                        │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Write-Behind (Write-Back)                                            │
│                                                                      │
│  App ──▶ Write Cache ──▶ Async write DB                            │
│                                                                      │
│ ✅ Write latency thấp (chỉ ghi cache)                               │
│ ❌ Risk mất data nếu cache crash trước khi DB write                  │
│    → dùng cho high-write throughput, tolerate some loss             │
│    → Redis AOF everysec mode là compromise                          │
└──────────────────────────────────────────────────────────────────────┘
```

### Cache Invalidation — Vấn đề khó nhất trong CS

```
TTL (Time-To-Live)
→ Tự expire sau N giây. Đơn giản nhưng không guarantee fresh data.
→ Ví dụ: SET user:profile:1 "..." EX 300 (5 phút stale window)

Event-based (Publish-Invalid)
→ Khi data thay đổi, publish event → subscriber invalidate cache key
→ Fresh nhưng phức tạp: cần event bus, xử lý out-of-order events
→ Ví dụ: OrderService.update() → publish "order.updated" → cache handler DEL cache key

Version-based
→ Key chứa version number: cache:order:1:v2
→ Khi data đổi, increment version → key mới, key cũ tự expire
→ Không cần explicit invalidation nhưng key namespace phình ra

Tag-based (Cache Tagging)
→ Mỗi cached item gắn tag: "order:123", "user:456"
→ Bulk invalidate bằng tag: INVALIDATE TAG "order:123"
→ Redis 6.2+ hỗ trợ RESP3 client libraries xử lý tagging
```

### Cache Layers — Từ browser đến database buffer pool

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Browser Cache                                          │
│   HTTP Cache-Control, ETag, Last-Modified                       │
│   Effect: Giảm HTTP request completely cho static assets        │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: CDN Cache (Cloudflare, Fastly, AWS CloudFront)         │
│   Cache static assets + API responses at edge                   │
│   Effect: Giảm latency cho global users, giảm origin load       │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: Application Cache (Redis, Memcached)                   │
│   In-memory key-value store, sub-ms latency                     │
│   Effect: Giảm DB pressure, serve hot data directly             │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: Query Cache (Prepared statements, query result cache)  │
│   PostgreSQL: prepared statement cache, query plan cache        │
│   Effect: Giảm planning overhead, không duplicate parse         │
├─────────────────────────────────────────────────────────────────┤
│ Layer 5: Database Buffer Pool (InnoDB buffer pool, shared_buffers)│
│   PostgreSQL: shared_buffers (default 128MB, set to 25–40% RAM) │
│   Effect: Data pages trong RAM, tránh disk I/O                  │
└─────────────────────────────────────────────────────────────────┘
```

> 💡 **Hit rate là king:** Một cache 99% hit rate tốt hơn cache 100% hit rate nhưng cấu hình sai. Luôn monitor hit rate + latency impact, không chỉ "cache được hay không".

---

## 🗺️ Tổng Kết: Database Knowledge Map

```
Database & Data Management
├── Fundamentals
│   ├── SQL vs NoSQL — trade-offs, CAP theorem
│   ├── ACID vs BASE — consistency models
│   └── CAP Theorem — C vs A trade-off in distributed systems
├── Design
│   ├── Normalization (1NF → BCNF) — eliminate anomalies
│   ├── ER Diagrams — visualize relationships
│   └── Denormalization — deliberate redundancy for read performance
├── Performance
│   ├── Indexing (B-Tree, GIN, Partial, Covering)
│   ├── Query Optimization (EXPLAIN, plan analysis)
│   ├── Pagination (offset vs cursor)
│   └── Caching (Redis, strategies, invalidation)
├── Reliability
│   ├── Transactions (ACID, isolation levels, deadlock)
│   ├── Replication (sync/async/semi-sync, lag)
│   └── Backup & Recovery (point-in-time, PITR)
├── Scalability
│   ├── Replication (read replicas)
│   ├── Sharding (range/hash/directory)
│   └── Read/Write splitting
└── Operations
    ├── Migrations (zero-downtime, rollback)
    ├── Monitoring (slow query log, connection pool, hit rate)
    └── Alerting (disk full, replication lag, lock contention)
```

---

## 📚 Tài Liệu Tham Khảo

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Redis Documentation](https://redis.io/docs/)
- [Use The Index, Luke](https://use-the-index-luke.com/) — free book về indexing
- [Database Internals (Alex Petrov)](https://www.databass.dev/) — deep dive storage engines
- [Designing Data-Intensive Applications](https://dataintensive.net/) — Martin Kleppmann (must-read)
- [The Art of Database Schema Evolution](https://www.citusdata.com/blog/) — migration strategies

---

> 💡 **"Data is the new oil, but only if you know how to refine it."**
> — Lưu trữ dữ liệu là một chuyện, quản lý nó hiệu quả mới là nghệ thuật.
> Học database không phải để biết syntax — học để hiểu trade-off giữa consistency, availability, và performance, rồi chọn đúng công cụ cho đúng bài toán.
