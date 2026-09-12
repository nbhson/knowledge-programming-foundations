# 🎯 1.7 Domain-Driven Design (DDD)

> Thiết kế phần mềm dựa trên **nghiệp vụ (domain)**. Dùng **Ubiquitous Language** (ngôn ngữ chung) giữa dev và domain expert, chia hệ thống thành **Bounded Context**, mô hình hóa bằng **Entities, Value Objects, Aggregates, Repositories**.

---

## 🎯 Kiến trúc này là gì?

DDD (Eric Evans) không phải kiến trúc kỹ thuật mà là **phương pháp thiết kế** tập trung vào nghiệp vụ. Mục tiêu: phần mềm phản ánh đúng cách domain hoạt động.

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

| Khái niệm | Mô tả | Ví dụ |
|-----------|-------|-------|
| **Ubiquitous Language** | Ngôn ngữ chung dev + domain expert | "Order", "Shipment", "TrackingId" |
| **Bounded Context** | Ranh giới của 1 domain model | Orders, Shipping, Billing |
| **Entity** | Có identity riêng, thay đổi theo thời gian | `Order` (id: #123) |
| **Value Object** | Không có identity, bất biến | `Address`, `Money`, `TrackingId` |
| **Aggregate** | Nhóm entity + VO, có root, bất biến qua root | `Shipment` (root) chứa `ShipmentLeg`/`Location` (VO) |
| **Aggregate Root** | Điểm truy cập duy nhất vào aggregate | `Shipment` |
| **Repository** | Interface lưu/truy xuất aggregate | `ShipmentRepository` |
| **Domain Service** | Business rule liên quan nhiều aggregate | `PricingService` |
| **Domain Event** | Sự kiện xảy ra trong domain | `ShipmentDelivered` |
| **Factory** | Tạo object phức tạp | `OrderFactory` |

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

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **Phản ánh đúng nghiệp vụ** | Code nói chuyện bằng ngôn ngữ domain |
| 🤝 **Giao tiếp tốt với domain expert** | Ubiquitous Language giảm hiểu lầm |
| 🧩 **Ranh giới rõ** | Bounded Context tách biệt, ít conflict |
| 🛡️ **Aggregate bảo vệ bất biến** | Invariant được đảm bảo qua root |
| 🔄 **Mô hình ổn định** | Domain ít đổi hơn công nghệ |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 👥 **Cần domain expert** | Không có expert thì DDD khó thành công |
| 🧠 **Learning curve cao** | Nhiều khái niệm mới, cần kỷ luật |
| 🏗️ **Phức tạp** | Overkill cho CRUD đơn giản |
| ⏳ **Tốn thời gian** | Cần workshop, event storming, modeling |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Nghiệp vụ phức tạp, nhiều quy tắc | ✅ Phù hợp |
| Có domain expert sẵn sàng tham gia | ✅ Phù hợp |
| Hệ thống vòng đời dài, cần bảo trì | ✅ Phù hợp |
| CRUD đơn giản, nghiệp vụ ít | ❌ Overkill |
| Không có domain expert | ⚠️ Khó áp dụng đúng |

---

## 🔗 Liên quan

- **1.3 Clean Architecture** — DDD thường kết hợp: Domain layer = DDD model
- **1.6 Onion Architecture** — Domain Model trung tâm = DDD model
- **1.2 Microservices** — Bounded Context = ranh giới tách service
- **1.14 Modular Monolith** — Bounded Context = ranh giới module

---

## 📁 Cấu trúc thư mục ví dụ

```
1.7-domain-driven-design/
├── README.md           # File này
└── examples/
    └── index.ts        # Shipping Domain demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.7-domain-driven-design
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Domain-Driven Design - Eric Evans (book)](https://www.oreilly.com/library/view/domain-driven-design-tackling/0321125215/)
- 📖 [DDD Community](https://dddcommunity.org/)
- 📖 [DDD Starter Modeling Process](https://github.com/ddd-crew/ddd-starter-modelling-process)

---

## ⏭️ Bài tiếp theo

→ [1.8 CQRS](../1.8-cqrs/README.md)