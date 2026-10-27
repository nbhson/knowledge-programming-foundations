# 📡 1.10 Event-Driven Architecture

> Các thành phần giao tiếp qua **sự kiện** bất đồng bộ thay vì gọi trực tiếp. Producer publish event, Consumer subscribe và phản ứng. Giảm coupling, tăng khả năng mở rộng.

---

## 🎯 Kiến trúc này là gì?

Event-Driven Architecture (EDA) tách **producer** (người tạo sự kiện) và **consumer** (người xử lý sự kiện) qua **Event Bus** (message broker). Producer không biết ai đang lắng nghe.

**Vấn đề mà EDA giải quyết — "orchestration hell":** trong kiến trúc sync (HTTP call chain), một nghiệp vụ "tạo đơn hàng" buộc service Order phải **biết và gọi lần lượt** Notify + Inventory + Payment + Shipping + Analytics. Mỗi lần thêm một hệ thống mới (ví dụ: fraud detection), phải **sửa code OrderService** — vi phạm Open/Closed. Mỗi lần một service downstream chậm, request chính **kẹt theo**. Một service chết, cả chuỗi fail (cascading failure).

EDA lật ngược: Order chỉ hô **"chuyện gì đã xảy ra"** (`OrderCreated`), ai quan tâm thì tự nghe. Producer **không biết, không chờ, không phụ thuộc** bất kỳ consumer nào.

**Hai phong cách EDA (khác nhau rõ rệt — phân biệt khi phỏng vấn):**

| | **Event-Carried State Transfer** | **Notification-Only Events** |
|---|---|---|
| Event chứa gì | **Toàn bộ dữ liệu** cần thiết | Chỉ id + thông báo tối thiểu |
| Consumer có cần gọi lại producer? | **Không** — tự đủ dữ liệu | **Có** — phải fetch thêm (API) |
| Coupling | Thấp nhất | Kém hơn — vẫn phụ thuộc API của nhau |
| Ví dụ | `OrderCreated { full order payload }` | `OrderCreated { orderId }` → consumer gọi `GET /orders/:id` |

**Hai topology giao tiếp (từ sách Designing Data-Intensive Applications):**
- **Peer-to-peer (direct):** producer đẩy thẳng sang consumer (RabbitMQ routing, Kappa). Không lưu trữ tập trung.
- **Mediator (broker):** mọi event đi qua broker (Kafka, SNS/SQS). Broker lưu log → consumer đọc lại được, thêm consumer mới không mất event.

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

**Đặt tên event ở ngôi quá khứ vì điều này:** `OrderCreated` không phải "lệnh tạo đơn" mà là "đơn hàng **đã được tạo**".Lệnh → **command** (`CreateOrder`); sự thật đã xảy ra → **event**. Command thay đổi được/bác bỏ được; event thì không. Nhầm hai loại này là lỗi thiết kế EDA số 1 (event trở thành remote procedure call đội lốt — "remote function call anti-pattern").

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả | Giải thích sâu |
|----------|-------|----------------|
| **Loose Coupling** | Producer không biết consumer | OrderService không import NotificationService. Xóa/hết sức chứa consumer → producer không đổi một dòng. Coupling duy nhất còn lại là **schema của event** → đó là lý do event cần versioning + registry. |
| **Asynchronous** | Không chờ nhau, không block | HTTP request trả về ngay sau khi publish event → latency user-facing thấp. Việc nặng (gửi email, trừ kho) chạy sau. Đổi lại: **không có cách nào "chờ" kết quả của consumer** — phải thiết kế lại flow thành "accept then process". |
| **Event Bus** | Trung gian vận chuyển event (Kafka, RabbitMQ, SNS/SQS) | **Kafka:** distributed log, giữ event theo retention, replay được, ordering **per partition**, phù hợp event streaming + nhiều consumer group. **RabbitMQ:** traditional broker, queue-based, ack/reject, routing keys, phù hợp task queue. Chọn sai công cụ = tự làm khó mình. |
| **Eventual Consistency** | Consumer cập nhật sau, không đồng bộ tức thì | Thời gian giữa `OrderCreated` và stock được trừ = **lag** (ms → phút nếu consumer sập). UI phải chịu được: "đơn của bạn đang được xử lý". Cần xử lý **duplicate** (at-least-once delivery → consumer phải idempotent). |
| **Fan-out** | 1 event → nhiều consumer cùng lúc | Cùng một `OrderCreated`: notify + inventory + analytics + fraud... mỗi bên một consumer group, không bên nào biết bên nào. Đây là giá trị lớn nhất: **thêm tiêu dùng mới không sửa nguồn**. |

