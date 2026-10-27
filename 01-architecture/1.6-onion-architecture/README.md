# 🧅 1.6 Onion Architecture

> Tương tự Clean Architecture nhưng nhấn mạnh **Domain Model** ở trung tâm, các lớp **Domain Services**, **Application Services**, **Infrastructure** bao quanh. Dependency Rule: phụ thuộc chỉ hướng vào trong. Domain Model không phụ thuộc vào bất kỳ thứ gì bên ngoài.

---

## 🎯 Kiến trúc này là gì?

Onion Architecture (Jeffrey Palermo) tổ chức code thành **các lớp hình tròn đồng tâm**, Domain Model nằm ở trung tâm nhất. Mỗi lớp bên ngoài phụ thuộc vào lớp bên trong, không bao giờ ngược lại.

**Bối cảnh ra đời (2008):** Palermo làm việc trên các codebase .NET enterprise nơi business logic lẫn trong code-behind của UI và trong stored procedure. Ông cần một mô hình mà: (1) **domain là trung tâm** (TDD + DDD đang lên ngôi), (2) dependency **đảo ngược** qua interface để domain không dính persistence, (3) **không cần mua tooling** của Microsoft để tuân theo. Onion ra đời từ đó — nó là phát biểu sớm nhất của tư tưởng "core ở giữa, chi tiết bao quanh", và Clean Architecture (2012) của Uncle Bob chịu ảnh hưởng rõ rệt.

**Điểm khác biệt nhấn mạnh của Onion so với Clean:** Onion đặt nặng khái niệm **Domain Services** như một **lớp riêng biệt** — tức những rule phức tạp liên quan nhiều entity không thuộc về entity nào. Clean Architecture gộp chung vào Entities/Use Cases. Khi đọc code Onion, câu hỏi đầu tiên của bạn luôn là: *"cái này có phải domain knowledge không, hay chỉ là orchestration?"*

```
                ┌─────────────────────────────────────────────┐
                │         INFRASTRUCTURE / UI                 │  ← Ngoài cùng
                │   DB, External APIs, Web, Console           │
                │   ┌─────────────────────────────────────┐   │
                │   │     APPLICATION SERVICES            │   │
                │   │   Use Cases, Orchestration          │   │
                │   │   ┌─────────────────────────────┐   │   │
                │   │   │   DOMAIN SERVICES           │   │   │
                │   │   │   Business rules phức tạp   │   │   │
                │   │   │   ┌─────────────────────┐   │   │   │
                │   │   │   │   DOMAIN MODEL      │   │   │   │
                │   │   │   │  Entities, VOs,     │   │   │   │
                │   │   │   │  Domain Events      │   │   │   │
                │   │   │   └─────────────────────┘   │   │   │
                │   │   └─────────────────────────────┘   │   │
                │   └─────────────────────────────────────┘   │
                └─────────────────────────────────────────────┘
```

**Tại sao hình tròn, không phải xếp chồng?** Hình tròn là lời nhắc trực quan: **không có "trên" hay "dưới"**, chỉ có tâm và ngoại vi. Trong layered (1.4), service nằm "trên" repository → service import repository. Trong onion, repository implementation nằm **ngoài rìa**, service nằm **trong** → service **không import** repository; repository import interface của service. Cùng code, **ngược chiều mũi tên**. Hình tròn giúp bạn không bao giờ quên điều đó.

> 📌 **Dependency Rule:** Phụ thuộc luôn hướng **vào trong**. Domain Model không import gì từ lớp ngoài.

**Hệ quả thực thi quan trọng nhất:** vì mọi thứ hướng vào trong, nên **không thể có** domain entity chứa ORM attribute (`@Column`, `@Entity` của JPA) — vì annotation đó là import từ infrastructure. Ở Onion, persistence model là **một model khác** nằm ngoài rìa, có mapper sang domain model.

---

## 📐 Các lớp (từ trong ra)

| Lớp | Chứa gì | Phụ thuộc | Giải thích sâu |
|---|---|---|---|
| **Domain Model** | Entities, Value Objects, Domain Events | Không phụ thuộc ai | **Bất biến số 1**: layer này không được có một `import` nào ra ngoài — không có cả interface "để gọi DB". Chứa rule nhất quán (invariant): `Order` biết tự tính total và tự biết khi nào nó hợp lệ. |
| **Domain Services** | Business rules phức tạp liên quan nhiều entity | Chỉ phụ thuộc Domain Model | Rule không thể nhét vào entity nào (cần state của nhiều aggregate) → đặt ở service. `PricingService` cần `Order` + `Customer` + `Promotion`. **Quan trọng:** vẫn là domain logic thuần, không có I/O, không có repository. |
| **Application Services** | Use cases, orchestration, transaction | Phụ thuộc Domain | Điều phối: mở transaction, lấy dữ liệu, gọi domain service, publish domain event, commit. **Không chứa rule**. Đây cũng là nơi **khai báo interface** (`IOrderRepository`) — interface thuộc về consumer (trong), implementation thuộc về provider (ngoài). |
| **Infrastructure / UI** | DB, external API, web, console | Phụ thuộc Application | Implement các interface mà ApplicationServices đã công bố, cộng với HTTP controllers/CLI. Mọi thứ bạn **dự tính thay thế** nằm ở đây. |

