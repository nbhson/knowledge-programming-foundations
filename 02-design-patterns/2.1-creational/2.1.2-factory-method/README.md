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

Mỗi lần thêm loại mới, phải sửa hàm này → **vi phạm Open/Closed Principle**.

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
  // Factory Method — subclass quyết định
  abstract createNotification(): Notification;

  // Operation dùng factory method
  notify(message: string) {
    const notification = this.createNotification();
    notification.send(message);
  }
}

// Concrete Creators
class EmailFactory extends NotificationFactory {
  createNotification(): Notification {
    return new EmailNotification();
  }
}

class SMSFactory extends NotificationFactory {
  createNotification(): Notification {
    return new SMSNotification();
  }
}

// Sử dụng
const factory = new EmailFactory();
factory.notify("Hello!"); // 📧 Email: Hello!
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔓 **Loose coupling** | Client không biết class cụ thể |
| 📐 **Open/Closed** | Thêm loại mới không sửa code cũ |
| 🎯 **Single Responsibility** | Tách việc tạo object khỏi nơi dùng |
| 🔄 **Consistent creation** | Tạo object tập trung 1 nơi |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📈 **Nhiều class** | Mỗi product cần 1 subclass creator |
| 🧩 **Phức tạp hóa** | Overkill cho trường hợp đơn giản |
| 🐌 **Gián tiếp** | Khó trace luồng tạo object |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Nhiều loại object cùng interface | ✅ Phù hợp |
| Không biết trước class cụ thể | ✅ Phù hợp |
| Muốn mở rộng dễ dàng (plugin) | ✅ Phù hợp |
| Chỉ có 1 loại object | ⚠️ Không cần thiết |

---

## 🔗 Liên quan

- **2.1.1 Singleton** — Factory Method thường tạo Singleton
- **2.1.3 Abstract Factory** — Tổng quát hóa: tạo cả gia đình object
- **2.1.4 Builder** — Tạo object phức tạp từng bước, Factory tạo 1 lần
- **2.2.1 Adapter** — Factory có thể trả về Adapter

---

## 📁 Cấu trúc thư mục

```
2.1.2-factory-method/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.1-creational/2.1.2-factory-method
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Factory Method - Refactoring Guru](https://refactoring.guru/design-patterns/factory-method)
- 📖 [Factory Method - Source Making](https://sourcemaking.com/design_patterns/factory_method)

---

## ⏭️ Bài tiếp theo

→ [2.1.3 Abstract Factory](../2.1.3-abstract-factory/README.md)