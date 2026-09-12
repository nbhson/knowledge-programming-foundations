# 🗃️ 10.1 SQL Basics

> **SQL** (Structured Query Language) là ngôn ngữ tiêu chuẩn để tương tác với relational databases.

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
│   Primary Key (PK): id                                      │
│   Foreign Key (FK): user_id trong orders → users.id         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 SELECT Fundamentals

```sql
-- Lấy tất cả cột
SELECT * FROM users;

-- Lấy cột cụ thể
SELECT id, name, email FROM users;

-- Alias
SELECT id AS user_id, name AS full_name FROM users;

-- Filter với WHERE
SELECT * FROM users WHERE role = 'admin' AND active = true;

-- IN, BETWEEN, LIKE
SELECT * FROM users
WHERE role IN ('admin', 'moderator')
  AND created_at BETWEEN '2024-01-01' AND '2024-12-31'
  AND name LIKE 'A%';

-- DISTINCT — không trùng lặp
SELECT DISTINCT role FROM users;

-- ORDER BY + LIMIT
SELECT * FROM users ORDER BY created_at DESC LIMIT 10 OFFSET 20;
```

---

## 🔗 JOINs

```
┌─────────────────────────────────────────────────────────────┐
│              JOIN TYPES                                     │
├──────────────┬──────────────────────────────────────────────┤
│ INNER JOIN   │ Chỉ lấy rows khớp ở CẢ 2 bảng                │
│ LEFT JOIN    │ Tất cả rows từ bảng trái + khớp bên phải    │
│ RIGHT JOIN   │ Tất cả rows từ bảng phải + khớp bên trái    │
│ FULL JOIN    │ Tất cả rows từ cả 2 bảng                     │
└──────────────┴──────────────────────────────────────────────┘
```

```sql
-- INNER JOIN
SELECT u.name, o.order_id, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN (giữ tất cả users, kể cả không có đơn hàng)
SELECT u.name, o.order_id, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- RIGHT JOIN
SELECT u.name, o.order_id
FROM orders o
RIGHT JOIN users u ON o.user_id = u.id;

-- SELF JOIN (table tự join)
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

---

## 📊 Aggregation

```sql
-- GROUP BY + Aggregate Functions
SELECT
  role,
  COUNT(*) AS total_users,
  AVG(created_at) AS avg_created,
  MAX(created_at) AS latest_user,
  MIN(created_at) AS first_user
FROM users
GROUP BY role
HAVING COUNT(*) > 5
ORDER BY total_users DESC;

-- Common aggregate functions
-- COUNT(), SUM(), AVG(), MIN(), MAX()
```

---

## 🔍 Subqueries

```sql
-- Scalar subquery
SELECT name FROM users
WHERE salary > (SELECT AVG(salary) FROM users);

-- IN subquery
SELECT * FROM orders
WHERE user_id IN (SELECT id FROM users WHERE role = 'admin');

-- EXISTS subquery
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- Derived table (subquery trong FROM)
SELECT dept_name, avg_salary
FROM (
  SELECT department, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY department
) AS dept_stats
WHERE avg_salary > 50000;
```

---

## 💻 TypeScript + SQL

```typescript
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL!);

// Parameterized query — an toàn khỏi SQL injection
async function getUserById(id: number) {
  return sql`SELECT * FROM users WHERE id = ${id}`;
}

async function searchUsers(query: string) {
  return sql`
    SELECT * FROM users
    WHERE name ILIKE ${`%${query}%`}
    ORDER BY created_at DESC
    LIMIT 20
  `;
}

// Transaction
await sql.begin(async (sql) => {
  await sql`INSERT INTO accounts (user_id, balance) VALUES (1, 100)`;
  await sql`UPDATE users SET status = 'active' WHERE id = 1`;
});
```

---

## ✅ Best Practices

| Thực hành | Giải thích |
|-----------|-----------|
| Luôn dùng parameterized queries | Chống SQL injection |
| Tạo index cho cột thường query | Tăng tốc độ tìm kiếm |
| Tránh `SELECT *` | Chỉ chọn cột cần thiết |
| Dùng transaction cho nhiều thao tác | Đảm bảo atomicity |
| Chuẩn hóa schema (3NF) | Giảm dư thừa dữ liệu |

---

⏭️ Bài tiếp theo → [10.2 MongoDB](../10.2-mongodb/README.md)