**Tránh bẫy "Domain Service God class":** nếu PricingService phình lên chứa cả gọi network/email → bạn vừa chuyển anemic model sang một lớp khác. Test phân biệt: **Domain Service phải test được với input là object thuần, output là object thuần** (không có mock nào). Nếu phải mock repo → nó là Application Service, đặt sai chỗ.

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Order Management**:

```
┌──────────────┐  placeOrder()   ┌──────────────────┐
│ ConsoleUI    │ ──────────────▶ │ OrderService     │
│ (Infra)      │                 │ (Application)    │
└──────────────┘                 └────────┬─────────┘
                                          │ calculatePrice()
                                          ▼
                               ┌──────────────────┐
                               │ PricingService   │
                               │ (Domain Service) │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ Order, Customer  │
                               │ (Domain Model)   │
                               └──────────────────┘
```

- **Domain Model:** `Order`, `Customer`
- **Domain Services:** `PricingService` (tính giá, áp dụng khuyến mãi)
- **Application Services:** `OrderService` (điều phối use case)
- **Infrastructure:** `InMemoryOrderRepo`, `ConsoleUI`

**Chú ý vị trí của repository interface** — thứ mà Onion giải quyết còn Layered thì không:

```
ApplicationServices  ──define──▶  IOrderRepository  ◀──implement──  Infrastructure
        (trong)                    (mặt bằng ranh giới)                   (ngoài)
```

`IOrderRepository` nằm trong `ApplicationServices`, `PostgresOrderRepository` nằm ngoài rìa. Khi `OrderService` cần lưu, nó gọi interface; DI container ở composition root mới biết đang dùng implement nào. Kết quả: **đổi DB là đổi một file ở ngoài cùng, và không phải sửa `OrderService`.**

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🎯 **Domain cô lập tuyệt đối** | Domain Model không biết DB, framework, UI | Business rule không phải đổi vì lý do kỹ thuật. Domain = tài sản trí tuệ sống lâu nhất; nếu giữ nó sạch, bạn có thể bỏ hết infrastructure và viết lại từng phần. |
| 🧪 **Test dễ** | Test domain/application với mock infra | Domain Services test **không cần mock** (thuần hàm), Application Services test với mock repo. Suite chạy trong miligiây, không Docker, không DB. |
| 🔄 **Dễ mở rộng** | Thêm adapter mới không đụng core | Thêm gRPC endpoint, thêm queue consumer, thêm Stripe song song PayPal → toàn bộ ở ngoài rìa. |
| 🧩 **Ranh giới rõ ràng** | Mỗi lớp 1 trách nhiệm, phụ thuộc 1 chiều | Khi review PR, chỉ cần hỏi "code này nằm đúng vòng nào?" → dễ phát hiện logic đặt sai chỗ (dễ enforce bằng ArchUnit/lint). |
| 🎓 **Domain Services là lớp được gọi tên** | (Ưu điểm riêng Onion) | Nhiều team để rule "liên entity" ở lung tung (util class? service app?). Onion cho nó một vị trí chính danh → chống anemic model hiệu quả hơn Clean ở chỗ này. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 📦 **Nhiều tầng gián tiếp** | Nhiều interface, mapping, boilerplate | 4 vòng = một feature có thể 8–10 file + 2 mapper. CRUD nhẹ không có gì để bảo vệ. *Giảm thiểu:* bắt đầu bằng 2 vòng (core + outer), tách thêm khi có nhu cầu thật. |
| 🧠 **Learning curve dốc** | Khó hiểu lúc đầu, cần kỷ luật | Nhầm lẫn Domain Service ↔ Application Service, đặt interface sai vòng → mất hết giá trị. *Giảm thiểu:* vẽ diagram vòng cho mỗi folder, lint "domain/ không được import". |
| 🏗️ **Overkill dự án nhỏ** | CRUD đơn giản không cần | Đúng 100% với script, internal tool, MVP 2 tuần. |
| 🕸️ **Không định nghĩa cấu trúc domain** | (Giới hạn cố hữu) | Onion cho biết **vòng nào chứa gì**, nhưng **không** cho biết domain nên tổ chức thành aggregate/service/event thế nào → phải dùng kèm DDD (1.7). |
| 🐢 **Overhead mapping** | Domain ↔ persistence model | Bắt buộc 2 model (vì entity không mang ORM attribute) → map qua lại, thêm chi phí CPU & code lặp. |
| 👕 **Không có ranh giới theo feature** | (Điểm yếu bị lãng quên) | Onion chia **trục đứng** (kỹ thuật). Không có gì ngăn `OrderService` gọi thẳng `UserRepository` → **trục ngang** (module) vẫn lộn xộn. Cần kết hợp Modular Monolith (1.14). |

