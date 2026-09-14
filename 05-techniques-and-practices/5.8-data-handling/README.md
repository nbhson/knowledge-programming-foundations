# ⚙️ 5.8 Data Handling (Xử Lý Dữ Liệu)

> **Data Handling** là các pattern quản lý dữ liệu giữa ứng dụng và storage — Repository, Unit of Work, DTO. Mục tiêu: **trừu tượng hóa storage**, **đảm bảo atomicity**, **che 민감 dữ liệu** — giúp business logic độc lập với chi tiết kỹ thuật.

```
Data Flow trong ứng dụng:
  UI ←→ Controller ←→ Service ←→ Repository ←→ Database
                   ↓              ↓
                  DTO (request)  DTO (response, sanitized)
```

**Vấn đề cốt lõi:** Không có pattern → **leaky abstraction**. Service biết SQL, Controller biết ORM entity, UI nhận raw DB row. Đổi DB = đổi hàng chục file. Data-sensitive fields (password, SSN) rò rỉ qua API. Transaction không atomic → data inconsistency.

> 📌 **Nguyên tắc: "Biến đổi dữ liệu gần nơi nó cần"** — DTO mapping ở boundary (controller/repository), không scatter khắp service.

---

## 📚 Mục Lục

| # | Pattern | Mục Đích |
|---|---------|----------|
| 5.8.1 | [Repository Pattern](../5.8.1-repository-pattern/README.md) | Trừu tượng hóa truy xuất dữ liệu |
| 5.8.2 | [Unit of Work](../5.8.2-unit-of-work/README.md) | Gom nhiều thao tác thành 1 transaction |
| 5.8.3 | [DTO](../5.8.3-dto/README.md) | Che field nhạy cảm, validate dữ liệu ra/vào |

---

## 🗄️ Repository Pattern

**Mô tả:** Repository là **abstraction over data access** — business logic giao tiếp với repository interface, không trực tiếp gọi SQL/ORM. Repository **đóng gói** chi tiết lưu trữ (SQL, MongoDB, Redis, in-memory) và expose **domain-oriented** query interface.

**Tại sao cần?**
1. **Testability:** Dùng `InMemoryRepository` trong test — không cần DB thực, test chạy nhanh (ms thay vì giây).
2. **Swappable storage:** Đổi PostgreSQL → MongoDB → MySQL → chỉ cần viết lại implementation, service không đổi.
3. **Single source of query logic:** Query phức tạp (JOIN, pagination, filtering) nằm 1 chỗ → dễ optimize, dễ test.
4. **Domain language:** Repository expose `findByEmail()` thay vì `query('SELECT * FROM users WHERE email = ?')` — business team đọc được.

```
┌─────────────────────────────────────────────────────┐
│  Service Layer                                      │
│  ─ OrderService                                     │
│  ─ Uses: OrderRepository (interface)                │
│          không biết PostgreSQL / MongoDB / Redis    │
└───────────────────────┬─────────────────────────────┘
                        │ depends on interface only
                        ▼
┌─────────────────────────────────────────────────────┐
│  Repository Layer                                   │
│  ─ OrderRepository (interface/abstract)             │
│  ─ PostgresOrderRepository                          │
│  ─ MongoOrderRepository                             │
│  ─ InMemoryOrderRepository (testing)                │
└─────────────────────────────────────────────────────┘
```

**Implementation example:**
```typescript
// 1. Interface —契约，业务层只依赖这个
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(page: number, limit: number): Promise<Paginated<User>>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// 2. PostgreSQL Implementation
class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return row[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE email = $1',
      [email]
    );
    return row[0] ?? null;
  }

  async findAll(page: number, limit: number): Promise<Paginated<User>> {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.db.query(
        'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      ),
      this.db.query('SELECT COUNT(*) as count FROM users'),
    ]);
    return { data: rows, total: Number(total[0].count), page, limit };
  }

  async save(user: User): Promise<User> {
    const result = await this.db.query(
      `INSERT INTO users (name, email, role, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [user.name, user.email, user.role, new Date()]
    );
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

