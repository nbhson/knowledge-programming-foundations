# 🏛️ 2.2.3 Facade Pattern

> Cung cấp **interface đơn giản** cho một **subsystem phức tạp**. Client chỉ cần gọi 1 method, không cần biết chi tiết bên trong.

---

## 🎯 Vấn đề

Hệ thống có nhiều class phức tạp phối hợp nhau. Client phải biết **tất cả** các class và thứ tự gọi — dễ sai, khó dùng.

**Facade không phải là "wrapper đơn giản"** — nó là **thiết kế lại tương tác** của subsystem cho người dùng cuối. Sự khác biệt tinh tế:
- **Wrapper:** bọc từng method của subsystem 1:1, chỉ thêm log/cache.
- **Facade:** định nghĩa lại cách subsystem được dùng — thường **gom nhiều operation** thành 1 high-level API.

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

**Phân biệt Facade vs Adapter vs Proxy:**

| Pattern | Mục đích | Interface | Số component |
|---------|----------|-----------|--------------|
| **Facade** | Đơn giản hóa subsystem | **Đơn giản hơn** subsystem | N subsystems → 1 facade |
| **Adapter** | Chuyển interface cũ sang mới | **Khác** target | Adaptee + adapter |
| **Proxy** | Kiểm soát truy cập | **Giữ nguyên** | Proxy + real |

Facade là **structural simplification pattern** — nó không làm cho system compatible hay kiểm soát access, mà làm cho system **dùng được**.

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

**Facade có thể hide nhiều điều:**
- Thứ tự gọi operations
- Validation rules
- Error handling
- Retry logic
- Logging/monitoring
- Transaction boundaries

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

**Real-world example — HTTP server facade:**

```typescript
// Express/Fastify thực chất là Facade cho Node.js HTTP server
const app = express();  // hide net.createServer(), parse headers, route

app.get('/orders', (req, res) => {
  // client code đơn giản — không cần biết TCP, sockets, etc.
});
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🎯 **Đơn giản** | Client gọi 1 method, không cần biết chi tiết | Reduce cognitive load cho consumer — chỉ cần biết facade contract. |
| 🔒 **Cô lập** | Thay đổi subsystem không ảnh hưởng client | Khi PaymentService đổi API, chỉ sửa OrderFacade, client không đụng. |
| 🧩 **Giảm coupling** | Client không phụ thuộc nhiều class | Giảm số import, giảm compile-time dependencies. |
| 📦 **Encapsulate complexity** | Ẩn các bước nội bộ | Transaction, validation, retry — tất cả ẩn trong facade. |
| 🧪 **Testable** | Test facade riêng, mock subsystem | Facade là nơi tốt để đặt contract test. |
| 👥 **Onboarding nhanh** | Dev mới chỉ cần học facade API | Subsystem complex có thể dành cho specialist. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🎭 **God object risk** | Facade dễ phình to nếu ôm quá nhiều | `OrderFacade` sau 1 năm có thể 1000 dòng, 20 methods. *Giảm thiểu:* chia nhỏ facade theo bounded context (OrderFacade, PaymentFacade, UserFacade). |
| 🔗 **Ràng buộc** | Client bị khóa vào interface Facade | Facade cố định contract → mở rộng khó. *Giảm thiểu:* document breaking changes, versioning facade interface. |
| 👻 **Facade sprawl** | (Failure mode) | Nhiều facade cho 1 subsystem = duplication. *Gi giảm thiểu:* mỗi facade cho 1 use case rõ ràng. |
| 📉 **Hide useful APIs** | Facade có thể che subsystem quan trọng khác | Client không biết được có `batchOrder()` trong InventoryService. *Gi giảm thiểu:* tài liệu hóa facade + direct subsystem API khi cần. |
| 🧱 **Thick facade** | Facade chứa logic nghiệp vụ thay vì chỉ orchestrate | Facade trở thành second Service layer → vi phạm SRP. *Gi giảm thiểu:* delegate phức tạp xuống service/subsystem, facade chỉ orchestrate. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| API wrapper cho thư viện phức tạp | ✅ Phù hợp | Library API quá nhiều method → facade expose subset. |
| Ẩn chi tiết subsystem | ✅ Phù hợp | Client không nên biết về 5 service phối hợp. |
| Entry point cho module lớn | ✅ Phù hợp | Module entry point qua facade = consistent contract. |
| Subsystem có nhiều dependency | ✅ Phù hợp | Facade hides dependency graph complexity. |
| Client cần simple quick-start | ✅ Phù hợp | "One-click" experience cho common flows. |
| Client cần direct access to subsystem | ❌ Không nên | Nếu client đã biết subsystem, facade chỉ gây abstraction leak. |
| Subsystem đơn giản (≤ 2 classes) | ⚠️ Overkill | Facade không worth overhead. |

---

## 🔗 Liên quan

- **2.2.1 Adapter** — Adapter đổi interface cho khớp, Facade đơn giản hóa.
- **2.2.4 Proxy** — Proxy cùng interface, Facade interface mới đơn giản hơn.
- **1.5 Hexagonal Architecture** — Facade ≈ Application Service (gateways).
- **5.10 API Design** — Facade là "simple API surface" của hệ thống phức tạp.

**Facade trong practice phổ biến:**
- `express()` — facade cho Node HTTP server
- `axios.create()` — facade cho fetch
- `PrismaClient` — facade cho raw SQL
- `createRouter()` — facade cho routing logic

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
- 📖 [Facade Pattern Explained - Gang of Four](https://en.wikipedia.org/wiki/Facade_pattern)

---

## ⏭️ Bài tiếp theo

→ [2.2.4 Proxy](../2.2.4-proxy/README.md)
