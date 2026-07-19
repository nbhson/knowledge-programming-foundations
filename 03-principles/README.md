# 📜 Lớp 3: Principles (Nguyên Tắc)

> **Principles** là các **quy tắc vàng** định hướng cách viết code tốt,
> duy trì codebase dễ bảo trì và mở rộng.
>
> **Ví dụ:** Quy chuẩn xây dựng — phải đúng kỹ thuật để tòa nhà vững chắc.

---

## Tổng Quan

```
Principles
├── Design Principles
│   ├── DRY (Don't Repeat Yourself)
│   ├── KISS (Keep It Simple, Stupid)
│   ├── YAGNI (You Ain't Gonna Need It)
│   ├── SoC (Separation of Concerns)
│   ├── Law of Demeter
│   └── Composition over Inheritance
└── SOLID Principles
    ├── S — Single Responsibility Principle
    ├── O — Open/Closed Principle
    ├── L — Liskov Substitution Principle
    ├── I — Interface Segregation Principle
    └── D — Dependency Inversion Principle
```

---

## Design Principles

---

### DRY (Don't Repeat Yourself)

**Mô tả:** Tránh **trùng lặp mã nguồn** — mỗi kiến thức nên có **một nguồn duy nhất** (single source of truth).

```typescript
// ❌ BAD: Duplicated validation logic
function validateUser(user: any) {
  if (!user.name || user.name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }
  if (!user.email || !user.email.includes("@")) {
    throw new Error("Invalid email");
  }
}

function validateAdmin(admin: any) {
  if (!admin.name || admin.name.length < 3) {
    throw new Error("Name must be at least 3 characters"); // duplicated!
  }
  if (!admin.email || !admin.email.includes("@")) {
    throw new Error("Invalid email"); // duplicated!
  }
}

// ✅ GOOD: Single source of truth
function validateName(name: string) {
  if (!name || name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }
}

function validateEmail(email: string) {
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email");
  }
}

function validateUser(user: any) {
  validateName(user.name);
  validateEmail(user.email);
}

function validateAdmin(admin: any) {
  validateName(admin.name);
  validateEmail(admin.email);
}
```

**Lưu ý:** Không nên DRY quá mức — đôi khi "duplicate" là OK nếu nó giúp code rõ ràng hơn (Rule of Three).

---

### KISS (Keep It Simple, Stupid)

**Mô tả:** Giữ mọi thứ **đơn giản**, tránh phức tạp hóa không cần thiết.

```typescript
// ❌ BAD: Over-engineered
type ProcessResult<T> = T extends string ? StringProcessor<T> : NumberProcessor<T>;
abstract class BaseProcessor<T> { abstract process(input: T): T; }

// ✅ GOOD: Simple and clear
function processInput(input: string): string {
  return input.trim().toLowerCase();
}
```

**Nguyên tắc:** Nếu bạn cần suy nghĩ quá nhiều để hiểu code → code quá phức tạp.

---

### YAGNI (You Ain't Gonna Need It)

**Mô tả:** Đừng viết code cho **tương lai** — chỉ viết code khi bạn **thực sự cần** ngay bây giờ.

```typescript
// ❌ BAD: Writing code "just in case"
class UserService {
  createUser(data: UserData) { /* ... */ }
  deleteUser(id: string) { /* ... */ }
  softDeleteUser(id: string) { /* ... */ }  // "có thể cần sau"
  archiveUser(id: string) { /* ... */ }     // "biết đâu cần"
  restoreUser(id: string) { /* ... */ }     // "cho chắc"
  bulkDeleteUsers(ids: string[]) { /* ... */ } // "phòng khi"
}

// ✅ GOOD: Only what's needed NOW
class UserService {
  createUser(data: UserData) { /* ... */ }
  deleteUser(id: string) { /* ... */ }
}
```

---

### SoC (Separation of Concerns)

**Mô tả:** Mỗi module/class chỉ chịu **trách nhiệm 1 lĩnh vực** duy nhất.

