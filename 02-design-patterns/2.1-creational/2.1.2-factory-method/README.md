# 🏭 2.1.2 Factory Method Pattern

> Định nghĩa một **interface để tạo đối tượng**, nhưng để **subclass quyết định class cụ thể** nào được tạo.
> Factory Method cho phép **defer instantiation** xuống subclass.

---

## 🎯 Vấn đề

Khi code trực tiếp `new` một class cụ thể, ta bị **tight coupling**:

```typescript
// ❌ Phải biết class cụ thể, đổi loại phải sửa code
function createNotification(type: string) {
  if (type === "email") return new EmailNotification();
  if (type === "sms") return new SMSNotification();
  if (type === "push") return new PushNotification();
}
```

**3 vấn đề nghiêm trọng** của pattern này:

1. **Vi phạm Open/Closed Principle (OCP):** Mỗi lần thêm type mới phải sửa hàm → mở rộng = sửa code cũ.
2. **Tight coupling:** Gọi `new EmailNotification()` tức là compile-time biết chính xác class đó. Đổi thư viện third-party = sửa everywhere.
3. **Conditional logic bloat:** Nếu có 20 type → switch/if chain 20 dòng → khó bảo trì.

Factory Method giải bằng cách: **giao việc tạo object cho subclass cụ thể**, thay vì hardcoded trong base class.

**Phân biệt Factory Method vs Abstract Factory (2.1.3):**
- **Factory Method:** tạo 1 product duy nhất, qua subclass override.
- **Abstract Factory:** tạo cả **gia đình** product, qua interface gồm nhiều factory methods.

```
Factory Method (1 product):
CreatorA.create() → ProductA1
CreatorB.create() → ProductA2

Abstract Factory (family of products):
FactoryA.createButton() → ButtonA1
FactoryA.createInput()  → InputA1
FactoryB.createButton() → ButtonB1
FactoryB.createInput()  → InputB1
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────┐
│  Creator (abstract)         │
│─────────────────────────────│
│  + factoryMethod(): Product │  ← abstract
│  + someOperation(): void    │  ← dùng factoryMethod
└─────────────┬───────────────┘
              │ extends
     ┌────────┴────────┐
┌────▼─────┐     ┌─────▼─────┐
│ Concrete │     │ Concrete  │
│ CreatorA │     │ CreatorB  │
│ factory  │     │ factory   │
│ Method() │     │ Method()  │
└────┬─────┘     └─────┬─────┘
     │ creates         │ creates
     ▼                 ▼
┌───────────┐    ┌───────────┐
│ ProductA  │    │ ProductB  │
└───────────┘    └───────────┘
     ▲                 ▲
     └────────┬────────┘
        ┌─────┴─────┐
        │  Product  │  ← interface chung
        └───────────┘
```

### Luồng hoạt động

```
Client ──▶ Creator.someOperation()
               │
               ▼
          factoryMethod()  ← subclass quyết định
               │
               ▼
          Product (interface)
               │
          Concrete Product
```

**Quy tắc vàng:** Client gọi `Creator.doWork()` — không gọi `factoryMethod()` trực tiếp. Subclass chỉ override `factoryMethod()`. Đây là điểm nhiều người implement sai (public factory method = open door).

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Product interface
interface Notification {
  send(message: string): void;
}

// Concrete Products
class EmailNotification implements Notification {
  send(message: string) {
    console.log(`📧 Email: ${message}`);
  }
}

class SMSNotification implements Notification {
  send(message: string) {
    console.log(`📱 SMS: ${message}`);
  }
}

// Creator (abstract)
abstract class NotificationFactory {
  // Factory Method — subclass quyết định (protected, không public!)
  protected abstract createNotification(): Notification;

  // Operation dùng factory method
  notify(message: string) {
    const notification = this.createNotification();
    notification.send(message);
  }
}

// Concrete Creators
class EmailFactory extends NotificationFactory {
  protected createNotification(): Notification {
    return new EmailNotification();
  }
}

class SMSFactory extends NotificationFactory {
  protected createNotification(): Notification {
    return new SMSNotification();
  }
}

