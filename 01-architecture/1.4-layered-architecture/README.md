# 🍰 1.4 Layered Architecture

> Phân lớp theo chiều dọc: **Presentation → Business → Persistence → Database**. Mỗi lớp chỉ gọi lớp dưới. Kiến trúc phổ biến nhất, dễ hiểu, nền tảng của hầu hết ứng dụng doanh nghiệp.

---

## 🎯 Kiến trúc này là gì?

Layered Architecture (N-tier) chia ứng dụng thành các lớp xếp chồng. **Quy tắc:** lớp trên chỉ gọi lớp dưới, không gọi ngang, không nhảy tầng.

**Vì sao nó phổ biến đến vậy?** Vì phân lớp là **phản xạ tự nhiên** của con người khi tổ chức công việc: người nhận đơn (presentation) → người xử lý (business) → người lưu hồ sơ (persistence). Nó là "kiến trúc mặc định" bạn sẽ vô tình tạo ra khi code theo bản năng, và mọi framework (Spring MVC, NestJS, Rails, Django MVT) đều đóng gói sẵn lối mòn này. Hiểu Layered là hiểu **nền móng** để so sánh với mọi kiến trúc khác (Clean, Hexagonal ra đời chính để sửa các điểm yếu của nó).

**"Layer" khác "Tier" ở đâu?** Hai từ hay bị dùng lẫn nhưng khác nhau về bản chất:
- **Layer** = phân chia logic trong code (các package/folder, compile-time). Mọi layer có thể chạy trong **cùng một process**.
- **Tier** = phân chia vật lý (deploy). 3-tier = web server riêng, app server riêng, DB server riêng — communicate qua **network**.

