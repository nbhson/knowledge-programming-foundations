# 🧱 2.1.4 Builder Pattern

> Tách việc **xây dựng một đối tượng phức tạp** khỏi **biểu diễn của nó**.
> Cùng một quá trình xây dựng có thể tạo ra **nhiều biểu diễn khác nhau**.

---

## 🎯 Vấn đề

Khi object có **nhiều tham số tùy chọn**, constructor trở nên khó đọc và dễ sai:

```typescript
// ❌ Khó đọc, dễ nhầm thứ tự tham số
const pizza = new Pizza(
  "large",      // size
  "thin",       // crust
  true,         // cheese
  true,         // pepperoni
  false,        // mushrooms
  true,         // onions
  false,        // sausage
  true,         // extraCheese
  "pepperoni",  // topping
  "classic"     // sauce
);
```

**Telescoping constructor** — càng nhiều tham số càng khó quản lý.

---

## 🧩 Cấu trúc

```
┌─────────────────────────────┐
│  Builder                    │
│─────────────────────────────│
│  + setPartA(): Builder      │  ← fluent, trả về this
│  + setPartB(): Builder      │
│  + build(): Product         │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Product                    │
│─────────────────────────────│
│  - partA: string            │
│  - partB: number            │
│  - constructor(builder)     │  ← private, nhận builder
└─────────────────────────────┘
```

### Luồng hoạt động

```
Client ──▶ new Builder()
              │
              ├─ .setPartA("x")  ──▶ Builder
              ├─ .setPartB(42)   ──▶ Builder
              ├─ .setPartC(true) ──▶ Builder
              │
              └─ .build()        ──▶ Product
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class Pizza {
  readonly size: string;
  readonly crust: string;
  readonly cheese: boolean;
  readonly pepperoni: boolean;
  readonly mushrooms: boolean;

  // Constructor private — chỉ tạo qua static create()
  private constructor(builder: PizzaBuilder) {
    this.size = builder.size;
    this.crust = builder.crust;
    this.cheese = builder.cheese;
    this.pepperoni = builder.pepperoni;
    this.mushrooms = builder.mushrooms;
  }

  // Static factory — truy cập được private constructor
  static create(builder: PizzaBuilder): Pizza {
    return new Pizza(builder);
  }

  static get builder(): PizzaBuilder {
    return new PizzaBuilder();
  }
}

class PizzaBuilder {
  size = "medium";
  crust = "classic";
  cheese = false;
  pepperoni = false;
  mushrooms = false;

  setSize(size: string): this {
    this.size = size;
    return this;
  }
  setCrust(crust: string): this {
    this.crust = crust;
    return this;
  }
  addCheese(): this {
    this.cheese = true;
    return this;
  }
  addPepperoni(): this {
    this.pepperoni = true;
    return this;
  }
  addMushrooms(): this {
    this.mushrooms = true;
    return this;
  }
  build(): Pizza {
    return Pizza.create(this);
  }
}

// Sử dụng — fluent, dễ đọc
const pizza = Pizza.builder
  .setSize("large")
  .setCrust("thin")
  .addCheese()
  .addPepperoni()
  .build();
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 📖 **Dễ đọc** | Fluent API, rõ ràng từng bước |
| 🎯 **Immutable** | Product không thể sửa sau khi build |
| 🧩 **Tách biệt** | Tách quá trình xây dựng khỏi biểu diễn |
| 🔄 **Tái sử dụng** | Cùng builder tạo nhiều biến thể |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📈 **Nhiều code** | Cần class Builder riêng |
| 🧩 **Phức tạp** | Overkill cho object ít tham số |
| 🐌 **Boilerplate** | Nhiều method setter trùng lặp |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Object nhiều optional param (>4) | ✅ Rất phù hợp |
| Cần immutable object | ✅ Phù hợp |
| Cần nhiều biến thể từ 1 quy trình | ✅ Phù hợp |
| Object 2-3 tham số | ⚠️ Không cần thiết |

---

## 🔗 Liên quan

- **2.1.2 Factory Method** — Factory tạo 1 lần, Builder tạo từng bước
- **2.1.3 Abstract Factory** — Abstract Factory tạo gia đình, Builder tạo 1 object phức tạp
- **2.1.1 Singleton** — Builder có thể tạo Singleton

---

## 📁 Cấu trúc thư mục

```
2.1.4-builder/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.1-creational/2.1.4-builder
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Builder - Refactoring Guru](https://refactoring.guru/design-patterns/builder)
- 📖 [Builder - Source Making](https://sourcemaking.com/design_patterns/builder)

---

## ⏭️ Bài tiếp theo

→ [2.1.5 Prototype](../2.1.5-prototype/README.md)