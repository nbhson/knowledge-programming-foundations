# 🚫 SoC - Vi phạm & Cách xử lý

## Tình huống 1: "God class" làm mọi thứ

**Vi phạm:**

```typescript
// ❌ BAD: 1 class chứa validate, save, email, report, log
class UserService {
  validateUser(user: any) { /* 20 dòng */ }
  saveToDatabase(user: any) { /* 30 dòng */ }
  sendWelcomeEmail(user: any) { /* 25 dòng */ }
  generateReport(user: any) { /* 40 dòng */ }
  logActivity(user: any) { /* 15 dòng */ }
  // Tổng: 130 dòng, 5 trách nhiệm
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: tách theo lĩnh vực
class UserValidator {
  validate(user: any) { /* ... */ }
}
class UserRepository {
  save(user: any) { /* ... */ }
}
class UserEmailService {
  sendWelcome(user: any) { /* ... */ }
}
class ReportService {
  generate(user: any) { /* ... */ }
}
class ActivityLogger {
  log(user: any) { /* ... */ }
}
```

---

## Tình huống 2: Controller làm cả business logic

**Vi phạm:**

```typescript
// ❌ BAD: Controller chứa cả validation + calculation + DB logic
class OrderController {
  async create(req, res) {
    // Validate
    if (!req.body.items) throw new Error("Missing items");
    if (req.body.items.length === 0) throw new Error("Empty order");

    // Business logic
    let total = 0;
    for (const item of req.body.items) {
      const product = await db.findById(item.productId);
      total += product.price * item.qty;
    }
    if (total > 1000000) throw new Error("Too expensive");

    // Save
    const order = await db.insert({ total, items: req.body.items });
    res.json(order);
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: controller chỉ nhận request + gọi service
class OrderController {
  constructor(private orderService: OrderService) {}

  async create(req, res) {
    const order = await this.orderService.create(req.body);
    res.json(order);
  }
}

class OrderService {
  async create(data: CreateOrderDto) {
    // validation ở đây
    const total = await this.calculateTotal(data.items);
    // business logic ở đây
    return this.repo.save(total, data.items);
  }
}
```

---

## Tình huống 3: Repository trộn query logic với business rules

**Vi phạm:**

```typescript
// ❌ BAD: Repository biết cả business rule
class UserRepository {
  async findByStatus(status: string) {
    const users = await db.query("SELECT * FROM users WHERE status = ?", [status]);
    // Vi phạm: repository không nên filter theo business rule
    return users.filter(u => u.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000);
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: repository chỉ lo data access
class UserRepository {
  async findByStatus(status: string): Promise<User[]> {
    return db.query("SELECT * FROM users WHERE status = ?", [status]);
  }
}

// Business logic nằm ở service
class UserService {
  async getActiveUsers() {
    const users = await this.repo.findByStatus("active");
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return users.filter(u => u.createdAt > thirtyDaysAgo);
  }
}
```

---

## Tình huống 4: Middleware/Interceptor làm quá nhiều việc

**Vi phạm:**

```typescript
// ❌ BAD: 1 middleware làm auth + logging + rate limit + CORS
app.use(async (req, res, next) => {
  // Auth
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });

  // Logging
  console.log(`${Date.now()} ${req.method} ${req.url}`);

  // Rate limiting
  if (counter++ > 100) return res.status(429).json({ error: "Too many requests" });

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");

  next();
});
```

**Cách xử lý:**

```typescript
// ✅ GOOD: mỗi middleware 1 trách nhiệm
app.use(cors());                        // CORS
app.use(rateLimiter);                   // Rate limit
app.use(authMiddleware);                // Auth
app.use(loggingMiddleware);             // Logging
```

---

## Tình huống 5: Function làm nhiều việc unrelated

**Vi phạm:**

```typescript
// ❌ BAD: 1 function làm validate + transform + save
async function handleRegistration(req: Request) {
  // Validate
  if (!req.body.email) throw new Error("Missing email");
  if (!req.body.password) throw new Error("Missing password");

  // Transform
  const user = {
    email: req.body.email.toLowerCase(),
    password: hashPassword(req.body.password),
    createdAt: new Date(),
  };

  // Save
  await db.insert("users", user);

  // Send email
  await sendEmail(user.email, "Welcome!");

  // Log
  console.log(`Registered: ${user.email}`);
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: tách thành các hàm riêng
async function registerUser(input: RegisterInput): Promise<User> {
  const validated = validateRegistration(input);      // validate
  const transformed = transformToUser(validated);       // transform
  const saved = await userRepository.save(transformed); // save
  await emailService.sendWelcome(saved.email);          // email
  await logger.logRegistration(saved.email);            // log
  return saved;
}
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm SoC | Cách xử lý |
|---------------------|------------|
| Class > 500 dòng, nhiều khái niệm | Tách theo lĩnh vực |
| Controller chứa business logic | Đưa về Service layer |
| Repository trộn business rules | Chỉ giữ data access |
| Middleware làm quá nhiều việc | Tách thành từng middleware |
| 1 function làm nhiều việc unrelated | Tách thành các hàm nhỏ |