# 🧼 1.3 Clean Architecture

> Phân lớp theo **Dependency Rule**: phụ thuộc luôn hướng từ ngoài vào trong. Entities (nghiệp vụ cốt lõi) ở trung tâm, framework/DB/UI ở ngoài cùng. Độc lập công nghệ, dễ test.

---

## 🎯 Kiến trúc này là gì?

Clean Architecture (Robert C. Martin) tổ chức code thành 4 vòng tròn đồng tâm. **Dependency Rule**: source code dependency chỉ hướng vào trong — lớp ngoài phụ thuộc lớp trong, không bao giờ ngược lại.

**Clean Architecture là kiến trúc, không phải thư mục.** Đây là hiểu lầm tai hại nhất. Uncle Bob không đưa ra "4 cái folder" — ông đưa ra **một quy tắc phụ thuộc duy nhất** và để bạn tự quyết định số vòng tròn (có thể 3, có thể 7). Folder chỉ là hệ quả. Bạn hoàn toàn có thể đặt cả 4 lớp trong **một folder duy nhất** và vẫn đúng Clean, miễn là dependency hướng đúng chiều.

**Vấn đề mà Clean Architecture giải quyết:** trong đa số codebase, business logic bị **dính chặt** vào chi tiết kỹ thuật. Bạn không thể đọc rule "order > 10 triệu thì phải duyệt sếp" mà không lạc vào giữa `req.body`, `sequelize.query`, `res.json()`. Khi đó:
- Đổi framework = viết lại nghiệp vụ
- Test nghiệp vụ = phải khởi động DB + HTTP server
- Sau 5 năm, không ai còn biết **rule thật** nằm ở đâu

Clean Architecture tách **two kinds of things**: *business rules* (thứ tồn tại mãi với công ty, là lý do công ty tồn tại) và *details* (framework, DB, UI — thứ thay đổi mỗi 3–5 năm). Chi tiết thì **quan trọng nhưng không cấp bách**; nghiệp vụ thì **cấp bách và quan trọng**. Kiến trúc phải bảo vệ cái gì sống lâu hơn.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ ① FRAMEWORKS & DRIVERS (ngoài cùng)                 │   │
│   │   React, Express, MongoDB, Kafka...                 │   │
│   │   ┌─────────────────────────────────────────────┐   │   │
│   │   │ ② INTERFACE ADAPTERS                        │   │   │
│   │   │   Controllers, Presenters, Gateways         │   │   │
│   │   │   ┌─────────────────────────────────────┐   │   │   │
│   │   │   │ ③ USE CASES                         │   │   │   │
│   │   │   │   Application business rules        │   │   │   │
│   │   │   │   (OrderService, CreateOrder...)    │   │   │   │
│   │   │   │   ┌─────────────────────────────┐   │   │   │
│   │   │   │   │ ④ ENTITIES (trong cùng)     │   │   │   │
│   │   │   │   │   Enterprise business rules │   │   │   │
│   │   │   │   │   (Order, User, Product)    │   │   │   │
│   │   │   │   └─────────────────────────────┘   │   │   │
│   │   │   └─────────────────────────────────────┘   │   │   │
│   │   └─────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Dependency: ① → ② → ③ → ④ (chỉ hướng vào trong)          │
└─────────────────────────────────────────────────────────────┘
```

**Dependency Rule hoạt động bằng cơ chế nào?** Về mặt vật lý, nếu lớp trong không được `import` lớp ngoài thì làm sao lớp ngoài "gọi" được lớp trong? Câu trả lời là **Dependency Inversion (nguyên tắc D trong SOLID)**: lớp trong **khai báo interface** (cổng), lớp ngoài **triển khai** nó. Ví dụ `CreateOrderUseCase` khai báo `interface OrderRepository`, và `PostgresOrderRepository` ở lớp ngoài implement. Kết quả: mũi tên source-code vẫn hướng vào trong, nhưng mũi tên **control flow** hướng ra ngoài. Đây là điểm tinh vi nhất và cũng là chỗ mọi người hay làm sai.

> 📌 **Dependency Rule:** Lớp ngoài phụ thuộc lớp trong. Lớp trong **không biết** lớp ngoài tồn tại. Framework/DB/UI có thể thay đổi mà không đụng business logic.

**Kiểm tra vi phạm (rule thực dụng):** trong `src/domain/` và `src/application/` **không được có** `import` từ `express`, `mongoose`, `pg`, `react`, `axios`, hoặc bất kỳ SDK vendor nào. Nếu có → Dependency Rule đã vỡ. Đây là thứ có thể enforce tự động bằng ESLint (`import/no-restricted-paths`), dependency-cruiser, hoặc ArchUnit (Java).

---

## 📐 4 lớp

| Lớp | Trách nhiệm | Ví dụ | Giải thích sâu |
|-----|-------------|-------|----------------|
| **① Frameworks & Drivers** | Công nghệ cụ thể: web, DB, queue | React, Express, MongoDB, Kafka, AWS SDK | Lớp "chứa đồ bỏ được". Chiến lược thiết kế tốt là **giảm thiểu số dòng code ở lớp này**. Framework chỉ nên là "xe đẩy" — bạn thuê nó, không cưới nó. Nếu lớp này phình (business logic rò rỉ vào controller/middleware), toàn bộ kiến trúc mất ý nghĩa. |
| **② Interface Adapters** | Chuyển đổi dữ liệu giữa use case và framework | Controllers, Presenters, Gateways, Repositories impl | Layer "phiên dịch". **Controller**: HTTP request → input DTO cho use case. **Presenter**: output use case → ViewModel/JSON cho UI. **Gateway/Repository impl**: use case ↔ ORM/DB. Đây là nơi đặt mọi thứ thuộc về **technology-specific shape**. |
| **③ Use Cases** | Business rules của ứng dụng | `CreateOrder`, `ProcessPayment`, `PlaceBid` | Nghiệp vụ **thuộc riêng ứng dụng này** — "app-level rules". Mỗi use case = một chức năng người dùng có thể gọi tên ("đặt hàng", "rút tiền"). Đặc trưng: **dài (orchestration)** — gọi entity, gọi repository, gọi service khác, xử lý transaction. Nhưng **không chứa rule cốt lõi** — rule đó nằm ở entity. |
| **④ Entities** | Business rules cốt lõi, độc lập mọi thứ | `Order`, `User`, `Product` | **Enterprise business rules** — những rule mà nếu bạn đổi công nghệ, đổi app sang web, đổi ngân hàng, chúng **vẫn đúng**. "Order không thể cancel sau khi đã ship" — đó là entity logic, không phải use case logic. Đây là tài sản có giá trị nhất và sống lâu nhất trong codebase. |

**Phân biệt cấp ③ và ④ (điểm khó nhất):**

| | Entity rule (④) | Use case rule (③) |
|---|---|---|
| Phạm vi | Đúng cho **mọi ứng dụng** của công ty | Đúng cho **một tính năng** của ứng dụng này |
| Ví dụ | `Order.canCancel()` — order đã ship thì không cancel được | `CancelOrderUseCase` — kiểm tra quyền hạn, ghi audit, hoàn tiền, gửi email |
| Chứa gì | Trạng thái + hành vi trên chính nó | Điều phối, thứ tự bước, giao tiếp ngoài |

**Mẹo đặt code:** tự hỏi "nếu công ty làm thêm app mobile, rule này có dùng lại không?" → Có = Entity/Domain. Không = Use Case.

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Order Processing**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  USE CASE: CreateOrderUseCase                        │   │
│  │  (business rule: kiểm tra stock, tạo order)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ENTITY: Order (id, items, total, status)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Use case gọi Entity. Không phụ thuộc framework/DB.         │
└─────────────────────────────────────────────────────────────┘
```

