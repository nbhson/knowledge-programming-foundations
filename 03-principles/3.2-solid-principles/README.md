# 📐 3.2 SOLID Principles

> **5 nguyên tắc thiết kế OOP** giúp code dễ đọc, dễ sửa, dễ mở rộng.
> Đặt tên từ Robert C. Martin (Uncle Bob) — nhóm lại thành từ "SOLID".

---

## 🧩 SOLID là gì?

```
S — Single Responsibility Principle (SRP)     → 1 class, 1 trách nhiệm
O — Open/Closed Principle (OCP)               → Mở rộng được, đóng sửa đổi
L — Liskov Substitution Principle (LSP)       → Class con thay được class cha
I — Interface Segregation Principle (ISP)     → Interface nhỏ, chuyên biệt
D — Dependency Inversion Principle (DIP)      → Phụ thuộc abstraction, không phụ thuộc cụ thể
```

> 💡 **Ghi nhớ:** Đọc tắt từng chữ cái thành "S-O-L-I-D" để dễ nhớ.

**Sự thật quan trọng:** SOLID không phải "luật bất di bất dịch" — chúng là **nguyên tắc chỉ dẫn** để đạt được các thuộc tính mong muốn của software:
- Dễ đọc → khả năng đọc
- Dễ sửa → modifiability
- Dễ mở rộng → extensibility
- Dễ test → testability

Mỗi nguyên tắc SOLID giải quyết 1 class vấn đề cụ thể. Hiểu vấn đề = hiểu pattern; không hiểu vấn đề = áp dụng hình thức.

---

## 📖 Chi tiết từng nguyên tắc

### **S — Single Responsibility Principle (SRP)**

**Định nghĩa:** Một class nên có **chỉ một lý do để thay đổi** (not "chỉ một việc").

**Phân biệt 2 cách hiểu sai phổ biến:**
- ❌ **Hiểu sai:** "Class chỉ nên có 1 method." → Sai! Class có thể có nhiều methods miễn là chúng phục vụ 1 purpose duy nhất.
- ✅ **Đúng:** "Class chỉ nên có 1 **người stakeholder** chịu trách nhiệm nghiệp vụ."

**Ví dụ vi phạm:**

```typescript
// ❌ VI PHẠM SRP: User class có 2 lý do thay đổi
class User {
  save() { /* gọi DB */ }           // lý do 1: persistence thay đổi schema
  validate() { /* regex */ }         // lý do 2: validation rule đổi format email
  sendWelcomeEmail() { /* SMTP */ }  // lý do 3: email service đổi provider
}
```

**Ví dụ đúng:**

```typescript
// ✅ tuân thủ SRP: mỗi class 1 stakeholder
class User {           // stakeholder: Product team (business domain)
  validate(): boolean { /* ... */ }
}
class UserRepository { // stakeholder: DBA (persistence)
  save(user: User): void { /* ... */ }
}
class EmailService {   // stakeholder: Marketing team (communication)
  sendWelcome(user: User): void { /* ... */ }
}
```

**Test kiểm tra SRP:** Hỏi "nếu requirement X thay đổi, có bắt buộc phải sửa class này không?" Nếu có, đó là stakeholder của class. Số stakeholder = số responsibility.

---

### **O — Open/Closed Principle (OCP)**

**Định nghĩa:** Software entities (classes, modules, functions) nên **open for extension, closed for modification**.

**Phân tích:**
- **Open for extension:** có thể thêm behavior mới mà không sửa code cũ.
- **Closed for modification:** khi thêm behavior mới, không sửa class hiện có → tránh regressions.

**Cách thực thi OCP:**
1. Abstraction (interface/abstract class) = điểm ổn định
2. Concrete implementations = điểm mở rộng

```typescript
// ❌ VI PHẠM OCP: thêm type mới = sửa code cũ
function calculatePrice(type: string, base: number): number {
  if (type === 'normal') return base;
  if (type === 'vip') return base * 0.8;
  if (type === 'employee') return base * 0.5;  // thêm mới = sửa function
  throw new Error('Unknown type');
}

// ✅ TUÂN THỦ OCP: thêm type mới = thêm class, không sửa cũ
interface DiscountStrategy {
  apply(base: number): number;
}
class NormalDiscount implements DiscountStrategy {
  apply(base: number): number { return base; }
}
class VipDiscount implements DiscountStrategy {
  apply(base: number): number { return base * 0.8; }
}
// Thêm EmployeeDiscount: thêm class mới, không sửa DiscountStrategy
```

