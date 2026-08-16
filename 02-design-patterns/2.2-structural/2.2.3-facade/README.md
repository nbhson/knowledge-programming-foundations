# 🏛️ 2.2.3 Facade Pattern

> Cung cấp **interface đơn giản** cho một **subsystem phức tạp**. Client chỉ cần gọi 1 method, không cần biết chi tiết bên trong.

---

## 🎯 Vấn đề

Hệ thống có nhiều class phức tạp phối hợp nhau. Client phải biết **tất cả** các class và thứ tự gọi — dễ sai, khó dùng.

```
❌ Client phải tự phối hợp mọi thứ
Client ──▶ AuthService ──▶ UserService ──▶ CacheService ──▶ LoggerService

✅ Facade — 1 điểm vào duy nhất
Client ──▶ OrderFacade.placeOrder()
                │
                ├─▶ AuthService.check()
                ├─▶ UserService.get()
                ├─▶ CacheService.set()
                └─▶ LoggerService.log()
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────┐
│  Client ──▶ Facade (interface đơn giản)     │
│                 │                           │
│                 │ gọi nội bộ                │
│                 ▼                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Subsystem│ │ Subsystem│ │ Subsystem│     │
│  │    A     │ │    B     │ │    C     │     │
│  └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Client gọi facade.placeOrder()
        │
        ▼
Facade: 1. auth → 2. validate → 3. save → 4. notify
        (client không cần biết thứ tự)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Subsystem phức tạp
class InventoryService {
  checkStock(id: string): boolean { return true; }
  reserve(id: string): void { console.log("📦 Reserved"); }
}
class PaymentService {
  charge(amount: number): void { console.log(`💳 Charged $${amount}`); }
}
class ShippingService {
  ship(orderId: string): void { console.log(`🚚 Shipped ${orderId}`); }
}
class NotificationService {
  sendEmail(email: string): void { console.log(`📧 Sent to ${email}`); }
}

// Facade — 1 method cho client
class OrderFacade {
  private inventory = new InventoryService();
  private payment = new PaymentService();
  private shipping = new ShippingService();
  private notification = new NotificationService();

  placeOrder(productId: string, amount: number, email: string): void {
    if (!this.inventory.checkStock(productId)) {
      console.log("❌ Out of stock");
      return;
    }
    this.inventory.reserve(productId);
    this.payment.charge(amount);
    this.shipping.ship(productId);
    this.notification.sendEmail(email);
  }
}

// Client — chỉ gọi 1 method
const facade = new OrderFacade();
facade.placeOrder("P001", 99, "user@example.com");
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **Đơn giản** | Client gọi 1 method, không cần biết chi tiết |
| 🔒 **Cô lập** | Thay đổi subsystem không ảnh hưởng client |
| 🧩 **Giảm coupling** | Client không phụ thuộc nhiều class |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🎭 **God object risk** | Facade dễ phình to nếu ôm quá nhiều |
| 🔗 **Ràng buộc** | Client bị khóa vào interface Facade |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| API wrapper cho thư viện phức tạp | ✅ Phù hợp |
| Ẩn chi tiết subsystem | ✅ Phù hợp |
| Entry point cho module lớn | ✅ Phù hợp |

---

## 🔗 Liên quan

- **2.2.1 Adapter** — Adapter đổi interface cho khớp, Facade đơn giản hóa
- **2.2.4 Proxy** — Proxy cùng interface, Facade interface mới đơn giản hơn

---

## 📁 Cấu trúc thư mục

```
2.2.3-facade/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.2-structural/2.2.3-facade
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Facade - Refactoring Guru](https://refactoring.guru/design-patterns/facade)
- 📖 [Facade - Source Making](https://sourcemaking.com/design_patterns/facade)

---

## ⏭️ Bài tiếp theo

→ [2.2.4 Proxy](../2.2.4-proxy/README.md)