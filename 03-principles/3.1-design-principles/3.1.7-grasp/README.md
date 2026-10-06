# 🧩 3.1.7 GRASP (General Responsibility Assignment Software Patterns)

> **GRASP** là 9 nguyên tắc gán trách nhiệm cho object: ai nên làm việc gì.
> Trả lời câu hỏi "method này nên đặt ở class nào?" — đặt đúng chỗ, code tự nhiên ít coupling.

---

## 🎯 Vấn đề

Khi thiết kế class, câu hỏi khó nhất là **gán trách nhiệm cho ai**:

- **Class "thần thánh" (God Class)** — 1 Controller làm mọi thứ, các class khác chỉ chứa dữ liệu
- **Đặt method sai chỗ** — `OrderService` tính `lineItem.getSubtotal()` bằng cách moi `price * quantity` từ bên trong
- **Coupling cao** — mọi class đều biết về mọi class khác
- **Không biết đặt logic mới ở đâu** — mỗi dev đặt 1 nơi, code loạn

```
❌ TRÁCH NHIỆM SAI CHỖ              ✅ TRÁCH NHIỆM ĐÚNG CHỖ
┌─────────────────────┐            ┌─────────────────────┐
│ OrderController     │            │ OrderController     │
│  tính subtotal()    │            │  điều phối, gọi     │
│  tính discount()    │  ──GRASP─▶ │  Order.total()      │
│  tính tax()         │            │                     │
│  lưu database()     │            │ Order (Expert)      │
│  gửi email()        │            │  tự tính total()    │
└─────────────────────┘            └─────────────────────┘
```

---

## 🧩 9 patterns GRASP

| # | Pattern | Ý tưởng ngắn gọn |
|---|---------|-----------------|
| 1 | **Creator** | Ai tạo object? → Class nào **chứa, dùng, hoặc có dữ liệu khởi tạo** của object đó thì tạo nó. Ví dụ: `Order` tạo `OrderLine` (Order chứa OrderLine). |
| 2 | **Controller** | Ai nhận request từ bên ngoài? → 1 **Controller** (điều phối) nhận event hệ thống, rồi **ủy thác** cho các object khác làm — không tự làm hết. |
| 3 | **Information Expert** | Ai làm việc? → Class nào **có đủ thông tin** thì làm việc đó. Có dữ liệu `price`, `quantity` thì tự tính `subtotal()`. |
| 4 | **Low Coupling** | **Giảm phụ thuộc** giữa các class — ít biết về nhau thì đổi 1 class không vỡ class khác. |
| 5 | **High Cohesion** | Mỗi class **tập trung 1 mục đích** — các method trong class liên quan chặt với nhau. |
| 6 | **Polymorphism** | Hành vi khác nhau theo loại → dùng **đa hình (polymorphism)** thay vì `if/else` kiểm tra loại. |
| 7 | **Pure Fabrication** | Được phép **bịa ra 1 class "nhân tạo"** không có trong domain (ví dụ: `OrderValidator`, `PriceCalculator`) để gom logic, giữ cohesion cao. |
| 8 | **Indirection** | Muốn giảm coupling? → Thêm **trung gian (indirection)**: interface, adapter, mediator đứng giữa 2 bên. |
| 9 | **Protected Variations** | **Bọc chỗ dễ thay đổi** sau interface/stable abstraction — thay đổi bên trong không lan ra ngoài. |

