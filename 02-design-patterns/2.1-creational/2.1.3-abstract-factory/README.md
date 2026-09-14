# 🏭 2.1.3 Abstract Factory Pattern

> Cung cấp một **interface để tạo cả gia đình các đối tượng liên quan** mà không chỉ rõ class cụ thể.
> Đảm bảo các đối tượng trong cùng gia đình **tương thích với nhau**.

---

## 🎯 Vấn đề

Khi cần tạo **nhiều đối tượng liên quan** phải đồng bộ với nhau — chúng phải cùng "theme", cùng "platform", cùng "family".

**Vấn đề thực tế dễ gặp:** 1 UI app có nhiều theme (Dark/Light). Mỗi theme có `Button`, `Input`, `Modal`... Bạn muốn đảm bảo **cùng một theme** khi tạo nhiều widget, không bị lẫn theme.

```
❌ VẤN ĐỀ: Trộn lẫn gia đình
┌─────────────────────────────┐
│  DarkButton + LightInput    │  ← không đồng bộ theme!
│  (button tối, input sáng)   │
└─────────────────────────────┘

✅ GIẢI PHÁP: Abstract Factory
┌─────────────────────────────┐
│  DarkThemeFactory           │
│  ├─ createButton() → Dark   │
│  ├─ createInput()  → Dark   │
│  └─ createModal()  → Dark   │  ← đồng bộ theme
└─────────────────────────────┘
```

Nếu dùng `new` trực tiếp, dễ tạo object từ **gia đình khác nhau** → giao diện lộn xộn. Abstract Factory đóng gói việc tạo cả gia đình vào 1 chỗ, đảm bảo tính đồng bộ.

**Phân biệt Abstract Factory vs Factory Method (2.1.2):**

| | Factory Method | Abstract Factory |
|---|---|---|
| Trả lời câu hỏi | "Tạo product nào?" | "Tạo cả gia đình product nào?" |
| Số lượng tạo | 1 type per subclass | N products per subclass |
| Interface | 1 method (`create()`) | N methods (`createButton()`, `createInput()`...) |
| Ví dụ | `EmailFactory.create()` → EmailNotification | `DarkThemeFactory.createButton()` + `createInput()` |

Abstract Factory thường **implement bằng Factory Method** bên trong mỗi method — vì vậy nó là "super-pattern" của Factory Method.

---

## 🧩 Cấu trúc

```
┌─────────────────────────────┐
│  AbstractFactory            │
│─────────────────────────────│
│  + createProductA(): A      │
│  + createProductB(): B      │
└──────┬──────────────┬───────┘
       │              │
   ┌────▼─────┐   ┌────▼─────┐
   │ Factory1 │   │ Factory2 │
   │ createA  │   │ createA  │
   │ createB  │   │ createB  │
   └────┬─────┘   └────┬─────┘
        │              │
        ▼              ▼
   ┌─────────┐    ┌─────────┐
   │ ProductA1│    │ ProductA2│
   └─────────┘    └─────────┘
   ┌─────────┐    ┌─────────┐
   │ ProductB1│    │ ProductB2│
   └─────────┘    └─────────┘
```

### Luồng hoạt động

```
Client ──▶ AbstractFactory (interface)
               │
         ┌─────┴─────┐
         │ Factory1  │  ← chọn 1 factory
         │ Factory2  │
         └─────┬─────┘
               │ tạo cả gia đình
               ▼
         ProductA + ProductB (đồng bộ)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Abstract Products
interface Button {
  render(): void;
}
interface Input {
  render(): void;
}

// Concrete Products (Dark theme)
class DarkButton implements Button {
  render() { console.log("🌙 Dark Button"); }
}
class DarkInput implements Input {
  render() { console.log("🌙 Dark Input"); }
}

// Concrete Products (Light theme)
class LightButton implements Button {
  render() { console.log("☀️ Light Button"); }
}
class LightInput implements Input {
  render() { console.log("☀️ Light Input"); }
}

// Abstract Factory
interface UIFactory {
  createButton(): Button;
  createInput(): Input;
}

// Concrete Factories
class DarkThemeFactory implements UIFactory {
  createButton(): Button { return new DarkButton(); }
  createInput(): Input  { return new DarkInput(); }
}

class LightThemeFactory implements UIFactory {
  createButton(): Button { return new LightButton(); }
  createInput(): Input  { return new LightInput(); }
}

// Client — chỉ biết UIFactory
function renderUI(factory: UIFactory) {
  const button = factory.createButton();
  const input  = factory.createInput();
  button.render();
  input.render();
}

// Sử dụng
renderUI(new DarkThemeFactory());  // 🌙 Dark Button, 🌙 Dark Input
renderUI(new LightThemeFactory()); // ☀️ Light Button, ☀️ Light Input
```

**Real-world example — database abstraction:**

