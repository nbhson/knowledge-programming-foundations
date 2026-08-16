# 🎀 2.2.2 Decorator Pattern

> Thêm **hành vi mới** cho object một cách **động**, không sửa class gốc. Bọc object trong object khác cùng interface.

---

## 🎯 Vấn đề

Muốn thêm tính năng (log, cache, auth) cho method nhưng **không muốn sửa class gốc** — vì class gốc dùng chung nhiều nơi, hoặc là thư viện bên thứ 3.

```
❌ Sửa class gốc — ảnh hưởng mọi nơi dùng
class OrderService {
  create() { log(); auth(); cache(); /* logic */ }
}

✅ Decorator — bọc thêm, class gốc không đổi
┌────────────────────────────┐
│  LoggingDecorator          │
│  ┌──────────────────────┐  │
│  │  CachingDecorator    │  │
│  │  ┌────────────────┐  │  │
│  │  │  OrderService  │  │  │
│  │  └────────────────┘  │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────┐
│  Component (interface)                      │
│      ▲          ▲                           │
│      │          │                           │
│  Concrete    Decorator (wraps Component)    │
│  Component       ▲                          │
│  (gốc)           │                          │
│            ConcreteDecoratorA/B             │
│            (thêm hành vi trước/sau)         │
└─────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Client gọi decorator.method()
        │
        ▼
Decorator: thêm hành vi (log) ──▶ gọi wrapped.method()
                                        │
                                        ▼
                              Component gốc xử lý
                                        │
                                        ▼
Decorator: thêm hành vi (cache) ◀── kết quả trả về
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface Notifier {
  send(message: string): void;
}

class EmailNotifier implements Notifier {
  send(message: string) { console.log(`📧 Email: ${message}`); }
}

// Decorator base
class NotifierDecorator implements Notifier {
  constructor(protected wrapped: Notifier) {}
  send(message: string) { this.wrapped.send(message); }
}

// Thêm SMS
class SMSDecorator extends NotifierDecorator {
  send(message: string) {
    super.send(message);
    console.log(`📱 SMS: ${message}`);
  }
}

// Thêm Slack
class SlackDecorator extends NotifierDecorator {
  send(message: string) {
    super.send(message);
    console.log(`💬 Slack: ${message}`);
  }
}

// Dùng: Email + SMS + Slack
let notifier: Notifier = new EmailNotifier();
notifier = new SMSDecorator(notifier);
notifier = new SlackDecorator(notifier);
notifier.send("Order shipped!"); // gửi cả 3 kênh
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔄 **Open/Closed** | Thêm hành vi không sửa class gốc |
| 🧩 **Kết hợp linh hoạt** | Bọc nhiều lớp theo ý muốn |
| 🎯 **Single Responsibility** | Mỗi decorator 1 trách nhiệm |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Nhiều class nhỏ** | Khó theo dõi khi bọc quá nhiều lớp |
| 🐛 **Thứ tự quan trọng** | Bọc sai thứ tự → hành vi sai |
| 🎭 **Khó debug** | Stack trace dài, nhiều lớp gián tiếp |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Thêm log/cache/auth cho method | ✅ Phù hợp |
| Middleware trong Express/Koa | ✅ Phù hợp |
| Stream trong Java/Node (pipe) | ✅ Phù hợp |
| Có thể sửa class gốc, ít nơi dùng | ⚠️ Sửa trực tiếp đơn giản hơn |

---

## 🔗 Liên quan

- **2.2.4 Proxy** — Proxy kiểm soát truy cập, Decorator thêm hành vi
- **2.2.1 Adapter** — Adapter đổi interface, Decorator giữ nguyên interface
- **2.3.2 Strategy** — Strategy đổi thuật toán, Decorator bọc thêm hành vi

---

## 📁 Cấu trúc thư mục

```
2.2.2-decorator/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.2-structural/2.2.2-decorator
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Decorator - Refactoring Guru](https://refactoring.guru/design-patterns/decorator)
- 📖 [Decorator - Source Making](https://sourcemaking.com/design_patterns/decorator)

---

## ⏭️ Bài tiếp theo

→ [2.2.3 Facade](../2.2.3-facade/README.md)