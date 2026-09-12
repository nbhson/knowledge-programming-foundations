# 🔀 3.2.5 DIP — Dependency Inversion Principle

> **Phụ thuộc abstraction, không phụ thuộc cụ thể.**
> Module cấp cao không nên phụ thuộc module cấp thấp — cả hai phụ thuộc abstraction.
> Đây là nguyên tắc giúp code decoupled và testable.

---

## 🎯 Vấn đề

Module cấp cao (business logic) phụ thuộc trực tiếp vào module cấp thấp (database, API):

- **Khó test** — phải dùng database thật, không mock được
- **Khó thay thế** — đổi từ SQL sang NoSQL phải sửa cả business logic
- **Tight coupling** — 2 module ràng buộc chặt, thay 1 chỗ ảnh hưởng chỗ kia
- **Khó tái sử dụng** — code không thể chạy trong môi trường khác
- **Hard to mock** — unit test không thể isolate business logic

```
❌ VI PHẠM DIP                              ✅ TUÂN THỦ DIP
┌─────────────────────┐                    ┌─────────────────────┐
│   UserService       │                    │   UserService       │
│   (cao cấp)         │                    │   (cao cấp)         │
│       │             │   ──DIP──▶        │       │             │
│       ▼             │                    │       │             │
│  ┌─────────┐       │                    │  ┌─────────┐       │
│  │  MySQL  │       │                    │  │Interface│       │
│  └─────────┘       │                    │  └───┬─────┘       │
│                    │                    │      │              │
│  Phụ thuộc cụ thể  │                    │  ┌───┴─────┐       │
└─────────────────────┘                    │  │MySQL    │       │
                                           │  │PostgreSQL│      │
                                           │  │MongoDB  │      │
                                           │  └─────────┘      │
                                           └─────────────────────┘
```

> 📌 **Quy tắc kiểm tra:** "Module cấp cao có đang `new` trực tiếp class cấp thấp không?" Nếu có → vi phạm DIP.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: phụ thuộc cụ thể
class MySqlDatabase {
  findUser(id: string) { /* ... */ }
}

class UserService {
  private db = new MySqlDatabase(); // phụ thuộc cụ thể
  getUser(id: string) { return this.db.findUser(id); }
}

// ✅ GOOD: phụ thuộc abstraction
interface UserRepository {
  findById(id: string): Promise<User>;
}

class MySqlRepo implements UserRepository {
  async findById(id: string) { /* ... */ }
}

class UserService {
  constructor(private repo: UserRepository) {} // phụ thuộc interface
  getUser(id: string) { return this.repo.findById(id); }
}
```

---

## 🔍 Phân tích chi tiết

### Các hình thức vi phạm DIP

| Hình thức | Ví dụ | Cách khắc phục |
|-----------|-------|----------------|
| **Hardcode import** | `import { MongoDb } from 'mongodb'` | Inject interface |
| **Direct instantiation** | `new Database()` | Constructor injection |
| **Static dependency** | `Database.getInstance()` | Pass dependency in |
| **Global singleton** | `const db = getDatabase()` | DI container |

### Ví dụ: Violation - Hardcoded dependency

```typescript
// ❌ BAD: UserService hardcode MySQL
class UserService {
  private db = new MySQLDatabase();
  