**Hai pattern bắt buộc phải biết khi vận hành:**
- **Outbox pattern:** publish event **sau khi** commit DB sẽ có khoảng hở (commit OK → crash → mất event). Outbox ghi event **cùng transaction** với business data, một background process (CDC) đẩy ra broker → **atomicity đảm bảo**.
- **Dead Letter Queue (DLQ):** event xử lý fail N lần → chuyển vào DLQ để con người điều tra, thay vì retry vô hạn làm nghẽn queue.

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

**Code đối chứng giá trị "open/closed" — thêm AnalyticsService:**

```ts
// Producer — không đổi một dòng nào:
class OrderService {
  constructor(private bus: EventBus) {}
  async createOrder(items: CartItem[]) {
    const order = await this.saveOrder(items);
    this.bus.publish(new OrderCreated(order));   // xong.
    return order;
  }
}

// Consumer mới — chỉ thêm file này:
class AnalyticsService {
  constructor(bus: EventBus) {
    bus.subscribe('OrderCreated', (e) => this.record(e));  // tự nghe
  }
}
```

So sánh với world sync: thêm AnalyticsService = mở `OrderService` ra, thêm `analyticsClient.track(...)`, thêm timeout handling, thêm try/catch... và lần sau thêm FraudService lại mở ra tiếp. EDA đóng file producer **vĩnh viễn**.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔗 **Loose coupling** | Thêm/bớt consumer không đụng producer | Producer không cần biết **số lượng** hay **danh tính** consumer → hai team phát triển độc lập, contract duy nhất là event schema. |
| 📈 **Scale độc lập** | Scale consumer riêng theo tải | Notify chịu tải 10k/s → scale consumer đó. Order chỉ 100/s → giữ nguyên. Không service nào bị "kéo" bởi service khác. |
| ⚡ **Xử lý bất đồng bộ** | Không block request chính | User nhận "đặt hàng thành công" trong 200ms, email gửi trong 5s — user không cần biết. Throughput hệ thống tăng nhờ **peak shaving**: broker đệm burst, consumer xử lý theo khả năng. |
| 🧩 **Fan-out tự nhiên** | 1 event → nhiều hệ thống phản ứng | Analytics, search indexing, audit, ML feature pipeline — tất cả chỉ subscribe, không sửa luồng chính. |
| 🛡️ **Chịu lỗi tốt hơn** | (Ưu điểm hay bị bỏ sót) | NotificationService sập → event **chờ trong queue**, InventoryService vẫn chạy, khi Notify sống lại sẽ xử lý tiếp. Sync call: Notify chết là checkout fail. |
| 🔀 **Decouple thời gian** | (Ưu điểm chiến lược) | Hai bên không cần **cùng sống cùng lúc**. Producer 3:00 publish, consumer 9:00 bật lên vẫn đọc được. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🔍 **Khó debug** | Không nhìn thấy luồng gọi trực tiếp | Bug "email không gửi": event chưa publish? broker delay? consumer crash loop? DLQ đầy? Không có call chain liền mạch. *Giảm thiểu:* correlation id xuyên event, distributed tracing, visualize topology. |
| 🔀 **Eventual consistency** | Dữ liệu lệch tạm thời giữa các service | "Trừ stock rồi nhưng sao web vẫn còn hàng?" → lag giữa write và projection. *Giảm thiểu:* UI hiển thị trạng thái pending; critical path (payment, stock) dùng sync call thay vì event. |
| 📦 **Ordering khó** | Đảm bảo thứ tự event phức tạp | `OrderCreated` rồi `OrderPaid` — nếu consumer xử lý sai thứ tự thì hỏng. Kafka chỉ đảm bảo order **per partition** → phải partition key đúng (`orderId`). Hai event cùng order nhưng partition khác → mất thứ tự. |
| 🧠 **Học đường cong** | Cần hiểu broker, retry, dead-letter | At-least-once → **duplicate là bình thường** → mọi consumer phải **idempotent** (idempotency key, state version check). Exactly-once là **huyền thoại marketing** — Kafka "exactly-once" chỉ đúng trong giới hạn của nó. |
| 🏗️ **Hạ tầng thêm** | Cần vận hành Kafka/RabbitMQ | Broker = stateful cluster, cần monitoring lag, capacity, retention, upgrade. Tự vận hành Kafka khó; managed (MSK/Confluent) thì đắt. |
| 🕸️ **Spaghetti events** | (Failure mode thực tế số 1) | Sau 2 năm: 300 topic, không ai biết event nào đang được dùng, đổi schema ai phải hỏi cả công ty. *Giảm thiểu:* **event schema registry** + ownership + tài liệu hóa topology, kỷ luật đặt tên. |
| 😵 **Mất dòng kiểm soát nghiệp vụ** | (Hệ quả thiết kế) | Không còn một nơi nào "làm hết flow order". Logic phân tán qua nhiều consumer → rất khó trả lời "đơn hàng này đang ở bước nào?". *Giảm thiểu:* **workflow orchestrator** (Temporal/Cadence) cho flow có trình tự phức tạp; hoặc saga + state máy tường minh (5.6.3). |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Nhiều service cần phản ứng cùng 1 sự kiện | ✅ Phù hợp | Fan-out là **lý do tồn tại** của EDA. |
| Cần scale consumer độc lập | ✅ Phù hợp | Mỗi consumer một nhịp độ, một capacity. |
| Xử lý bất đồng bộ (notification, analytics, search indexing) | ✅ Phù hợp | Nhóm bài toán "không cần kết quả ngay, chỉ cần được thực hiện". |
| Cần response ngay, không chờ xử lý phụ | ✅ Phù hợp | User-facing latency tối thiểu. |
| Data pipeline / CQRS projection / CDC | ✅ Phù hợp | Event stream là nguồn dựng read model (kết hợp 1.8/1.9). |
| Luồng nghiệp vụ có **trình tự chặt** và cần chờ kết quả ngay | ❌ Dùng sync | EDA không có "return value". Cần biết "thanh toán thành công/bại" ngay → gọi trực tiếp. |
| Hệ thống nhỏ, luồng gọi đơn giản | ❌ Overkill | 1 app, 1 team, 3 consumer = gọi hàm là đủ. |
| Team chưa hiểu idempotency/retry/DLQ | ⚠️ Đào tạo trước | EDA mà thiếu hiểu biết delivery semantics = mất dữ liệu hoặc nhân đôi email. |

