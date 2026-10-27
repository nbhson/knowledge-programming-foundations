# 🧠 4.1 Object-Oriented Programming (OOP)

> **OOP** là cách tổ chức code xung quanh **đối tượng (objects)** — các thực thể có trạng thái và hành vi. Mọi thứ trong OOP đều là "đối tượng": dữ liệu và hành động xử lý dữ liệu được gói gọn lại.

---

## Tư duy cốt lõi của OOP

OOP không phải là "class + inheritance" — đó là hiểu lầm phổ biến. OOP là **cách mô hình hóa thế giới thực thành software**. Ý tưởng: thay vì nghĩ "program là tập hợp function", hãy nghĩ "program là tập hợp objects giao tiếp với nhau".

**4 trụ cột — nhưng chỉ có 2 thực sự quan trọng:**
- **Encapsulation** + **Abstraction** = nền tảng của mọi OOP. Không có 2 cái này = không phải OOP.
- **Inheritance** + **Polymorphism** = công cụ để đạt được DRY + open/closed — nhưng **composition thường tốt hơn inheritance**.

**Phản đối lập với FP:** OOP nói "state + behavior gói trong object"; FP nói "stateless function, immutable data". Không có cái nào "đúng" hơn — chúng là **cách tiếp cận khác nhau** cho các loại bài toán khác nhau.

---

## Bốn Trụ Cột Của OOP

### 1. Đóng Gói (Encapsulation)

**Ý tưởng:** Bọc dữ liệu và hành vi liên quan vào một đối tượng, ẩn chi tiết cài đặt bên trong.

```typescript
class BankAccount {
  private balance: number = 0; // Ẩn bên trong class

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Số tiền phải dương");
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount > this.balance) throw new Error("Không đủ tiền");
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount();
account.deposit(100);
account.withdraw(30);
console.log(account.getBalance()); // 70
// account.balance = 999999; // ❌ Không thể truy cập trực tiếp
```

**Tại sao quan trọng:**
- **Validation tại 1 chỗ:** rule "không withdraw quá số dư" sống trong method, không phân tán khắp code.
- **Invariant protection:** object không bao giờ ở state bất hợp lệ (balance âm) vì mọi thay đổi đi qua method có kiểm tra.
- **Refactor an toàn:** đổi internal storage (balance từ number → string) — public API không đổi, client không ảnh hưởng.

> 💡 **Lưu ý:** Encapsulation ≠ "đặt tất cả private rồi tạo getter/setter". Đó là Java-style anti-pattern. Đúng là **hide implementation, expose behavior**. `getBalance()` là OK (read-only query), nhưng `setBalance(n)` thì thường là design flaw.

---

### 2. Kế Thừa (Inheritance)

**Ý tưởng:** Class con kế thừa properties và methods từ class cha, mở rộng hoặc ghi đè.

```typescript
class Animal {
  constructor(public name: string) {}

  eat() {
    console.log(`${this.name} đang ăn`);
  }

  sleep() {
    console.log(`${this.name} đang ngủ`);
  }
}

class Dog extends Animal {
  bark() {
    console.log(`${this.name} sủa: Gâu gâu!`);
  }
}

class Cat extends Animal {
  meow() {
    console.log(`${this.name} kêu: Meo meo!`);
  }
}

const dog = new Dog("Buddy");
dog.eat();    // Buddy đang ăn (kế thừa)
dog.sleep();  // Buddy đang ngủ (kế thừa)
dog.bark();   // Buddy sủa: Gâu gâu! (riêng của Dog)
```

**⚠️ Cạm bẫy của Inheritance — "is-a" vs "has-a":**
- ✅ `Dog is-an Animal` → inheritance OK
- ❌ `Car has-an Engine` → composition, KHÔNG phải `Car extends Engine`

**Lighthouse pattern** (thay thế kế thừa sâu):
```typescript
// ❌ BAD: deep inheritance — fragile, tight coupling
class ElectricCar extends Car {
  // override everything...
}

// ✅ GOOD: composition — flexible, loose coupling
class Engine {
  start() { console.log("Engine started"); }
}
class Car {
  private engine = new Engine();
  start() { this.engine.start(); }
}
```

**Hierarchy explosion warning:** N classes mỗi class extend M classes → N×M classes. Dễ vỡ. Prefer **mixin/composition**.

---

### 3. Đa Hình (Polymorphism)

**Ý tưởng:** Nhiều class khác nhau cùng implement một interface — client không cần biết chi tiết.

