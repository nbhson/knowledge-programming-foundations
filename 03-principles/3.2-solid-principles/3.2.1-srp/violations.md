# 🚫 SRP - Vi phạm & Cách xử lý

## Tình huống 1: Class có nhiều "lý do thay đổi"

**Vi phạm:**

```typescript
// ❌ BAD: UserService có 3 lý do thay đổi
class UserService {
  // Lý do 1: thay đổi validate
  validateUser(user: any) {
    if (!user.name) throw new Error("Name required");
    if (user.name.length < 3) throw new Error("Name too short");
  }

  // Lý do 2: thay đổi database schema
  saveUser(user: any) {
    const db = new MySQLDatabase();
    db.insert("users", user);
  }

  // Lý do 3: thay đổi email template
  sendWelcomeEmail(user: any) {
    const template = renderTemplate("welcome.html", user);
    smtp.send(user.email, template);
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: mỗi class 1 lý do thay đổi
class UserValidator {
  validate(user: any) { /* chỉ liên quan validate */ }
}

class UserRepository {
  save(user: any) { /* chỉ liên quan database */ }
}

class UserEmailService {
  sendWelcome(user: any) { /* chỉ liên quan email */ }
}

// Orchestrator ghép lại
class UserService {
  constructor(
    private validator: UserValidator,
    private repo: UserRepository,
    private emailService: UserEmailService
  ) {}
}
```

---

## Tình huống 2: Controller lẫn business logic và presentation

**Vi phạm:**

```typescript
// ❌ BAD: Controller làm cả validation + calculation + formatting
class OrderController {
  async create(req: Request, res: Response) {
    // Validation
    if (!req.body.items) return res.status(400).json({ error: "Missing items" });

    // Business logic
    let total = 0;
    for (const item of req.body.items) {
      const product = await this.repo.findById(item.productId);
      total += product.price * item.qty;
    }

    // Presentation formatting
    const output = {
      orderId: Date.now(),
      total: total.toFixed(2),  // format string trong controller?
      items: req.body.items.map((i: any) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
      }))
    };

    await this.repo.save(output);
    res.json(output);
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: controller chỉ nhận request + trả response
class OrderController {
  constructor(private orderService: OrderService) {}

  async create(req: Request, res: Response) {
    const order = await this.orderService.create(req.body);
    res.json(OrderFormatter.format(order));  // riêng phần format
  }
}

class OrderService {
  async create(data: CreateOrderDto) {
    // validation + business logic ở đây
  }
}

class OrderFormatter {
  static format(order: Order) {
    return { orderId: order.id, total: order.total.toFixed(2) };
  }
}
```

---

## Tình huống 3: Repository trộn query với business rules

**Vi phạm:**

```typescript
// ❌ BAD: UserRepository biết cả business rule
class UserRepository {
  async findActiveUsers() {
    const users = await db.query("SELECT * FROM users WHERE status = 'active'");
    // Vi phạm: filter theo business rule (30 ngày)
    return users.filter(u =>
      u.lastLoginAt > Date.now() - 30 * 24 * 60 * 60 * 1000
    );
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: repository chỉ lo data access, service lo business
class UserRepository {
  async findByStatus(status: string): Promise<User[]> {
    return db.query("SELECT * FROM users WHERE status = ?", [status]);
  }
}

class UserService {
  async findActiveRecentUsers() {
    const users = await this.repo.findByStatus("active");
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return users.filter(u => u.lastLoginAt > thirtyDaysAgo);
  }
}
```

---

## Tình huống 4: DTO class có cả validation + transformation

**Vi phạm:**

```typescript
// ❌ BAD: DTO vừa chứa data vừa có validation logic
class CreateUserDto {
  name: string;
  email: string;

  // Validation logic nằm trong DTO?
  validate(): boolean {
    if (!this.name) throw new Error("Name required");
    if (!this.email?.includes("@")) throw new Error("Invalid email");
    return true;
  }

  // Transformation logic cũng ở đây?
  toEntity(): User {
    return {
      name: this.name.toUpperCase(),
      email: this.email.toLowerCase(),
      createdAt: new Date(),
    };
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: DTO chỉ chứa data, validation và transformation riêng
class CreateUserDto {
  constructor(
    public name: string,
    public email: string
  ) {}
}

class CreateUserValidator {
  validate(dto: CreateUserDto): void {
    if (!dto.name) throw new Error("Name required");
    if (!dto.email?.includes("@")) throw new Error("Invalid email");
  }
}

class CreateUserMapper {
  toEntity(dto: CreateUserDto): User {
    return {
      name: dto.name.toUpperCase(),
      email: dto.email.toLowerCase(),
      createdAt: new Date(),
    };
  }
}
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm SRP | Cách xử lý |
|---------------------|------------|
| Class có nhiều lý do thay đổi | Tách thành các class riêng |
| Controller chứa validation + business + formatting | Chia thành Controller → Service → Formatter |
| Repository trộn query với business filter | Repository chỉ query, Service filter |
| DTO có cả data + validation + transformation | Tách Validator và Mapper riêng |