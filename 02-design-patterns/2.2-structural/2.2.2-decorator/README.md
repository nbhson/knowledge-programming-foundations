# 🎀 2.2.2 Decorator Pattern

> Thêm **hành vi mới** cho object một cách **động**, không sửa class gốc. Bọc object trong object khác cùng interface.

---

## 🎯 Vấn đề

Muốn thêm tính năng (log, cache, auth) cho method nhưng **không muốn sửa class gốc** — vì class gốc dùng chung nhiều nơi, hoặc là thư viện bên thứ 3.

**2 cách phổ biến để "thêm tính năng":**
- **Inheritance (extends):** thừa kế class gốc, override methods. *Vấn đề:* fragile, tight coupling, không composable (không thể "chỉ thêm log cho 1 method").
- **Decorator (wrap):** bọc object trong decorator, intercept gọi. *Ưu điểm:* dynamic, composable, không sửa class gốc.

**So sánh Decorator vs Mixin vs Inheritance:**

| | Inheritance | Mixin | Decorator |
|---|---|---|---|
| Cách thêm behavior | extends class | import function | wrap object |
| Compile-time hay runtime | Compile | Compile | Runtime |
| Composable | ❌ (single inheritance) | ❌ (name collision risk) | ✅ (nesting) |
| Sửa class gốc | ❌ | ❌ | ✅ (không sửa) |
| Ví dụ | `class LogOrderService extends OrderService` | `mix(OrderService, loggingMixin)` | `new LoggingDecorator(new OrderService())` |

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

**Key insight — Decorator luôn gọi `super.method()` hoặc `this.wrapped.method()`:** Đây là luật bất di bất dịch. Nếu decorator không forward call → nó đã trở thành **Fake object**, không phải decorator.

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

**Middleware pattern (Decorator phổ biến nhất trong web):**

```typescript
type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>;

async function compose(middlewares: Middleware[], ctx: Context) {
  let i = 0;
  async function next() {
    const mw = middlewares[i++];
    if (mw) await mw(ctx, next);
  }
  await next();
}

// Mỗi middleware là decorator cho next()
const logger: Middleware = async (ctx, next) => {
  console.log('Request start');
  await next();
  console.log('Request end');
};
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔄 **Open/Closed** | Thêm hành vi không sửa class gốc | Class gốc vẫn đơn giản — behavior mở rộng qua decoration. |
| 🧩 **Kết hợp linh hoạt** | Bọc nhiều lớp theo ý muốn | `new CacheDecorator(new LogDecorator(new Service()))` — order tùy ý. |
| 🎯 **Single Responsibility** | Mỗi decorator 1 trách nhiệm | `LoggingDecorator` chỉ log, `CachingDecorator` chỉ cache. |
| ⚡ **Lazy behavior** | Behavior thêm vào lúc runtime | Decorator có điều kiện: `if (env === 'prod') svc = new CacheDecorator(svc)`. |
| 🧪 **Testability** | Test từng decorator riêng | Log decorator test độc lập với service thật. |
| 🔌 **Non-invasive** | Không require subclass | Class không implement interface decorator vẫn được (duck typing). |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Nhiều class nhỏ** | Khó theo dõi khi bọc quá nhiều lớp | `Cache(Log(Auth(Service())))` — đọc từ trong ra ngoài, khó debug. *Giảm thiểu:* document rõ chain, dùng DI container để wire. |
| 🐛 **Thứ tự quan trọng** | Bọc sai thứ tự → hành vi sai | `Auth(Cache(service))` vs `Cache(Auth(service))` cho kết quả khác nhau. *Gi giảm thiểu:* quy ước team rõ ràng (auth trước, cache sau). |
| 🎭 **Khó debug** | Stack trace dài, nhiều lớp gián tiếp | Error ở sâu trong nested decorator → traceback dài. *Giảm thiểu:* log mỗi decorator entry/exit. |
| 🧨 **Memory leak risk** |wrapped reference giữ alive | Decorator giữ reference wrapped → GC không thu hồi được. *Giảm thiểu:* weak reference khi appropriate. |
| 👻 **Decorator sprawl** | (Failure mode) | Nhiều decorator cho cùng mục đích = complexity bloat. *Giảm thiểu:* tổng hợp decorator liên quan thành 1 composite decorator. |
| 🐌 **Performance overhead** | Mỗi call qua nhiều decorator | 5 decorator layers = 5 function call overhead. *Gi giảm thiểu:* decorator chỉ dùng ở cold path, hot path bypass. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Thêm log/cache/auth cho method | ✅ Phù hợp | AOP (aspect-oriented programming) base pattern. |
| Middleware trong Express/Koa | ✅ Rất phù hợp | Middleware chain = decorator pattern kinh điển. |
| Stream trong Java/Node (pipe) | ✅ Phù hợp | Readable.pipe(Writable) = decorator pattern dạng stream. |
| Transaction management | ✅ Phù hợp | `@Transactional` decorator trên method = common pattern. |
| Có thể sửa class gốc, ít nơi dùng | ⚠️ Sửa trực tiếp đơn giản hơn | Decorator overkill khi chỉ có 1 consumer. |
| Hành vi rất phức tạp (> 3 layers) | ❌ Tổng hợp thành class mới | decorator soup → revert to extension or new class. |
| Performance-critical path | ⚠️ Cân nhắc bypass | Hot path không nên qua nhiều decorator layers. |

**Decorator trong TypeScript thực tế:**
- **TypeORM `@Column()`, `@Entity()`** decorators (JavaScript decorator proposal)
- **Express middleware** `app.use(logger())` — decorator chain
- **RxJS operators** `pipe(map(), filter())` — function-level decorators

---

## 🔗 Liên quan

- **2.2.4 Proxy** — Proxy kiểm soát truy cập, Decorator thêm hành vi.
- **2.2.1 Adapter** — Adapter đổi interface, Decorator giữ nguyên interface.
- **2.3.2 Strategy** — Strategy đổi thuật toán, Decorator bọc thêm hành vi.
- **2.3.5 Template Method** — Template method kiểm soát flow, Decorator bổ sung behavior.
- **5.4.2 Aspect-Oriented Programming** — Decorator là cơ sở của AOP.

**Proxy vs Decorator:** Cùng cấu trúc (wrap object), khác mục đích:
- **Proxy:** kiểm soát truy cập (`if (!user.isAdmin) throw`)
- **Decorator:** thêm behavior (`log()`, `cache()`)

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
- 📖 [AOP - Martin Fowler](https://martinfowler.com/articles/aop.html)

---

## ⏭️ Bài tiếp theo

→ [2.2.3 Facade](../2.2.3-facade/README.md)
