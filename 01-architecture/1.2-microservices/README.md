# 🧩 1.2 Microservices Architecture

> Tách ứng dụng thành **nhiều service nhỏ, độc lập**, mỗi service có DB riêng, giao tiếp qua network (HTTP, message queue). Scale độc lập, team độc lập, nhưng vận hành phức tạp.

---

## 🎯 Kiến trúc này là gì?

Microservices chia hệ thống thành các service nhỏ theo **bounded context**. Mỗi service: codebase riêng, DB riêng, deploy riêng, team riêng. Giao tiếp qua network.

**Định nghĩa chuẩn (Fowler & Lewis):** kiến trúc phân tách ứng dụng thành một tập hợp **các service nhỏ** mà:
- Build & deploy **độc lập** (independently deployable)
- Quét xung quanh **một business capability** (không phải theo technical layer)
- Giao tiếp qua **lightweight mechanism** (HTTP API, message queue)
- **Decentralized**: decentralized governance (mỗi team chọn công nghệ riêng), decentralized data (mỗi service tự sở hữu data của mình)

**Bản chất đánh đổi:** microservices **không phải kiến trúc tốt hơn** — nó là kiến trúc **mua sự đơn giản ở tầng code bằng sự phức tạp ở tầng vận hành**. Một lời gọi function trong monolith trở thành một network call, và mọi network call mang theo "8 sai lầm của distributed computing": network không ổn định, latency khác 0, topology thay đổi, có race conditions, chỉ 1 admin (của bạn) biết cấu hình, chi phí bandwidth hữu hạn, v.v. Bạn phải tự xử lý **tất cả** những thứ mà in-process call được compiler và OS miễn phí cho bạn.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────┐                                               │
│  │  Client  │                                               │
│  └────┬─────┘                                               │
│       │ HTTP                                                │
│       ▼                                                     │
│  ┌────────────────┐                                         │
│  │  API Gateway   │  (route, auth, rate-limit)              │
│  └───┬────┬────┬──┘                                         │
│      │    │    │                                            │
│      ▼    ▼    ▼                                            │
│  ┌──────┐  ┌──────┐  ┌──────┐                               │
│  │Order │  │Payment│  │User  │   ← mỗi service độc lập      │
│  │Svc   │  │Svc   │  │Svc   │                               │
│  └──┬───┘  └──┬───┘  └──┬───┘                               │
│     │       │       │                                       │
│     ▼       ▼       ▼                                       │
│  ┌──────┐┌──────┐┌──────┐                                   │
│  │ DB A ││ DB B ││ DB C │   ← mỗi service 1 DB riêng        │
│  └──────┘└──────┘└──────┘                                   │
│                                                             │
│  Giao tiếp: HTTP/REST, gRPC, Message Queue (Kafka...)       │
└─────────────────────────────────────────────────────────────┘
```

**Kích thước "nhỏ" nghĩa là gì?** Không phải số dòng code. Một service "đủ nhỏ" là service mà **một team nhỏ có thể viết lại từ đầu trong ~2 tuần** nếu cần, và nó **change together, deploy together** — những code hay sửa chung với nhau nằm cùng chỗ. Service có 100k LOC nhưng chỉ 1 team sở hữu và deploy mỗi ngày vẫn là microservice đúng nghĩa; service 5k LOC mà 3 team phải phối hợp khi sửa là **distributed monolith** — kiểu kiến trúc tệ nhất (xem Nhược điểm).

> 📌 **Nguyên tắc:** Service không share DB. Muốn dữ liệu của service khác → gọi API của nó. Database-per-service là **lằn ranh không được phép mơ hồ**: share DB = mọi service dính chặt vào schema chung = mất khả năng deploy độc lập, chỉ còn lại chi phí phân tán.

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả | Giải thích sâu |
|----------|-------|----------------|
| **Service nhỏ, độc lập** | Mỗi service 1 bounded context | Bounded context = ranh giới ngữ nghĩa: từ "Product" trong Catalog (giá, mô tả, ảnh) khác "Product" trong Shipping (khối lượng, kích thước). Cho phép mỗi service model hóa đúng phần thế giới của mình mà không cần "1 unified domain model" — thứ khiến mọi thứ phụ thuộc mọi thứ. |
| **DB riêng** | Không share DB giữa service | Database-per-service → **không ai JOIN hộ bạn được**. Nghiệp vụ cần dữ liệu 2 service: (a) API composition (gọi và tổng hợp), (b) replicated view qua events (CQRS), (c) đặt ở service "sở hữu" nghiệp vụ đó. Consistency giữa các DB là **eventual** — phải chấp nhận đọc thấy dữ liệu cũ vài ms–vài giây. |
| **Giao tiếp qua network** | HTTP, gRPC, message queue | Sync (HTTP/gRPC): đơn giản, có response ngay, nhưng **couple availability** — service A sập thì B fail theo, latency cộng dồn. Async (queue/pub-sub): **decouple** — producer không cần receiver sống, absorb burst tốt, nhưng độ phức tạp chuyển sang: outbox pattern, exactly-once (ảo giác — chỉ có at-least-once + idempotency), ordering. |
| **Deploy độc lập** | Deploy service riêng, không ảnh hưởng nhau | Sức mạnh cốt lõi: team Payment release 20 lần/ngày không cần team Order biết. Điều kiện tiên quyết: API **backward compatible** trong cửa sổ deploy (consumer cũ vẫn sống khi producer đã lên version mới) → cần contract discipline, versioning, consumer-driven contract tests. |
| **Team độc lập** | Mỗi team sở hữu 1+ service | Conway's law thành công cụ: thiết kế ranh giới service = thiết kế ranh giới team ("you ship on weekends" — đội nào code, đội đó vận hành). Mặt trái: ranh giới service **cố định** cách tổ chức team; tách/sáp nhập team sau này đắt. |

**Đặc điểm ngầm định — observability là bắt buộc:** khi không còn 1 stack trace duy nhất, bạn **không thể debug bằng mắt thường** nữa. Distributed tracing (traceId xuyên service), centralized logging, RED metrics, alerting là **điều kiện gia nhập** (entry ticket), không phải nice-to-have. Không có chúng, microservices = mù máy bay không có cockpit.

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Mini Shop (3 services)**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────┐   HTTP (sync)   ┌──────────────────┐      │
│  │  Ordering    │ ──────────────▶ │  Catalog         │      │
│  │  Service     │  reserve stock  │  Service         │      │
│  └──────┬───────┘                 └──────────────────┘      │
│         │  publish OrderCreated (async)                     │
│         ▼                                                   │
│  ┌──────────────────┐   subscribe   ┌──────────────────┐    │
│  │   Event Bus      │ ─────────────▶│  User Service    │    │
│  │  (Kafka/RabbitMQ)│               │  (gửi email)     │    │
│  └──────────────────┘               └──────────────────┘    │
│                                                             │
│  Mỗi service: codebase riêng, DB riêng, deploy riêng        │
│  Giao tiếp: HTTP (sync) + Event Bus (async)                 │
└─────────────────────────────────────────────────────────────┘
```

