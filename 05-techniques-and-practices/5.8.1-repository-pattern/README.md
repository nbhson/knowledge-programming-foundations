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

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.8.1-repository-pattern
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.8.2 Unit of Work](../5.8.2-unit-of-work/README.md)