Layered Architecture nói về **layers**. Khi bạn tách các layer đó xuống các máy khác nhau, nó trở thành N-**tier**. Hiểu rõ điều này tránh được sai lầm "phải có 3 con server mới gọi là layered".

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ① PRESENTATION LAYER                                │   │
│  │   UI, Controllers, API endpoints                     │   │
│  │   (nhận request, trả response)                       │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ gọi                             │
│                         ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ② BUSINESS LOGIC LAYER                              │   │
│  │   Services, business rules, validation               │   │
│  │   (xử lý nghiệp vụ)                                  │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ gọi                             │
│                         ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ③ PERSISTENCE LAYER                                 │   │
│  │   Repositories, DAOs, ORM                            │   │
│  │   (truy cập dữ liệu)                                 │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ gọi                             │
│                         ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ④ DATABASE LAYER                                    │   │
│  │   DB, Cache, File storage                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Luồng: ① → ② → ③ → ④ (chỉ xuống dưới)                    │
└─────────────────────────────────────────────────────────────┘
```

**Direction of dependency vs direction of control:** cả hai đều chảy từ trên xuống. Controller **import** Service, Service **import** Repository. Nghĩa là source code của Service **phụ thuộc** vào Repository — service không thể compile nếu không có persistence layer. Đây là **điểm yếu cốt tử** so với Clean Architecture (nơi dependency bị đảo ngược bằng interface). Hãy khắc ghi: Layered = phụ thuộc xuôi chiều; Clean = phụ thuộc ngược chiều vào core.

> 📌 **Quy tắc (nghiêm ngặt):** Lớp trên gọi lớp dưới. Lớp dưới **không biết** lớp trên. Không nhảy tầng (Presentation không gọi thẳng Persistence). Thực tế có biến thể **relaxed/open layering** cho phép bỏ qua tầng trung gian khi cần tối ưu.

**Hai biến thể cần biết:**
- **Closed/Strict layering:** mỗi layer chỉ được gọi layer **kề dưới**. Chuẩn mực, an toàn, nhưng đôi khi gây "telephone code" (layer trung gian chỉ để forward call).
- **Open layering:** layer trên có thể gọi **bất kỳ layer nào bên dưới** (presentation gọi thẳng persistence). Linh hoạt, nhanh hơn, nhưng ranh giới mục cho rule nghiệp vụ bị rò rỉ dần. Chọn một trong hai và **enforce bằng lint**, đừng "open theo cảm hứng".

---

## 📐 4 lớp

| Lớp | Trách nhiệm | Ví dụ | Giải thích sâu |
|-----|-------------|-------|----------------|
| **① Presentation** | Nhận input, hiển thị output | Controllers, Views, API routes, DTOs, middleware auth | Chỉ được làm đúng 3 việc: **parse & validate** input, **gọi** service, **format** output. Nếu bạn thấy `if (order.total > 1000000)` bên trong controller → rule nghiệp vụ đã rò rỉ, lớp bắt đầu ung thư. An toàn hơn khi lớp này **mỏng nhất**. |
| **② Business Logic** | Xử lý nghiệp vụ, validation | `OrderService`, `PaymentService` | Nơi mọi rule ứng dụng sống. Trong thực tế Java/Spring, đây là chỗ đặt **transaction boundary** (`@Transactional`). Layer này quyết định **chất lượng thật** của hệ thống: service phải nhận input → trả output, **không biết** dữ liệu đến từ HTTP hay queue hay CLI. |
| **③ Persistence** | Truy cập dữ liệu | `OrderRepository`, DAOs, ORM entities | Bọc toàn bộ chi tiết "nói chuyện với DB". Mục tiêu: layer Business **không có một dòng SQL nào**. Repository trả về **domain object**, không phải `ResultSet` hay ORM entity dính annotation — nếu trả entity có quan hệ lazy, persistence leak lên trên. |
| **④ Database** | Lưu trữ vật lý | PostgreSQL, Redis, S3 | Không phải code của bạn — là **external system**. Liệt kê trong diagram vì mỗi lần qua biên giới này là một network call + serialization. |

**Nên có bao nhiêu lớp?** 3 (Presentation/Business/Data) hoặc 4 như trên là điển hình. Thêm "Cross-cutting layer" (logging, security, caching) hay "Common/Util layer" nằm ngang, phục vụ mọi lớp. Quy tắc vàng: **càng nhiều lớp, mỗi bước đi xuống càng đắt** — cả chi phí performance (mỗi bước là một lần map data) lẫn chi phí đọc hiểu.

**Data đi qua các lớp biến đổi như thế nào?**

```
JSON request ──► DTO ──► Domain Model ──► ORM Entity ──► SQL row
                                                    (④ DB)
SQL row ──► ORM Entity ──► Domain Model ──► ViewModel ──► HTML/JSON
```

Nhiều chuyển đổi = an toàn + rõ trách nhiệm, nhưng **nhiều bug mapping** nếu không cẩn thận. Đây là trade-off cố hữu của layered.

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Order Processing**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  OrderService (Business Logic)                       │   │
│  │  ── kiểm tra stock, tính total, tạo order            │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ gọi                             │
│                         ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  OrderRepository (Persistence)                       │   │
│  │  ── lưu/đọc order từ DB                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Service gọi Repository. Repository không biết Service.     │
└─────────────────────────────────────────────────────────────┘
```

- **Business Logic:** `OrderService` — xử lý nghiệp vụ
- **Persistence:** `OrderRepository` — truy cập dữ liệu

**Mã giả mô tả từng lớp (xem examples/index.ts để thấy phiên bản chạy được):**

```ts
// ① Presentation — chỉ parse + delegate
class OrderController {
  async create(req: Request) {
    const dto = CreateOrderDto.parse(req.body);   // validation
    return orderService.placeOrder(dto);          // 1 dòng duy nhất
  }
}
// ② Business — mọi rule nằm ở đây
class OrderService {
  async placeOrder(dto) {
    if (!await this.stockRepo.isAvailable(dto.productId)) // ← gọi layer 3
      throw new OutOfStockError();
    const total = calculateTotal(dto.items);
    return this.orderRepo.save(Order.create(dto.userId, total));
  }
}
```

