# ⬡ 1.5 Hexagonal Architecture (Ports & Adapters)

> **Domain** ở trung tâm, giao tiếp với thế giới bên ngoài qua **Ports** (interface) và **Adapters** (implement). Domain độc lập hoàn toàn với công nghệ — đổi DB, đổi framework không đụng core.

---

## 🎯 Kiến trúc này là gì?

Hexagonal Architecture (Alistair Cockburn) cô lập **domain core** khỏi mọi thứ bên ngoài. Bên ngoài gọi vào qua **driving adapters** (HTTP, CLI). Core gọi ra qua **driven ports** (interface) được implement bởi **driven adapters** (DB, external API).

**Vấn đề Cockburn giải quyết (2005):** trong ứng dụng thông thường, business logic bị **kẹt giữa** UI và DB. Không thể test logic mà không có UI; không thể thay DB mà không sửa logic; không thể đổi HTTP sang CLI mà không đụng core. Ông đề xuất: đặt core vào **giữa một hình lục giác**, mọi kết nối ra ngoài đều đi qua **cạnh** (= port). Hình lục giác không phải ngẫu nhiên — nó có **nhiều cạnh hơn ô vuông**, tức là thông điệp: "số lượng điểm kết nối ra thế giới nhiều hơn bạn tưởng" (HTTP, CLI, test harness, queue, batch job...).

**Tư duy cốt lõi — "as-if":** logic nghiệp vụ phải chạy **as if** nó đang nói chuyện với người dùng thật và DB thật, nhưng thực tế chỉ là interface. Khi test, bạn nối "fake" vào các port đó → toàn bộ nghiệp vụ chạy được **trong một tiến trình, không cần hạ tầng**. Đây là lý do hexagonal còn được gọi là **"testability architecture"**.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   DRIVING SIDE (bên ngoài gọi vào)                          │
│                                                             │
│  ┌──────────────┐   ┌──────────────────────────────────┐   │
│  │ HTTP Adapter │──▶│                                  │   │
│  └──────────────┘   │                                  │   │
│  ┌──────────────┐   │          DOMAIN CORE             │   │
│  │  CLI Adapter │──▶│        (business logic)          │   │
│  └──────────────┘   │                                  │   │
│  ┌──────────────┐   │   ┌──────────────────────────┐   │   │
│  │ Queue Adapter│──▶│   │  Use Cases / Services    │   │   │
│  └──────────────┘   │   └───────────┬──────────────┘   │   │
│                     │               │                  │   │
│                     │   ┌───────────▼──────────────┐   │   │
│                     │   │  Ports (interfaces)      │   │   │
│                     │   │  OrderRepository,        │   │   │
│                     │   │  PaymentGateway          │   │   │
│                     │   └───────────┬──────────────┘   │   │
│                     └───────────────┼──────────────────┘   │
│                                     │ implement            │
│   DRIVEN SIDE (core gọi ra)         ▼                      │
│  ┌──────────────┐   ┌──────────────────────────────────┐   │
│  │  DB Adapter  │◀──│  (PostgresRepo, StripeGateway)   │   │
│  └──────────────┘   └──────────────────────────────────┘   │
│  ┌──────────────┐                                           │
│  │ External API │                                           │
│  └──────────────┘                                           │
│                                                             │
│  Core chỉ biết Ports (interface). Adapters implement Ports. │
└─────────────────────────────────────────────────────────────┘
```

**Hai chiều của port — dễ nhầm nhất:**
- **Driving port (primary/in-bound):** core **công bố** API của mình. Ai muốn dùng core thì gọi vào đây. VD: `PlaceOrderUseCase`.
- **Driven port (secondary/out-bound):** core **đưa ra yêu cầu** với thế giới. Ai cung cấp dịch vụ thì implement. VD: `OrderRepository`.

**Quy tắc vàng của dependency:** adapter **luôn phụ thuộc** vào port, port **không phụ thuộc** gì cả. Core chỉ biết port. Không có đường nào để core gọi thẳng adapter — nếu có thì toàn bộ kiến trúc sụp.

> 📌 **Port = interface** (hợp đồng). **Adapter = implement** (công nghệ cụ thể). Core gọi Port, không biết Adapter nào đang chạy.

---

## 📐 Thành phần chính

| Thành phần | Trách nhiệm | Ví dụ | Giải thích sâu |
|------------|-------------|-------|----------------|
| **Domain Core** | Business logic, không biết công nghệ | `OrderService`, `Order` | Chứa rule + application flow. Không `import` HTTP library, không ORM, không SDK vendor. Đây là thứ bạn **muốn giữ mãi**; adapters là thứ bạn **dự tính sẽ vứt**. |
| **Port (driving)** | Interface cho bên ngoài gọi vào | `OrderUseCase` | Là **API công khai** của core. Điều thú vị: driving port **không nhất thiết là interface** — nó có thể chính là use case class, vì không có dependency nào phải đảo. Nhiều dự án chỉ có 1 loại port (driven) và dùng luôn use case làm driving side. |
| **Adapter (driving)** | Nhận input từ bên ngoài, gọi Port | `OrderController` (HTTP), CLI, test harness | Biến đổi hình dạng thế giới → hình dạng core hiểu. **Đây là điểm khiến hexagonal mạnh hơn MVC**: một use case có thể được gọi bởi HTTP **và** cron job **và** message consumer mà core không đổi một dòng. Test harness cũng chỉ là driving adapter. |
| **Port (driven)** | Interface core gọi ra | `OrderRepository`, `PaymentGateway` | Đặt tên theo **ý đồ của core**, không theo công nghệ. Sai: `IOrderTable`. Đúng: `OrderRepository`. Sai: `IPostgresClient`. Đúng: `PaymentGateway`. Interface phản ánh **ngôn ngữ nghiệp vụ**. |
| **Adapter (driven)** | Implement Port, giao tiếp công nghệ | `PostgresOrderRepository`, `StripePaymentGateway` | Nơi mọi `import mongoose / aws-sdk` sống. Chứa mapping giữa persistence model và domain object. Nếu adapter phình thành logic → logic nghiệp vụ đang rò rỉ ra ngoài, cần kéo về core. |

**Quy tắc đặt số lượng port:** port không phải theo thực thể, mà theo **nhu cầu của use case**. `OrderRepository` có thể không cần `deleteById()` nếu chưa use case nào cần xóa. Interface nhỏ, đặt tên bằng động từ nghiệp vụ (`reserveStock`) thay vì CRUD (`update`) → code review dễ phát hiện "ai đang làm gì với dữ liệu".

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Order Processing**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  OrderService (Domain Core)                          │   │
│  │  ── gọi OrderRepository (Port, interface)            │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ implement                       │
│                         ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  InMemoryOrderRepository (Adapter)                   │   │
│  │  ── implement OrderRepository interface              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Core không biết InMemory. Chỉ biết interface.              │
│  Đổi sang PostgresRepo? Chỉ cần adapter mới.                │
└─────────────────────────────────────────────────────────────┘
```

