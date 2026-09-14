# 🎯 1.7 Domain-Driven Design (DDD)

> Thiết kế phần mềm dựa trên **nghiệp vụ (domain)**. Dùng **Ubiquitous Language** (ngôn ngữ chung) giữa dev và domain expert, chia hệ thống thành **Bounded Context**, mô hình hóa bằng **Entities, Value Objects, Aggregates, Repositories**.

---

## 🎯 Kiến trúc này là gì?

DDD (Eric Evans) không phải kiến trúc kỹ thuật mà là **phương pháp thiết kế** tập trung vào nghiệp vụ. Mục tiêu: phần mềm phản ánh đúng cách domain hoạt động.

**DDD giải quyết vấn đề gì?** Phần mềm thất bại không phải vì chậm, mà vì **hiểu sai nghiệp vụ**. "Order" trong đầu BA, "Order" trong database, và "Order" trong code là **ba thứ khác nhau**. Mỗi lần một bên đổi hiểu biết, hai bên kia không biết → phần mềm lệch dần khỏi thực tế cho tới khi không ai dùng được. DDD đối phó bằng cách **buộc mọi người dùng chung một ngôn ngữ** và **buộc code phản ánh đúng ngôn ngữ đó**.

**DDD là chiến lược, không phải layout.** Đây là hiểu lầm lớn nhất: người ta hay triển khai "DDD" bằng cách thêm folder `domain/`, rồi vẫn trả về anemic entities và nhét toàn bộ logic vào `OrderService`. DDD bắt đầu ở **phòng họp** (khám phá domain với chuyên gia, strategic design), không bắt đầu trong IDE. tactical patterns (entity, VO, aggregate) chỉ là **hệ quả** khi bạn đã hiểu domain.

**DDD gồm hai phần, thường bị bỏ sót một nửa:**
- **Strategic design** (quan trọng hơn): Ubiquitous Language, Bounded Context, Context Mapping — thiết kế **ranh giới của toàn hệ thống**, dùng chung giữa các team/service.
- **Tactical design**: Entity, Value Object, Aggregate, Repository, Domain Service, Domain Event — thiết kế **bên trong một bounded context**.