**Câu quyết định:** nghiệp vụ này có phải "**sự kiện đã xảy ra → ai quan tâm thì phản ứng**" không? Nếu đúng và số bên quan tâm ≥ 3 → EDA. Nếu nó là "tôi hỏi và cần câu trả lời ngay" → sync call.

---

## 🔗 Liên quan

- **1.9 Event Sourcing** — Lưu event, EDA phát tán event
- **1.2 Microservices** — EDA là cách giao tiếp phổ biến giữa services
- **1.8 CQRS** — Event từ write side cập nhật read model
- **5.6.4 Dead Letter Queue** — Xử lý event fail
- **5.6.2 Retry Pattern** — Xử lý event delivery lỗi tạm thời

**Phân biệt nhanh 3 khái niệm hay lẫn:**

| Khái niệm | Vai trò |
|-----------|---------|
| **Event Sourcing (1.9)** | Cách **lưu** state (event store là nguồn sự thật) |
| **EDA (đây)** | Cách **giao tiếp** giữa các thành phần |
| **Domain Event (1.7)** | Loại **event nghiệp vụ** được publish |

Bạn có thể có EDA mà không cần Event Sourcing (publish notification từ CRUD DB), và ngược lại.

---

## 📁 Cấu trúc thư mục ví dụ

```
1.10-event-driven-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Processing demo (chạy: npx ts-node examples/index.ts)
```

Layout trong dự án thật (theo event ownership):

```text
src/
├── events/
│   ├── order/     # OrderCreated.ts, OrderPaid.ts (schema + version)
│   └── inventory/ # StockReserved.ts
├── producers/
│   └── order/     # OrderService — publish
├── consumers/
│   ├── notification/  # OrderCreated → email
│   ├── inventory/     # OrderCreated → trừ stock
│   └── analytics/     # OrderCreated → metric
└── infrastructure/
    └── bus/       # EventBus abstraction (Kafka/RabbitMQ adapter)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.10-event-driven-architecture
npx ts-node examples/index.ts
```

Hãy để ý thứ tự log: `OrderService` publish rồi **trả về ngay**, consumers chạy sau. Thêm một dòng `bus.subscribe('OrderCreated', analyticsService)` — producer không đổi gì. Đó là Open/Closed principle ở tầng kiến trúc.

---

## 📚 Tài liệu tham khảo

- 📖 [Event-Driven Architecture - AWS](https://aws.amazon.com/event-driven-architecture/)
- 📖 [Event-Driven Architecture - Martin Fowler](https://martinfowler.com/articles/201701-event-driven.html)
- 📖 [Kafka Documentation](https://kafka.apache.org/documentation/)
- 📖 [Outbox Pattern - microservices.io](https://microservices.io/patterns/data/transactional-outbox.html)

---

## ⏭️ Bài tiếp theo

→ [1.11 MVC](../1.11-mvc/README.md)