```
BẢN ĐỒ NHANH: KHI NÀO DÙNG GÌ?
│
├─ "Ai tạo object này?" → Creator
├─ "Ai nhận request UI/API?" → Controller (chỉ điều phối!)
├─ "Ai tính toán với dữ liệu này?" → Information Expert
├─ "2 class dính nhau quá?" → Low Coupling + Indirection
├─ "Class làm quá nhiều việc?" → High Cohesion (+ Pure Fabrication để tách)
├─ "if/else theo loại object?" → Polymorphism
└─ "Chỗ này hay thay đổi?" → Protected Variations
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Fat Controller — Controller moi dữ liệu, tự tính hết
class OrderControllerBad {
  calculateTotal(items: { price: number; quantity: number }[]): number {
    let total = 0;
    for (const item of items) {
      total += item.price * item.quantity; // Controller biết chi tiết bên trong line!
    }
    return total;
  }
}

// ✅ GOOD: Information Expert — OrderLine tự biết subtotal của mình,
// Order tự biết total, Controller chỉ điều phối
class OrderLine {
  constructor(readonly price: number, readonly quantity: number) {}

  subtotal(): number {
    return this.price * this.quantity; // Expert: có dữ liệu → tự tính
  }
}

class Order {
  constructor(private lines: OrderLine[] = []) {}

  addLine(line: OrderLine): void {
    this.lines.push(line); // Creator: Order chứa OrderLine → Order tạo/quản lý nó
  }

  total(): number {
    return this.lines.reduce((sum, line) => sum + line.subtotal(), 0);
  }
}

class OrderController {
  constructor(private order: Order) {}

  checkout(): number {
    return this.order.total(); // Controller: chỉ điều phối, không tự tính
  }
}
```

> 💡 **Điểm mấu chốt:** Controller **không sai** — sai là **Fat Controller** (tự làm hết thay vì ủy thác).
> Information Expert và Controller **bổ sung** cho nhau: Controller nhận request → Expert thực hiện.

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🎯 **Biết đặt logic ở đâu** | 9 patterns trả lời trực tiếp "method này thuộc về ai" |
| 🔗 **Coupling thấp** | Trách nhiệm đúng chỗ → ít phụ thuộc chéo |
| 📦 **Cohesion cao** | Mỗi class làm việc liên quan dữ liệu của chính nó |
| 🧪 **Dễ test** | Expert nhỏ, tập trung → test từng unit dễ dàng |

---

## ⚠️ Lưu ý — Đừng áp dụng máy móc

| Vấn đề | Ví dụ |
|--------|-------|
| **Pure Fabrication lạm dụng** | Bịa quá nhiều class "Manager", "Helper" không ánh xạ domain → khó hiểu |
| **Controller phình to** | Mọi request dồn vào 1 Controller → tách theo use-case/module |
| **Expert "béo"** | Dồn hết logic vào 1 Expert → tách bằng Pure Fabrication khi class quá lớn |

> 💡 **Quy tắc:** Bắt đầu từ **Information Expert + Controller**. Chỉ dùng Pure Fabrication,
> Indirection, Protected Variations khi code đã có dấu hiệu coupling cao hoặc thay đổi thường xuyên.

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Không biết method mới đặt ở class nào | ✅ Hỏi "ai có đủ thông tin?" → Information Expert |
| Thiết kế API/UI handler | ✅ Controller chỉ điều phối, ủy thác cho domain object |
| Object A tạo object B | ✅ Creator nếu A chứa/dùng sát B |
| `if/else` theo loại object | ✅ Polymorphism |
| 2 module thay đổi cùng nhau liên tục | ✅ Indirection + Protected Variations |
| Class tiện ích không thuộc domain | ⚠️ Pure Fabrication — đặt tên rõ theo nhiệm vụ |

---

## 🔗 Liên quan

- **3.1.4 SoC** — High Cohesion là phiên bản class-level của SoC
- **3.2.1 SRP** — 1 class 1 lý do thay đổi (chi tiết hóa High Cohesion)
- **3.1.5 Law of Demeter** — Expert tự tính giúp không phải moi dữ liệu xuyên object
- **2.3.1 Strategy** — Cách cụ thể để thực hiện Polymorphism + Protected Variations

---

## 📁 Cấu trúc thư mục

```
3.1.7-grasp/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.7-grasp
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [GRASP - Wikipedia](https://en.wikipedia.org/wiki/GRASP_(object-oriented_design))
- 📖 [Applying UML and Patterns — Craig Larman](https://www.oreilly.com/library/view/applying-uml-and/9780133488616/)

---

## ⏭️ Bài tiếp theo

→ [3.1.8 CUPID](../3.1.8-cupid/README.md)