```
┌─────────────────────────────────────────────────────────────┐
│                    BOUNDED CONTEXT: ORDERS                  │
│                                                             │
│  ┌────────────┐   ┌────────────┐   ┌────────────────────┐   │
│  │  Order     │   │  OrderItem │   │  OrderRepository   │   │
│  │  (Entity)  │──▶│ (ValueObj) │   │  (Interface)       │   │
│  └────────────┘   └────────────┘   └────────────────────┘   │
│        │                                                    │
│        ▼                                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Domain Services: PricingService, ShippingService  │     │
│  │  Domain Events: OrderPlaced, OrderShipped          │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  Ubiquitous Language: "Order", "Item", "Ship", "Cancel"     │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Bounded Context** = ranh giới rõ ràng của 1 domain model. "Order" trong context Orders khác "Order" trong context Shipping.

---

## 📐 Các khái niệm cốt lõi

| Khái niệm | Mô tả | Ví dụ | Giải thích sâu |
|-----------|-------|-------|----------------|
| **Ubiquitous Language** | Ngôn ngữ chung dev + domain expert | "Order", "Shipment", "TrackingId" | Nếu BA nói "tách lô" và dev gọi `splitBatch()` → ok. Nếu BA nói "tách lô" mà code gọi `divideOrder()` → **language broken**, bug chỉ là thời gian. Khi thuật ngữ mâu thuẫn → **dừng lại, làm rõ ngay**, đó là tín hiệu domain hiểu sai. |
| **Bounded Context** | Ranh giới của 1 domain model | Orders, Shipping, Billing | Cùng một từ nhưng khác nghĩa là **bình thường**: `Customer` trong Billing có hóa đơn, trong Shipping chỉ có địa chỉ. Bounded context = nơi một model nhất quán, **không có model dùng chung cho mọi context**. Đây là cơ sở tách microservices/service module. |
| **Entity** | Có identity riêng, thay đổi theo thời gian | `Order` (id: #123) | Hai `Order` cùng mọi field nhưng khác id → khác nhau. So sánh bằng **id**, không phải thuộc tính. Entity có **vòng đời**: tạo → sửa → hủy, vẫn là cùng một object. |
| **Value Object** | Không có identity, bất biến | `Address`, `Money`, `TrackingId` | Hai `Money("100","USD")` → **bằng nhau**, ai quan tâm là object nào. Bất biến: đổi tiền không `setAmount()`, mà `a.add(b)` trả VO mới. VO **gom validation**: `TrackingId` không thể chứa chuỗi rỗng → hệ thống không bao giờ có state không hợp lệ. |
| **Aggregate** | Nhóm entity + VO, có root, bất biến qua root | `Shipment` (root) chứa `ShipmentLeg`/`Location` | Aggregate là **transaction boundary**: mọi thay đổi trong aggregate xảy ra **nguyên khối** hoặc không gì cả. Aggregate **chỉ tham chiếu tới aggregate khác bằng id**, không giữ object → tránh "aggregate nào cũng phụ thuộc aggregate nào". |
| **Aggregate Root** | Điểm truy cập duy nhất vào aggregate | `Shipment` | Bên ngoài không được sửa `ShipmentLeg` trực tiếp → `shipment.moveToLocation(...)` là **cổng duy nhất**, ở đó invariant (không được dịch chuyển về ngày quá khứ) được kiểm tra. |
| **Repository** | Interface lưu/truy xuất aggregate | `ShipmentRepository` | Một repository **per aggregate root**, không per table. `ShipmentRepository.save(shipment)` — không có `saveLeg()`; leg chỉ được lưu qua root. |
| **Domain Service** | Business rule liên quan nhiều aggregate | `PricingService` | Logic cần cả `Order` + `Product` + `Promotion` → không đặt được vào entity nào → service. Stateless, chỉ dùng ubiquitous language. |
| **Domain Event** | Sự kiện xảy ra trong domain | `ShipmentDelivered` | Phát biểu quá khứ: đã xảy ra và không thể đảo. `ShipmentDelivered`, không phải `SendDeliveryNotification`. Cầu nối giữa các bounded context (integration). |
| **Factory** | Tạo object phức tạp | `OrderFactory` | Khi tạo `Shipment` phải dựng 5 VO và 3 child entity đúng invariant → gom vào factory hoặc named constructor (`Shipment.create(...)`) để aggregate chỉ được sinh ra ở **trạng thái hợp lệ**. |

**Quy tắc chọn Aggregate (khó nhất, sai nhiều nhất):**
1. Aggregate **nhỏ nhất có thể** — mỗi aggregate chứa đúng số object cần để đảm bảo invariant của nó. Không có `Order` chứa cả `Customer`, `Product`, `Review`.
2. Invariant **phải** là invariant (nếu bỏ invariant, gộp aggregate = chọn sai).
3. Một transaction chỉ nên đụng **một aggregate**. Nếu nghiệp vụ cần sửa 2 aggregate cùng lúc → có thể bạn đang định nghĩa aggregate quá to.
4. **Eventual consistency giữa các aggregate** — chấp nhận update async qua domain events.

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Shipping Domain**:

```
┌─────────────────────────────────────────────────────┐
│              BOUNDED CONTEXT: SHIPPING              │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Shipment (Aggregate Root, Entity)          │    │
│  │  ├── TrackingId (Value Object)              │    │
│  │  ├── Address (Value Object)                 │    │
│  │  └── Location (Value Object)                │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Domain Events: ShipmentDelivered                   │
│  Repository: ShipmentRepository (interface)         │
└─────────────────────────────────────────────────────┘
```

- **Entities:** `Shipment` (Aggregate Root)
- **Value Objects:** `TrackingId`, `Address`, `Location`
- **Aggregate:** `Shipment` (root) chứa các VO
- **Domain Events:** `ShipmentDelivered`
- **Repository:** `ShipmentRepository`

> 💡 `TrackingId` là Value Object vì 2 tracking id giống nhau = cùng giá trị, không cần identity riêng.

**Mặt trái của VO — code:**

```ts
// Không có VO: ai cũng có thể tạo state sai
function ship(order: Order, address: string, tracking: string) {
  order.destination = address;     // "Hà Nội" hay "hanoi, vn" hay "" ?
  order.trackingId  = tracking;    // "12345" hay "TN-12345" ?
}

