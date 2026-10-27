# 🗃️ 10.1 SQL Basics

> **SQL** (Structured Query Language) là ngôn ngữ tiêu chuẩn để tương tác với relational databases. Nó không phải "cách gọi database" — SQL là **ngôn ngữ khai báo**: bạn mô tả **cái gì** cần, database engine quyết định **làm thế nào** để lấy. Sự tách biệt này là sức mạnh — cùng một câu query, optimizer có thể chọn plan khác nhau tùy version database, statistics, hardware.

```
┌─────────────────────────────────────────────────────────────┐
│           RELATIONAL DATABASE MODEL                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Table: users                                              │
│   ┌──────┬─────────┬───────────────┬──────────┐            │
│   │ id   │ name    │ email         │ role     │            │
│   ├──────┼─────────┼───────────────┼──────────┤            │
│   │ 1    │ Alice   │ alice@test.com│ admin    │            │
│   │ 2    │ Bob     │ bob@test.com  │ user     │            │
│   │ 3    │ Carol   │ carol@test.com│ user     │            │
│   └──────┴─────────┴───────────────┴──────────┘            │
│                                                             │
│   Primary Key (PK): id — uniquely identifies each row       │
│   Foreign Key (FK): user_id trong orders → users.id         │
│   Constraint: NOT NULL, UNIQUE, CHECK, FOREIGN KEY          │
│                                                             │
│   Mỗi cột có 1 kiểu dữ liệu (VARCHAR, INTEGER, BOOLEAN,     │
│   TIMESTAMP, DECIMAL...) — kiểu dữ liệu là phần đầu tiên    │
│   của "structure" trong Structured Query Language           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 SQL là gì và tại sao nó tồn tại?

SQL ra đời năm 1974 tại IBM (Edgar F. Codd, "A Relational Model of Data for Large Shared Data Banks"). Trước đó, data được lưu trong hierarchical/network model — phức tạp, khó truy vấn. SQL đưa vào **lý thuyết tập hợp** làm nền tảng: mỗi bảng là một quan hệ (relation), mỗi hàng là một tuple, mỗi cột là một attribute. Từ đó, mọi truy vấn trở thành **phép toán tập hợp** (select, project, join) — toán học chắc chắn, dễ suy luận.

**Ba lớp SQL quan trọng:**
- **DDL (Data Definition Language):** `CREATE`, `ALTER`, `DROP` — định nghĩa cấu trúc
- **DML (Data Manipulation Language):** `SELECT`, `INSERT`, `UPDATE`, `DELETE` — thao tác dữ liệu
- **DCL/TCL (Control Language):** `GRANT`, `REVOKE`, `BEGIN`, `COMMIT`, `ROLLBACK` — quyền và transaction

---

## 📐 SELECT Fundamentals — Từ cơ bản đến tinh tế

```sql
-- Lấy tất cả cột — CHỈ dùng khi thực sự cần, tránh SELECT *
SELECT * FROM users;
-- Vấn đề: tải về cột không dùng, waste bandwidth + memory, fragile khi schema đổi

-- Lấy cột cụ thể — explicit là explicit
SELECT id, name, email FROM users;

-- Alias — đổi tên cột trong kết quả, hữu ích cho report
SELECT id AS user_id, name AS full_name, email AS contact_email FROM users;

-- Filter với WHERE — luôn nhớ WHERE có LIMIT, tránh memory overflow
SELECT * FROM users WHERE role = 'admin' AND active = true;
-- Operator: =, !=, <>, >, <, >=, <=, IS NULL, IS NOT NULL, AND, OR, NOT

-- IN — thay thế nhiều OR
SELECT * FROM users
WHERE role IN ('admin', 'moderator', 'support')
  AND created_at BETWEEN '2024-01-01' AND '2024-12-31'
  AND name LIKE 'A%';
-- LIKE patterns: 'A%' (bắt đầu bằng A), '%son' (kết thúc bằng son), '%al%' (chứa al)
-- ILIKE (PostgreSQL) — case-insensitive LIKE

-- DISTINCT — loại bỏ duplicates
-- ⚠️ DISTINCT tốn CPU + memory, dùng khi thực sự cần
SELECT DISTINCT role FROM users;