// Client — chỉ biết NotificationFactory
const factory = new EmailFactory();
factory.notify("Hello!"); // 📧 Email: Hello!
```

**TypeScript idiomatic variant (không cần subclass, dùng function factory):**

```typescript
// Factory function — đơn giản hơn, không cần hierarchy
function createNotification(type: 'email' | 'sms'): Notification {
  switch (type) {
    case 'email': return new EmailNotification();
    case 'sms':   return new SMSNotification();
  }
}
```

Factory function không phải "không phải design pattern" — trong TypeScript/JS thường preferred hơn Class-based Factory Method vì ít boilerplate. Class hierarchy chỉ đáng dùng khi bạn cần **polymorphism trong creator** (subclass có side-effect trong create, cần DI, v.v.).

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔓 **Loose coupling** | Client không biết class cụ thể | Client chỉ gọi `Creator.notify()`, không cần import `EmailNotification`. |
| 📐 **Open/Closed** | Thêm loại mới không sửa code cũ | Thêm `PushFactory extends NotificationFactory` — không đụng code cũ. |
| 🎯 **Single Responsibility** | Tách việc tạo object khỏi nơi dùng | Logic "tạo gì" nằm ở subclass, logic "dùng gì" nằm ở base. |
| 🔄 **Consistent creation** | Tạo object tập trung 1 nơi | Quy tắc tạo object đúng chuẩn (lifecycle, validation, config) được enforce qua base. |
| 🧪 **Testable** | Mock factory method dễ dàng | Test có thể subclass và override `createNotification()` để trả mock. |
| 🧬 **Life-cycle control** | Có thể kiểm soát khởi tạo | Lazy init, caching, validation trong factory method. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 📈 **Nhiều class** | Mỗi product cần 1 subclass creator | 3 product = 3 creator subclass. *Giảm thiểu:* factory function inline nếu không cần polymorphism. |
| 🧩 **Phức tạp hóa** | Overkill cho trường hợp đơn giản | 1 product + 1 creator = thừa thãi abstraction. |
| 🐌 **Gián tiếp** | Khó trace luồng tạo object | Debug: `new X()` bị ẩn sau factory → phải follow through abstract class. *Giảm thiểu:* log factory entry. |
| 🔀 **Phụ thuộc hierarchy** | Sửa base class ảnh hưởng tất cả | Abstract method trong base = contract bắt buộc. *Giảm thiểu:* dùng interface thay abstract class khi không cần shared implementation. |
| 🧨 **Tái tạo object vô tội vạ** | (Mistake) | Factory method có thể bị gọi nhiều lần tạo ra object mới thay vì reuse. *Giảm thiểu:* thêm cache/singletons vào factory nếu cần. |
| 👻 **Không giải quyết vấn đề "bao nhiêu product"** | (Giới hạn) | Factory Method chỉ phù hợp khi số lượng product **cố định, biết trước**. Khi số lượng động (runtime config) → dùng **Abstract Factory (2.1.3)** hoặc registration map. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Nhiều loại object cùng interface | ✅ Rất phù hợp | `Email/SMS/Push` đều là `Notification`. |
| Không biết trước class cụ thể (runtime quyết định) | ✅ Phù hợp | Type đến từ config/user input → factory giải quyết. |
| Muốn mở rộng dễ dàng (plugin) | ✅ Phù hợp | Thêm plugin mới = thêm subclass, không sửa cũ. |
| Cần kiểm soát lifecycle của object | ✅ Phù hợp | Lazy init, caching, validation trong factory. |
| Platform theme (Dark/Light, iOS/Android) | ⚠️ Dùng Abstract Factory | Factory Method chỉ tạo 1 sản phẩm, Abstract Factory tạo family. |
| Chỉ có 1 loại object | ⚠️ Không cần thiết | `new X()` là đủ. |
| Số lượng product lớn/dynamic | ❌ Dùng registration map | Registry pattern (map type → class) đơn giản hơn hierarchy. |

**Decision matrix so sánh creational patterns:**

| | Singleton | Factory Method | Abstract Factory | Builder | Prototype |
|---|---|---|---|---|---|
| Trả lời câu hỏi | "Có bao nhiêu instance?" | "Tạo object nào?" | "Tạo cả gia đình object nào?" | "Object phức tạp được xây như thế nào?" | "Object được clone từ cái nào?" |
| Số lượng create | 1 | 1 type per subclass | family per subclass | 1 complex | any number |
| Khi nào dùng | shared resource | polymorphic creation | themed family | complex object | expensive init |

---

## 🔗 Liên quan

- **2.1.1 Singleton** — Singleton thường được tạo qua Factory Method (lazy init + singleton control).
- **2.1.3 Abstract Factory** — Tổng quát hóa: tạo cả gia đình object.
- **2.1.4 Builder** — Builder tạo object phức tạp từng bước, Factory tạo 1 lần.
- **2.2.1 Adapter** — Factory Method có thể trả về Adapter.
- **5.9.1 Barrel Exports** — Factory functions thường được export từ barrel.

**Factory Method vs Strategy (2.3.1):**
- **Factory:** "tạo object nào"
- **Strategy:** "dùng algorithm nào"
- Khác nhau ở mục đích: factory tạo ra strategy; strategy được chọn để execute.

---

## 📁 Cấu trúc thư mục

```
2.1.2-factory-method/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx tsx examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.1-creational/2.1.2-factory-method
npx tsx examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Factory Method - Refactoring Guru](https://refactoring.guru/design-patterns/factory-method)
- 📖 [Factory Method - Source Making](https://sourcemaking.com/design_patterns/factory_method)
- 📖 [Polymorphic Design - Gang of Four](https://en.wikipedia.org/wiki/Factory_method_pattern)

---

## ⏭️ Bài tiếp theo

→ [2.1.3 Abstract Factory](../2.1.3-abstract-factory/README.md)