- **Catalog Service:** quản lý sản phẩm, reserve stock (DB riêng: catalog-db)
- **Ordering Service:** tạo đơn, gọi Catalog qua HTTP, publish event (DB riêng: ordering-db)
- **User Service:** quản lý user, lắng nghe `OrderCreated` để gửi email (DB riêng: user-db)
- **Giao tiếp:** HTTP request/response (sync) + Event Bus (async)

**So sánh cùng một nghiệp vụ đặt hàng — monolith vs microservices:**

| Bước | Monolith (1.1) | Microservices (đây) |
|------|----------------|---------------------|
| Kiểm stock | `productService.checkStock()` — ~0.0001ms | HTTP `GET /stock` — 1–50ms, **có thể timeout/5xx** |
| Trừ stock | `repo.decrease()` trong cùng transaction | `POST /reserve` — nếu trừ xong nhưng tạo order fail → phải **bù đắp** (release stock) |
| Gửi email | `emailService.send()` inline | Consume `OrderCreated` event — email **có thể gửi muộn**, hoặc gửi 2 lần nếu retry → cần idempotency |
| Lỗi | 1 exception, rollback sạch | Partial state: order PENDING, stock reserved, email chưa gửi — **ai dọn dẹp?** |

> 💡 Trong demo dùng HTTP trực tiếp + Event Bus in-process. Thực tế thường qua API Gateway + service discovery + Kafka/RabbitMQ.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 📈 **Scale độc lập** | Scale service tải cao, không scale toàn bộ | Black Friday: chỉ nhân bản 10x `Catalog` (đọc nhiều), `Admin` giữ 1 bản. Chi phí hạ tầng tỉ lệ với tải **thực** của từng phần. Còn hay hơn: chọn DB phù hợp từng service (catalog → Elasticsearch, ledger → Postgres). |
| 👥 **Team độc lập** | Team tự chọn công nghệ, deploy riêng | Không deploy queue liên team, không "code freeze chờ nhau". Team velocity **không phụ thuộc tuyến tính vào số team** — scaling tổ chức, đây thường là động cơ thật sự (Conway's law, Team Topologies). |
| 🛡️ **Cô lập lỗi** | 1 service lỗi không sập toàn hệ thống | Blast radius = 1 service. Email service OOM vì file export nặng? Checkout vẫn chạy. Điều kiện: phải **fail fast + fallback + bulkhead** (thread/connection pool riêng per dependency), nếu không lỗi vẫn lan theo call graph. |
| 🔄 **Deploy nhanh** | Deploy service nhỏ, ít rủi ro | Artifact nhỏ → build/test vài phút. Canary một service đơn lẻ → rollback một service. Frequency tăng → each release nhỏ → each release ít rủi ro hơn (virtuous cycle). |
| 🧩 **Công nghệ đa dạng** | Service dùng ngôn ngữ phù hợp riêng | ML inference bằng Python + GPU, batch bằng Spark, API bằng NestJS — cùng một hệ thống. Phù hợp "best tool for the job". |
| 🧑‍💼 **Onboarding theo vùng** | (Ưu điểm bị bỏ sót) | Dev mới vào team Order chỉ cần hiểu service Order + 1–2 API láng giềng, không cần thuộc 500k dòng code. **Điều kiện:** ranh giới service phải sạch và tài liệu hóa (ownership, API contracts). |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & thực tế |
|------------|------------|--------------------------|
| 🌐 **Phức tạp network** | Latency, timeout, retry, circuit breaker | Mọi cuộc gọi giờ có **3 trạng thái**: success, fail, và **unknown** (timeout — không biết phía kia đã xử lý chưa). Bắt buộc: timeout ở mọi hop, retry + backoff + jitter, idempotency key, circuit breaker, bulkhead. Thiếu 1 trong 5 → lỗi nhỏ lan thành cascade. |
| 🔀 **Distributed transaction** | Khó đảm bảo consistency giữa service | Không còn ACID xuyên nghiệp vụ. Saga + compensating transactions thay thế: trừ stock OK, tạo order FAIL → phải chạy `releaseStock` — mà nó cũng có thể fail... Phải chấp nhận **eventual consistency** và thiết kế UI/UX chịu được (user thấy "đơn đang được xử lý" thay vì "thành công" tức thì). |
| 🐛 **Debug khó** | Trace qua nhiều service, log phân tán | Bug "email không gửi" có thể ở: event chưa publish (ordering), broker delay, consumer crash loop, email provider throttle. Không có distributed tracing = điều tra như đoán. Chi phí ẩn lớn nhất mà các team coi thường. |
| 🏗️ **Hạ tầng phức tạp** | Service discovery, load balancer, monitoring, CI/CD pipeline ×N | Mỗi service = 1 repo + 1 pipeline + 1 dashboard + 1 alert set + 1 runbook. 50 service = 50 lần. Cần platform team + Kubernetes + IaC + SRE culture. **Nếu thiếu những thứ này, microservices biến thành micromonoliths không người vận hành được.** |
| 💰 **Chi phí cao** | Nhiều service = nhiều tài nguyên vận hành | Mỗi service cần memory riêng cho runtime (JVM image 512MB cho app 5MB logic). Inter-service traffic qua AZ tính tiền. Network hop thêm latency: 1 request qua 8 service = 8 hops + 8 serializations — có thể **chậm hơn monolith cũ** bạn vừa thay. |
| 🧟 **Distributed monolith** | (Bẫy phổ biến nhất) | Tách service nhưng: share 1 DB "cho tiện", đồng bộ deploy "theo lịch release chung", 3 service phải sửa cùng lúc cho 1 feature. Bạn trả **toàn bộ** chi phí phân tán nhưng nhận **0** lợi ích độc lập. Dấu hiệu: "muốn deploy service A phải deploy B, C kèm". |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Hệ thống lớn, nhiều team (> 20–30 dev), bottleneck tổ chức rõ ràng | ✅ Phù hợp | Đây là động cơ chính: **scale team**, không phải scale máy. Khi deploy queue liên team dài, separation of concerns thành chi phí thật. |
| Cần deploy độc lập từng phần (mỗi team release theo nhịp riêng) | ✅ Phù hợp | Điều kiện: API contracts ổn định + backward compatibility discipline. |
| Có module với tải/công nghệ rất khác phần còn lại (search, ML, realtime) | ✅ Phù hợp | Chỉ tách đúng module "khác biệt" — hybrid monolith + service, không cần all-in. |
| Domain chưa rõ, sản phẩm đang tìm PMF | ❌ Overkill, Monolith tốt hơn | Requirement đổi từng tuần → boundary sẽ sai → mỗi lần đổi boundary là một dự án refactor phân tán. Sai boundary đắt hơn sai code gấp nhiều lần. |
| Chưa có hạ tầng vận hành (CI/CD tự động, monitoring, tracing, container orchestration) | ❌ Chưa nên | Microservices **khuếch đại** mọi điểm yếu vận hành: không có automated pipeline = mỗi deploy là một cuộc phiêu lưu với N service. |
| Team nhỏ nhưng thích kiến trúc "xịn" | ❌ Trào ngược | Rule of thumb của Fred George: **"No small company should be doing microservices"** — nếu không đủ tiền cho mỗi service một đội trực on-call. |

**Checklist trước khi tách (mọi câu phải YES):**
1. Có automated deployment cho từng service (1 lệnh hoặc tự động)?
2. Có centralized logging + distributed tracing hoạt động?
3. Có monitoring + alerting per service?
4. Domain đã đủ ổn định để xác định bounded context?
5. Đã tổ chức được team own-to-onduty (ai code, ai vận hành)?

---

## 🔗 Liên quan

- **1.1 Monolithic** — Đối lập: 1 codebase, 1 deploy
- **1.14 Modular Monolith** — Bước đệm: ranh giới module, deploy 1 unit
- **1.10 Event-Driven** — Cách giao tiếp bất đồng bộ giữa service
- **1.8 CQRS** — Tách read/write model trong service

**Chiến lược an toàn nhất:** Monolith First → Modular Monolith (boundary trước, network sau) → tách **một** service có động cơ rõ ràng (scale/tech/team) → đo lường → lặp lại. Amazon tách được "two-pizza teams" nhờ đã có platform; Netflix tách nhờ có domain ổn định. Bạn không copy **đích đến**, bạn copy **quy trình tiến hóa**.

---

## 📁 Cấu trúc thư mục ví dụ

```
1.2-microservices/
├── README.md           # File này
└── examples/
    └── index.ts        # Mini Shop demo (chạy: npx ts-node examples/index.ts)
```

Trong thực tế, mỗi service là một repo độc lập:

```text
github.com/company/
├── catalog-service/     # 1 repo, 1 pipeline, 1 DB
├── ordering-service/    # 1 repo, 1 pipeline, 1 DB
└── user-service/        # 1 repo, 1 pipeline, 1 DB
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.2-microservices
npx ts-node examples/index.ts
```

Hãy để ý điểm khác biệt với demo 1.1: `reserveStock` giờ là **network call** (có thể fail độc lập), và email trigger qua **event** (tách rời khỏi luồng chính) — đó chính là 2 "mùi" của distributed systems.

---

## 📚 Tài liệu tham khảo

- 📖 [Microservices - Martin Fowler](https://martinfowler.com/articles/microservices.html)
- 📖 [Microservices - microservices.io](https://microservices.io/)
- 📖 [Microservices - AWS](https://aws.amazon.com/microservices/)
- 📖 [Microservice Trade-offs - Chris Richardson](https://microservices.io/patterns/microservices.html)

---

## ⏭️ Bài tiếp theo

→ [1.3 Clean Architecture](../1.3-clean-architecture/README.md)