```typescript
abstract class Shape {
  abstract area(): number;
  abstract describe(): string;
}

class Circle extends Shape {
  constructor(private radius: number) { super(); }
  area(): number { return Math.PI * this.radius ** 2; }
  describe(): string { return `Tròn bán kính ${this.radius}`; }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) { super(); }
  area(): number { return this.width * this.height; }
  describe(): string { return `Chữ nhật ${this.width}x${this.height}`; }
}

// Polymorphism: gọi chung một interface
function printShape(shape: Shape) {
  console.log(shape.describe());
  console.log(`Diện tích: ${shape.area()}`);
}

printShape(new Circle(5));     // Tròn bán kính 5, Diện tích: 78.54
printShape(new Rectangle(4, 6)); // Chữ nhật 4x6, Diện tích: 24
```

** runtime polymorphism ** (dynamic dispatch) là cơ chế: cùng lời gọi `shape.area()` nhưng implementation khác nhau tùy object thật. Đây chính là sức mạnh của OOP — **code phụ thuộc abstraction, không concrete**.

---

### 4. Trừu Tượng Hóa (Abstraction)

**Ý tưởng:** Ẩn phức tạp, chỉ expose interface cần thiết.

```typescript
interface CarEngine {
  start(): void;
  stop(): void;
  getRPM(): number;
}

class TurboEngine implements CarEngine {
  private rpm: number = 0;

  start() { this.rpm = 800; console.log("Khởi động"); }
  stop()  { this.rpm = 0; console.log("Dừng"); }
  getRPM() { return this.rpm; }

  // Hidden internals
  private adjustFuelAirRatio() { /* phức tạp */ }
  private calibrateTurbo()     { /* phức tạp */ }
}

function driveCar(engine: CarEngine) {
  engine.start();
  console.log(`RPM: ${engine.getRPM()}`);
  engine.stop();
}
// DriveCar không cần biết engine hoạt động thế nào
```

**Abstraction là gì KHÔNG PHẢI:**
- ❌ Không phải là "ít code hơn"
- ❌ Không phải là "đặt tên dài hơn"
- ✅ Là **che giấu complexity không cần thiết cho caller**

---

## So Sánh OOP vs Các Paradigm Khác

| Đặc Điểm | OOP | FP | Procedural |
|----------|-----|----|------------|
| Đơn vị cốt lõi | Object | Function | Procedure/Function |
| Trạng thái | Mutable, ẩn trong object | Immutability | Biến toàn cục/cục bộ |
| Xử lý dữ liệu | Method trên object | Function độc lập | Function + biến |
| Ưu điểm | Mô hình hóa thực tế, reuse | Không side effect, dễ test | Đơn giản, dễ hiểu |
| Nhược điểm | Overhead, inheritance hell | Khó với state phức tạp | Khó scale |
| Khi nào dùng | UI, game, domain model | Data pipeline, concurrent | Script nhỏ |

**OOP + FP combo trong thực tế:** TypeScript hiện đại thường kết hợp — domain model (OOP với entity/value object) + service layer (FP với pure functions). Không phải đối kháng, mà là **cộng sinh**.

---

## Khi Nào Dùng OOP?

| Scenario | Khuyến nghị |
|----------|-------------|
| Ứng dụng lớn, nhiều đối tượng thực thể | ✅ OOP |
| UI / Game / Simulation | ✅ OOP |
| Data transformation pipeline | ⚠️ FP phù hợp hơn |
| Script nhỏ, one-off | ⚠️ Procedural đủ |
| Cần parallel/concurrent | ⚠️ FP/RxJS phù hợp hơn |
| Domain phức tạp, nhiều business rules | ✅ OOP (DDD + OOP mạnh nhất) |

---

## 🔗 Liên Quan

- **4.2 Functional** — FP là đối trọng của OOP
- **2.1 Creational Patterns** — Factory, Singleton, Builder hỗ trợ OOP
- **3.2.1 SRP** — Một lớp nên có một lý do thay đổi
- **1.7 DDD** — Entity, Value Object là OOP áp dụng cho domain modeling

---

## 📚 Tài Liệu Tham Khảo

- 📖 [Head First Design Patterns](https://www.oreilly.com/library/view/head-first-design/9780596007126/)
- 📖 [Martin Fowler - OOP vs FP](https://martinfowler.com/articles/nonOpaque.html)
- 📖 [TypeScript Classes](https://www.typescriptlang.org/docs/handbook/classes.html)

---

## ▶️ Chạy ví dụ

```bash
cd 04-paradigms/4.1-oop
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [4.2 Functional Programming](../4.2-functional/README.md)