```typescript
// ❌ BAD: Class does everything
class UserService {
  createUser(data: UserData) { /* ... */ }
  sendWelcomeEmail(user: User) { /* ... */ }
  generateReport(users: User[]) { /* ... */ }
  logAction(action: string) { /* ... */ }
}

// ✅ GOOD: Each class has one concern
class UserService {
  createUser(data: UserData) { /* ... */ }
}

class EmailService {
  sendWelcomeEmail(user: User) { /* ... */ }
}

class ReportService {
  generateUserReport(users: User[]) { /* ... */ }
}

class LogService {
  logAction(action: string) { /* ... */ }
}
```

---

### Law of Demeter

**Mô tả:** Chỉ nói chuyện với **đối tượng trực tiếp**, không "chatter" với bạn của bạn.

```typescript
// ❌ BAD: Talking to friend's friend
user.getAddress().getCity().getName();

// ✅ GOOD: Talk to direct object only
user.getCityName(); // User knows how to get its city name
// hoặc
class User {
  getCityName(): string {
    return this.address.city.name; // Still accessed internally but exposed via one method
  }
}
```

---

### Composition over Inheritance

**Mô tả:** Ưu tiên **composition** (kết hợp) thay vì **inheritance** (kế thừa).

```typescript
// ❌ BAD: Inheritance
class Bird {
  fly() { console.log("Flying"); }
  swim() { console.log("Swimming"); } // Not all birds swim!
}

class Penguin extends Bird {
  fly() { throw new Error("Penguins can't fly!"); } // Override = design smell
}

// ✅ GOOD: Composition
class FlyingAbility {
  fly() { console.log("Flying"); }
}

class SwimmingAbility {
  swim() { console.log("Swimming"); }
}

class Eagle {
  private flying = new FlyingAbility();
  fly() { this.flying.fly(); }
}

class Penguin {
  private swimming = new SwimmingAbility();
  swim() { this.swimming.swim(); }
}
```

---

## SOLID Principles

---

### S — Single Responsibility Principle (SRP)

**Mỗi class chỉ nên có MỘT lý do để thay đổi.**

```typescript
// ❌ BAD: Multiple responsibilities
class Employee {
  calculatePay() { /* ... */ }
  generateReport() { /* ... */ }
  saveToDatabase() { /* ... */ }
}

// ✅ GOOD: One responsibility per class
class Employee {
  constructor(
    private name: string,
    private salary: number
  ) {}
}

class PayCalculator {
  calculatePay(employee: Employee): number {
    return employee.salary;
  }
}

class ReportGenerator {
  generateReport(employee: Employee): string {
    return `Report for ${employee.name}`;
  }
}

class EmployeeRepository {
  save(employee: Employee): void {
    // save to database
  }
}
```

---

### O — Open/Closed Principle (OCP)

**Mở để mở rộng, đóng để sửa đổi.** Bạn có thể thêm hành vi mới mà không cần sửa code hiện có.

```typescript
// ❌ BAD: Must modify existing code to add new discount type
class DiscountCalculator {
  calculate(price: number, type: string): number {
    if (type === "percentage") return price * 0.9;
    if (type === "fixed") return price - 10;
    return price; // must modify this method for new discount types
  }
}

// ✅ GOOD: Open for extension, closed for modification
interface DiscountStrategy {
  apply(price: number): number;
}

class PercentageDiscount implements DiscountStrategy {
  apply(price: number): number { return price * 0.9; }
}

class FixedDiscount implements DiscountStrategy {
  apply(price: number): number { return price - 10; }
}

// To add new discount: just add a new class, NO modification needed
class BuyOneGetOneFree implements DiscountStrategy {
  apply(price: number): number { return price / 2; }
}

class DiscountCalculator {
  calculate(price: number, strategy: DiscountStrategy): number {
    return strategy.apply(price);
  }
}
```

---

### L — Liskov Substitution Principle (LSP)

**Object có thể thay thế bởi subtype mà không sai chương trình.**

