# ⚙️ 5.8 Data Handling (Xử Lý Dữ Liệu)

> **Data Handling** là các pattern quản lý dữ liệu giữa ứng dụng và storage — Repository, Unit of Work, DTO.

```
Data Flow trong ứng dụng:
  UI ←→ Service ←→ Repository ←→ Database
              ↓
           DTO (giới hạn dữ liệu gửi đi)
```

---

## 🗄️ Repository Pattern

**Mô tả:** Trừu tượng hóa **truy xuất dữ liệu** — lớp giữa business logic và database.

```
┌─────────────────────────────────────────────────────┐
│  Service Layer                                      │
│  ─ OrderService                                     │
│  ─ Uses: OrderRepository (interface)                │
│          không biết PostgreSQL / MongoDB / Redis    │
└───────────────────────┬─────────────────────────────┘
                        │ depends on interface
                        ▼
┌─────────────────────────────────────────────────────┐
│  Repository Layer                                   │
│  ─ OrderRepository (interface)                      │
│  ─ PostgresOrderRepository                          │
│  ─ MongoOrderRepository                             │
│  ─ InMemoryOrderRepository (testing)                │
└─────────────────────────────────────────────────────┘
```

```typescript
// Interface — định nghĩa CONTRACT
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(page: number, limit: number): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// PostgreSQL Implementation
class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.query('SELECT * FROM users WHERE email = $1', [email]);
  }

  async save(user: User): Promise<User> {
    const result = await this.db.query(
      `INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *`,
      [user.name, user.email, user.role]
    );
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

// In-memory (cho testing)
class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  // findAll, findByEmail...
}
```

---

## 🔄 Unit of Work

**Mô tả:**.Group multiple repository operations vào **một transaction** — commit cả batch hoặc rollback.

```
Unit of Work Flow:
  1. Begin transaction
  2. repository.save(user)     → stage change
  3. repository.save(order)    → stage change
  4. uow.commit()             → execute all or rollback all
```

```typescript
class UnitOfWork {
  private operations: DatabaseOperation[] = [];
  private transaction?: Transaction;

  constructor(private db: Database) {}

  begin(): void {
    this.transaction = this.db.beginTransaction();
  }

  addOperation(op: DatabaseOperation): void {
    this.operations.push(op);
  }

  async commit(): Promise<void> {
    if (!this.transaction) throw new Error('No transaction started');

    try {
      for (const op of this.operations) {
        await op.execute(this.transaction);
      }
      await this.transaction.commit();
      this.operations = [];
    } catch (error) {
      await this.transaction.rollback();
      throw error;
    }
  }

  async rollback(): Promise<void> {
    await this.transaction?.rollback();
    this.operations = [];
  }
}

// Usage — atomic batch operation
const uow = new UnitOfWork(db);
uow.begin();

uow.addOperation({
  execute: (tx) => tx.insert('orders', { userId, productId, qty: 1 }),
});
uow.addOperation({
  execute: (tx) => tx.update('inventory', { decrement: 1 }, { productId }),
});
uow.addOperation({
  execute: (tx) => tx.insert('order_items', { orderId, productId, qty: 1 }),
});

await uow.commit(); // Tất cả thành công HOẶC rollback cùng lúc
```

---

## 📦 DTO (Data Transfer Object)

**Mô tả:** Object trung gian truyền dữ liệu giữa các lớp — **cách ly entity khỏi API response**.

```
Entity (bên trong)          DTO (ra ngoài)
┌─────────────────┐         ┌─────────────────┐
│ User            │         │ UserDTO         │
│ ├─ id           │         │ ├─ id           │
│ ├─ name         │────────▶│ ├─ name         │
│ ├─ email        │  copy   │ ├─ email        │
│ ├─ passwordHash │  ❌     │ │  (không có!)  │
│ ├─ createdAt    │         │ ├─ createdAt    │
│ └─ ...          │         │ └─ ...          │
└─────────────────┘         └─────────────────┘
```

```typescript
// Entity — chứa business logic + sensitive data
class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public passwordHash: string, // 🔒 Không bao giờ expose
    public role: 'admin' | 'user',
    public createdAt: Date
  ) {}
}

// DTO — chỉ expose trường an toàn
class UserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;

  static fromEntity(user: User): UserResponseDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      // passwordHash NOT included ✅
    };
  }
}

// Usage in controller
app.get('/api/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json(UserResponseDTO.fromEntity(user));
});
```

---

## 🎯 So sánh patterns

| Pattern | Mục đích | Khi dùng |
|---------|----------|----------|
| **Repository** | Trừu tượng DB access | Mọi app có database |
| **Unit of Work** | Atomic transactions | Khi cần nhiều operations cùng lúc |
| **DTO** | Giới hạn dữ liệu expose | API responses, requests |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Cần thay đổi DB mà không sửa service | ✅ Repository Pattern |
| Nhiều DB writes phải atomically | ✅ Unit of Work |
| API response cần ẩn field nhạy cảm | ✅ DTO |
| Testing với in-memory DB | ✅ Repository + InMemory impl |
| Shared code giữa frontend/backend | ✅ DTO (shared types) |

---

## 🔗 Liên quan

- **5.6 Error Handling** — Unit of Work + Saga pattern kết hợp
- **5.7 Refactoring** — DTO giúp tách biệt concerns
- **1.3 Clean Architecture** — Repository trong data layer

---

## 📚 Tài liệu tham khảo

- 📖 [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- 📖 [Unit of Work - Martin Fowler](https://martinfowler.com/eaaCatalog/unitOfWork.html)
- 📖 [DTO Pattern](https://docs.microsoft.com/en-us/dotnet/standard/microservices-architecture/microservice-ddd-cqrs-patterns/application-service)

---

## ⏭️ Bài tiếp theo

→ [5.9 Code Organization](./5.9-code-organization/README.md)
