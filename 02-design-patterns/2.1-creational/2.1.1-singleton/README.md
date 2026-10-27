# 🧊 2.1.1 Singleton Pattern

> Đảm bảo một class **chỉ có duy nhất 1 instance** và cung cấp **điểm truy cập toàn cục** đến instance đó.

---

## 🎯 Vấn đề

Một số tài nguyên chỉ nên có **1 instance** trong toàn ứng dụng — và đó không phải vì "hiệu suất" mà vì **tính đúng đắn của hệ thống**.

**3 lý do thật sự để dùng Singleton** (phân biệt rõ từ khi bắt đầu):

1. **Shared state (shared mutable)** — Nhiều phần của app cần đọc/ghi cùng 1 state. VD: `AppConfig` — nếu mỗi nơi tự `new Config()` thì mỗi instance có thể tải config khác nhau.
2. **Shared resource** — Kết nối DB, thread pool, logger. Multiple instances = multiple connections → cạn pool, log bị phân tán.
3. **Global coordination point** — Event bus, dependency injection container — những thứ cần 1 điểm điều phối duy nhất.

**Đừng nhầm với:** "tôi muốn code ngắn lại" (dùng static function), hay "tôi không muốn pass qua constructor" (đó là lazy injection failure).

```
❌ VẤN ĐỀ: Nhiều instance
┌─────────┐  ┌─────────┐  ┌─────────┐
│ DB Conn │  │ DB Conn │  │ DB Conn │  ← 3 connection, lãng phí
└─────────┘  └─────────┘  └─────────┘

✅ GIẢI PHÁP: Singleton
┌─────────┐
│ DB Conn │  ← chỉ 1 instance, mọi nơi dùng chung
└─────────┘
```

**Tuy nhiên — sự thật là Singleton thường là anti-pattern.** Martin Fowler gọi là "smelly pattern". Lý do:
- **Ẩn dependency:** caller không biết class này phụ thuộc DB connection
- **Khó test:** state dùng chung giữa các test → test này làm bẩn test kia
- **Global state:** đọc code từ xa không biết state hiện tại là gì
- **Single point of failure:** nếu nó sập, tất cả ứng dụng sập theo

Hãy cân nhắc **Dependency Injection (DI)** trước. DI có cùng lợi ích (1 instance duy nhất) nhưng công khai dependency, test được dễ dàng. Singleton chỉ nên dùng khi bạn thực sự cần global access point (event bus, config) — hoặc khi framework bắt buộc (Angular, NestJS internals).

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────┐
│              Singleton                      │
│─────────────────────────────────────────────│
│  - instance: Singleton                      │
│─────────────────────────────────────────────│
│  + getInstance(): Singleton                 │
│  + businessMethod(): void                   │
│  - constructor()                            │
│─────────────────────────────────────────────│
│  • static instance = null                   │
│  • getInstance(): nếu null → tạo mới        │
│  • constructor private → không new ngoài    │
└─────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Client A ──getInstance()──▶ ┌────────────┐
                             │ instance = │
Client B ──getInstance()──▶ │   null?    │
                             └─────┬──────┘
                                   │ null → tạo mới
                                   │ có sẵn → trả về
                                   ▼
                             ┌────────────┐
                             │ 1 instance │
                             │  duy nhất  │
                             └────────────┘
```

**Tại sao `getInstance()` phải thread-safe?** Vì trong multi-thread (Node.js không multi-thread, nhưng server app Java/C# thì có), 2 thread cùng call `if (!instance)` → cả 2 tạo mới → 2 instance tồn tại → vi phạm singleton. Giải pháp:

| Technique | Mô tả | Độ an toàn | Chi phí |
|-----------|-------|------------|---------|
| Synchronized method | Khóa toàn bộ method | ✅ Cao | ❌ Cao (bottleneck) |
| Double-checked locking | Kiểm tra 2 lần + volatile | ✅ Cao | ✅ Thấp |
| Static initializer | JVM/JIT đảm bảo khởi tạo | ✅ Cao | ✅ Thấp |
| ES6 Module singleton | `export const` module scope | ✅ Cao | ✅ Thấp nhất (node modules cache) |

**ES6/Node thực tế:** chỉ cần `export` 1 instance, runtime module system đảm bảo chỉ load 1 lần — đây là pattern **mặc định** của JavaScript/TypeScript.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private connected = false;

  // Constructor private → không thể `new` từ bên ngoài
  private constructor() {}

  // Điểm truy cập toàn cục
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  connect() {
    if (!this.connected) {
      console.log("Connecting to database...");
      this.connected = true;
    }
  }
}

// Sử dụng
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true — cùng 1 instance
```

**ES6 Module-style (recommended cho Node):**