// Có VO: invariant sống ngay trong type, không thể tạo giá trị sai
class TrackingId {
  constructor(public readonly value: string) {
    if (!/^TN-\d{8}$/.test(value))
      throw new Error(`Invalid tracking id: ${value}`);
  }
}
```

`Shipment` chỉ tồn tại nếu `TrackingId` được tạo thành công → hệ thống **không bao giờ có** `Shipment` với tracking id sai định dạng → bug ở tầng service/UI biến mất.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🎯 **Phản ánh đúng nghiệp vụ** | Code nói chuyện bằng ngôn ngữ domain | `order.confirm()` đọc được như mô tả BA, không cần "dịch". Khi bug xảy ra, BA đọc được code → debug nhanh. |
| 🤝 **Giao tiếp tốt với domain expert** | Ubiquitous Language giảm hiểu lầm | Mỗi khi dev nói "tôi cần thêm field" mà BA không hiểu → thất bại. Language chung buộc cả hai phía hiểu cùng một mô hình. |
| 🧩 **Ranh giới rõ** | Bounded Context tách biệt, ít conflict | Context map = bản đồ hệ thống: ai sở hữu gì, model nào chuyển đổi sang model nào → team không "đạp" vào định nghĩa của nhau. |
| 🛡️ **Aggregate bảo vệ bất biến** | Invariant được đảm bảo qua root | Rule "không giảm quá 10% giảm giá" được viết **một lần, ở một chỗ, không vòng nào có thể bypass**. |
| 🔄 **Mô hình ổn định** | Domain ít đổi hơn công nghệ | Cùng một model dùng được với Express và NestJS, PostgreSQL và DynamoDB. |
| 🔗 **DDD → Microservices** | (Ưu điểm chiến lược) | Bounded context = ranh giới service tự nhiên, thay vì tách theo "team nào code". Tách microservices đúng cách chính là **tách đúng bounded context**. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 👥 **Cần domain expert** | Không có expert thì DDD khó thành công | "DDD = 3 ngày workshop + tạo folder domain" là thất bại DDD phổ biến nhất. Nếu không có ai am hiểu nghiệp vụ ngồi cùng, bạn chỉ đang **đoán** tên class. *Giảm thiểu:* dùng **Event Storming** khi bắt đầu để phát hiện kiến thức thiếu ngay, trước khi commit code. |
| 🧠 **Learning curve cao** | Nhiều khái niệm mới, cần kỷ luật | Aggregate design, Context Mapping, Anticorruption Layer… nhiều thuật ngữ. Team chưa quen → làm "hình thức DDD": anemic + service = DDD cosplay. |
| 🏗️ **Phức tạp cho CRUD** | Overkill cho CRUD đơn giản | DDD mạnh nhất ở **core domain** (phần làm bạn khác biệt). CRUD admin panel, internal tool → **supporting domain**, DDD chỉ tạo thêm việc. |
| ⏳ **Tốn thời gian upfront** | Cần workshop, event storming, modeling | DDD đầu tư 2–4 tuần khám phá domain trước khi code → ROI chỉ hiện ra sau năm đầu tiên. Không phù hợp khi requirement đổi liên tục (MVP). |
| 🎭 **Aggregate quá to / god entity** | (Bẫy tactical phổ biến nhất) | Team tạo `Order` chứa 30 field + danh sách `LineItem` + `Payment` + `Shipment` trong một aggregate. Transaction nào cũng load hết, lock toàn bộ, không scale. *Giảm thiểu:* invariant nhỏ → aggregate nhỏ; tách bằng id reference + eventual consistency. |
| 🕸️ **Không tự giải quyết technical** | DDD không nói về deployment, observability, performance | DDD không phải Clean Architecture, không phải microservices playbook. Bạn cần **DDD + Clean/Onion + một kiến trúc triển khai** mới đủ. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Nghiệp vụ phức tạp, nhiều quy tắc, nhiều edge case | ✅ Phù hợp | DDD shine ở đây: fintech, insurance, logistics, e-commerce pricing — nơi "logic thật" là lợi thế cạnh tranh. |
| Có domain expert sẵn sàng tham gia thường xuyên | ✅ Phù hợp | Điều kiện **tiên quyết**, không phải nice-to-have. |
| Hệ thống vòng đời dài, nhiều dev thay phiên nhau | ✅ Phù hợp | Code là tài liệu sống. Model tốt cho phép dev mới hiểu nghiệp vụ mà không cần gặp BA mỗi ngày. |
| Sắp tách microservices | ✅ Rất phù hợp | Bounded context = blueprint ranh giới service → tách đúng ngay từ đầu. |
| CRUD đơn giản, nghiệp vụ ít | ❌ Overkill | DDD ở đây = thêm 10 abstraction không mua được gì. |
| Không có domain expert | ⚠️ Khó áp dụng đúng | Có thể dùng strategic DDD (bounded context) mà không cần tactical design. |
| Requirement thay đổi liên tục, chưa ổn định | ⚠️ Đợi domain ổn rồi model | Model hóa trên cát = phải xé model mỗi sprint. |

---

## 🔗 Liên quan

- **1.3 Clean Architecture** — DDD thường kết hợp: Domain layer = DDD model
- **1.6 Onion Architecture** — Domain Model trung tâm = DDD model
- **1.2 Microservices** — Bounded Context = ranh giới tách service
- **1.14 Modular Monolith** — Bounded Context = ranh giới module

**Các quan hệ giữa các bounded context (Context Mapping patterns):**
| Pattern | Mô tả |
|---------|-------|
| **Shared Kernel** | Hai context chia sẻ một phần model nhỏ (đắt, dễ coupling) |
| **Customer/Supplier** | Context A phụ thuộc B để cung cấp feature |
| **Conformist** | A chấp nhận model của B (B là external vendor) |
| **Anticorruption Layer** | A xây adapter dịch model B → model A (bảo vệ A khỏi ô nhiễm) |
| **Open Host Service** | B công khai API chuẩn cho mọi consumer |

---

## 📁 Cấu trúc thư mục ví dụ

```
1.7-domain-driven-design/
├── README.md           # File này
└── examples/
    └── index.ts        # Shipping Domain demo (chạy: npx ts-node examples/index.ts)