// 3. In-memory Implementation (testing)
class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();
  private idCounter = 1;

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values())
      .find(u => u.email === email) ?? null;
  }

  async findAll(page: number, limit: number): Promise<Paginated<User>> {
    const all = Array.from(this.users.values());
    const offset = (page - 1) * limit;
    return {
      data: all.slice(offset, offset + limit),
      total: all.length,
      page,
      limit,
    };
  }

  async save(user: User): Promise<User> {
    const entity: User = {
      ...user,
      id: user.id ?? String(this.idCounter++),
      createdAt: user.createdAt ?? new Date(),
    };
    this.users.set(entity.id, entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}
```

> 💡 **Repository vs DAO (Data Access Object):** Repository mang tính **domain-oriented** (expose `findByEmail`, `findByCartTotal`), DAO mang tính **table-oriented** (expose `insert`, `update`, `delete` theo CRUD). Repository better cho domain modeling.

**Khi nào KHÔNG dùng Repository:**
- CRUD thuần túy, không có business logic → ORM service trực tiếp đủ.
- Query quá phức tạp, custom SQL nhiều → dùng Query Object pattern hoặc raw SQL với comment giải thích.
- Read-heavy, performance critical → bypass repository, direct query với caching layer.

✅ **Ưu điểm:** Abstraction, testability, swappable storage, domain-oriented queries.
❌ **Nhược điểm:** Boilerplate (interface + N implementations), Over-abstraction cho simple CRUD.

---

## 🔄 Unit of Work — Atomic Batch Operations

**Mô tả:** Unit of Work (UoW) **gôm nhiều repository operations** thành **một transaction duy nhất** — hoặc commit tất cả, hoặc rollback tất cả. Không có UoW, multiple repository calls có thể dẫn đến **partial update** (order created, stock not decremented → data inconsistency).

**Cơ chế hoạt động:**
1. `begin()` — mở transaction.
2. Mỗi repository `save()` **stage** thay đổi vào UoW (chưa commit vào DB).
3. `commit()` — execute tất cả staged operations trong 1 transaction.
4. Nếu bất kỳ operation fail → `rollback()` undo tất cả.

```
Unit of Work Flow:
  1. Begin transaction
  2. orderRepo.save(order)       → stage: INSERT orders
  3. inventoryRepo.decrement(id) → stage: UPDATE inventory
  4. paymentRepo.charge()        → stage: INSERT payments
  5. uow.commit()                → execute all OR rollback all
```

```typescript
interface DatabaseOperation {
  execute(transaction: Transaction): Promise<void>;
}

class UnitOfWork {
  private operations: DatabaseOperation[] = [];
  private transaction?: Transaction;

  constructor(private db: Database) {}

  begin(): void {
    if (this.transaction) {
      throw new Error('UnitOfWork already has an active transaction');
    }
    this.transaction = this.db.beginTransaction();
    this.operations = [];
  }

  addOperation(op: DatabaseOperation): void {
    if (!this.transaction) {
      throw new Error('Call begin() before addOperation()');
    }
    this.operations.push(op);
  }

  async commit(): Promise<void> {
    if (!this.transaction) throw new Error('No transaction started');

    try {
      // Execute all operations within the same transaction
      for (const op of this.operations) {
        await op.execute(this.transaction);
      }
      await this.transaction.commit();
      this.operations = [];
    } catch (error) {
      // Atomic rollback on any failure
      await this.rollback();
      throw error;
    }
  }

  async rollback(): Promise<void> {
    await this.transaction?.rollback();
    this.transaction = undefined;
    this.operations = [];
  }
}

// Usage — atomic batch operation
const uow = new UnitOfWork(db);
uow.begin();

try {
  // Step 1: Create order
  uow.addOperation({
    execute: async (tx) => {
      const result = await tx.insert('orders', {
        userId, productId, quantity: 1, status: 'PENDING', createdAt: new Date(),
      });
      return result.insertId;
    },
  });

  // Step 2: Decrement inventory (depends on order insertId)
  uow.addOperation({
    execute: async (tx) => {
      await tx.update('inventory',
        { stock: { $subtract: ['$stock', 1] } },
        { productId }
      );
    },
  });

  // Step 3: Record payment
  uow.addOperation({
    execute: async (tx) => {
      await tx.insert('payments', { orderId, amount, status: 'CHARGED' });
    },
  });

  await uow.commit(); // All succeed OR all rollback
} catch (err) {
  console.error('Transaction failed, rolled back:', err);
  // Data consistent: no partial state
}
```

> ⚠️ **Important:** UoW đảm bảo **transactional atomicity within ONE database**. Nếu các operations nằm ở **different databases/services**, UoW không đủ — cần **Saga Pattern** (5.6.3).

**UoW vs manual transaction:**
| | Manual `BEGIN...COMMIT` | Unit of Work |
|--|------------------------|--------------|
| Coordination | Developer nhớ gọi begin/commit/rollback | UoW object quản lý lifecycle |
| Nesting | Khó, cần savepoint | UoW có thể compose |
| Testability | Khó mock transaction | Inject fake UoW trong test |
| Cross-operation deps | Hard to pass intermediate results | Operations có shared context |

✅ **Ưu điểm:** Guarantee atomicity, clean separation, easier testing.
❌ **Nhược điểm:** Không giải quyết distributed transaction (cần Saga); overhead nếu chỉ 1 operation.

---

## 📦 DTO (Data Transfer Object)

**Mô tả:** DTO là **object trung gian** truyền dữ liệu giữa các layer (controller ↔ service ↔ repository) hoặc giữa client ↔ server. DTO **che** internal entity structure, **validates** input, và **formats** output — tạo boundary rõ giữa internal model và external contract.

```
Entity (bên trong)                    DTO (ra ngoài)
┌─────────────────────────┐           ┌─────────────────────────┐
│ User                    │           │ UserResponseDTO         │
│ ├─ id: string           │           │ ├─ id: string           │
│ ├─ name: string         │──────────▶│ ├─ name: string         │
│ ├─ email: string        │   map     │ ├─ email: string        │
│ ├─ passwordHash: string │   ❌      │ │  (không có!)          │
│ ├─ role: 'admin'|'user' │           │ ├─ role: string         │
│ ├─ createdAt: Date      │           │ ├─ createdAt: Date      │
│ └─ ...                  │           │ └─ ...                  │
└─────────────────────────┘           └─────────────────────────┘
       Internal                          External (API response)
```

**Security: Che sensitive fields:**
```typescript
// Entity — chứa business logic + sensitive data
class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public passwordHash: string, // 🔒 Không bao giờ expose ra ngoài
    public role: 'admin' | 'user',
    public createdAt: Date
  ) {}
}

