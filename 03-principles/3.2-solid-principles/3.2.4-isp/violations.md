# 🚫 ISP - Vi phạm & Cách xử lý

## Tình huống 1: Interface to, class phải implement method không dùng

**Vi phạm:**

```typescript
// ❌ BAD: Robot phải implement eat() và sleep() — không dùng
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Robot implements Worker {
  work() { /* ... */ }
  eat() { throw new Error("Robot doesn't eat"); } // method vô nghĩa!
  sleep() { throw new Error("Robot doesn't sleep"); } // method vô nghĩa!
}

class Human implements Worker {
  work() { /* ... */ }
  eat() { /* ... */ }
  sleep() { /* ... */ }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: nhiều interface nhỏ, chuyên biệt
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Robot implements Workable {
  work() { /* ... */ }
  // Không implement eat() hay sleep()
}

class Human implements Workable, Eatable, Sleepable {
  work() { /* ... */ }
  eat() { /* ... */ }
  sleep() { /* ... */ }
}
```

---

## Tình huống 2: Interface với quá nhiều method không liên quan

**Vi phạm:**

```typescript
// ❌ BAD: 1 interface chứa tất cả method của mọi service
interface IService {
  save(data: any): void;
  delete(id: string): void;
  findById(id: string): any;
  findAll(): any[];
  sendEmail(to: string, subject: string, body: string): void;
  uploadFile(file: File): string;
  generateReport(type: string): Buffer;
  cacheGet(key: string): any;
  cacheSet(key: string, value: any): void;
}

// Mỗi class phải implement tất cả, dù chỉ dùng 1-2 method
class EmailService implements IService {
  sendEmail(to: string, subject: string, body: string) { /* ... */ }
  // Phải implement các method khác dù không dùng
  save(data: any) { throw new Error("Not implemented"); }
  delete(id: string) { throw new Error("Not implemented"); }
  // ... 7 methods không dùng
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: tách thành các interface nhỏ theo responsibility
interface Saveable {
  save(data: any): void;
  delete(id: string): void;
}

interface Findable {
  findById(id: string): any;
  findAll(): any[];
}

interface EmailService {
  sendEmail(to: string, subject: string, body: string): void;
}

interface FileUploadable {
  uploadFile(file: File): string;
}

// Class nào cần interface nào thì implement interface đó
class EmailServiceImpl implements EmailService { /* ... */ }
class ReportService implements Saveable, Findable { /* ... */ }
```

---

## Tình huống 3: Client phụ thuộc vào method nó không gọi

**Vi phạm:**

```typescript
// ❌ BAD: Printer interface bắt client phải cung cấp scan功能
interface IPrinter {
  print(document: string): void;
  scan(): string;        // Client chỉ cần print nhưng phải implement scan
  copy(): string;        // Client chỉ cần print nhưng phải implement copy
  fax(number: string): void; // Client chỉ cần print nhưng phải implement fax
}

class SimplePrinter implements IPrinter {
  print(document: string) { /* ... */ }
  scan() { throw new Error("Not supported"); }  // method không dùng
  copy() { throw new Error("Not supported"); }  // method không dùng
  fax(number: string) { throw new Error("Not supported"); }  // method không dùng
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: tách interface theo capability
interface IPrintable {
  print(document: string): void;
}

interface IScanable {
  scan(): string;
}

interface ICopiable {
  copy(): string;
}

interface IFaxable {
  fax(number: string): void;
}

// Simple printer chỉ implement những gì nó có
class SimplePrinter implements IPrintable {
  print(document: string) { /* ... */ }
}

// Multifunction printer implement nhiều interface
class MFP implements IPrintable, IScanable, ICopiable, IFaxable {
  print(document: string) { /* ... */ }
  scan() { /* ... */ }
  copy() { /* ... */ }
  fax(number: string) { /* ... */ }
}
```

---

## Tình huống 4: Interface lớn gây khó test

**Vi phạm:**

```typescript
// ❌ BAD: Test class phải mock tất cả methods của interface
interface IFullService {
  getUser(id: number): User;
  createUser(user: CreateUserDto): User;
  deleteUser(id: number): void;
  getOrders(userId: number): Order[];
  createOrder(order: CreateOrderDto): Order;
  processPayment(orderId: number, amount: number): PaymentResult;
  sendNotification(userId: number, message: string): void;
  generateReport(type: string): Report;
}

class UserService {
  constructor(private service: IFullService) {}

  // Chỉ dùng getUser và createUser
  getUserProfile(id: number) {
    return this.service.getUser(id);
  }
}

// Test phải mock 8 methods, 6 method không dùng
const mockService = {} as IFullService;
mockService.getUser = jest.fn();
mockService.createUser = jest.fn();
mockService.deleteUser = jest.fn();       // không dùng
mockService.getOrders = jest.fn();        // không dùng
// ... 4 more empty mocks
```

**Cách xử lý:**

```typescript
// ✅ GOOD: interface nhỏ, chỉ expose methods client thực sự cần
interface IUserRepository {
  getUser(id: number): User;
  createUser(user: CreateUserDto): User;
}

class UserService {
  constructor(private repo: IUserRepository) {}

  getUserProfile(id: number) {
    return this.repo.getUser(id);
  }
}

// Test chỉ mock 2 methods thay vì 8
const mockRepo = {
  getUser: jest.fn(),
  createUser: jest.fn(),
};
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm ISP | Cách xử lý |
|---------------------|------------|
| Class implement method không dùng | Tách thành interface nhỏ hơn |
| Interface > 5-6 methods unrelated | Chia thành multiple interfaces |
| Client phụ thuộc vào method không gọi | Dependency on abstraction chỉ cần thiết |
| Mock nhiều methods trong test | Interface nhỏ → mock ít hơn |