- **Entity:** `Order` — nghiệp vụ cốt lõi, không biết DB/framework
- **Use Case:** `CreateOrderUseCase` — điều phối nghiệp vụ ứng dụng

**Kiến trúc đầy đủ khi có HTTP + DB (hệ quả của 4 lớp trên):**

```
HTTP Request
   │
   ▼
CreateOrderController (② adapter)      ← biết Express, parse req.body
   │ input DTO
   ▼
CreateOrderUseCase.execute(input) (③)  ← orchestration, KHÔNG biết Express
   │  ├─► OrderRepository (interface ③, impl ở ① ②)  ← DB
   │  ├─► InventoryClient  (interface ③, impl ở ngoài) ← network
   │  └─► Order.canCancel() / Order.calculateTotal() (④)
   ▼
output DTO
   │
   ▼
CreateOrderPresenter (② adapter)       ← format JSON, ViewModel
   │
   ▼
HTTP Response
```

**Payoff thật sự** — test `CreateOrderUseCase` mà không cần khởi động gì cả:

```ts
// Không mock framework, không DB, không HTTP server
const uc = new CreateOrderUseCase(
  new FakeOrderRepo(),      // in-memory
  new FakeInventory()       // trả stock có sẵn
);
const result = await uc.execute({ userId: 'u1', items: [...] });
expect(result.order.status).toBe('CONFIRMED');
```