// Response DTO — chỉ expose trường an toàn
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

// Request DTO — validate input shape
class CreateUserRequestDTO {
  name!: string;
  email!: string;
  password!: string; // plain text — validate trong service, hash trước save
}
```

**Khi DTO thực sự cần thiết:**
1. **Security:** Che passwordHash, SSN, internal IDs, sensitive PII.
2. **API contract stability:** Entity đổi schema (thêm field mới), API version cũ vẫn trả về DTO cũ.
3. **Validation gate:** DTO + Zod/ Joi validator ở boundary — reject invalid input trước khi vào service.
4. **Cross-process:** DTO serialization (JSON) qua network; entity không thể serialize trực tiếp (có method, circular ref).
5. **Different consumers:** Mobile app cần subset fields, web app cần full — DTO khác nhau cho cùng entity.

```typescript
// Controller — DTO as boundary
app.get('/api/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  // Transform entity → DTO trước send response
  res.json(UserResponseDTO.fromEntity(user));
});

app.post('/api/users', async (req, res) => {
  // Validate input DTO
  const input = CreateUserRequestDTO.parse(req.body); // Zod validation
  const user = await userService.create(input);
  res.status(201).json(UserResponseDTO.fromEntity(user));
});
```

> 💡 **Anti-pattern: Entity as DTO** — Trả về entity trực tiếp từ controller. Rủi ro: passwordHash leak, schema coupling, circular serialization error.

**DTO vs VO (Value Object):**
| | DTO | VO |
|--|-----|----|
| Purpose | Transfer data between layers | Domain concept with identity |
| Lifecycle | Short-lived (request-response) | Long-lived (part of entity) |
| Immutability | Mutable (for mapping) | Usually immutable |
| Example | `CreateUserRequestDTO` | `Money(amount, currency)`, `EmailAddress(value)` |

✅ **Ưu điểm:** Security, API stability, validation, clean separation.
❌ **Nhược điểm:** Boilerplate mapping (entity ↔ DTO); Over-engineering cho internal-only apps.

---

## 🎯 So sánh patterns

| Pattern | Mục đích | Mức trừu tượng | Kết hợp với |
|---------|----------|----------------|-------------|
| **Repository** | Trừu tượng DB access | Cao (domain language) | Unit of Work, DTO |
| **Unit of Work** | Atomic transactions | Trung bình (transaction scope) | Repository, Saga (distributed) |
| **DTO** | Sanitize + validate data | Thấp (shape transformation) | Repository output, Controller input |

**Workflow điển hình:**
```
HTTP Request
  → DTO validate (Zod/Joi)
  → Service (business logic)
  → Repository (data access)
  → Unit of Work (transaction)
  → DB
  → Entity → DTO (sanitize)
  → HTTP Response
