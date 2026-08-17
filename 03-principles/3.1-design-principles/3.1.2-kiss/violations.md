# 🚫 KISS - Vi phạm & Cách xử lý

## Tình huống 1: Giải pháp quá phức tạp cho vấn đề đơn giản

**Vi phạm:**

```typescript
// ❌ BAD: Dùng dependency injection container chỉ để inject 2 service
const container = new Container();
container.register("logger", Logger);
container.register("cache", CacheService);
container.register("db", DatabaseService);
// ... 20 registrations khác
//只为 gọi một function đơn giản

function processOrder(order: Order) {
  const logger = container.resolve("logger");
  const cache = container.resolve("cache");
  // ... phức tạp vô必要
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: dùng trực tiếp, không cần DI container cho project nhỏ
class OrderProcessor {
  private logger = new Logger();
  private cache = new CacheService();

  processOrder(order: Order) {
    this.logger.log("Processing order");
    this.cache.get("order:" + order.id);
  }
}
```

---

## Tình huống 2: Tạo abstraction vô必要 khi chỉ có 1 implementation

**Vi phạm:**

```typescript
// ❌ BAD: interface + abstract class cho 1 class duy nhất
interface ILogger { log(msg: string): void; }
abstract class BaseLogger implements ILogger { log(msg: string) { console.log(msg); } }
class ConsoleLogger extends BaseLogger {} // chỉ có 1 subclass, không cần abstract

// ❌ BAD: Factory pattern không cần thiết
class PaymentFactory {
  static create(type: string) {
    if (type === "card") return new CardPayment();
    if (type === "cash") return new CashPayment();
    throw new Error("Unknown");
  }
}
// Nhưng cả app chỉ có 1 loại payment, không bao giờ thêm mới
```

**Cách xử lý:**

```typescript
// ✅ GOOD: đơn giản hóa, bỏ abstraction không cần
class Logger {
  log(msg: string) { console.log(msg); }
}

class PaymentProcessor {
  private payment = new CardPayment(); // trực tiếp, không cần factory
}
```

---

## Tình huống 3: Over-engineering với pattern không phù hợp

**Vi phạm:**

```typescript
// ❌ BAD: Observer pattern cho 1 event đơn giản
class EventManager {
  private listeners: Map<string, Function[]> = new Map();
  subscribe(event: string, fn: Function) { /* ... */ }
  unsubscribe(event: string, fn: Function) { /* ... */ }
  emit(event: string, data: any) { /* ... */ }
}

// Nhưng chỉ có 1 listener, 1 event, không cần cơ chế complex
function handleClick() {
  const em = new EventManager();
  em.subscribe("click", (e) => console.log(e));
  em.emit("click", { x: 1, y: 2 });
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: gọi trực tiếp, không cần event bus
function handleClick(e: MouseEvent) {
  console.log(e);
}
```

---

## Tình huống 4: Thêm layer trung gian không cần thiết

**Vi phạm:**

```typescript
// ❌ BAD: Service → Manager → Controller → Facade — quá nhiều layer
class UserDTO { /* ... */ }
class UserMapper { dtoToEntity(dto: UserDTO): User { /* ... */ } }
class UserService { getUser(id: number): User { /* ... */ } }
class UserQueryService { /* wrapper around UserService */ }
class UserController {
  getUser(id: number) {
    const query = new UserQueryService();
    const user = query.getUser(id);
    const mapper = new UserMapper();
    return mapper.dtoToEntity(user);
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: giảm layer, gọi trực tiếp
class UserController {
  constructor(private userService: UserService) {}
  getUser(id: number) {
    return this.userService.getUser(id);
  }
}
```

---

## Tình huống 5: Dùng regex phức tạp thay vì built-in

**Vi phạm:**

```typescript
// ❌ BAD: Regex quá phức tạp cho validate đơn giản
const EMAIL_REGEX = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

function validateEmail(email: string) {
  return EMAIL_REGEX.test(email);
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: dùng regex đơn giản hoặc built-in
function validateEmail(email: string): boolean {
  return email.includes("@") && email.includes(".");
}

// Hoặc dùng thư viện có sẵn: validator.isEmail(email)
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm KISS | Cách xử lý |
|----------------------|------------|
| Giải pháp phức tạp hơn vấn đề | Chọn cách đơn giản nhất |
| Abstraction khi không cần thiết | Bỏ interface/factory/base class thừa |
| Pattern áp dụng sai ngữ cảnh | Chỉ dùng pattern khi thực sự cần |
| Quá nhiều layer trung gian | Gom gọn, gọi trực tiếp |
| Regex phức tạp không cần | Dùng built-in hoặc regex đơn giản |