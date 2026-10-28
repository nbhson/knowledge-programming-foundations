# 🧱 1.14 Modular Monolith

> Một deployment unit như Monolith, nhưng bên trong chia thành **module biệt lập** theo bounded context. Giao tiếp qua interface rõ ràng. Cầu nối giữa Monolith và Microservices.

---

## 🎯 Kiến trúc này là gì?

Modular Monolith giữ sự đơn giản của Monolith (1 codebase, 1 deploy) nhưng áp dụng **ranh giới module nghiêm ngặt** như Microservices. Mỗi module độc lập về code, có thể tách thành service riêng sau này.

**Mô hình này sinh ra từ bài học thực tế:** nhiều công ty (Spotify, Zalando, Booking.com) ban đầu monolith, khi scale thì thử tách microservices — và thất bại thảm hại vì:
1. Tách sai ranh giới → distributed monolith (xem 1.2)
2. Hạ tầng chưa đủ để vận hành N services
3. Không ai còn hiểu module cũ = team "đá bóng" blame game

Martin Fowler gọi là **"Monolith First"**: hãy bắt đầu monolith nhưng **lập tức thiết kế ranh giới** ngay từ ngày đầu, thay vì đợi khi đã phình to rồi mới cố cắt module. Đó chính là Modular Monolith.

**"Modular" nghĩa là gì trong thực tế — và điều quan trọng hơn là "không phải modular":**

| Đúng (modular) | Sai (monolith cũ) |
|----------------|-------------------|
| Module A **không thể** `import` class private của Module B | Module A gọi thẳng `ModuleBClasss.bloatedMethod()` |
| Module B chỉ expose interface public (port) | Module A đọc trực tiếp DB table của Module B |
| Mỗi module sở hữu schema/table của mình | 3 module cùng viết vào `users` table |
| Giao tiếp in-process qua port, không bao giờ qua DB | 3 module cùng JOIN bảng `order` |
| CI: mỗi module có test suite riêng, chạy độc lập | CI: run tất cả cùng nhau, fail 1 module khác |

**Tóm tắt triết lý:** Modular Monolith = Monolith **nhưng** với kỷ luật module strict như bạn đang chuẩn bị tách microservices. Bạn nhận được 80% lợi ích module (ranh giới rõ, dễ refactor) với chi phí 0% overhead phân tán (không có network, không có broker).

```
┌─────────────────────────────────────────────────────────────┐
│              MODULAR MONOLITH APPLICATION                   │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │  MODULE:      │  │  MODULE:      │  │  MODULE:      │    │
│  │  Orders       │  │  Payment      │  │  Users        │    │
│  │               │  │               │  │               │    │
│  │  OrderService │  │ PaymentService│  │ UserService   │    │
│  │  OrderRepo    │  │ PaymentRepo   │  │ UserRepo      │    │
│  └──────┬────────┘  └──────┬────────┘  └──────┬────────┘    │
│         │                  │                  │             │
│         └─────── giao tiếp qua interface ─────┘             │
│                 (in-process, không network)                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           1 DATABASE (schema tách module)           │    │
│  │  orders.*  │  payments.*  │  users.*               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Deploy: 1 unit (như Monolith)                              │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Khác Monolith:** Module có ranh giới rõ, không gọi thẳng class của nhau. **Khác Microservices:** Giao tiếp in-process, 1 DB, 1 deploy.

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả | Giải thích sâu |
|----------|-------|----------------|
| **1 deployment unit** | Deploy toàn bộ 1 lần | Mọi module nằm trong 1 process, 1 artifact. Không có orchestration, không có service discovery. Deploy nhanh (minutes), rollback đơn giản. |
| **Module độc lập** | Mỗi module có service, repo, schema riêng | Module là đơn vị đóng gói nhỏ nhất. `OrdersModule` chứa hết logic xử lý đơn hàng — không nhờ module khác "giúp" bằng cách đọc bảng của nó. |
| **Giao tiếp qua interface** | Module A gọi Module B qua public interface, không đụng internal | Đây là **điểm then chốt**: module B export **ports** (interface); module A **inject** interface đó. Nếu module B đổi internal implementation → module A không đổi. *Tương lai tách microservices chỉ cần thay adapter HTTP — code nghiệp vụ module không đổi.* |
| **1 DB, nhiều schema** | Schema tách theo module, không share bảng | Postgres `orders.*`, `payments.*`, `users.*` — mỗi schema là namespace của module. Không có bảng join trực tiếp giữa schema, truy xuất chéo qua port. *Lý do:* nếu share table → module vẫn phụ thuộc DB schema → tách module sẽ "dính" DB riêng. |
| **Dễ migrate** | Tách module thành service riêng khi cần | Khi có wall of load/team → module B có thể trở thành microservice riêng. Việc chỉ là viết `HttpOrdersPortAdapter` bên ngoài. |

**4 level của "module boundary" (càng cao càng đáng tin):**

| Level | Mô tả | Đạt được gì |
|-------|-------|--------------|
| **1. Package chỉ** | `src/orders/`, `src/payments/` trong cùng TS project | Namespace, tổ chức code |
| **2. Dependency rule** | Linter cấm module X `import` module Y trực tiếp | Boundary về compile-time |
| **3. Port interface** | Module export chỉ interface; internal class `private` | Boundary về public API |
| **4. Test boundary** | Module test có thể chạy độc lập với module khác | Đảm bảo module self-contained |

**Level 1–2 là minimum.** Level 3 mới là "module thật". Level 4 là "module chắc khỏe".

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Mini Shop**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │  OrdersModule    │   │  InventoryModule │                │
│  │  (tạo đơn hàng)  │──▶│  (reserve stock) │                │
│  └──────────────────┘   └──────────────────┘                │
│  ┌──────────────────┐                                       │
│  │  UsersModule     │                                       │
│  │  (lấy email)     │◀── OrdersModule gọi qua interface     │
│  └──────────────────┘                                       │
│                                                             │
│  OrdersModule chỉ biết interface (InventoryPort, UserPort)  │
│  — không import class internal của module khác              │
└─────────────────────────────────────────────────────────────┘
```