```typescript
// db.ts
class DbConnection {
  private constructor() {}
  connect() { ... }
}
export const db = new DbConnection();  // module cached, guaranteed singleton

// app.ts
import { db } from './db';  // luôn là cùng instance
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🎯 **1 instance duy nhất** | Kiểm soát chặt tài nguyên | Shared connection pool, shared config state — tránh inconsistency giữa nhiều instance. |
| 🌍 **Truy cập toàn cục** | Mọi nơi đều lấy được instance | Không cần pass qua constructor chain — đặc biệt hữu ích cho event bus, config, logger. |
| 💾 **Lazy initialization** | Chỉ tạo khi thực sự cần | `getInstance()` mới tạo → tiết kiệm memory nếu app không bao giờ dùng. |
| 🚀 **Hiệu quả** | Không tạo lại object tốn kém | Object expensive to construct (DB init, file load) chỉ tạo 1 lần. |
| 📦 **Thích hợp với module system** | (ES6 context) | Node modules cached → singleton mặc định mà không cần pattern explicit. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🌐 **Global state** | Khó test (state dùng chung giữa test) | Test A gọi `getInstance().connect()` → test B nhận kết quả của A. *Giảm thiểu:* reset sau mỗi test, hoặc inject interface thay class concrete. |
| 🔗 **Tight coupling** | Class gọi trực tiếp Singleton, khó thay thế | `Foo.getInstance()` = compile-time dependency. Muốn đổi thành mock? Không được trừ khi refactor interface. *Giảm thiểu:* wrapper interface + DI. |
| 🧵 **Thread safety** | Cần xử lý nếu multi-thread | Double-checked locking, synchronized, hoặc static init. *Giảm thiểu:* Node.js single-threaded → ít vấn đề, nhưng web worker context thì có. |
| 🐛 **Ẩn dependency** | Khó thấy class nào phụ thuộc gì | Không có constructor injection → khó đọc dependency graph. *Giảm thiểu:* document ở top-level rõ ràng, hoặc dùng DI container để wire. |
| 🧨 **Single point of failure** | 1 lỗi = sập hết | Logger singleton crash = không thể log được nữa → debugging mất phương tiện. |
| 🎭 **Testability phá vỡ** | (Hệ quả thực tế) | Integration tests cần state sạch mỗi lần chạy → singleton giữ state → phải cleanup thủ công. |

> 💡 **Lưu ý:** Nhiều người coi Singleton là **anti-pattern** vì global state. Cân nhắc dùng **Dependency Injection** thay thế khi có thể.

**Khi nào chấp nhận cái giá này?** Khi bạn đã có bằng chứng: (a) thật sự cần shared state, (b) DI không giải quyết được (event bus), hoặc (c) framework yêu cầu. Đừng dùng vì "code ngắn hơn".

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Giải thích |
|----------|-------------|------------|
| Logger toàn cục | ✅ Phù hợp | 1 Logger instance viết vào cùng file/stream — tránh race condition log. |
| Config toàn cục | ✅ Phù hợp | App config đọc 1 lần từ env/config file, dùng chung qua cả app. |
| DB connection pool | ✅ Phù hợp | Pool quản lý connections — nhiều pool = lãng phí connection, thiếu pool = OOM. |
| Event bus / pub-sub | ✅ Phù hợp | Cần 1 điểm phát/nhận event xuyên suốt app. |
| DI Container | ✅ Phù hợp | Container phải tồn tại ở 1 nơi để resolve dependencies. |
| Cần testable, inject dependency | ⚠️ Dùng DI thay thế | `new Foo(new Bar())` > `Foo.getInstance()`. |
| Multi-thread, cần thread-safe | ⚠️ Cân nhắc kỹ | Synchronized singleton có chi phí performance. |
| Singleton class có mutable state phức tạp | ⚠️ Cân nhắc refactor | State phức dễ dẫn đến side-effect khó debug. |

---

## 🔗 Liên quan

- **2.1.2 Factory Method** — Singleton thường được tạo qua Factory để kiểm soát lazy init.
- **2.2.4 Proxy** — Proxy có thể dùng Singleton để quản lý instance (virtual proxy).
- **2.3.1 Observer** — Event bus thường là Singleton.
- **4.7 Dependency Injection** — DI container thường là Singleton (hoặc có scope singleton).

**Singleton vs static utility class — phân biệt rõ:**
| Singleton | Static Utility |
|-----------|---------------|
| Có state nội bộ | Stateless, pure functions |
| Constructor có side-effect | Không có |
| Instance có thể được replace (mock) | Không thể |
| VD: Logger, Config | VD: MathUtils, StringUtils |

---

## 📁 Cấu trúc thư mục

```
2.1.1-singleton/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.1-creational/2.1.1-singleton
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Singleton - Refactoring Guru](https://refactoring.guru/design-patterns/singleton)
- 📖 [Singleton - Source Making](https://sourcemaking.com/design_patterns/singleton)
- 📖 [The Singleton — Martin Fowler](https://martinfowler.com/bliki/Singleton.html)

---

## ⏭️ Bài tiếp theo

→ [2.1.2 Factory Method](../2.1.2-factory-method/README.md)