-- ORDER BY + LIMIT/OFFSET
SELECT * FROM users
ORDER BY created_at DESC
LIMIT 10 OFFSET 20;
-- LIMIT 10 OFFSET 20 = page 3 (0-indexed), chậm khi OFFSET lớn (xem 10.5-indexes)
```

### WHERE clause — Deep dive operators

```sql
-- BETWEEN — inclusive range (inclusive cả 2 đầu)
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
-- Tương đương: WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
-- Recommend dùng < next day thay vì BETWEEN date để tránh off-by-one với timestamp

-- IS NULL / IS NOT NULL — null khác với empty string!
WHERE phone_number IS NULL        -- chưa có số điện thoại
WHERE phone_number IS NOT NULL    -- đã có số điện thoại
WHERE phone_number = ''           -- khác: có số điện thoại rỗng (khác null)

-- COALESCE — return first non-null value, safe fallback
SELECT name, COALESCE(phone, email, 'no-contact') AS fallback_contact
FROM users;

-- CASE — conditional logic trong SQL
SELECT
    name,
    salary,
    CASE
        WHEN salary > 10000 THEN 'high'
        WHEN salary > 5000 THEN 'medium'
        ELSE 'low'
    END AS salary_tier
FROM employees;
```

---

## 🔗 JOINs — Nghệ thuật kết nối các bảng

```
┌─────────────────────────────────────────────────────────────┐
│              JOIN TYPES — Visualized                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INNER JOIN   =  ──■──      (giao thoa)                    │
│  LEFT JOIN    =  ■■■■      (tất cả trái + khớp phải)       │
│  RIGHT JOIN   =      ■■■■  (khớp trái + tất cả phải)       │
│  FULL OUTER   =  ■■■■■■   (hợp của cả 2)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```sql
-- INNER JOIN — chỉ lấy rows khớp cả 2 bảng
-- Sử dụng khi: chỉ quan tâm đến orders có user tương ứng
SELECT u.name, o.order_id, o.total, o.status
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.total > 100;
-- Nếu user không có order → user bị loại khỏi kết quả

-- LEFT JOIN — giữ tất cả users, kể cả không có đơn hàng
-- Sử dụng khi: cần báo cáo TẤT CẢ users, kể cả chưa mua gì
SELECT u.name, o.order_id, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- Kết quả: user A (chưa mua) hiện diện, order_id/null, total/null

-- RIGHT JOIN — ngược LEFT JOIN, thường viết lại thành LEFT cho rõ
SELECT u.name, o.order_id
FROM orders o
RIGHT JOIN users u ON o.user_id = u.id;
-- Tương đương: LEFT JOIN users u ON u.id = o.user_id

-- FULL OUTER JOIN — tất cả từ cả 2 bảng, null ở bên nào không khớp
SELECT u.name, o.order_id
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;
-- Kết quả: user không có đơn + đơn không có user (orphan records!)

-- CROSS JOIN — tích Descartes: mỗi row × mỗi row
-- ⚠️ DANGER: 1000 users × 500 products = 500,000 rows
SELECT u.name, p.product_name
FROM users u
CROSS JOIN products p;

-- SELF JOIN — bảng tự join với chính nó
-- Ví dụ: employee có manager_id trỏ đến employee khác
SELECT e.name AS employee, m.name AS manager_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
-- Manager của CEO sẽ có manager_name = NULL (đứng đầu hierarchy)
```

### JOIN với nhiều bảng — Cascade join

```sql
-- Join 3 bảng: users → orders → order_items → products
SELECT
    u.name AS customer,
    o.order_id,
    o.total AS order_total,
    p.name AS product_name,
    oi.quantity,
    oi.price_at_buy
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= '2024-01-01'
ORDER BY o.created_at DESC;
-- Thứ tự join quan trọng về performance: join bảng nhỏ trước,
-- filtered trước để giảm intermediate result size
```

---

## 📊 Aggregation — Nhóm và tóm tắt dữ liệu