> 💡 Demo bỏ Presentation/DB layer cho gọn. Thực tế: Controller (Presentation) gọi Service, Repository gọi DB.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🚀 **Đơn giản, dễ hiểu** | Cấu trúc quen thuộc, dễ onboarding | Ai từng làm backend đều nhận ra ngay. Không cần giải thích "tại sao có interface ở đây". Dev mới contribute trong ngày đầu — **cost gia nhập thấp nhất** trong các kiến trúc doanh nghiệp. |
| 🧩 **Tách trách nhiệm** | Mỗi lớp 1 việc rõ ràng | Cho phép **chuyên môn hóa nhân sự**: người giỏi UI code presentation, DBA optimize query ở persistence. Đồng thời cho phép **parallel development** nếu các lớp có hợp đồng interface. |
| 🔄 **Dễ thay đổi lớp** | Đổi DB không đụng Presentation | Đổi MySQL→Postgres chỉ ảnh hưởng ③+④ (miễn là ② không viết raw SQL — "miễn là" này rất quan trọng và thường bị phá vỡ). |
| 📚 **Phổ biến** | Nhiều framework hỗ trợ sẵn | NestJS modules, Spring @Service/@Repository, Rails MVC — **tooling, docs, best practice, hiring pool** đều cực lớn. Bạn không phải nghĩ về kiến trúc, framework nghĩ hộ. |
| 🔧 **Dễ thêm cross-cutting** | (Ưu điểm ít được nói) | Caching, logging, security... thêm vào ② hoặc ③ bằng decorator/middleware mà không đổi kiến trúc tổng. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🔗 **Phụ thuộc chiều dọc** | Lớp trên phụ thuộc lớp dưới, khó test độc lập | Dependency đi **một chiều từ trên xuống** → business logic (②) **phụ thuộc** persistence (③). Muốn test service mà không đụng DB? Phải mock repo — và repo là class concrete → không mock được cleanly → hoặc dùng DI framework, hoặc test bằng integration DB. Đây chính là **động cơ ra đời của Clean Architecture** (đảo dependency bằng interface). |
| 🐌 **Performance overhead** | Dữ liệu đi qua nhiều lớp trung gian, tăng latency | Request phải đi qua N hop + M lần object mapping. "Telephone game": controller copy sang DTO, service copy sang domain, repo copy sang entity. *Giảm thiểu:* cho phép open layering ở đường đọc (hot read path), dùng caching, hoặc gộp layer khi không có lý do tách. |
| 🌀 **Anemic model** | Business logic dồn Service, Model chỉ là data | Hệ quả gần như tất yếu: `Order` chỉ có getter/setter, mọi rule nằm trong `OrderService`. Đây là **Anemic Domain Model anti-pattern** (Fowler): object biết không gì cả, service trở thành God object không test độc lập. *Giảm thiểu:* đẩy rule về entity khi rule chỉ đụng tới state của chính nó. |
| 🚫 **Khó nhảy tầng** | Đôi khi cần truy cập thẳng, bị chặn bởi quy tắc nghiêm ngặt | Strict layering gây boilerplate vô nghĩa (interface chỉ để forward call). *Giảm thiểu:* chọn open layering **có chủ đích** + tài liệu hóa ngoại lệ (ADR). |
| 🧨 **Logic leak — "death by a thousand cuts"** | (Failure mode phổ biến nhất trong thực tế) | Mỗi sprint lại có "một lần cho phép" controller query thẳng DB, service return raw SQL result... Sau 2 năm không còn lớp nào sạch. **Không có gì enforce các layer** → con người luôn đi đường tắt. *Giảm thiểu:* ArchUnit / eslint-plugin-boundaries / import rules trong CI. |
| 🧓 **Monolithic by nature** | Toàn bộ hệ thống vẫn là một deploy unit | Layered **không giúp gì** cho việc tách deploy độc lập — đó là câu chuyện của module/service. Đừng nhầm "nhiều layer" với "nhiều service". |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Ứng dụng doanh nghiệp tiêu chuẩn, CRUD + workflow | ✅ Rất phù hợp | 90% app doanh nghiệp nằm gọn ở đây. Matching độ phức tạp thật. |
| CRUD, quản lý dữ liệu (admin panel, backoffice) | ✅ Phù hợp | Không có rule phức tạp → không cần cấu trúc bảo vệ rule → layered nhẹ đủ. |
| Team nhiều dev, cần cấu trúc dễ hiểu | ✅ Phù hợp | Uniformity > sophistication khi có 100 dev: mọi repo cùng một hình. |
| Team junior/ít kinh nghiệm | ✅ Phù hợp | Mọi kiến trúc mạnh hơn đều đòi hỏi kỷ luật + hiểu biết mà team chưa có.
| Ứng dụng nhỏ, không dự định đổi framework | ✅ Phù hợp | Clean mua "future flexibility" mà bạn sẽ không dùng tới → trả phí vô ích. |
| Nghiệp vụ phức tạp, cần domain model mạnh | ⚠️ Cân nhắc Clean/DDD | Layered **vẫn chứa được** DDD/Clean — bạn có thể tổ chức lớp ② bằng use case + entities, chỉ khác là phải đảo dependency. Đừng nghĩ Layered đối lập với Clean. |
| Nhiều team cần deploy độc lập | ❌ Không đủ | Layered không tách deployment → cần module boundary hoặc microservices. |
| High-frequency trading, edge cases yêu cầu latency µs | ❌ Không đủ | Overhead không đáng cho enterprise nhưng không chấp nhận được ở hot path realtime. |

