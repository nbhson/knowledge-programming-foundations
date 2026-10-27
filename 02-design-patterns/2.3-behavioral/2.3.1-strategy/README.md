# 🎯 2.3.1 Strategy Pattern

> Đóng gói các thuật toán thành object riêng biệt, cho phép đổi thuật toán lúc runtime mà không sửa code client.

---

## 🎯 Vấn đề

Bạn có nhiều cách làm cùng 1 việc (tính phí ship, sắp xếp, giảm giá) và dùng `if/else` hoặc `switch` để chọn:

```
❌ if/else chồng chất — thêm cách mới phải sửa code cũ
if (type === "normal") cost = weight * 10000
else if (type === "express") cost = weight * 20000 + 30000
else if (type === "free") cost = 0

✅ GIẢI PHÁP: Mỗi thuật toán = 1 class riêng, client chọn strategy lúc runtime
┌──────────┐   ┌──────────────────┐   ┌────────────────┐
│  Client  │──▶│ ShippingStrategy │◀──│  Normal/Express│
│  Order   │   │  (interface)     │   │    /Free       │
└──────────┘   └──────────────────┘   └────────────────┘
```

**Tại sao Strategy pattern quan trọng?** Nó giải quyết **vi phạm Open/Closed Principle (OCP)** trong conditional logic. Mỗi khi thêm new strategy, bạn sửa code cũ — đó là red flag rõ nhất của anti-pattern.

**Phân biệt Strategy vs State vs Template Method:**

| Pattern | Mục đích | Khi nào thay đổi | Ai quyết định |
|---------|----------|------------------|---------------|
| **Strategy** | Chọn algorithm | Khi client muốn đổi cách thực hiện | **Client** (explicit) |
| **State** | Thay đổi hành vi theo trạng thái nội bộ | Khi state object đổi | **Internal state** (automatic) |
| **Template Method** | Khung cố định, subclass override step | Khi subclass override method | **Inheritance** (compile-time) |

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────────────┐
│  Context (Order)                                     │
│  ─ hold: ShippingStrategy                            │
│  ─ checkout() → strategy.calculate(weight)           │
│                  ▲                                   │
│                  │ implements                        │
│   ┌──────────────┼──────────────┐                    │
│   │              │              │                     │
│ ┌─┴──────┐ ┌───┴────┐  ┌──────┴─────┐                │
│ │Normal  │ │Express │  │FreeShipping│                │
│ └────────┘ └────────┘  └────────────┘                │
└─────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Client tạo Order với NormalShipping
         │ setShipping(ExpressShipping)  ← đổi lúc runtime
         ▼
Order.checkout() → strategy.calculate(weightKg) → trả cost
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface ShippingStrategy {
  calculate(weightKg: number): number;
}

class NormalShipping implements ShippingStrategy {
  calculate(weightKg: number): number { return weightKg * 10_000; }
}

class ExpressShipping implements ShippingStrategy {
  calculate(weightKg: number): number { return weightKg * 20_000 + 30_000; }
}

class FreeShipping implements ShippingStrategy {
  calculate(_weightKg: number): number { return 0; }
}

class Order {
  constructor(private weightKg: number, private shipping: ShippingStrategy) {}
  setShipping(s: ShippingStrategy): void { this.shipping = s; }
  checkout(): void {
    const cost = this.shipping.calculate(this.weightKg);
    console.log(`Phí ship: ${cost}`);
  }
}

// Đổi strategy lúc runtime — không sửa class Order
const order = new Order(2, new NormalShipping());
order.checkout(); // 20k
order.setShipping(new ExpressShipping());
order.checkout(); // 70k
order.setShipping(new FreeShipping());
order.checkout(); // 0
```

**TypeScript practical variant — function-based strategy:**

```typescript
// Function là first-class value — dùng function làm strategy
const strategies: Record<string, (w: number) => number> = {
  normal: (w) => w * 10_000,
  express: (w) => w * 20_000 + 30_000,
  free: () => 0,
};

