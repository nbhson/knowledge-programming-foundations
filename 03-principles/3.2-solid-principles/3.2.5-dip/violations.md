# 🚫 DIP - Vi phạm & Cách xử lý

## Tình huống 1: Service tạo trực tiếp implementation cụ thể

**Vi phạm:**

```typescript
// ❌ BAD: UserService tạo trực tiếp MySQLDatabase
class UserService {
  private db = new MySQLDatabase();  // Phụ thuộc cụ thể

  async getUser(id: number) {
    return this.db.query("SELECT * FROM users WHERE id = ?", [id]);
  }

  async saveUser(user: User) {
    return this.db.insert("users", user);
  }
}

// Vấn đề:
// - Khó đổi sang PostgreSQL
// - Khó test (phải có MySQL thật)
// - Khó mock
```

**Cách xử lý:**

```typescript
// ✅ GOOD: phụ thuộc abstraction qua interface
interface UserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<void>;
}

class UserService {
  constructor(private repo: UserRepository) {}  // Injection qua constructor

  async getUser(id: number) {
    return this.repo.findById(id);
  }

  async saveUser(user: User) {
    return this.repo.save(user);
  }
}

// Đổi database → thay class implementation, không sửa UserService
class MySQLUserRepository implements UserRepository { /* ... */ }
class PostgresUserRepository implements UserRepository { /* ... */ }
```

---

## Tình huống 2: Module cấp cao phụ thuộc module cấp thấp

**Vi phạm:**

```typescript
// ❌ BAD: Logger module (cao) phụ thuộc vào FileLogger (thấp)
// logger.ts
class Logger {
  private writer = new FileWriter();  // Phụ thuộc cụ thể

  log(message: string) {
    this.writer.write(message);
  }
}

// file-writer.ts
class FileWriter {
  write(content: string) {
    fs.writeFileSync("log.txt", content);
  }
}

// Vấn đề: muốn đổi sang console log hoặc remote log? Phải sửa Logger
```

**Cách xử lý:**

```typescript
// ✅ GOOD: Logger phụ thuộc abstraction
interface LogWriter {
  write(content: string): void;
}

class Logger {
  constructor(private writer: LogWriter) {}  // Dependency injection

  log(message: string) {
    this.writer.write(message);
  }
}

// Các implementation có thể hoán đổi
class FileLogWriter implements LogWriter {
  write(content: string) { fs.writeFileSync("log.txt", content); }
}

class ConsoleLogWriter implements LogWriter {
  write(content: string) { console.log(content); }
}

class RemoteLogWriter implements LogWriter {
  write(content: string) { /* send to remote server */ }
}
```

---

## Tình huống 3: Controller gọi thẳng database

**Vi phạm:**

```typescript
// ❌ BAD: Controller gọi thẳng database — vi phạm cả SRP và DIP
class OrderController {
  async create(req: Request, res: Response) {
    const db = new MySQLDatabase();  // Tạo trực tiếp DB
    const order = await db.insert("orders", req.body);
    res.json(order);
  }
}

// Vấn đề:
// - Controller biết chi tiết database
// - Không thể test mà không có DB thật
// - Không thể dùng SQLite cho test
```

**Cách xử lý:**

```typescript
// ✅ GOOD: Controller phụ thuộc interface, không phụ thuộc DB cụ thể
interface OrderRepository {
  create(order: CreateOrderDto): Promise<Order>;
}

class OrderController {
  constructor(private orderRepo: OrderRepository) {}

  async create(req: Request, res: Response) {
    const order = await this.orderRepo.create(req.body);
    res.json(order);
  }
}

// Test dùng mock repository
class InMemoryOrderRepository implements OrderRepository {
  async create(order: CreateOrderDto) {
    return { id: Date.now(), ...order };
  }
}

// Production dùng real repository
class MySQLOrderRepository implements OrderRepository {
  async create(order: CreateOrderDto) {
    const db = new MySQLDatabase();
    return db.insert("orders", order);
  }
}
```

---

## Tình huống 4: Hardcode thư viện cụ thể trong business logic

**Vi phạm:**

```typescript
// ❌ BAD: Business logic phụ thuộc trực tiếp vào thư viện cụ thể
class ReportService {
  async generateReport(data: any) {
    // Phụ thuộc cụ thể vào exceljs
    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    // ... 100 dòng code exceljs
    return workbook.xlsx.writeBuffer();
  }
}

// Vấn đề: muốn đổi sang pdf? Phải rewrite cả service
```

**Cách xử lý:**

```typescript
// ✅ GOOD: business logic phụ thuộc abstraction
interface ReportFormatter {
  format(data: any): Buffer;
}

class ReportService {
  constructor(private formatter: ReportFormatter) {}

  async generateReport(data: any) {
    return this.formatter.format(data);
  }
}

// Các implementation hoán đổi được
class ExcelReportFormatter implements ReportFormatter {
  format(data: any) { /* exceljs logic */ }
}

class PdfReportFormatter implements ReportFormatter {
  format(data: any) { /* pdfkit logic */ }
}

class CsvReportFormatter implements ReportFormatter {
  format(data: any) { /* csv logic */ }
}
```

---

## Tình huống 5: Service khởi tạo dependency trong method

**Vi phạm:**

```typescript
// ❌ BAD: Khởi tạo dependency bên trong method
class PaymentService {
  async processPayment(amount: number) {
    const gateway = new StripeGateway();  // Tạo trong method
    return gateway.charge(amount);
  }

  async refundPayment(amount: number) {
    const gateway = new StripeGateway();  // Tạo lại
    return gateway.refund(amount);
  }
}

// Vấn đề:
// - Khó test (phải có Stripe thật)
// - Không thể mock
// - Mỗi lần gọi tạo object mới
```

**Cách xử lý:**

```typescript
// ✅ GOOD: inject dependency qua constructor
interface PaymentGateway {
  charge(amount: number): PaymentResult;
  refund(amount: number): PaymentResult;
}

class PaymentService {
  constructor(private gateway: PaymentGateway) {}

  async processPayment(amount: number) {
    return this.gateway.charge(amount);
  }

  async refundPayment(amount: number) {
    return this.gateway.refund(amount);
  }
}

// Test dùng mock
class MockPaymentGateway implements PaymentGateway {
  charge(amount: number) { return { success: true, id: "mock-id" }; }
  refund(amount: number) { return { success: true, id: "mock-refund" }; }
}

// Production
class StripeGateway implements PaymentGateway { /* ... */ }
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm DIP | Cách xử lý |
|---------------------|------------|
| Service `new ConcreteClass()` | Inject qua constructor |
| Module cao phụ thuộc module thấp | Abstraction ở giữa |
| Controller gọi thẳng database | Interface repository |
| Hardcode thư viện cụ thể | Interface + strategy |
| Khởi tạo dependency trong method | Constructor injection |