```typescript
// ❌ BAD: Subtype breaks parent contract
class Rectangle {
  constructor(protected width: number, protected height: number) {}

  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  getArea() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w: number) {
    this.width = w;
    this.height = w; // Side effect! Changes height too
  }
  setHeight(h: number) {
    this.width = h;
    this.height = h; // Side effect! Changes width too
  }
}

// Client expects Rectangle behavior but Square breaks it
function enlargeRectangle(rect: Rectangle) {
  const originalArea = rect.getArea();
  rect.setWidth(rect.width + 1);
  // For Rectangle: area increases. For Square: unexpected behavior!
}

// ✅ GOOD: Use composition or separate interfaces
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  getArea() { return this.width * this.height; }
}

class Square implements Shape {
  constructor(private side: number) {}
  getArea() { return this.side * this.side; }
}
```

---

### I — Interface Segregation Principle (ISP)

**Không ép client implement interface mà chúng không sử dụng.**

```typescript
// ❌ BAD: Fat interface
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  code(): void;
  design(): void;
}

// Robot must implement eat() and sleep() — doesn't make sense!
class Robot implements Worker {
  work() { /* ... */ }
  eat() { throw new Error("Robots don't eat!"); }
  sleep() { throw new Error("Robots don't sleep!"); }
  code() { /* ... */ }
  design() { /* ... */ }
}

// ✅ GOOD: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

interface Coder {
  code(): void;
}

class HumanDeveloper implements Workable, Eatable, Sleepable, Coder {
  work() { /* ... */ }
  eat() { /* ... */ }
  sleep() { /* ... */ }
  code() { /* ... */ }
}

class RobotWorker implements Workable, Coder {
  work() { /* ... */ }
  code() { /* ... */ }
}
```

---

### D — Dependency Inversion Principle (DIP)

**Depend vào abstraction, không depend vào class cụ thể.**

```typescript
// ❌ BAD: High-level module depends on low-level module
class MySQLDatabase {
  query(sql: string) { /* ... */ }
  insert(data: any) { /* ... */ }
}

class UserService {
  private db = new MySQLDatabase(); // Tight coupling!

  createUser(data: UserData) {
    this.db.insert(data);
  }
}

// ✅ GOOD: Both depend on abstraction
interface Database {
  query(sql: string): any;
  insert(data: any): void;
}

class MySQLDatabase implements Database {
  query(sql: string) { /* ... */ }
  insert(data: any) { /* ... */ }
}

class PostgreSQLDatabase implements Database {
  query(sql: string) { /* ... */ }
  insert(data: any) { /* ... */ }
}

// High-level module depends on abstraction
class UserService {
  constructor(private db: Database) {} // Dependency injection

  createUser(data: UserData) {
    this.db.insert(data);
  }
}

// Can swap implementations easily
const mysqlService = new UserService(new MySQLDatabase());
const pgService = new UserService(new PostgreSQLDatabase());
```

---

## Bảng So Sánh

| Nguyên Tắc | Cốt Lõi | Kết Quả |
|------------|---------|---------|
| **DRY** | Tránh trùng lặp | Code ngắn hơn, dễ thay đổi |
| **KISS** | Đơn giản hóa | Dễ hiểu, dễ maintain |
| **YAGNI** | Chỉ viết khi cần | Không over-engineering |
| **SoC** | Tách trách nhiệm | Module rõ ràng |
| **Law of Demeter** | Ít coupling hơn | Giảm depend |
| **Composition** | Kết hợp thay vì kế thừa | Linh hoạt hơn |
| **SRP** | 1 class = 1 trách nhiệm | Dễ thay đổi |
| **OCP** | Mở rộng, không sửa | Thêm chức năng an toàn |
| **LSP** | Subtype thay thế được | Không phá vỡ contract |
| **ISP** | Interface nhỏ, tập trung | Client không bị overloading |
| **DIP** | Depend abstraction | Linh hoạt thay đổi implementation |