# 🏭 2.1.3 Abstract Factory Pattern

> Cung cấp một **interface để tạo cả gia đình các đối tượng liên quan** mà không chỉ rõ class cụ thể.
> Đảm bảo các đối tượng trong cùng gia đình **tương thích với nhau**.

---

## 🎯 Vấn đề

Khi cần tạo **nhiều đối tượng liên quan** phải đồng bộ với nhau:

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

Nếu dùng `new` trực tiếp, dễ tạo object từ **gia đình khác nhau** → không đồng bộ.

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
  createInput(): Input { return new DarkInput(); }
}

class LightThemeFactory implements UIFactory {
  createButton(): Button { return new LightButton(); }
  createInput(): Input { return new LightInput(); }
}

// Client — chỉ biết UIFactory
function renderUI(factory: UIFactory) {
  const button = factory.createButton();
  const input = factory.createInput();
  button.render();
  input.render();
}

// Sử dụng
renderUI(new DarkThemeFactory());  // 🌙 Dark Button, 🌙 Dark Input
renderUI(new LightThemeFactory()); // ☀️ Light Button, ☀️ Light Input
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **Đồng bộ gia đình** | Các object cùng factory luôn tương thích |
| 🔓 **Loose coupling** | Client không biết class cụ thể |
| 📐 **Open/Closed** | Thêm gia đình mới không sửa code cũ |
| 🧩 **Single Responsibility** | Tách việc tạo object khỏi nơi dùng |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📈 **Nhiều class** | Mỗi product × mỗi factory = nhiều class |
| 🧩 **Phức tạp** | Overkill cho 1-2 loại object |
| 🔒 **Khó mở rộng product** | Thêm product mới phải sửa interface factory |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Nhiều theme/platform (Dark/Light, iOS/Android) | ✅ Rất phù hợp |
| Cần đảm bảo object đồng bộ | ✅ Phù hợp |
| UI kit, component library | ✅ Phù hợp |
| Chỉ có 1 loại object | ⚠️ Dùng Factory Method |

---

## 🔗 Liên quan

- **2.1.2 Factory Method** — Abstract Factory thường implement bằng Factory Method
- **2.1.1 Singleton** — Factory thường là Singleton
- **2.2.1 Adapter** — Abstract Factory có thể trả về Adapter

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