const cost = strategies['express'](2);  // dynamic lookup
```

Function strategy đơn giản hơn class strategy cho trường hợp không cần state internal.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔄 **Đổi thuật toán lúc runtime** | `setShipping()` không cần sửa Context | Context không biết sẽ dùng strategy nào — flexibility cao. |
| 🧩 **Open/Closed** | Thêm strategy mới chỉ thêm class | Không đụng code cũ → giảm regression risk. |
| 🧹 **Hết if/else** | Mỗi thuật toán cô lập, dễ test riêng | Condition logic → pure function/class → maintainability tăng. |
| 🧪 **Test dễ** | Test từng strategy độc lập | Unit test strategy với mock inputs, không cần integration test. |
| 🧬 **Composition over inheritance** | Strategy injectable, flexible | Không cần subclass nhiều biến thể. |
| 🔀 **Dynamic selection** | Chọn strategy dựa trên runtime data | Config-driven, user-driven, environment-driven. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Nhiều class** | Mỗi biến thể 1 class, overkill nếu chỉ 1-2 case | *Gi giảm thiểu:* function strategy cho simple cases. |
| 🧠 **Client phải biết strategy** | Phải chọn strategy phù hợp ở đâu đó | Nếu client không biết nên dùng strategy nào → cần Factory/Registry. |
| 🔀 **Khó quản lý khi nhiều** | Nhiều strategy cần factory/registry | *Gi giảm thiểu:* Registration map + default strategy. |
| 👻 **Strategy sprawl** | (Failure mode) | Nhiều strategy cùng mục đích = redundancy. *Gi giảm thiểu:* quy tắc naming + documentation. |
| 📉 **Abstraction cost** | Interface overhead cho function đơn giản | 3 dòng function vs 20 dòng class/interface — ROI thấp. *Gi giảm thiểu:* quy tắc "function < 10 dòng, class ≥ 10 dòng". |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Nhiều biến thể cùng 1 thuật toán | ✅ Rất phù hợp | `CalculateDiscount: Percentage/Fixed/VIP`. |
| Muốn tránh `if/else` / `switch` lớn | ✅ Phù hợp | Condition spaghetti → Strategy refactor. |
| Cần đổi thuật toán lúc runtime | ✅ Phù hợp | User có thể chọn delivery type tại checkout. |
| Chỉ 1 thuật toán, không đổi | ❌ Không cần | Function direct call là đủ. |
| Thuật toán phụ thuộc state nội bộ | ⚠️ State pattern phù hợp hơn | Strategy do client chọn, State tự động change. |
| Simple function < 10 dòng | ⚠️ Function direct đủ |.overhead không worth. |

**Decision flowchart thực tế:**
1. Có ≥ 2 algorithms cho cùng operation? → Yes → Go 2
2. Algorithms cần đổi runtime? → Yes → Strategy
3. Algorithms phụ thuộc state object? → Yes → State
4. Algorithms khác nhau compile-time (inheritance)? → Yes → Template Method

---

## 🔗 Liên quan

- **2.3.4 State** — State đổi hành vi theo trạng thái nội bộ, Strategy đổi thuật toán do client chọn.
- **2.3.2 Observer** — Observer thay đổi hành vi subscriber khi subject đổi.
- **2.1.2 Factory Method** — Factory có thể tạo Strategy phù hợp.
- **5.9.2 Feature-based Organization** — Chiến lược per feature folder structure.

**Strategy trong TypeScript thực tế:**
- `Array.sort(comparator)` — comparator là strategy
- `fetch(url, options)` — options điều khiển behavior
- Redux thunks/sagas — async action creators
- Middleware pattern — each middleware is a strategy

---

## 📁 Cấu trúc thư mục

```
2.3.1-strategy/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx tsx examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.1-strategy
npx tsx examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Strategy - Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- 📖 [Strategy - Source Making](https://sourcemaking.com/design_patterns/strategy)

---

## ⏭️ Bài tiếp theo

→ [2.3.2 Observer](../2.3.2-observer/README.md)
