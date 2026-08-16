# 📡 1.10 Event-Driven Architecture

> Các thành phần giao tiếp qua **sự kiện** bất đồng bộ thay vì gọi trực tiếp. Producer publish event, Consumer subscribe và phản ứng. Giảm coupling, tăng khả năng mở rộng.

---

## 🎯 Kiến trúc này là gì?

Event-Driven Architecture (EDA) tách **producer** (người tạo sự kiện) và **consumer** (người xử lý sự kiện) qua **Event Bus** (message broker). Producer không biết ai đang lắng nghe.

```
CÁCH GỌI TRỰC TIẾP (Synchronous):
┌──────────┐  gọi trực tiếp  ┌──────────┐
│ OrderSvc │ ──────────────▶ │ NotifySvc│
└──────────┘                 └──────────┘
   (biết nhau, chờ nhau)

CÁCH EVENT-DRIVEN (Asynchronous):
┌──────────┐  publish       ┌──────────────┐  subscribe  ┌──────────┐
│ OrderSvc │ ─────────────▶ │  EVENT BUS   │ ──────────▶ │ NotifySvc│
└──────────┘                │ (Kafka,      │             └──────────┘
                            │  RabbitMQ)   │  subscribe  ┌──────────┐
                            └──────────────┘ ──────────▶ │InventorySvc│
                                                         └──────────┘
   (không biết nhau, không chờ nhau)
```

> 📌 **Event = sự thật đã xảy ra** (`OrderCreated`, `PaymentReceived`). Producer publish, consumer phản ứng độc lập.

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Loose Coupling** | Producer không biết consumer |
| **Asynchronous** | Không chờ nhau, không block |
| **Event Bus** | Trung gian vận chuyển event (Kafka, RabbitMQ, SNS/SQS) |
| **Eventual Consistency** | Consumer cập nhật sau, không đồng bộ tức thì |
| **Fan-out** | 1 event → nhiều consumer cùng lúc |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Order Processing**:

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENT BUS (SimpleEventBus)               │
│                                                             │
│  OrderCreated ──▶ NotificationService (gửi thông báo)       │
│  OrderCreated ──▶ InventoryService (trừ stock)              │
│  OrderPaid    ──▶ NotificationService (gửi hóa đơn)         │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐  OrderCreated   ┌──────────────────┐
│ OrderService │ ──────────────▶ │ Event Bus        │
│ (Producer)   │                 └────────┬─────────┘
└──────────────┘                          │
                                          ▼
                               ┌──────────────────┐
                               │ NotificationSvc  │
                               │ InventorySvc     │
                               │ (Consumers)      │
                               └──────────────────┘
```

- **Event Bus:** `SimpleEventBus`
- **Producers:** `OrderService` (publish `OrderCreated`, `OrderPaid`)
- **Consumers:** `NotificationService`, `InventoryService`

> 💡 Thêm consumer mới (ví dụ `AnalyticsService`) chỉ cần subscribe, **không sửa** OrderService.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔗 **Loose coupling** | Thêm/bớt consumer không đụng producer |
| 📈 **Scale độc lập** | Scale consumer riêng theo tải |
| ⚡ **Xử lý bất đồng bộ** | Không block request chính |
| 🧩 **Fan-out tự nhiên** | 1 event → nhiều hệ thống phản ứng |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🔍 **Khó debug** | Không nhìn thấy luồng gọi trực tiếp |
| 🔀 **Eventual consistency** | Dữ liệu lệch tạm thời giữa các service |
| 📦 **Ordering khó** | Đảm bảo thứ tự event phức tạp |
| 🧠 **Học đường cong** | Cần hiểu broker, retry, dead-letter |
| 🏗️ **Hạ tầng thêm** | Cần vận hành Kafka/RabbitMQ |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Nhiều service cần phản ứng cùng 1 sự kiện | ✅ Phù hợp |
| Cần scale consumer độc lập | ✅ Phù hợp |
| Xử lý bất đồng bộ (notification, analytics) | ✅ Phù hợp |
| Cần response ngay, không chờ xử lý phụ | ✅ Phù hợp |
| Hệ thống nhỏ, luồng gọi đơn giản | ❌ Overkill |

---

## 🔗 Liên quan

- **1.9 Event Sourcing** — Lưu event, EDA phát tán event
- **1.2 Microservices** — EDA là cách giao tiếp phổ biến giữa services
- **1.8 CQRS** — Event từ write side cập nhật read model

---

## 📁 Cấu trúc thư mục ví dụ

```
1.10-event-driven-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Processing demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.10-event-driven-architecture
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Event-Driven Architecture - AWS](https://aws.amazon.com/event-driven-architecture/)
- 📖 [Event-Driven Architecture - Martin Fowler](https://martinfowler.com/articles/201701-event-driven.html)
- 📖 [Kafka Documentation](https://kafka.apache.org/documentation/)

---

## ⏭️ Bài tiếp theo

→ [1.11 MVC](../1.11-mvc/README.md)