**Quy tắc chọn thực dụng:** nếu có **< 20 business rules quan trọng** và bạn không cần đảo dependency để test → Layered là tối ưu về effort. Nếu có **> 50 rules**, rules đổi liên tục, hoặc cần test rule độc lập hạ tầng → thêm inversion (bước sang Clean).

---

## 🔗 Liên quan

- **1.3 Clean** — Cải tiến: đảo dependency hướng vào trong
- **1.5 Hexagonal** — Cải tiến: cô lập core khỏi infrastructure
- **1.11 MVC** — Presentation layer thường dùng MVC

**Bản đồ tiến hóa:** Layered (mặc định) → Layered + strict boundary enforcement → Hexagonal/Clean (đảo dependency) → Modular Monolith (thêm module axis) → Microservices (tách deploy unit). Mỗi bước thêm sức mạnh và thêm chi phí; Layered là điểm khởi đầu của mọi hành trình.

---

## 📁 Cấu trúc thư mục ví dụ

```
1.4-layered-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Processing demo (chạy: npx ts-node examples/index.ts)
```

Layout "theo layer" điển hình (so với "theo feature" — xem 5.9.2):

```text
src/
├── controllers/    # ①
├── services/       # ②
├── repositories/   # ③
├── entities/       # data model (dễ trở thành anemic)
├── dto/
└── app.ts
```

Layout này có nhược điểm: một tính năng "đặt hàng" bị rải ra 4 folder → khi đọc phải nhảy 4 nơi. Đó là lý do **feature-based + layered** thường kết hợp (mỗi feature có 4 subfolder riêng).

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.4-layered-architecture
npx ts-node examples/index.ts
```

Quan sát luồng: Service **import trực tiếp** Repository class (không qua interface). Đó chính là "phụ thuộc xuôi chiều" — và là thứ Clean Architecture sẽ sửa.

---

## 📚 Tài liệu tham khảo

- 📖 [Layered Architecture - Software Architecture Patterns](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch01.html)
- 📖 [Layered Architecture - Wikipedia](https://en.wikipedia.org/wiki/Multitier_architecture)
- 📖 [Pattern: Layered architecture (microservices.io)](https://microservices.io/patterns/application-layered-architecture.html)

---

## ⏭️ Bài tiếp theo

→ [1.5 Hexagonal Architecture](../1.5-hexagonal-architecture/README.md)