- **Port:** `OrderRepository` (interface)
- **Adapter:** `InMemoryOrderRepository` (implement)
- **Core:** `OrderService` (chỉ gọi interface)

**Code mô tả đúng cơ chế (xem examples/index.ts):**

```ts
// Port — do core định nghĩa, ngôn ngữ nghiệp vụ
interface OrderRepository {
  save(order: Order): void;
  findById(id: string): Order | null;
}

// Core — nhận port qua constructor (DI), không new adapter nào
class OrderService {
  constructor(private readonly repo: OrderRepository) {}
  placeOrder(items: string[]) {
    const order = new Order(items);
    this.repo.save(order);       // không biết DB là gì
    return order;
  }
}

// Adapter — công nghệ cụ thể, thay được
class InMemoryOrderRepository implements OrderRepository { ... }
class PostgresOrderRepository   implements OrderRepository { ... }

// Wiring (composition root)
new OrderService(process.env.DB === 'pg' ? new PostgresOrderRepository() : new InMemoryOrderRepository());
```

> 💡 Muốn đổi DB? Viết `PostgresOrderRepository` implement cùng interface — core không đổi dòng nào.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🎯 **Domain độc lập** | Core không biết DB/framework/UI | Core chỉ phụ thuộc vào **interface nó tự tạo ra** → là nơi ổn định nhất của hệ thống. Business rule không bao giờ phải sửa vì lý do kỹ thuật. |
| 🔄 **Dễ swap adapter** | Đổi DB, đổi HTTP→gRPC không đụng core | Không chỉ đổi DB: thêm **REST + gRPC + queue** cùng gọi vào một use case là kịch bản đẹp nhất của hexagonal. Một tính năng, nhiều cửa ngõ. |
| 🧪 **Test dễ (lý do #1 để chọn nó)** | Test core bằng mock adapter | Chạy toàn bộ suite nghiệp vụ **không boot** Spring/Express/Docker, không DB. Test nhanh cỡ miligiây, không flaky. Test chính là "một driving adapter" — bạn test cùng API mà production gọi. |
| 🧩 **Tách rõ ranh giới** | Port/Adapter phân định rõ trách nhiệm | Câu hỏi review PR trở nên rõ ràng: "code này thuộc core hay adapter?". Không còn vùng xám "query nằm trong controller". |
| 👥 **Song song hóa** | (Ưu điểm bị bỏ sót) | Core có thể viết **trước khi biết** UI hay DB. Hai team dev song song: core vs adapters, hợp đồng là port. |
| 🔁 **Testability là thiết kế, không phải vá sau** | (Ưu điểm tinh thần) | Khác Clean: hexagonal **không có lớp để xếp** → nó chỉ yêu cầu "mọi tương tác ngoài phải qua interface", nên nó tương thích với mọi cấu trúc thư mục (theo feature, theo layer...). |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 📝 **Nhiều interface** | Mỗi port 1 interface, boilerplate | Với CRUD app, bạn sẽ tạo N interface mà **chỉ có 1 implement** → indirection không mua gì. *Giảm thiểu:* chỉ tạo port khi (a) có ≥2 implementations thật, hoặc (b) cần core chạy trong test không có adapter, hoặc (c) adapter là external service. |
| 🧠 **Khó hình dung** | Khái niệm port/adapter trừu tượng lúc đầu | Lẫn lộn driving/driven là lỗi số 1. *Giảm thiểu:* dùng từ thay thế dễ hơn — "cổng vào / cổng ra", vẽ diagram mỗi feature. |
| 🏗️ **Overkill dự án nhỏ** | CRUD đơn giản không cần nhiều lớp gián tiếp | Với app 3 màn hình, chi phí tư duy lớn hơn lợi ích test. |
| 🧷 **Không chỉ rõ placement** | (Nhược điểm cố hữu) | Hexagonal nói "biên giới nằm ở đâu" nhưng **không nói domain nên tổ chức thế nào** (aggregate, service, entity ra sao). Bạn vẫn phải mượn DDD cho phần đó. |
| 🐢 **Mapping overhead** | DTO ↔ domain ↔ persistence model | Mỗi bước qua port là một lần dịch dữ liệu. Lặp code ở các mapper. *Giảm thiểu:* cho phép dùng "persistence model" làm domain model khi domain đủ đơn giản — đừng map vì thẩm mỹ. |
| 🎭 **Leaky abstraction** | Interface "phẳng" che dấu ngữ nghĩa thật của adapter | `PaymentGateway.charge()` — có ai biết Stripe timeout 10s, có idempotency key không? Adapter-specific constraint rò rỉ vào core. *Giảm thiểu:* đặt tên port theo **intent**, tài liệu hóa hợp đồng trong comment/port. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Có thể đổi DB/framework trong tương lai | ✅ Rất phù hợp | Port là chỗ "đặt cược kỹ thuật". Đổi quyết định chỉ = viết adapter. |
| Nghiệp vụ phức tạp, cần cô lập core | ✅ Phù hợp | Nơi rule sống cần được bảo vệ khỏi áp lực deadline hạ tầng. |
| Nhiều adapter cho cùng 1 port (nhiều DB, nhiều gateway) | ✅ Phù hợp | Stripe + PayPal, Postgres + DynamoDB, email + SMS → mỗi cái một adapter, core không đổi. |
| Cần test coverage cao cho logic, CI nhanh | ✅ Rất phù hợp | Đây là động cơ **mạnh nhất** để chọn hexagonal trong thực tế. |
| Application có **nhiều loại entry point** (HTTP + queue + cron + CLI) | ✅ Rất phù hợp | Kịch bản hexagonal tỏa sáng: một use case, nhiều driving adapters. |
| Dự án nhỏ, công nghệ cố định | ❌ Overkill | Boilerplate không có phần thưởng. |
| CRUD thuần, không có rule nghiệp vụ | ❌ Không cần | Port ở đây chỉ để forward CRUD. |
| Team chưa quen interface/DI | ⚠️ Đào tạo trước | Áp dụng hình thức → "hexagonal" với adapter chứa logic = mất hết giá trị. |

---

## 🔗 Liên quan

- **1.3 Clean** — Cùng ý tưởng: core độc lập, dependency hướng vào trong
- **1.6 Onion** — Tương tự: domain trung tâm, phân lớp hình tròn
- **1.7 DDD** — Core thường chứa domain model của DDD

| | Hexagonal | Clean | Onion |
|---|---|---|---|
| Hình ảnh | 1 hình + các cạnh | 4 vòng tròn | 4 vòng tròn |
| Nói về | **biên giới** (ports) | **dependency rule** | **domain model** |
| Nhấn mạnh | testability, swap technology | separation of concerns | business logic trung tâm |
| Điểm khác | không ép xếp lớp | tách Use Case khỏi Entity | tách Domain khỏi Application |

**Thực tế:** ba kiến trúc này **tương thích**, không đối lập. Common combo: hexagonal cho ranh giới + DDD cho cấu trúc domain + onion/clean naming cho folder. Đừng tranh luận "kiến trúc nào đúng" — chúng đúng với các vấn đề khác nhau.

---

## 📁 Cấu trúc thư mục ví dụ

```
1.5-hexagonal-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Processing demo (chạy: npx ts-node examples/index.ts)
```

Layout theo feature (điển hình nhất cho hexagonal):

```text
src/features/orders/
├── domain/            # Order, rule
├── application/       # ports + use cases (core)
│   ├── ports/         # OrderRepository (interface), PlaceOrderUseCase
│   └── use-cases/
├── adapters/
│   ├── driving/       # REST controller, CLI, queue consumer
│   └── driven/        # PostgresOrderRepository, StripeGateway
└── index.ts           # composition root của feature
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.5-hexagonal-architecture
npx ts-node examples/index.ts
```

Đổi adapter sang một implement khác ngay trong demo → output không đổi → đó là bằng chứng của "swap adapter không đụng core".

---

## 📚 Tài liệu tham khảo

- 📖 [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- 📖 [Ports & Adapters - Wikipedia](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))
- 📖 [Hexagonal Architecture explained - Philipp Schmitt](https://philipp-schmitt.com/2023/03/11/hexagonal-architecture-explained/)

---

## ⏭️ Bài tiếp theo

→ [1.6 Onion Architecture](../1.6-onion-architecture/README.md)
