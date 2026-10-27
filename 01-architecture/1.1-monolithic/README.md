# 🏢 1.1 Monolithic Architecture

> Toàn bộ ứng dụng trong **1 codebase, 1 deployment unit**. UI, business logic, data access chạy trong cùng 1 process. Đơn giản nhất, phù hợp khởi đầu.

---

## 🎯 Kiến trúc này là gì?

Monolithic Architecture gói toàn bộ tính năng vào 1 ứng dụng duy nhất. Mọi module (auth, order, payment...) nằm chung codebase, deploy chung 1 lần.

**"Monolith" không phải là "mớ bòng bong" (big ball of mud)** — đây là hiểu lầm phổ biến nhất. Monolith là một *quyết định kiến trúc* (1 đơn vị triển khai), còn big ball of mud là *Chất lượng code bên trong* kém. Một monolith được tổ chức tốt (module rõ ràng, ranh giới sạch) có thể phục vụ hàng triệu người dùng trong nhiều năm. WordPress, Shopify (giai đoạn đầu), GitHub (giai đoạn đầu) đều là monolith thành công.

Ba từ khóa định nghĩa monolith:

1. **1 codebase** — tất cả tính năng lives trong 1 repository, code của module này có thể gọi trực tiếp function của module kia (in-process call, không qua network).
2. **1 deployment unit** — build ra **1 artifact duy nhất** (1 file `.jar`, 1 binary `.exe`, 1 Docker image) và deploy artifact đó là deploy **toàn bộ** ứng dụng.
3. **1 process/runtime** — UI, business logic, data access cùng chia sẻ 1 bộ nhớ, 1 kết nối DB pool, 1 lần khởi động.

```
┌─────────────────────────────────────────────────────────────┐
│                    MONOLITH APPLICATION                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  UI Layer    │  │  Business    │  │  Data Access │       │
│  │  (Controllers│  │  Logic       │  │  (Repos,     │       │
│  │   Templates) │  │  (Services)  │  │   DAOs)      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              DATABASE (1 DB, 1 schema)              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Deploy: 1 artifact (jar, exe, container)                   │
│  Scale: nhân bản toàn bộ ứng dụng                          │
└─────────────────────────────────────────────────────────────┘
```

**Vì sao mô hình này tồn tại và vẫn phổ biến?** Vì nó khớp với cách phần mềm được viết tự nhiên nhất: một chương trình. Khi bạn gọi `OrderService.create()` từ `CheckoutController`, đó là một lời gọi function trực tiếp — nhanh nhất, đơn giản nhất, debug dễ nhất. Mọi kiến trúc phân tán đều phải "trả giá" bằng cách biến lời gọi in-process thành lời gọi network (chậm hơn ~10.000 lần, có thể lỗi, cần timeout/retry). Monolith **không phải** kiến trúc "cũ lỗi thời" — nó là lựa chọn **mặc định hợp lý** cho tới khi có bằng chứng bạn cần tách.