- **Module Orders:** `OrdersModule` (tạo đơn, gọi Inventory/Users qua interface)
- **Module Inventory:** `InventoryModule` (reserve stock, getStock)
- **Module Users:** `UsersModule` (getEmail)
- **Giao tiếp:** OrdersModule gọi InventoryModule/UsersModule qua interface công khai

> 💡 Muốn tách Inventory thành microservice? Chỉ cần thay interface call bằng HTTP/event call — phần còn lại giữ nguyên.

**Pattern "port và adapter" trong cùng monolith (xem examples/index.ts):**

```ts
// Module Inventory: expose ONLY this interface
export interface IInventoryPort {
  getStock(productId: string): number;
  reserve(productId: string, qty: number): void;
}

// Module Orders: gọi qua interface, không biết implementation
class OrderService {
  constructor(private inventory: IInventoryPort) {}
  async placeOrder(productId: string, qty: number) {
    if (this.inventory.getStock(productId) < qty)
      throw new InsufficientStockError();
    this.inventory.reserve(productId, qty);
    // ...
  }
}
```

Khi tách Inventory → microservice, code trong `OrderService` **giữ nguyên** — chỉ cần viết `HttpInventoryPortAdapter` để `reserve()` gọi qua HTTP. Module Orders không bao giờ biết nó đang gọi in-process hay network.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🚀 **Deploy đơn giản** | 1 unit, không cần orchestration | Deploy 1 lệnh `docker run`. Không cần Kubernetes, consul, etcd. Cost hạ tầng ~0. |
| 🧩 **Ranh giới rõ** | Module tách biệt, ít conflict code | `git blame src/orders/` = Orders team chỉ commit code ở đó. Git conflict gần như bằng 0 vì module khác không đụng. |
| 🔄 **Dễ migrate sang microservices** | Ranh giới đã có sẵn | Khi có bằng chứng (scale/team wall), tách module nào thì **chỉ làm adapter HTTP**, không viết lại. Chiến lược "strangler fig" (1.2): cắt từng module một. |
| 🐛 **Debug dễ hơn microservices** | In-process, không network | Stack trace xuyên module. Không cần distributed tracing cho module-internal call. |
| 💰 **Chi phí vận hành thấp** | Không cần broker, service discovery | 0 chi phí Kafka/RabbitMQ, 0 chi phí sidecar proxy, 0 chi phí vận hành cluster. |
| 👥 **Team autonomy** | Mỗi team sở hữu 1 module | "Your code, your service" principle hoạt động: module là single owner, team không "bơ" vào module khác. |
| 🛡️ **Bảo vệ domain logic** | Module có thể đặt DDD/Hexagonal bên trong | Mỗi module có thể độc lập có kiến trúc riêng (Clean, Onion) → domain strong. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 💥 **Single point of failure** | 1 lỗi ảnh hưởng toàn hệ thống | Module Orders OOM → toàn bộ monolith chết. Microservices cho phép Orders sập riêng. *Giảm thiểu:* bulkhead pool (thread pool/connection pool riêng per module), resource limit cgroup. |
| 🧠 **Cần kỷ luật cao** | Module dễ "thân nhau quá" nếu không kiểm soát | Linter + CI test không enforce là đủ. Cần code review + dependency graph visualization. |
| 📈 **Scale toàn bộ** | Không scale từng module riêng | Black Friday Orders traffic tăng 10x — bạn vẫn phải scale toàn bộ app. *Giảm thiểu:* giữ module "tải cao" cho tới khi có evidence rõ rồi tách. |
| 🏗️ **DB vẫn 1** | Khó scale DB độc lập theo module | `orders.*` phình to → phải scale cả DB. Schema separation chưa đủ. *Giảm thiểu:* shard/read-replica sau này; hoặc tách module + DB riêng khi tách service. |
| 📦 **Build-time coupling** | Module phải compile cùng lúc | Module Inventory thay đổi API → tất cả module import nó phải rebuild. *Giảm thiểu:* CI build parallel + contract test để phát hiện sớm. |
| 😵 **Trở thành modular monolith "trên danh nghĩa"** | Cấu trúc folder nhưng runtime vẫn linked | Bạn có folder `orders/` nhưng vẫn `import mongoose` và query trực tiếp bảng `orders_orders`. *Giảm thiểu:* enforce import rules (eslint-plugin-boundaries) + test module độc lập. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Team vừa (5–30 dev), muốn ranh giới rõ nhưng deploy đơn giản | ✅ Rất phù hợp | Lý tưởng nhất. Enough team để cần boundary, not enough để vận hành micro. |
| Đang Monolith, muốn chuẩn bị tách microservices | ✅ Rất phù hợp | Đây là bước đệm an toàn nhất: xây module boundary trước khi đối mặt distributed complexity. |
| Chưa đủ hạ tầng vận hành microservices | ✅ Phù hợp | Không có Kafka/K8s/SRE → Modular Monolith là lựa chọn duy nhất thông minh. |
| Domain phức tạp (DDD) cần aggregate biên giới rõ | ✅ Rất phù hợp | Bounded context = module. DDD + Modular Monolith là **cặp bài trùng thực tế số 1**. |
| Ứng dụng lớn, cần scale độc lập từng phần | ❌ Microservices phù hợp hơn | Khi đã có evidence module nào tải cao riêng rẽ. |
| Team nhỏ (< 5), app đơn giản | ⚠️ Layered Monolith đủ | Đừng đánh đổi complexity cho abstraction chưa cần. |
| SLA phải cách ly lỗi nghiêm ngặt (fintech core) | ❌ Microservices phù hợp hơn | Single process = single blast radius. Không phải trade-off đúng. |