  async getUser(id: string) {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Test khó vì phải có MySQL running
describe('UserService', () => {
  it('should get user', async () => {
    const service = new UserService(); // cần MySQL
    const user = await service.getUser('1');
    expect(user).toBeDefined();
  });
});
```

### ✅ Giải pháp: Dependency Injection

```typescript
// ✅ GOOD: UserService phụ thuộc interface
interface UserStore {
  findById(id: string): Promise<User | null>;
}

class UserService {
  constructor(private userStore: UserStore) {}
  
  async getUser(id: string) {
    return this.userStore.findById(id);
  }
}

// Test dễ dàng với mock
class InMemoryUserStore implements UserStore {
  private users = new Map<string, User>();
  
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
}

describe('UserService', () => {
  it('should get user', async () => {
    const store = new InMemoryUserStore();
    const service = new UserService(store);
    const user = await service.getUser('1');
    expect(user).toBeDefined();
  });
});
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích | Ví dụ |
|---------|------------|-------|
| 🧪 **Dễ test** | Mock interface, test không cần DB | Unit test UserService không cần MySQL |
| 🔧 **Dễ thay thế** | Đổi MySQL → PostgreSQL, chỉ đổi implementation | Swap repo impl |
| ♻️ **Tái sử dụng** | Business logic độc lập với infrastructure | Dùng cùng service với nhiều DB |
| 🏗️ **Clean Architecture** | Tách business logic khỏi infrastructure | Domain layer không biết data layer |
| 🎭 **Dependency Injection** | Dễ dàng inject dependencies | Constructor injection pattern |

---

## 🧠 DIP và Dependency Injection

| Khái niệm | Mô tả |
|-----------|-------|
| **DIP** | Nguyên tắc: phụ thuộc abstraction, không phụ thuộc cụ thể |
| **DI (Dependency Injection)** | Kỹ thuật thực thi DIP bằng cách inject dependencies |
| **IoC Container** | Công cụ quản lý dependency injection tự động |

```typescript
// DIP + DI kết hợp
interface Logger { log(msg: string): void; }

class ConsoleLogger implements Logger {
  log(msg: string) { console.log(msg); }
}

class FileLogger implements Logger {
  log(msg: string) { 
    fs.appendFileSync('app.log', msg + '\n'); 
  }
}

class AppService {
  constructor(private logger: Logger) {} // DIP: phụ thuộc interface
  
  doWork() {
    this.logger.log('Working...');
    // ...
  }
}

// Inject implementation tại runtime
const app = new AppService(new ConsoleLogger());
const app2 = new AppService(new FileLogger());
```

---

## ⚠️ Khi nào KHÔNG nên dùng DIP?

| Tình huống | Khuyến nghị | Lý do |
|------------|-------------|-------|
| Script nhỏ, 1 file | ❌ Không cần DI | Over-engineering |
| Performance critical path | ⚠️ Cân nhắc | DI overhead nhỏ nhưng có |
| Simple configuration | ❌ Không cần interface | Hardcode config OK |
| Quick prototype | ❌ Bỏ qua | Tốc độ quan trọng |

> 💡 **Quy tắc ngón tay cái:** "Nếu class phụ thuộc vào external service (DB, API, filesystem) → dùng DIP."

---

## 🔗 Mối quan hệ với các nguyên tắc khác

| Nguyên tắc | Mối quan hệ |
|-----------|-------------|
| **3.2.2 OCP** | Phụ thuộc abstraction giúp mở rộng dễ |
| **3.2.1 SRP** | Tách trách nhiệm giúp DIP dễ implement |
| **2.1.2 Factory Method** | Factory tạo object theo interface |
| **5.8 Data Handling** | Repository pattern thực thi DIP |

---

## 🏭 Real-world Example

```typescript
// E-commerce: Order Service với DIP

// ❌ BAD: Hardcode database
class OrderServiceBad {
  private db = new MongoDB();
  
  async createOrder(order: Order) {
    const result = await this.db.collection('orders').insertOne(order);
    return result;
  }
}

// ✅ GOOD: DIP với interface
interface OrderRepository {
  create(order: Order): Promise<OrderId>;
  findById(id: OrderId): Promise<Order | null>;
  update(id: OrderId, data: Partial<Order>): Promise<void>;
}

class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private paymentGateway: PaymentGateway,
    private notificationService: NotificationService
  ) {}
  
  async createOrder(order: Order): Promise<Order> {
    // Business logic
    const orderId = await this.orderRepo.create(order);
    await this.paymentGateway.charge(order.total);
    await this.notificationService.sendConfirmation(order.customerEmail);
    return { ...order, id: orderId };
  }
}

// Multiple implementations
class MongoDBOrderRepo implements OrderRepository { /* ... */ }
class PostgreSQLOrderRepo implements OrderRepository { /* ... */ }
class InMemoryOrderRepo implements OrderRepository { /* ... */ }
```

---

## 📁 Cấu trúc thư mục

```
3.2.5-dip/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.2-solid-principles/3.2.5-dip
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Dependency Inversion Principle - Wikipedia](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- 📖 [Refactoring.Guru — DIP](https://refactoring.guru/design-principles/dependency-inversion)
- 📘 *Clean Architecture* — Robert C. Martin, Chương 4
- 📖 [Dependency Injection - Martin Fowler](https://martinfowler.com/articles/injection.html)

---

## ⏭️ Bài tiếp theo

→ [04-paradigms](../../04-paradigms/README.md)