**OCP là nguyên tắc khó nhất trong SOLID** vì đòi hỏi **tư duy trừu tượng trước** — phải dự đoán được chỗ nào sẽ thay đổi để đặt abstraction đúng chỗ. Dự đoán sai = over-engineering.

---

### **L — Liskov Substitution Principle (LSP)**

**Định nghĩa:** Objects of a superclass shall be replaceable with objects of its subclasses without breaking the application.

**Bài phát biểu cổ điển (Barbara Liskov):** Subtypes must be substitutable for their base types.

**7 quy tắc LSP thực tế:**
1. **Preconditions không được mạnh hơn** — subclass không được yêu cầu input stricter hơn parent.
2. **Postconditions không được yếu hơn** — subclass không được trả về kết quả kém chất lượng hơn parent.
3. **Invariants phải được giữ** — subclass không được phá vỡ state hợp lệ.
4. **History constraint** — subclass không được vi phạm timeline state.
5. **Type refinement** — có thể specialize types, không phải generalize.
6. **No throwing new exceptions** — subclass không được throw exception mới không có trong parent contract.
7. **No changing method signature in incompatible ways** — parameter types wider, return types narrower.

**Vi phạm LSP kinh điển — Square/Rectangle:**

```typescript
// ❌ VI PHẠM LSP: Square không thể thay Rectangle an toàn
class Rectangle {
  width = 0; height = 0;
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  // Square invariant: width === height
  setWidth(w: number) {
    super.setWidth(w);
    super.setHeight(w);  // vi phạm preconditions của Rectangle
  }
  setHeight(h: number) {
    super.setWidth(h);   // vi phạm postconditions của Rectangle
    super.setHeight(h);
  }
}

// Client code expecting Rectangle behavior
function processRect(r: Rectangle) {
  r.setWidth(5);
  r.setHeight(10);
  console.log(r.area()); // Mong 50, nhưng Square trả 25!
}
processRect(new Square());  // ❌ broken!
```

**Fix đúng:** Đừng kế thừa Square từ Rectangle — dùng interface chung hoặc composition.

---

### **I — Interface Segregation Principle (ISP)**

**Định nghĩa:** Clients should not be forced to depend on interfaces they do not use.

**Tương đương:** Better many client-specific interfaces than one general-purpose interface.

**Ví dụ vi phạm ISP:**

```typescript
// ❌ VI PHẠM ISP: interface quá rộng, client bắt buộc implement methods không dùng
interface Worker {
  work(): void;
  eat(): void;       // Robot không cần
  sleep(): void;     // Robot không cần
}
class Robot implements Worker {
  work() { /* ... */ }
  eat() { throw new Error("Robot doesn't eat"); }  // meaningless implementation
  sleep() { throw new Error("Robot doesn't sleep"); } // meaningless implementation
}
```

**Fix ISP:**

```typescript
// ✅ TUÂN THỦ ISP: interface nhỏ, chuyên biệt
interface Workable {
  work(): void;
}
interface Eatble {
  eat(): void;
}
interface Sleepable {
  sleep(): void;
}
class Robot implements Workable {
  work() { /* ... */ }
  // Không cần implement eat(), sleep()
}
class Human implements Workable, Eatble, Sleepable {
  work() { /* ... */ }
  eat() { /* ... */ }
  sleep() { /* ... */ }
}
```

**Quy tắc thực hành:** Interface phải **client-centric**, không **provider-centric**. Đặt câu hỏi: "Ai sẽ dùng interface này?" — thiết kế dựa trên người dùng, không dựa trên implementation.

---

### **D — Dependency Inversion Principle (DIP)**

**Định nghĩa:** 
1. High-level modules should not depend on low-level modules. Both should depend on abstractions.
2. Abstractions should not depend on details. Details should depend on abstractions.

**2 luật DIP:**
- **Luật 1:** High-level policy (business logic) không phụ thuộc low-level detail (database, HTTP). Cả hai phụ thuộc abstraction.
- **Luật 2:** Abstraction không biết implementation. Implementation phải thỏa abstract contract.