**Câu quyết định duy nhất bạn cần trả lời:** *"module nào sẽ tách ra đầu tiên khi cần scale?"* Nếu câu trả lời rõ (Inventory, Notification, Reporting...) → bắt đầu modular hóa theo module đó ngay từ đầu. Nếu không rõ → cứ dùng monolith sạch (1.1) thôi.

---

## 🔗 Liên quan

- **1.1 Monolithic** — Tiền thân: không có ranh giới module
- **1.2 Microservices** — Đích đến: tách module thành service riêng
- **1.7 DDD** — Ranh giới module = Bounded Context
- **1.3 Clean Architecture** — Mỗi module có thể áp dụng Clean bên trong
- **5.9.2 Feature-based Organization** — Cách organize file trong module

**Chiến lược "tách dần" an toàn:**

1. Khởi đầu: **Modular Monolith** — ranh giới module đã có.
2. Khi có wall of load/team: tách **một module** → microservice (thêm Kafka adapter cho event-out).
3. Giữ nguyên module không tải → vẫn monolith.
4. Kết quả: **Hybrid** (phần lớn monolith + vài service chuyên biệt).

Đây chính là con đường Amazon, Netflix, Spotify đi — không phải "all-in" microservices.

---

## 📁 Cấu trúc thư mục ví dụ

```
1.14-modular-monolith/
├── README.md           # File này
└── examples/
    └── index.ts        # Mini Shop demo (chạy: npx tsx examples/index.ts)
```

Layout module-per-feature (preferred):

```text
src/
├── modules/
│   ├── orders/          # Bounded context Orders
│   │   ├── domain/      # Order, OrderItem (entities)
│   │   ├── ports/       # IInventoryPort, IUserPort (interface)
│   │   ├── application/ # OrderService, handlers
│   │   ├── infrastructure/ # OrderRepository (in-module scope)
│   │   └── index.ts     # exports: IInventoryPort, IOrderRepository
│   ├── inventory/
│   │   ├── ports/       # (none needed — Inventory không gọi module khác)
│   │   └── ...
│   └── users/
│       └── ...
├── bootstrap.ts         # wiring: resolve port adapters
└── app.ts               # composition root
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.14-modular-monolith
npx tsx examples/index.ts
```

Nhấn mạnh: trong demo, `OrdersModule` không biết `InventoryModule` là class nào — chỉ biết `IInventoryPort`. Đây là boundary đang làm việc.

---

## 📚 Tài liệu tham khảo

- 📖 [Modular Monolith - Martin Fowler](https://martinfowler.com/bliki/ModularMonolith.html)
- 📖 [Modular Monolith - microservices.io](https://microservices.io/patterns/monolithic/modular-monolith.html)
- 📖 [Monolith First - Fowler](https://martinfowler.com/bliki/MonolithFirst.html)

---

## ⏭️ Bài tiếp theo

→ [02-design-patterns](../../02-design-patterns/README.md)
