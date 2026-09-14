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

**3 vấn đề nghiêm trọng:**
1. **Telescoping constructor:** Càng nhiều optional param, constructor càng dài → khó đọc, dễ nhầm order.
2. **Không immutable:** Nếu class mutable, setter chaining dễ tạo object ở trạng thái intermediate không hợp lệ.
3. **Không validate:** Không enforce required params (phải nhớ validate thủ công).

Builder pattern giải quyết bằng cách tách **object construction** (step-by-step) khỏi **object representation** (final state).

**Phân biệt Builder vs Factory Method:**
- **Factory Method:** tạo 1 object đơn giản, client gọi 1 method.
- **Builder:** tạo 1 object phức tạp, client gọi nhiều method để cấu hình từng bước, cuối cùng `build()`.

**Phân biệt Builder vs DTO + Map:** (cùng giải quyết problem này nhưng hướng khác)
- **DTO + Map:** cấu hình bên ngoài object, sau đó map sang object (có thể gây leaky abstraction).
- **Builder:** cấu hình trong fluent API của object itself (tự validate, tự ensure invariant).

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

**2 variant chính của Builder (quan trọng):**

| Variant | Mô tả | Khi dùng |
|---------|-------|----------|
| **Director-based** | Có lớp Director điều phối sequence xây dựng | Object có quy trình xây dựng cố định (build house: foundation → walls → roof) |
| **Fluent (no Director)** | Client tự gọi từng setter, không có Director | Object có cấu hình linh hoạt, optional params |

Code mẫu trong repo dùng **Fluent variant** — phổ biến nhất trong TypeScript.

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

  // Fluent entry point
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

**Java-style Builder (static inner class) — pattern gốc từ GoF:**

```java
public class Pizza {
    private final String size;
    private final boolean cheese;
    
    private Pizza(PizzaBuilder builder) {
        this.size = builder.size;
        this.cheese = builder.cheese;
    }
    
    public static class PizzaBuilder {
        private String size = "medium";
        private boolean cheese = false;
        
        public PizzaBuilder setSize(String size) { this.size = size; return this; }
        public PizzaBuilder addCheese() { this.cheese = true; return this; }
        public Pizza build() { return new Pizza(this); }
    }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 📖 **Dễ đọc** | Fluent API, rõ ràng từng bước | `setSize("large").addCheese()` đọc như câu tiếng Việt — không cần hiểu API signature. |
| 🎯 **Immutable** | Product không thể sửa sau khi build | `readonly` fields + private constructor → object final sau khi build. Tránh state mutation bug. |
| 🧩 **Tách biệt** | Tách quá trình xây dựng khỏi biểu diễn | Builder biết **cách xây**, Product biết **là gì**. Thay đổi cách build không đổi Product class. |
| 🔄 **Tái sử dụng** | Cùng builder tạo nhiều biến thể | `baseBuilder.clone().addPepperoni().build()` — diff giữa các object nhỏ, giảm code lặp. |
| ✅ **Validation tại build()** | Chỉ cần validate 1 chỗ | Tất cả field đã đầy đủ → check invariant trong `build()`. |
| 📐 **Optional params** | Tham số tùy chọn dễ quản lý | Đặt default value trong builder, client chỉ override những gì cần. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 📈 **Nhiều code** | Cần class Builder riêng | Cùng object có thể 2x code (class + builder). *Giảm thiểu:* dùng TypeScript `Partial<T>` + defaults, hoặc record/struct với defaults. |
| 🧩 **Phức tạp** | Overkill cho object ít tham số | 2-3 params → constructor đủ. Chỉ dùng khi ≥ 4 optional params. |
| 🐌 **Boilerplate** | Nhiều method setter trùng lặp | Mỗi field = 1 setter + 1 getter trên builder. *Giảm thiểu:* codegen, macro, hoặc helper function. |
| 🔀 **Không enforce order** | Client có thể gọi setter sai thứ tự | `addCheese().setSize().addPepperoni()` → order không quan trọng nhưng dễ gây nhầm intent. *Giảm thiểu:* Director pattern (bắt buộc order). |
| 🧨 **Mutable intermediate** | Builder state có thể bị mutate từ outside | `builder.setSize("small").size = "large"` — bypass setter. *Giảm thiểu:* private fields + getters không có setters. |
| 👻 **Test double khó** | Mock builder phức tạp | Builder pattern thường dùng trong unit test nhưng cũng có thể là test double khó viết. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Object nhiều optional param (>4) | ✅ Rất phù hợp | Constructor telescoping là red flag rõ nhất. |
| Cần immutable object | ✅ Phù hợp | Private constructor + static factory enforce immutability. |
| Cần nhiều biến thể từ 1 quy trình | ✅ Phù hợp | Diff giữa variants nhỏ, common boilerplate lớn. |
| Validation phức tạp cần consolidate | ✅ Phù hợp | Build-time validation 1 nơi thay vì runtime check scattered. |
| Object 2-3 tham số | ⚠️ Không cần thiết | Constructor rõ ràng hơn. |
| Object có cấu hình động (runtime params) | ⚠️ Factory method đơn giản hơn | Builder tốt cho compile-time config, factory tốt cho runtime config. |
| Complex object với sub-components | ✅ Phù hợp | Builder của sub-object aggregate vào builder chính. |

**Rule of thumb:** nếu constructor có ≥ 4 parameters và ≥ 2 là optional → Builder. Nếu constructor có ≤ 3 params → constructor là đủ.

---

## 🔗 Liên quan

- **2.1.2 Factory Method** — Factory tạo 1 lần, Builder tạo từng bước.
- **2.1.3 Abstract Factory** — Abstract Factory tạo family, Builder tạo 1 object phức tạp.
- **2.1.1 Singleton** — Builder có thể tạo Singleton (lazy init + validation).
- **5.1.1 Unit Testing** — Test object complex config dùng Builder là pattern phổ biến.
- **5.9.1 Barrel Exports** — Export Builder từ barrel để client dễ import.

**Builder vs DTO mapping:**
| | Builder | DTO + Map |
|---|---|---|
| Enforce invariant | ✅ Tại build() | ❌ Sau khi map |
| API readability | ✅ Fluent | ⚠️ Depends on mapper |
| Refactor safety | ✅ Compiler check | ⚠️ Runtime error possible |
| Boilerplate | ❌ More | ✅ Less |

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
- 📖 [Effective Java - Joshua Bloch (Builder chapter)](https://www.oreilly.com/library/view/effective-java-3rd/9780134685991/)

---

## ⏭️ Bài tiếp theo

→ [2.1.5 Prototype](../2.1.5-prototype/README.md)