**Phân biệt DIP vs dependency injection (DI):**
- **DIP** là nguyên tắc (phụ thuộc abstraction).
- **DI** là cơ chế (inject dependency qua constructor).
- DI là cách thực thi DIP phổ biến, nhưng không phải cách duy nhất (có thể dùng factory, service locator — tuy nhiên service locator thường bị coi là anti-pattern).

```typescript
// ❌ VI PHẠM DIP: high-level module phụ thuộc concrete class
class OrderService {
  private repo = new PostgresOrderRepository();  // phụ thuộc concrete
  async save(order: Order) {
    await this.repo.save(order);
  }
}

// ✅ TUÂN THỦ DIP: phụ thuộc abstraction
interface OrderRepository {
  save(order: Order): Promise<void>;
}
class PostgresOrderRepository implements OrderRepository {
  async save(order: Order) { /* ... */ }
}
class OrderService {
  constructor(private repo: OrderRepository) {}  // inject abstraction
  async save(order: Order) {
    await this.repo.save(order);
  }
}
```

**Lợi ích DIP:**
- Test được với mock repository (không cần DB thật).
- Đổi database không sửa OrderService.
- Decouple business logic từ infrastructure.

---

## 🎯 Tại sao SOLID quan trọng?

```
Code không có SOLID                  Code có SOLID
┌─────────────────────┐             ┌─────────────────────┐
│  spaghetti code     │             │  mỗi class 1 việc   │
│  khó đọc            │   ←──────▶  │  dễ hiểu             │
│  khó sửa            │             │  sửa không ảnh      │
│  khó test           │             │  test dễ dàng        │
│  bug lan truyền     │             │  mở rộng an toàn     │
└─────────────────────┘             └─────────────────────┘
```

---

## ✅ Lợi ích tổng quát

| Lợi ích | Giải thích |
|---------|------------|
| 📖 **Dễ đọc** — mỗi class 1 việc, nhìn là hiểu | SRP, ISP làm code self-documenting. |
| 🔧 **Dễ sửa** — thay đổi cục bộ, không lan rộng | DIP + ISP giảm blast radius của change. |
| 🧪 **Dễ test** — phụ thuộc abstraction, mock dễ dàng | DIP cho phép inject fake dependency. |
| 🚀 **Dễ mở rộng** — thêm tính năng mới không đụng code cũ | OCP + SRP = mở rộng safe. |
| ♻️ **Tái sử dụng** — component nhỏ, tái dùng cao | SRP + DIP = decoupled components. |

---

## 📚 Mối quan hệ giữa các nguyên tắc

```
     ┌─────────────┐
     │    SRP      │  ← Nền tảng: tách trách nhiệm
     └──────┬──────┘
            │ giúp thực hiện
     ┌──────▼──────┐     ┌─────────────┐
     │     OCP     │────▶│     DIP     │
     │  Mở rộng    │  ↔  │  Abstraction│
     │  không sửa  │     │  dễ mở rộng │
     └─────────────┘     └─────────────┘
            │                    │
     ┌──────▼──────┐     ┌──────▼──────┐
     │     LSP     │     │     ISP     │
     │  Thay thế   │     │  Interface  │
     │  an toàn    │     │  chuyên biệt│
     └─────────────┘     └─────────────┘
```

> **SRP** là nền tảng. Các nguyên tắc còn lại xây dựng trên đó.

---

## 🔗 Liên quan

- **3.1.1 DRY** — Tránh trùng lặp, nền tảng cho SRP
- **3.1.4 SoC** — Tách trách nhiệm, liên quan SRP
- **3.1.6 Composition over Inheritance** — Hỗ trợ OCP, LSP
- **2.2 Structural Patterns** — Adapter, Proxy, Facade giúp thực thi SOLID
- **2.3 Behavioral Patterns** — Strategy giúp thực thi OCP, DIP
- **5.8 Data Handling** — Repository Pattern thực thi DIP
- **1.3 Clean Architecture** — DIP enforce qua Dependency Rule

---

## 📚 Tài liệu tham khảo

- 📖 [SOLID - Wikipedia](https://en.wikipedia.org/wiki/SOLID)
- 📘 *Clean Architecture* — Robert C. Martin
- 📘 *Clean Code* — Robert C. Martin
- 📖 [Refactoring.Guru — SOLID](https://refactoring.guru/design-patterns/solid)

---

## ⏭️ Bài tiếp theo

→ [3.2.1 SRP — Single Responsibility Principle](./3.2.1-srp/README.md)