```

Layout DDD kinh điển (kết hợp Onion):

```text
src/
├── shipping/                # 1 bounded context
│   ├── domain/
│   │   ├── model/           # Shipment, TrackingId, Address, Location
│   │   ├── event/           # ShipmentDelivered
│   │   └── repository/      # ShipmentRepository (interface)
│   ├── application/         # Use cases orchestration
│   └── infrastructure/      # DB adapter, HTTP adapter
├── billing/                 # another bounded context
└── shared/                  # kernel nhỏ nếu cần (hạn chế dùng)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.7-domain-driven-design
npx ts-node examples/index.ts
```

Hãy để ý trong demo: `Shipment` không có setter `address` — chỉ có method `moveToLocation(loc: Location)` qua aggregate root. Đó là aggregate pattern đang làm việc: không cách nào vi phạm invariant mà vẫn compile được.

---

## 📚 Tài liệu tham khảo

- 📖 [Domain-Driven Design - Eric Evans (book)](https://www.oreilly.com/library/view/domain-driven-design-tackling/0321125215/)
- 📖 [DDD Community](https://dddcommunity.org/)
- 📖 [DDD Starter Modeling Process](https://github.com/ddd-crew/ddd-starter-modelling-process)
- 📖 [Implementing Domain-Driven Design - Vaughn Vernon](https://www.oreilly.com/library/view/implementing-domain-driven-design/9780133039900/)

---

## ⏭️ Bài tiếp theo

→ [1.8 CQRS](../1.8-cqrs/README.md)