> 📌 **Đặc trưng:** 1 codebase → 1 build → 1 deploy. Muốn scale → chạy nhiều instance giống hệt nhau (horizontal scaling).

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả | Giải thích sâu |
|----------|-------|----------------|
| **1 codebase** | Tất cả module trong 1 repo | Compiler/type-check nhìn thấy toàn bộ hệ thống → phát hiện lỗi tích hợp ngay lúc build. Refactor toàn cục dễ (rename 1 API, IDE sửa hết call sites). Mặt trái: ai cũng sửa được code của module bất kỳ → ranh giới dễ bị xói mòn nếu không kỷ luật. |
| **1 deployment unit** | Build 1 artifact, deploy 1 lần | Toàn bộ hệ thống lên/production **cùng thời điểm, cùng version** → không bao giờ có tình trạng "service A mới, service B cũ" (version skew). Mặt trái: chỉ để sửa 1 dòng ở module ít quan trọng cũng phải redeploy **tất cả** → quy trình release nặng hơn. |
| **1 process** | UI + logic + data access chạy chung | Shared memory, direct method calls → latency mỗi bước xử lý ~vài nano giây, không serialization, không network hop. Mặt trái: 1 request ăn hết memory cũng làm OOM **toàn bộ** app; 1 vòng lặp vô hạn chiếm CPU làm mọi tính năng chậm theo. |
| **1 database** | Thường dùng 1 DB, 1 schema | **Transactional consistency miễn phí**: tạo order + trừ stock + ghi audit trong 1 ACID transaction. Đây là lợi thế kỹ thuật lớn nhất so với microservices (nơi cần saga/2-phase). Mặt trái: DB trở thành single scaling point — mọi module đổ tải vào 1 database. |
| **Scale đồng bộ** | Nhân bản toàn bộ, không scale từng phần | Chạy N instance giống hệt nhau sau load balancer. Đơn giản, stateless là scale được ngay. Mặt trái: nếu chỉ module "report" nặng tải mà vẫn phải scale cả app → tốn tài nguyên cho phần không cần (chi phí = bội số của toàn bộ app). |

**Đặc điểm ngầm định — shared runtime:** mọi module dùng chung **1 công nghệ** (ngôn ngữ, framework, version thư viện), **1 pipeline CI/CD**, **1 lời khuyên vận hành** (cùng config, cùng monitoring). Đây chính là ràng buộc khó nới nhất khi hệ thống lớn lên: muốn viết module ML bằng Python? Phải tách khỏi monolith.

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Mini Shop Monolith**:

```
┌─────────────────────────────────────────────────────────────┐
│                    MONOLITH APP (1 process)                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Presentation: ConsoleUI                             │   │
│  │  Business:     ProductService, OrderService          │   │
│  │  Data Access:  ProductRepository, OrderRepository    │   │
│  │  (gọi trực tiếp trong cùng process, không network)   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  In-memory Database (Map) — 1 DB dùng chung          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Presentation:** `ConsoleUI` — hiển thị sản phẩm, tạo đơn
- **Business Logic:** `ProductService`, `OrderService` — gọi trực tiếp nhau
- **Data Access:** `ProductRepository`, `OrderRepository` — dùng chung in-memory DB
- **Database:** in-memory `Map` — 1 DB dùng chung

**Điều quan sát được khi chạy demo:** một "luồng nghiệp vụ" hoàn chỉnh (đặt hàng) đi qua 3 layer chỉ bằng lời gọi function thông thường:

```
ConsoleUI.placeOrder()
   → OrderService.createOrder(items)      // in-process call #1
       → ProductService.checkStock(id)    // in-process call #2  ← module khác, cùng process
       → OrderRepository.save(order)      // in-process call #3
       → ProductRepository.decreaseStock()// in-process call #4
   // tất cả nằm trong 1 transaction (v cùng 1 "DB")