```sql
-- GROUP BY — nhóm theo cột, tính aggregate mỗi nhóm
SELECT
    department,
    COUNT(*) AS headcount,            -- số người trong department
    AVG(salary) AS avg_salary,        -- lương trung bình
    MAX(salary) AS max_salary,        -- lương cao nhất
    MIN(salary) AS min_salary,        -- lương thấp nhất
    SUM(salary) AS total_payroll      -- tổng chi phí nhân sự
FROM employees
WHERE is_active = true
GROUP BY department
HAVING COUNT(*) >= 5                -- chỉ giữ nhóm có ≥ 5 người
   AND AVG(salary) > 50000          -- và lương TB > 50k
ORDER BY avg_salary DESC;
-- Thứ tự thực thi: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
-- Hiểu order này giúp debug query sai logic

-- Common aggregate functions
-- COUNT(*), COUNT(column), COUNT(DISTINCT column)
-- SUM(column), AVG(column), MIN(column), MAX(column)
-- STRING_AGG(column, ',') — concatenate strings (PostgreSQL)
-- ARRAY_AGG(column) — collect into array (PostgreSQL)
```

### GROUPING SETS — Aggregate nhiều chiều cùng lúc

```sql
--/report doanh thu theo ngày, theo tháng, và tổng toàn bộ
SELECT
    DATE_TRUNC('day', created_at) AS day,
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS orders,
    SUM(total) AS revenue
FROM orders
GROUP BY GROUPING SETS (
    (day),        -- breakdown theo ngày
    (month),      -- breakdown theo tháng
    ()            -- grand total
)
ORDER BY month DESC, day DESC;
-- hữu ích cho report dashboard, không cần 3 query riêng
```

---

## 🔍 Subqueries — Query trong query

```sql
-- Scalar subquery — trả về 1 giá trị duy nhất
-- "Tìm user có salary cao hơn trung bình"
SELECT name, salary
FROM users
WHERE salary > (SELECT AVG(salary) FROM users);
-- ⚠️ Nếu subquery trả về nhiều rows, scalar subquery sẽ lỗi

-- IN subquery — so sánh với tập giá trị
SELECT * FROM orders
WHERE user_id IN (SELECT id FROM users WHERE role = 'admin');
-- ⚠️ IN với subquery lớn có thể slow — dùng EXISTS thay thế nếu chỉ check existence

-- EXISTS subquery — check tồn tại, hiệu quả hơn IN cho large sets
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
-- EXISTS dừng ngay khi tìm thấy 1 match — không cần đếm tất cả

-- Derived table (subquery trong FROM) — materialize trước rồi join
SELECT dept_name, avg_salary
FROM (
    SELECT department, AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department
) AS dept_stats
WHERE avg_salary > 50000
ORDER BY avg_salary DESC;
-- Lưu ý: derived table phải có alias (dept_stats), không có alias = syntax error

-- Correlated subquery — phụ thuộc outer query, chạy 1 lần per row
-- ⚠️ Có thể rất chậm: N rows × M lookups = O(N×M)
SELECT u.name,
    (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
FROM users u;
-- Rewrite thành JOIN thường nhanh hơn:
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

### CTE (Common Table Expression) — Named subquery, readable hơn

```sql
-- CTE — define before main query, multiple CTEs supported
WITH active_users AS (
    SELECT id, name, email
    FROM users
    WHERE is_active = true AND created_at > '2023-01-01'
),
user_orders AS (
    SELECT user_id, COUNT(*) AS total_orders, SUM(total) AS lifetime_value
    FROM orders
    WHERE status = 'completed'
    GROUP BY user_id
)
SELECT
    au.name,
    au.email,
    uo.total_orders,
    uo.lifetime_value
FROM active_users au
LEFT JOIN user_orders uo ON au.id = uo.user_id
ORDER BY uo.lifetime_value DESC
LIMIT 10;
-- Lợi ích: readable, reusable (có thể refer nhiều lần), recursive CTE support
-- PostgreSQL recursive CTE: traverse hierarchy, graph traversal
```

---

## 💻 TypeScript + SQL — Integration patterns

```typescript
import postgres from 'postgres';

// Connection pool — tái sử dụng connections, tránh handshake overhead
const sql = postgres(process.env.DATABASE_URL!, {
  max: 20,                  // max connections in pool
  idle_timeout: 30,         // close idle connection after 30s
  connect_timeout: 10,      // fail fast if can't connect
});