> 💡 Demo đơn giản hóa (entity + use case). Thực tế thêm controllers, presenters, gateways ở lớp ngoài.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔌 **Độc lập framework** | Đổi React→Vue, MongoDB→Postgres không đụng core | Testability ≠ chỉ unit test; là khả năng **đổi quyết định kỹ thuật mà không đổi chi phí kiến trúc**. Framework thay 3–5 năm một lần; nếu nghiệp vụ nằm trong `@Controller` thì mỗi lần đổi framework là một dự án rewrite. |
| 🧪 **Dễ test** | Test use case/entity không cần DB/framework | **Test pyramid tự nhiên đúng**: phần nhiều nhất (rule) nằm ở nơi pure nhất → test nhanh, không flaky. Không cần test container, không cần seeding DB để verify một rule nghiệp vụ. Vòng feedback giây thay vì phút. |
| 🎯 **Business logic tập trung** | Rule nghiệp vụ rõ ràng, không lẫn công nghệ | Trả lời được câu "rule tính phí ship nằm ở đâu?" trong 5 giây → `ShippingFeePolicy` ở domain. Codebase tự tài liệu hóa: đọc folder `use-cases` ≈ đọc danh sách chức năng ≈ đọc spec. |
| 🔄 **Dễ thay đổi công nghệ** | Lớp ngoài thay được, core giữ nguyên | Quyết định công nghệ trở nên **trễ hạn** (deferred): hôm nay không biết chọn SQL hay NoSQL? Đặt sau, vì kiến trúc không phụ thuộc lựa chọn đó. "Keep options open" là mục tiêu chính của Clean. |
| 👥 **Song song hóa team** | (Ưu điểm bị bỏ sót) | Frontend dev code UI chỉ cần **contract** là input/output DTO của use case, không cần backend xong. Boundary rõ → merge conflict giảm. |
| 🔍 **Review code dễ hơn** | (Ưu điểm bị bỏ sót) | PR thay đổi DB schema không thể lẫn vào PR sửa rule tính thuế — chúng ở các lớp khác nhau, reviewer đọc đúng phần cần đọc. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 📝 **Nhiều boilerplate** | Nhiều lớp, interface, DTO chuyển đổi | Một tính năng "hello world" cần 5–8 file: entity, use case, interface repo, repo impl, controller, DTO in, DTO out. **Đặc biệt nặng với CRUD thuần** — nơi không có rule nghiệp vụ để bảo vệ. *Giảm thiểu:* chỉ tạo interface khi thực sự có 2 implementation hoặc cần test; dùng generic base controller; cho phép "thin layer" gộp file. |
| 🧠 **Phức tạp, learning curve cao** | Khó hình dung lúc đầu | Dev mới (đặc biệt từ Express/Rails) thấy "vòng vo": tại sao không query DB ngay trong controller? Không nắm Dependency Inversion → làm sai, tạo interface cho **đúng chỗ sai**. *Giảm thiểu:* code walkthrough, ADR ghi lại vì sao, linter enforce boundary. |
| 🏗️ **Overkill dự án nhỏ** | CRUD đơn giản không cần nhiều lớp | **Đây là nhược điểm thật, không phải lỗi người dùng.** Một nội bộ tool / prototype / app 3 màn hình: Clean Architecture làm chậm delivery mà không mua được gì (không ai đổi framework, không ai cần test domain). |
| 🐢 **Hiệu năng giảm nhẹ** | (Nhược điểm ít được nói tới) | Mỗi bước qua adapter = thêm 1 lần map DTO (copy object). Với request lớn/tần suất cao, chi phí map có thể cộng lại thành microsecond–millisecond. Không đáng lo cho 95% case, nhưng nên biết. |
| 🎭 **Trở thành Cargo Cult** | (Rủi ro văn hóa) | Team áp dụng **hình thức**: đặt tên folder `domain/use-cases/adapters` nhưng business logic vẫn nằm hết trong controller, repository trả về ORM entity đầy quan hệ → lớp "trong" phụ thuộc DB. **Có structure, không có rule.** Đây là failure mode phổ biến nhất và tệ hơn cả không dùng Clean. |
| 🧨 **Model chuyển đổi nhiều lần** | Entity ↔ Domain ↔ DTO ↔ ORM entity ↔ JSON | Cùng một dữ liệu có 4 hình dạng → dễ lệch, bug mapping. *Giảm thiểu:* cho phép reuse DTO khi không có lý do tách, đừng map "vì Clean nói vậy". |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Ứng dụng doanh nghiệp, vòng đời 5–10 năm+ | ✅ Rất phù hợp | Vòng đời càng dài thì số lần đổi framework/DB càng nhiều → giá trị của "độc lập chi tiết" càng lớn. Đây là **bài toán ROI theo thời gian**, không phải thẩm mỹ. |
| Nghiệp vụ phức tạp: nhiều rule, nhiều biến thể, tính tiền / risk / inventory / tax | ✅ Phù hợp | Rule nhiều và hay thay đổi → cần nơi **duy nhất** để đặt chúng và cần test không phụ thuộc hạ tầng. |
| Được yêu cầu test coverage cao / compliance / audit | ✅ Phù hợp | Clean cho phép chứng minh hành vi nghiệp vụ bằng unit test thuần, chạy trong CI vài giây. |
| Có thể đổi framework/DB trong tương lai, hoặc đang nợ công nghệ | ✅ Phù hợp | Decision giữ nguyên chi phí khi bạn mua **option** (deferred decision). |
| Nhiều team cùng code một hệ thống | ✅ Phù hợp | Boundary rõ ràng + linter enforce = giảm xung đột liên team. |
| Dự án nhỏ, CRUD đơn giản, admin panel, internal tool | ❌ Overkill | Không có rule nghiệp vụ để bảo vệ → chỉ còn chi phí boilerplate. Dùng layered nhẹ hoặc MVC thường là đủ. |
| Prototype, MVP tuần này phải ra, domain đang đổi liên tục | ❌ Chưa nên | Bạn chưa biết gì về domain để mà tách đúng lớp. Clean sai chỗ còn tốn hơn không Clean. |
| Team chưa quen SOLID / DI | ⚠️ Cần đào tạo trước | Nếu áp dụng hình thức, bạn sẽ nhận đúng Cargo Cult ở trên: chi phí boilerplate, không có lợi ích. |