```typescript
interface DbConnection {
  connect(): void;
  query(sql: string): Result;
}

interface IDbFactory {
  createConnection(host: string): DbConnection;
}

class PostgresFactory implements IDbFactory {
  createConnection(host: string): DbConnection {
    return new PostgresConnection(host);
  }
}

class MysqlFactory implements IDbFactory {
  createConnection(host: string): DbConnection {
    return new MysqlConnection(host);
  }
}
// Client code dùng IDbFactory → không biết đang dùng DB nào.
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🎯 **Đồng bộ gia đình** | Các object cùng factory luôn tương thích | Đảm bảo DarkButton + DarkInput + DarkModal luôn phối hợp — không lo lẫn theme. |
| 🔓 **Loose coupling** | Client không biết class cụ thể | Client chỉ phụ thuộc `UIFactory`, không import `DarkButton`. |
| 📐 **Open/Closed** | Thêm gia đình mới không sửa code cũ | Thêm `GreenThemeFactory` — không đụng `renderUI()`. |
| 🧩 **Single Responsibility** | Tách việc tạo object khỏi nơi dùng | `renderUI()` không biết gì về rendering detail. |
| 🧬 **Platform abstraction** | Switch platform không đổi client | Cùng `UIFactory` interface → Postgres/Mysql, iOS/Android. |
| 🔒 **Consistency guarantee** | (Ưu điểm tinh tế) | Factory đảm bảo tất cả product được tạo từ cùng theme/platform — invariant được bảo vệ. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 📈 **Nhiều class** | Mỗi product × mỗi factory = nhiều class | 3 products × 2 factories = 6 concrete classes + 2 factory classes. *Giảm thiểu:* factory function inline nếu không cần OCP. |
| 🧩 **Phức tạp** | Overkill cho 1-2 loại object | Nếu chỉ có 1 theme (Light), Abstract Factory = thừa abstraction. |
| 🔒 **Khó mở rộng product** | Thêm product mới phải sửa interface factory | Thêm `Modal` vào UI family = phải sửa `UIFactory` interface + tất cả concrete factories + client code. *Giảm thiểu:* dùng `optional` method trong interface hoặc default method. |
| 📝 **Boilerplate** | Interface + nhiều implement | Code-heavy so với lợi ích. |
| 🧨 **Concrete dependency** | Factory biết tất cả product trong family | DarkThemeFactory phải import DarkButton, DarkInput... → coupling tăng ngược. *Giảm thiểu:* registration map (dynamic loading). |
| 👻 **Không giải quyết "factory selection"** | Phải chọn factory ở đâu? | Client vẫn cần biết `DarkThemeFactory` hay `LightThemeFactory`. Cần thêm config/constructor injection. *Giảm thiểu:* kết hợp với Container/Factory Registry. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Nhiều theme/platform (Dark/Light, iOS/Android) | ✅ Rất phù hợp | Đây là use case kinh điển nhất của Abstract Factory. |
| Cần đảm bảo object đồng bộ trong gia đình | ✅ Phù hợp | Invariant: "cùng theme" phải được enforce. |
| UI kit, component library | ✅ Phù hợp | Design system cần family consistency. |
| Database abstraction (Postgres/Mysql/Redis) | ✅ Phù hợp | Cùng interface, implementation khác nhau. |
| Plugin system với family of extensions | ✅ Phù hợp | Plugin family: validator, serializer, logger cùng "style". |
| Chỉ có 1 loại object | ⚠️ Dùng Factory Method | Abstract Factory overkill. |
| Gia đình product rất nhiều (10+) | ❌ Cân nhắc registration map | Interface quá rộng → maintenance nightmare. |
| Không cần family consistency | ⚠️ Dùng Factory Method | Abstract Factory mua consistency nhưng hy sinh flexibility. |

---

## 🔗 Liên quan

- **2.1.2 Factory Method** — Abstract Factory thường implement bằng Factory Method bên trong.
- **2.1.1 Singleton** — Factory thường là Singleton (chỉ có 1 instance factory).
- **2.2.1 Adapter** — Abstract Factory có thể trả về Adapter (convert format).
- **2.1.4 Builder** — Builder xây object phức tạp, Abstract Factory tạo family of simple objects.
- **5.8.1 Repository Pattern** — `UserRepository`, `OrderRepository` — pattern này thực chất là **Family Factory** (mỗi module family riêng).

**Abstract Factory + Template Method (2.3.5) combo:** Factory method có thể là template method body → vừa control flow, vừa defer creation.

---

## 📁 Cấu trúc thư mục

```
2.1.3-abstract-factory/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.1-creational/2.1.3-abstract-factory
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Abstract Factory - Refactoring Guru](https://refactoring.guru/design-patterns/abstract-factory)
- 📖 [Abstract Factory - Source Making](https://sourcemaking.com/design_patterns/abstract_factory)

---

## ⏭️ Bài tiếp theo

→ [2.1.4 Builder](../2.1.4-builder/README.md)
