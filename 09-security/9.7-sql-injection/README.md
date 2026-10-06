# 💉 9.7 SQL Injection (Khai Thác & Phòng Chống)

> **SQL injection** xảy ra khi input user bị nối thẳng vào câu SQL — attacker biến **data thành code**. Phòng chống duy nhất đúng: **parameterized queries** — không bao giờ nối chuỗi SQL.

---

## 🎯 Vấn đề

Nối chuỗi trông vô hại nhưng là cửa sau cho attacker:

```typescript
// ❌ VULNERABLE
const sql = `SELECT * FROM users WHERE id = '${userInput}'`;
// userInput = '1' OR '1'='1' → trả về TOÀN BỘ users!
// userInput = ''; DROP TABLE users; -- → xóa bảng!
```

OWASP A03: injection vẫn top 3 sau 20 năm vì quá dễ mắc.

---

## 💻 Code ví dụ

Mô phỏng query builder vulnerable vs safe (parameterized).

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

// ❌ Nối chuỗi: input điều khiển được cấu trúc SQL
function vulnerable(id: string): string {
  return `SELECT * FROM users WHERE id = '${id}'`;
}
vulnerable("1' OR '1'='1"); // → SELECT ... WHERE id = '1' OR '1'='1' 💥

// ✅ Parameterized: input LUÔN là data, DB tự escape
function safe(): { sql: string; params: unknown[] } {
  return { sql: "SELECT * FROM users WHERE id = ?", params: ["1' OR '1'='1"] };
}
// DB tìm user có id đúng bằng chuỗi đó → 0 rows, không vỡ ✅
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Triệt tiêu SQLi | Placeholder `?/$1` tách code khỏi data ở tầng protocol — attacker không thể "thoát" ra khỏi data |
| Rõ ràng + nhanh | Query plan cache được theo template; code đọc rõ input nào đi đâu |
| Miễn phí với ORM | Prisma/TypeORM/Sequelize đều parameterized mặc định — chỉ vỡ khi dùng `raw()` nối chuỗi |

---

## ⚠️ Lưu Ý

- Payloads phổ biến phải nhận ra: `' OR '1'='1`, `'; DROP TABLE--`, `UNION SELECT`, `SLEEP(5)` (blind), `information_schema` enumeration.
- Tên bảng/cột **không parameterize được** → dùng allowlist map (`sort=price` → `ORDER BY price`), không bao giờ nhận tên cột từ user.
- `LIKE` có wildcard `%/_`: escape riêng. Second-order injection: data đã lưu DB vẫn phải parameterized khi query lại.
- Defense in depth: least-privilege DB user (app không có quyền DROP), WAF chỉ là lớp phụ.

---

## 🎯 Khi nào dùng

- Mọi query có input từ user: login, search, filter, sort, pagination — không ngoại lệ.
- Audit: grep `+` nối chuỗi trong SQL, mọi `queryRaw`/template literal chứa `${}`.

---

## 🔗 Liên quan

- **9.1 OWASP Top 10** — injection (A03) và cách xếp hạng.
- **9.4 XSS & CSRF** — cùng gốc "tin input": encode output thay vì nối HTML.
- **10.1 SQL Basics** — viết SELECT/JOIN đúng trước khi bảo vệ nó.

---

## 📚 Tài liệu

- OWASP SQL Injection — https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- PortSwigger SQLi Labs — https://portswigger.net/web-security/sql-injection
- Bobby Tables — https://bobby-tables.com/

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.7-sql-injection
npx ts-node examples/index.ts
```

Demo: 4 payloads kinh điển qua builder vulnerable (đều đổi cấu trúc SQL) vs safe builder (đều thành data vô hại).

---

## ⏭️ Bài tiếp theo

→ [9.8 Password Hashing](../9.8-password-hashing/README.md)