**Khung quyết định 3 câu hỏi:**
1. Ứng dụng này sẽ sống bao lâu? (< 2 năm → cân nhắc; > 5 năm → gần như chắc chắn nên)
2. Có bao nhiêu business rule **phức tạp** (không phải CRUD)? (< 10 rule đơn giản → overkill)
3. Có khả năng phải đổi framework/DB/UI không? (Nếu gần như chắc chắn có → Clean)

---

## 🔗 Liên quan

- **1.6 Onion** — Ý tưởng tương tự: domain trung tâm, phụ thuộc hướng vào trong
- **1.5 Hexagonal** — Bổ sung: Ports & Adapters cho ranh giới
- **1.7 DDD** — Cung cấp khái niệm Entity, Use Case cho Clean

**So sánh nhanh các "họ hàng":**

| Kiến trúc | Trọng tâm | Thuật ngữ riêng |
|-----------|-----------|-----------------|
| **Hexagonal (1.5)** | Ports & Adapters, testability | "Ports", "Driving/Driven adapters" |
| **Onion (1.6)** | Domain model ở giữa, layer hướng tâm | "Domain", "Infrastructure" |
| **Clean (đây)** | Tổng hợp + nhấn mạnh Dependency Rule & Use Case | "Entities", "Use Cases", "Interface Adapters" |
| **DDD (1.7)** | Model hóa domain, bounded context | "Aggregate", "Domain Service", "Repository" |

Clean Architecture **không cạnh tranh** với DDD — nó quy định **hình dạng dependency**, còn DDD quy định **nội dung lớp trong**. Cặp phổ biến và mạnh nhất trong thực tế: **Clean/Hexagonal shell + DDD domain**.

---

## 📁 Cấu trúc thư mục ví dụ

```
1.3-clean-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Processing demo (chạy: npx ts-node examples/index.ts)
```

Cấu trúc thường gặp trong dự án thật (theo feature × layer):

```text
src/
├── domain/                 # ④ Entities — không import gì từ ngoài
│   └── order/ (Order.ts, OrderStatus.ts)
├── application/            # ③ Use Cases + interface cổng
│   ├── use-cases/ (CreateOrderUseCase.ts)
│   └── ports/    (OrderRepository.ts — interface)
├── infrastructure/         # ① + ② — implement ports
│   ├── persistence/ (PostgresOrderRepository.ts)
│   ├── http/        (CreateOrderController.ts)
│   └── external/    (HttpInventoryClient.ts)
└── main.ts                 # Composition Root: nối wiring tại đây
```

> 💡 `main.ts` (Composition Root) là nơi **duy nhất** được phép biết hết mọi thứ và `new` mọi implementation. Đây là chỗ dependency injection thật sự diễn ra.

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.3-clean-architecture
npx ts-node examples/index.ts
```

Khi chạy, để ý: `Order` và `CreateOrderUseCase` không hề nhắc tới Express/DB. Thêm một "database" mới chỉ cần thêm adapter — đó là bằng chứng trực quan của Dependency Rule.

---

## 📚 Tài liệu tham khảo

- 📖 [The Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- 📖 [Clean Architecture - Wikipedia](https://en.wikipedia.org/wiki/Clean_architecture)
- 📖 [The Dependency Rule](https://blog.cleancoder.com/uncle-bob/2020-10-18/TheDependenceRule.html)

---

## ⏭️ Bài tiếp theo

→ [1.4 Layered Architecture](../1.4-layered-architecture/README.md)
