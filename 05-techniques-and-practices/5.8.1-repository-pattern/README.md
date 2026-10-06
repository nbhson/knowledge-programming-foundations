# 🗄️ 5.8.1 Repository Pattern

> Repository = lớp **trừu tượng hóa truy xuất dữ liệu**. Service chỉ biết interface, không biết đó là InMemory hay PostgreSQL → đổi DB, thêm cache, mock cho test đều không đụng business logic.

---

## 🎯 Vấn đề

```
❌ Service gọi SQL trực tiếp:
   OrderService.query("SELECT * FROM users WHERE id=$1")
   → đổi MongoDB là phải sửa khắp service, khó test

✅ Service phụ thuộc INTERFACE:
   UserService → UserRepository (interface)
                     ├── InMemoryUserRepo (test/dev)
                     └── PostgresUserRepo (prod)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface UserRepository {
  findById(id: string): User | null;
  findByEmail(email: string): User | null;
  all(): User[];
  save(user: User): User;
  remove(id: string): void;
}

// ✅ Implementation 1 — InMemory (test)
class InMemoryUserRepository implements UserRepository { /* Map<string,User> */ }

// ✅ Implementation 2 — PostgreSQL (prod, chỉ giả lập trong demo)
class PostgresUserRepository extends InMemoryUserRepository { /* query thật */ }

// ✅ Service chỉ biết interface
class UserService {
  constructor(private readonly repo: UserRepository) {}
  // repo.findById / repo.save ... — KHÔNG thấy SQL
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🔌 **Đổi DB không đụng service** | Viết thêm 1 repo mới là xong |
| 🧪 **Test dễ** | Bơm InMemory/mock vào thay Postgres thật |
| 🧹 **SQL tập trung 1 nơi** | Dễ review, dễ tối ưu câu query |
| 🔐 **Che chi tiết storage** | Service không biết là SQL hay Redis |

---

## ❌ BAD — thêm 1 case: repository rò rỉ chi tiết storage

```typescript
// ❌ BAD — tên interface "chung" nhưng lộ SQL + kiểu DB cụ thể
interface UserRepository {
  findById(id: string): User | null;
  queryRaw(sql: string, params: unknown[]): unknown[]; // caller vẫn viết SQL!
  getPgClient(): PgClient;                             // lộ Postgres
}

// ✅ GOOD — interface chỉ nói ngôn ngữ nghiệp vụ, storage giấu kín
interface UserRepository {
  findById(id: string): User | null;
  findActiveSince(since: Date): User[];
  save(user: User): User;
}
```

> Repository rò SQL/client DB = trừu tượng hình thức: đổi DB vẫn phải sửa mọi caller. Test nhanh: **đọc interface có đoán ra đang dùng DB gì không?** Nếu có → rò rỉ.

---

## ⚖️ Trade-off: repository vs các lựa chọn khác

| Lựa chọn | Khi nào hơn Repository | Khi nào thua |
|----------|------------------------|--------------|
| **Gọi ORM trực tiếp** (Prisma/TypeORM) | CRUD đơn giản, team nhỏ, 1 DB duy nhất | Đổi DB/cache khó; logic query rải khắp service |
| **DAO** (1 DAO = 1 table) | Muốn ánh xạ sát schema DB | Nghiệp vụ phải tự join nhiều DAO; repository gom theo aggregate gọn hơn |
| **Active Record** (`user.save()`) | Prototype nhanh, ít lớp | Entity dính persistence, khó test, khó đổi storage |
| **Repository + Unit of Work** (5.8.2) | Nhiều aggregate, cần transaction | Thêm 1 lớp — overkill cho CRUD 1 bảng |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| God repository (`findByX` phình 30 method) | Interface khổng lồ, khó mock | Tách theo aggregate; query phức tạp → Specification/criteria object |
| Trả entity "sống" cho caller sửa trực tiếp | Caller đổi field, save ở đâu không rõ | Trả bản sao hoặc entity có phương thức domain rõ ràng |
| `save()` vừa insert vừa update ma thuật | Caller không biết khi nào tạo mới/khi nào ghi đè | Tách `add`/`update`, hoặc document rõ upsert semantics |
| Quên test với implementation thật | InMemory xanh nhưng Postgres đỏ (NULL, transaction, collation) | Contract test: cùng 1 bộ test chạy trên mọi implementation |

---

## ✅ Checklist khi review

- [ ] Interface không lộ SQL, client DB, hay kiểu storage cụ thể?
- [ ] Mỗi repository tương ứng 1 aggregate (không god repository)?
- [ ] Có ≥ 2 implementation (InMemory cho test + DB thật)?
- [ ] Cùng bộ contract test chạy trên mọi implementation?
- [ ] Ngữ nghĩa `save/add/update/delete` rõ ràng (không upsert ma thuật)?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.8.1-repository-pattern
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.8.2 Unit of Work](../5.8.2-unit-of-work/README.md)