---

## 🆚 So sánh với Clean & Hexagonal

| Tiêu chí | Onion | Clean | Hexagonal |
|----------|-------|-------|-----------|
| Trung tâm | Domain Model | Entities | Domain Core |
| Nhấn mạnh | Phân lớp hình tròn | Dependency Rule 4 vòng | Ports & Adapters |
| Điểm khác | Domain Services là lớp riêng | Use Cases là lớp riêng | Tập trung 2 chiều in/out |
| Số vòng | 4 (cứng) | 4 (đề xuất) | 2 (core vs adapters — không ép) |
| Ra đời | 2008 (Palermo) | 2012 (Martin) | 2005 (Cockburn) |
| Kết hợp | ✅ Dùng chung được | ✅ Dùng chung được | ✅ Dùng chung được |

> 💡 3 kiến trúc này **cùng tư duy**: core độc lập, phụ thuộc hướng vào trong. Khác nhau chủ yếu ở cách đặt tên và vẽ hình.

**Dịch thuật ngữ — dùng khi đọc code từ nguồn khác:**

| Onion | Clean | Hexagonal |
|-------|-------|-----------|
| Domain Model | Entities | Domain Core |
| Domain Services | Entities/Use Cases | Domain Core |
| Application Services | Use Cases | Use Cases (driving ports) |
| Interface trong AppServices | — | Driven Ports |
| Infrastructure/UI | Interface Adapters + Frameworks | Adapters |

Nếu bạn thấy 3 diagram này và nghĩ "có gì khác đâu" → **đúng**, bạn đã hiểu chúng. Hãy chọn **một bộ từ vựng** cho team và dùng nhất quán; đừng đổi tên mỗi khi đọc blog mới.

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Domain phức tạp, nhiều business rules | ✅ Phù hợp | Onion là khung tốt nhất để "nhốt" rule ở một chỗ có thể test. |
| Cần test domain độc lập hoàn toàn | ✅ Phù hợp | Không cần DB/framework trong unit test. |
| Ứng dụng doanh nghiệp vòng đời dài | ✅ Phù hợp | ROI của isolation chỉ hiện ra sau 3+ năm, khi framework đã lỗi thời 1–2 lần. |
| Team .NET/Java enterprise, quen phân tầng rõ | ✅ Phù hợp | Naming Application/Domain/Infrastructure khớp hệ sinh thái enterprise. |
| Dự án nhỏ, CRUD đơn giản | ❌ Overkill | Trả giá boilerplate không mua được gì. |
| Domain đã đơn giản, không có rule | ❌ Không cần | Onion tạo interface cho CRUD — pure ceremony. |
| Cần tách deploy độc lập (nhiều team) | ❌ Không đủ | Onion không chia deployment → cần thêm module/service axis. |

---

## 🔗 Liên quan

- **1.3 Clean Architecture** — Cùng tư duy, Use Cases thay cho Application Services
- **1.5 Hexagonal** — Cùng tư duy, nhấn mạnh Ports & Adapters
- **1.7 DDD** — Domain Model trong Onion thường thiết kế theo DDD

**Cặp bài trùng Onion + DDD:** Onion = khung vật lý (vòng nào chứa gì). DDD = nội dung (aggregate, repository pattern, domain event, bounded context). Onion không thể bảo vệ domain nếu domain model là anemic — DDD không có chỗ đặt code nếu thiếu Onion. Đây là combo thực tế phổ biến nhất trong enterprise Java/.NET.

---

## 📁 Cấu trúc thư mục ví dụ

```
1.6-onion-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Management demo (chạy: npx tsx examples/index.ts)
```

Layout chuẩn Onion (mỗi vòng một project/folder):

```text
src/
├── 1.Domain/           # model: Order, Money, Customer, DomainEvent
├── 2.DomainServices/   # PricingService, DiscountPolicy
├── 3.Application/      # OrderService + IOrderRepository (ports)
└── 4.Infrastructure/   # PostgresOrderRepository, WebControllers
```

Số prefix `1./2./3.` là thủ thuật để thứ tự đọc khớp thứ tự vòng tròn.

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.6-onion-architecture
npx tsx examples/index.ts
```

Thử đổi `InMemoryOrderRepo` sang một repository khác trong demo → bạn chỉ sửa **composition root**, không sửa `OrderService`: đó là dependency inversion bằng chứng.

---

## 📚 Tài liệu tham khảo

- 📖 [The Onion Architecture - Jeffrey Palermo](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- 📖 [Onion Architecture - Part 2](https://jeffreypalermo.com/2008/08/the-onion-architecture-part-2/)
- 📖 [Onion Architecture - Part 3](https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/)

---

## ⏭️ Bài tiếp theo

→ [1.7 Domain-Driven Design](../1.7-domain-driven-design/README.md)