// Parameterized query — CHỐNG SQL injection!
// ❌ NEVER: `SELECT * FROM users WHERE email = '${userInput}'`
// ✅ ALWAYS: template literal với parameter binding
async function getUserById(id: number) {
  return sql`SELECT * FROM users WHERE id = ${id}`;
}

async function searchUsers(query: string) {
  // ILIKE = case-insensitive LIKE (PostgreSQL)
  // LIKE = case-sensitive
  return sql`
    SELECT id, name, email
    FROM users
    WHERE name ILIKE ${`%${query}%`}
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 20
  `;
}

// Transaction — atomic multi-statement
async function transferFunds(fromId: number, toId: number, amount: number) {
  return sql.begin(async (sql) => {
    // Trừ tài khoản gửi
    const sender = await sql`
      UPDATE accounts SET balance = balance - ${amount}
      WHERE id = ${fromId} AND balance >= ${amount}
      RETURNING id, balance
    `;
    if (sender.length === 0) throw new Error('Insufficient funds');

    // Cộng tài khoản nhận
    await sql`
      UPDATE accounts SET balance = balance + ${amount}
      WHERE id = ${toId}
      RETURNING id, balance
    `;

    // Ghi audit log
    await sql`
      INSERT INTO transactions (from_id, to_id, amount, created_at)
      VALUES (${fromId}, ${toId}, ${amount}, NOW())
    `;

    // Nếu bất kỳ step nào throw → automatic ROLLBACK
    // Nếu tất cả ok → automatic COMMIT
  });
}

// Batch INSERT — 1 lần round-trip thay vì N lần
async function bulkInsertUsers(users: Array<{ name: string; email: string }>) {
  return sql`
    INSERT INTO users (name, email, created_at)
    VALUES ${sql(users.map(u => [u.name, u.email, new Date()]))}
  `;
}

// Raw query — when ORM/cursor can't express it (rare)
async function getRevenueByMonth() {
  return sql`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      SUM(total) AS revenue,
      COUNT(*) AS orders
    FROM orders
    WHERE status = 'completed'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;
}

// Cleanup — close pool on shutdown
process.on('SIGINT', async () => {
  await sql.end();
  process.exit(0);
});
```

---

## ✅ Best Practices — Quy tắc thực hành

| Thực hành | Giải thích | Tại sao quan trọng |
|-----------|-----------|-------------------|
| Luôn dùng parameterized queries | `sql\`... ${value}\`` thay vì string concatenation | Chống SQL injection — top 1 OWASP vulnerability |
| Tạo index cho cột thường query | WHERE/JOIN/ORDER BY columns | Giảm query time từ seconds → milliseconds |
| Tránh `SELECT *` | Chỉ chọn cột cần thiết | Giảm memory, bandwidth, network overhead |
| Dùng transaction cho nhiều thao tác | BEGIN → multi-statement → COMMIT/ROLLBACK | Đảm bảo atomicity — all-or-nothing guarantee |
| Chuẩn hóa schema (3NF) | Loại bỏ redundancy, enforce constraints | Prevent update anomalies, data inconsistency |
| Dùng EXPLAIN ANALYZE trước khi optimize | Nhìn query plan thực tế | Optimize đúng chỗ, không phải intuition |
| Thao tác batch | Batch INSERT/UPDATE thay vì từng row | Giảm round-trip overhead, tăng throughput |
| Monitor slow query log | Catch queries > threshold (e.g., 1s) | Proactive optimization, not reactive fire-fighting |

**Common anti-patterns to avoid:**
- `SELECT *` trong production — fragile khi schema change, waste bandwidth
- String concatenation cho SQL — SQL injection risk
- N+1 queries — loop in app code calling DB per iteration (use JOIN hoặc batch)
- Over-indexing — mỗi index làm chậm write operations
- Không có WHERE trong UPDATE/DELETE — "where is the WHERE clause?!" horror stories

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.1-sql-basics
npx ts-node examples/index.ts
```

Khi chạy demo, để ý:
- Mỗi query in ra kết quả dạng bảng, minh họa rõ cấu trúc relation
- Transaction demo cho thấy `begin()`/`commit()`/`rollback()` flow thực tế
- Parameterized query demo chứng minh SQL injection prevention

---

## ⏭️ Bài tiếp theo

→ [10.2 MongoDB](../10.2-mongodb/README.md)
