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

**Scenario điển hình:** Khi cần nhiều biến thể thuật toán (ShipCost: Normal/Express/Free, Discount: 10%/20%/VIP) và muốn đổi linh hoạt, tránh `if/else` chồng chất, tuân thủ Open/Closed.

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

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔄 **Đổi thuật toán lúc runtime** | `setShipping()` không cần sửa Context |
| 🧩 **Open/Closed** | Thêm strategy mới chỉ thêm class |
| 🧹 **Hết if/else** | Mỗi thuật toán cô lập, dễ test riêng |
| 🧪 **Test dễ** | Test từng strategy độc lập |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Nhiều class** | Mỗi biến thể 1 class, overkill nếu chỉ 1-2 case |
| 🧠 **Client phải biết strategy** | Phải chọn strategy phù hợp ở đâu đó |
| 🔀 **Khó quản lý khi nhiều** | Nhiều strategy cần factory/registry |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Nhiều biến thể cùng 1 thuật toán | ✅ Phù hợp |
| Muốn tránh `if/else` / `switch` lớn | ✅ Phù hợp |
| Cần đổi thuật toán lúc runtime | ✅ Phù hợp |
| Chỉ 1 thuật toán, không đổi | ❌ Không cần |

---

## 🔗 Liên quan

- **2.3.4 State** — State đổi hành vi theo trạng thái nội bộ, Strategy đổi thuật toán do client chọn
- **2.3.2 Observer** — Observer thay đổi hành vi subscriber khi subject đổi
- **2.1.2 Factory Method** — Factory có thể tạo Strategy phù hợp

---

## 📁 Cấu trúc thư mục

```
2.3.1-strategy/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.1-strategy
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Strategy - Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- 📖 [Strategy - Source Making](https://sourcemaking.com/design_patterns/strategy)

---

## ⏭️ Bài tiếp theo

→ [2.3.2 Observer](../2.3.2-observer/README.md)