```

> 💡 Các layer gọi nhau trực tiếp (in-process), không qua network. Đơn giản nhưng khó tách riêng sau này.

**Vì sao "khó tách về sau"?** Vì `OrderService` đã quen gọi thẳng `ProductService.checkStock()`. Khi muốn tách Product thành service riêng, lời gọi đó phải trở thành HTTP/gRPC — kèm theo timeout handling, serialization, error semantics hoàn toàn khác. **Ranh giới không tồn tại thì không thể cắt**, đó là lý do monolith nên giữ module boundary rõ ràng từ đầu (→ 1.14 Modular Monolith).

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🚀 **Đơn giản** | 1 codebase, 1 build, 1 deploy | Không cần service discovery, API gateway, message broker, distributed tracing. Hạ tầng vận hành tối thiểu: 1 server (hoặc 1 pool sau LB) + 1 DB. Time-to-market cho MVP gần như nhanh nhất có thể. |
| 🐛 **Debug dễ** | Gọi trực tiếp, không network, dễ trace | 1 stack trace đi xuyên qua mọi layer của nghiệp vụ. Không có cảnh tượng "log nằm rải rác 6 service, correlate requestId thủ công". Reproduce bug production = chạy local y nguyên 1 process. |
| 💰 **Chi phí thấp** | Không cần hạ tầng phức tạp | Không cluster Kubernetes, không phí inter-service traffic giữa các AZ, không đội SRE riêng. Một developer có thể deploy toàn bộ hệ thống. |
| ⚡ **Performance tốt** | Không có network overhead giữa module | Lời gọi in-process ~nanoseconds; 1 request đi qua 50 internal calls trong monolith vẫn nhanh hơn 2 network hops giữa 2 services (each hop ~0.5–5ms + serialization). Latency thấp **mặc định**, không cần tối ưu. |
| 👨‍💻 **Onboarding nhanh** | Cấu trúc đơn giản, dễ hiểu | Dev mới clone 1 repo, chạy 1 lệnh, F5 toàn bộ luồng tiền. Không cần bản đồ 40 service và ai sở hữu cái gì. |
| 🔒 **Consistency dễ** | 1 DB → ACID transaction toàn nghiệp vụ | Nghiệp vụ đa-bước (trừ stock + tạo order + ghi ledger) chạy trong 1 transaction thật. Trong microservices, điều tương đương cần saga + compensating transactions + xử lý partial failure — một trong những nguồn bug phân tán khó nhất. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & thực tế |
|------------|------------|--------------------------|
| 📦 **Code phình to** | Lớn dần, khó bảo trì | Sau 2–3 năm: 500k+ LOC, hàng nghìn file. Không ai còn hiểu "toàn cảnh". Conflicts git tăng, build cache kém hiệu quả, risk khi chạm vào code vùng khác đang chạm. Đây là điểm mà **team size**, không phải dòng code, là chất xúc tác: 3 dev vẫn ổn, 30 dev trong 1 repo = địa ngục điều phối. |
| 🔗 **Ràng buộc công nghệ** | Khó đổi ngôn ngữ/framework từng phần | Nâng cấp Spring/NestJS major version = việc của **toàn công ty**, blocking. Muốn module tìm kiếm dùng Elasticsearch client bằng thư viện chỉ có ở ngôn ngữ khác? Không được. Technical debt của framework thành debt của toàn hệ thống. |
| 📈 **Scale lãng phí** | Scale toàn bộ dù chỉ 1 module tải cao | Black Friday: trang "deal hot" cần gấp 10 lần capacity → bạn phải trả tiền nhân bản 10 lần **cả ứng dụng**, gồm cả module admin ít ai vào. Trong container world còn tệ hơn: mỗi instance mang theo toàn bộ memory footprint của mọi module. |
| 💥 **1 lỗi = sập hết** | Lỗi 1 module ảnh hưởng toàn hệ thống | Không có **process isolation**: 1 export CSV tải 100MB file vào memory → OOM kill cả app (kể cả checkout đang chạy). 1 query xấu chiếm hết connection pool → mọi tính năng đứng máy. Blast radius = 100%. Microservices trả giá bằng độ phức tạp để đổi lấy việc cô lập lỗi vào 1 service. |
| 🐢 **Deploy chậm** | Build/test toàn bộ mỗi lần deploy | Pipeline CI phải build + test cả triệu dòng → 20–60 phút. Team checkout muốn release phải xếp hàng sau team report vừa phá build. Release frequency giảm → mỗi release mang nhiều change hơn → rủi ro mỗi release tăng → sợ deploy → deploy càng ít → càng sợ (vicious cycle). |
| 😵 **Onboarding & velocity giảm theo thời gian** | (Hệ quả tổng hợp) | Kết hợp 5 nhược điểm trên: thay đổi nhỏ cũng rủi ro, kiến thức tập trung vào vài "người giữ đền", team bắt đầu build tính năng **xung quanh** vùng code đáng sợ thay vì refactor nó. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Dự án mới, MVP, team nhỏ (< 10 người) | ✅ Rất phù hợp | Unknown domain → yêu cầu đổi liên tục. Monolith refactor rẻ hơn rất nhiều so với "split rồi merge requirement". Đúng tinh thần **Monolith First** (Fowler): start monolith, extract khi có bằng chứng. |
| Ứng dụng đơn giản, ít module | ✅ Phù hợp | Không đủ áp lực (tải, team, công nghệ) để biện minh cho distributed complexity. |
| Chưa rõ yêu cầu, cần nhanh | ✅ Phù hợp | Time-to-market là ưu tiên #1; kiến trúc tối ưu sau khi domain ổn định. |
| Startup đã có PMF, team bắt đầu phình | ✅ Vẫn phù hợp — nhưng hãy modular hóa | Giữ monolith + áp dụng quy tắc module (boundary, import rule, mỗi module 1 owner team). |
| Hệ thống lớn, nhiều team (> 2–3 pizza teams), cần scale độc lập | ❌ Cân nhắc Modular Monolith / Microservices | Khi deploy queue và merge conflict trở thành bottleneck đo được, hoặc khi có module có profile tải/công nghệ hoàn toàn khác (ML, realtime, batch nặng). |
| Yêu cầu SLA cách ly lỗi nghiêm ngặt (fintech core, y tế) | ❌ Cân nhắc dịch vụ tách nhỏ | Cần blast radius nhỏ: payment sập không được làm sập tra cứu số dư. |

**Quy tắc thực hành:** đừng chọn microservices để "cho sang". Hãy chọn monolith cho tới khi gặp **một trong ba bức tường thật**: (1) wall of code — build/deploy không theo kịp team, (2) wall of load — các module cần scale hệ số khác nhau, (3) wall of tech — module cần runtime khác.

---

## 🔗 Liên quan

- **1.14 Modular Monolith** — Cải tiến: thêm ranh giới module
- **1.2 Microservices** — Đối lập: tách thành service độc lập
- **1.4 Layered** — Cách tổ chức code bên trong Monolith

**Sơ đồ tiến hóa thường gặp:** Layered Monolith → Modular Monolith (giữ 1 deploy unit, thêm boundary) → tách 1–2 module thành service (khi có wall of load/tech) → Hybrid (phần lớn vẫn là monolith + vài service chuyên biệt). Hầu hết công ty thành công dừng ở **Hybrid**, không đi hết đường tới "all microservices".

---

## 📁 Cấu trúc thư mục ví dụ

```text
1.1-monolithic/
├── README.md           # File này
└── examples/
    └── index.ts        # Mini Shop demo (chạy: npx tsx examples/index.ts)
```

Trong dự án thật, một monolith thường có cấu trúc chia theo layer hoặc theo feature:

```text
my-shop/                          # 1 repo, 1 build
├── src/
│   ├── presentation/             # controllers, DTOs
│   ├── service/                  # business logic
│   │   ├── product/  ├── order/  ├── user/
│   └── repository/               # data access
├── db/                           # 1 schema dùng chung
└── build.gradle / package.json   # 1 build config duy nhất
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.1-monolithic
npx tsx examples/index.ts
```

Hãy để ý output: toàn bộ luồng đặt hàng chạy tuần tự trong **một tiến trình**, không có dấu vết network/serialization nào — đó chính là "mùi" đặc trưng của monolith.

---

## 📚 Tài liệu tham khảo

- 📖 [Monolithic Architecture - microservices.io](https://microservices.io/patterns/monolithic.html)
- 📖 [Monolith First - Martin Fowler](https://martinfowler.com/bliki/MonolithFirst.html)
- 📖 [Monoliths are the future - Simon Brown](https://cnupsolve.sgugtest.co.in/2020/05/29/monoliths-are-the-future/)

---

## ⏭️ Bài tiếp theo

→ [1.2 Microservices](../1.2-microservices/README.md)
