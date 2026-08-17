# 🚫 LSP - Vi phạm & Cách xử lý

## Tình huống 1: Class con override làm thay đổi hành vi class cha

**Vi phạm:**

```typescript
// ❌ BAD: Square kế thừa Rectangle nhưng setWidth thay đổi cả height
class Rectangle {
  width: number = 0;
  height: number = 0;

  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w: number) {
    // Vi phạm: thay đổi behavior khác với contract của Rectangle
    this.width = w;
    this.height = w;  // Rectangle không làm vậy!
  }
  setHeight(h: number) {
    this.width = h;
    this.height = h;
  }
}

// Code dùng Rectangle kỳ vọng width và height độc lập
const rect: Rectangle = new Square();  // LSP violation
rect.setWidth(5);
rect.setHeight(10);
console.log(rect.area()); // 100? Không, là 100 vì Square override
// Nhưng nếu code expect width=5, height=10 → sai
```

**Cách xử lý:**

```typescript
// ✅ GOOD: dùng interface chung, không kế thừa sai
interface Shape {
  area(): number;
}

class Rectangle implements Shape {
  constructor(public width: number, public height: number) {}
  area() { return this.width * this.height; }
}

class Square implements Shape {
  constructor(public side: number) {}
  area() { return this.side * this.side; }
}
// Không có quan hệ kế thừa, mỗi class tự lo area của mình
```

---

## Tình huống 2: Class con ném exception mới

**Vi phạm:**

```typescript
// ❌ BAD: Method override ném thêm exception
class BaseService {
  find(id: number) {
    return { id, name: "test" };
  }
}

class SecureService extends BaseService {
  find(id: number) {
    // Thêm exception không có trong contract gốc
    if (!this.isAuthenticated()) {
      throw new AuthenticationException("Not authenticated");
    }
    return super.find(id);
  }
}

// Code client gọi BaseService.find không expect exception này
const service: BaseService = new SecureService();
service.find(1); // Có thể throw AuthenticationException
```

**Cách xử lý:**

```typescript
// ✅ GOOD: exception đã được định nghĩa trong base class contract
class BaseService {
  find(id: number): User | null {
    return null; // Hoặc throw NotFoundError - đã document sẵn
  }
}

class SecureService extends BaseService {
  find(id: number): User | null {
    if (!this.isAuthenticated()) {
      throw new AuthenticationException("Not authenticated");
      // Exception này vẫn nằm trong phạm vi exception có thể xảy ra
    }
    return super.find(id);
  }
}
// Hoặc tốt hơn: dùng interface, không kế thừa
```

---

## Tình huống 3: Class con trả về kiểu khác

**Vi phạm:**

```typescript
// ❌ BAD: Override method trả về kiểu con trỏ hẹp hơn
class Logger {
  log(message: string): void {
    console.log(message);
  }
}

class FileLogger extends Logger {
  log(message: string): void {
    // Trả về FileResult thay vì void — vi phạm LSP
    const result = this.writeFile(message);
    return result;  // Kiểu trả về khác!
  }
}

// Client mong đợi void, nhưng nhận được FileResult
const logger: Logger = new FileLogger();
logger.log("test"); // Gây lỗi hoặc hành vi không mong đợi
```

**Cách xử lý:**

```typescript
// ✅ GOOD: giữ nguyên contract, thêm method riêng
class Logger {
  log(message: string): void {
    console.log(message);
  }
}

class FileLogger extends Logger {
  log(message: string): void {
    super.log(message);  // Giữ nguyên contract
    this.writeToFile(message);  // Thêm hành vi riêng qua method khác
  }

  private writeToFile(message: string): void {
    // implementation
  }
}
```

---

## Tình huống 4: Precondition bị weakened trong class con

**Vi phạm:**

```typescript
// ❌ BAD: Class con nới lỏng precondition
class PaymentProcessor {
  process(amount: number): void {
    if (amount <= 0) throw new Error("Amount must be positive");
    // process payment
  }
}

class FreePaymentProcessor extends PaymentProcessor {
  process(amount: number): void {
    // Bỏ kiểm tra amount > 0 — nới lỏng precondition
    // Code gọi expect amount > 0, nhưng class con chấp nhận amount <= 0
    super.process(amount);  // Sẽ throw nếu amount <= 0
  }
}

// Client gọi với amount = 0, expected OK nhưng lại throw
const processor: PaymentProcessor = new FreePaymentProcessor();
processor.process(0); // Throws!
```

**Cách xử lý:**

```typescript
// ✅ GOOD: interface riêng cho mỗi loại payment
interface IPaymentProcessor {
  process(amount: number): void;
}

class PaymentProcessor implements IPaymentProcessor {
  process(amount: number): void {
    if (amount <= 0) throw new Error("Amount must be positive");
  }
}

class FreePaymentProcessor implements IPaymentProcessor {
  process(amount: number): void {
    // Miễn phí — không cần kiểm tra amount
    // Không kế thừa PaymentProcessor, dùng interface chung
  }
}
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm LSP | Cách xử lý |
|---------------------|------------|
| Class con override thay đổi hành vi class cha | Dùng interface, không kế thừa |
| Override ném thêm exception mới | Definemethod riêng, giữ nguyên contract |
| Override trả về kiểu khác | Giữ nguyên return type, thêm method mới |
| Nới lỏng precondition | Dùng interface riêng, không extend |