```

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Cần thay đổi DB mà không sửa service | ✅ Repository Pattern | Service phụ thuộc interface, không phải impl |
| Nhiều DB writes phải atomically | ✅ Unit of Work | Đảm bảo all-or-nothing, tránh partial state |
| API response cần ẩn field nhạy cảm | ✅ DTO | passwordHash, internal IDs không ra client |
| Testing với in-memory DB | ✅ Repository + InMemory impl | Không cần DB thật cho unit test |
| Shared code giữa frontend/backend | ✅ DTO (shared types) | TypeScript shared types = contract tự document |
| Simple CRUD internal tool | ⏸️ Không cần | Overhead > benefit; ORM service trực tiếp đủ |
| Distributed transaction across services | ❌ UoW không đủ | Cần Saga Pattern (5.6.3) cho distributed scope |
| Read-heavy analytics query | ⏸️ Bypass Repository | Direct query với caching layer, performance ưu tiên |

---

## 🧠 Common Pitfalls

| Pitfall | Dấu hiệu | Fix |
|---------|----------|-----|
| **Repository leak** | Service vẫn gọi `db.query()` trực tiếp | Enforce interface-only qua lint rule |
| **DTO bloat** | DTO có 50+ fields, entity có 10 | Split DTO theo consumer (UserSummaryDTO, UserDetailDTO) |
| **UoW overuse** | Mỗi query đơn lẻ cũng gói UoW | UoW chỉ cho **multiple writes** trong 1 business transaction |
| **Entity↔DTO infinite loop** | Entity.hasMany → DTO serialization stack overflow | Custom serializer, ignore circular refs |
| **Magic in DTO** | DTO hardcoded default values | Move defaults to service/domain layer |

---

## 🔗 Liên quan

- **5.6 Error Handling** — Unit of Work + Saga pattern kết hợp cho distributed transaction
- **5.7 Refactoring** — DTO giúp tách biệt concerns, dễ refactor
- **1.3 Clean Architecture** — Repository trong data layer, DTO ở boundary layer
- **1.8 CQRS** — Command/Query separation, DTO khác nhau cho C và Q

---

## 📚 Tài liệu tham khảo

- 📖 [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- 📖 [Unit of Work - Martin Fowler](https://martinfowler.com/eaaCatalog/unitOfWork.html)
- 📖 [DTO Pattern - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/microservices-architecture/microservice-ddd-cqrs-patterns/application-service)
- 📖 [Value Object Pattern](https://docs.microsoft.com/en-us/dotnet/standard/microservices-architecture/microservice-ddd-cqrs-patterns/domain-model-layer-entities-versus-value-objects)
- 📖 [Clean Architecture - Chapter 5 (Input Adaptors & Output Adaptors)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## ⏭️ Bài tiếp theo

→ [5.9 Code Organization](../5.9-code-organization/README.md)
