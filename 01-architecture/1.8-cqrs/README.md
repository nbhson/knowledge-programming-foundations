# ⚔️ 1.8 CQRS (Command Query Responsibility Segregation)

> Tách **Command** (ghi, thay đổi trạng thái) và **Query** (đọc, không thay đổi) thành 2 mô hình riêng. Cho phép tối ưu schema, scaling độc lập.

---

## 🎯 Kiến trúc này là gì?

CQRS (Greg Young) tách **đọc** và **ghi** thành 2 đường riêng biệt. Thay vì 1 model dùng chung cho cả đọc lẫn ghi, ta có:

- **Command Side:** Xử lý ghi (Create, Update, Delete) — thay đổi trạng thái
- **Query Side:** Xử lý đọc (Get, List) — không thay đổi trạng thái

**Vấn đề gốc của CRUD model chung:** một model duy nhất phải phục vụ cả hai mục đích trái ngược.
- Khi **ghi**, bạn cần model phản ánh **ràng buộc nghiệp vụ** (aggregate, invariant, business rules).
- Khi **đọc**, bạn cần model phản ánh **cái màn hình đang hiển thị** (đã join sẵn 6 bảng, format đẹp, không cần rule).

Ép một model làm cả hai → hoặc query phải chịu schema chuẩn hóa (join 12 bảng, chậm), hoặc write model bị kéo theo field "để hiển thị" (mất trong sáng domain). CQRS nói: **mỗi bên được tối ưu cho mục đích của mình**.

**Hiểu lầm chết người số 1:** "CQRS nghĩa là phải có 2 database". **Sai.** CQRS chỉ yêu cầu **tách model** — có thể chỉ là tách class/service trong cùng 1 schema. Đây gọi là **CQRS cơ bản (single-database)**. Chỉ khi có nhu cầu scale/perf thật sự, hai model mới chạy trên hai DB riêng.

**Hiểu lầm chết người số 2:** "CQRS = Event Sourcing". **Sai.** Đây là hai pattern **độc lập**, hay đi cùng nhau vì_event Sourcing_ cho write side miễn phí cơ chế "phát hành state change" → dễ build read model. Nhưng CQRS hoàn toàn chạy được với update/chết thông thường, và Event Sourcing có thể dùng mà không cần CQRS.

```
                    ┌────────────────────────────────────────────┐
                    │                CLIENT                     │
                    └──────────┬──────────────────┬─────────────┘
                               │                  │
                    Command    │                  │    Query
                    (ghi)      ▼                  ▼      (đọc)
                    ┌──────────────────┐  ┌──────────────────┐
                    │ Command Handler  │  │ Query Handler    │
                    │ (Write Model)    │  │ (Read Model)     │
                    └────────┬─────────┘  └────────┬─────────┘
                             │                     │
                             ▼                     ▼
                    ┌──────────────────┐  ┌──────────────────┐
                    │   WRITE DB      │  │   READ DB        │
                    │  (normalized)   │  │ (denormalized/   │
                    │                 │  │  cache)          │
                    └──────────────────┘  └──────────────────┘
                             │                     ▲
                             └───── sync ──────────┘
                            (event / CDC / job)
```

> 📌 **Khác biệt chính:** Query KHÔNG được phép thay đổi trạng thái. Command KHÔNG trả dữ liệu đọc phức tạp.

**Bốn mức độ CQRS (từ nhẹ tới nặng)** — chọn đúng mức, đừng nhảy lên mức 4:

| Mức | Mô tả | Khi nào dùng |
|-----|-------|--------------|
| **1. Tách method** | `getOrder()` vs `updateOrder()` trong cùng service, cùng DB | Mặc định cho mọi codebase. Gần như miễn phí, nên luôn làm. |
| **2. Tách handler/class** | `GetOrderQueryHandler` vs `UpdateOrderCommandHandler`, chung 1 schema | Khi nghiệp vụ bắt đầu có rule, muốn rõ trách nhiệm. |
| **3. Tách model** | Write model = domain object; Read model = DTO/projection riêng | Khi query phức tạp (report, dashboard), không muốn ép domain mang field hiển thị. |
| **4. Tách DB + async sync** | Hai DB riêng, projection cập nhật qua event/CDC | Khi có **evidence** tải đọc/ghi lệch nhau lớn, hoặc cần scaling độc lập. Đây mới là CQRS "đúng nghĩa" mà mọi người nghĩ tới. |

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả | Giải thích sâu |
|----------|-------|----------------|
| **Tách model** | Write model (domain) khác Read model (projection) | Write model **không có method đọc**. Read model **không có rule**. Nếu `Product` (write) có `getDiscountedPrice()` và `ProductReadModel` cũng có → rule đã duplicate → sẽ lệch. Chỉ một bên là nguồn sự thật cho rule. |
| **Tách DB (tùy chọn)** | Có thể dùng 2 DB riêng hoặc 1 DB 2 schema | Chọn DB khác nhau cho từng bên là **quyền lợi** của CQRS: write → Postgres (transaction, constraint); read → Elasticsearch (fulltext, aggregation) hoặc Redis (đọc nhanh). Không phải nghĩa vụ. |
| **Đồng bộ** | Event, CDC (Change Data Capture), hoặc job | Ba cách propagate write → read: **(a) domain events** — command handler publish event, projector cập nhật read model; **(b) CDC/Debezium** — đọc binlog DB, không cần sửa app; **(c) batch job** — đơn giản nhưng trễ. Ở mức 1–3 (single DB), "đồng bộ" là **không có gì cả** — transaction commit xong là đọc được. |
| **Command trả kết quả tối thiểu** | Chỉ trả id/status, không trả dữ liệu phức tạp | `CreateProduct` trả `{ productId, status }`. Client muốn thông tin chi tiết → gọi **Query**. Quy tắc này giữ cho write side không bị kéo vào nhu cầu hiển thị, đồng thời tránh ambiguity "command có trả dữ liệu hay side effect?" |
| **Idempotency ở command side** | (Đặc điểm bắt buộc khi async) | `UpdatePrice` nhận retry 2 lần không được cộng giá 2 lần. Cần `commandId`/version check. Bỏ qua đặc điểm này là nguồn bug phổ biến nhất khi dùng CQRS async. |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Product Catalog**:

```
┌─────────────────────────────────────────────────────────────┐
│  COMMAND SIDE                    QUERY SIDE                 │
│  ┌──────────────────────┐        ┌──────────────────────┐   │
│  │ ProductCommandHandler│        │ ProductQueryHandler  │   │
│  │ CreateProduct        │        │ GetProduct           │   │
│  │ UpdatePrice          │        │ ListProducts         │   │
│  └──────────┬───────────┘        └──────────┬───────────┘   │
│             │                              │               │
│             ▼                              ▼               │
│  ┌──────────────────────┐        ┌──────────────────────┐   │
│  │ InMemoryEventStore   │        │ ProductReadModel     │   │
│  │ (write events)       │        │ (denormalized)       │   │
│  └──────────────────────┘        └──────────────────────┘   └
└─────────────────────────────────────────────────────────────┘
```

- **Command Side:** `ProductCommandHandler` (CreateProduct, UpdatePrice)
- **Query Side:** `ProductQueryHandler` (GetProduct, ListProducts)
- **Event Store:** `InMemoryEventStore`
- **Read Model:** `ProductReadModel` (denormalized — dữ liệu sẵn sàng hiển thị)

> 💡 Read model có thể chứa dữ liệu dư thừa (denormalized) để query nhanh, không cần join.

**Ví dụ về sự khác biệt giữa hai model — cùng một product:**

```ts
// WRITE model (domain) — tối ưu cho rule, chuẩn hóa
class Product {
  constructor(private id: ProductId, private price: Money, private stockPolicy: StockPolicy) {}
  changePrice(newPrice: Money) {
    if (newPrice.amount < 0) throw new InvalidPriceError();   // invariant ở đây
    this.events.push(new ProductPriceChanged(this.id, newPrice));
  }
}

// READ model (projection) — tối ưu cho màn hình, dư thừa, không rule
type ProductListItem = {
  id: string; name: string; priceLabel: string;    // "₫199.000" đã format
  categoryName: string;                             // denormalized từ bảng categories
  inStock: boolean;                                 // tính sẵn từ stock_events
  imageUrl: string;                                 // đã ký URL CDN
};
```

Điểm mấu chốt: `ProductListItem` **không có method** nào ngoài cấu trúc dữ liệu; `Product` **không có** `categoryName` (không phải dữ liệu của nó). Mỗi model chỉ lo việc của mình.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| ⚡ **Tối ưu riêng cho đọc/ghi** | Read model denormalized → query nhanh; Write model đúng domain | API đọc không cần 8 JOIN; write không bị field "để hiển thị" làm bẩn. Mỗi schema được thiết kế cho **hình dạng truy vấn thật**. |
| 📈 **Scale độc lập** | Scale read replicas riêng, write riêng | Trang chủ 10.000 req/s, admin chỉ ghi 10 req/s → 20 replica read + 2 write node. Trong single model chung, bạn buộc scale theo phía cao hơn → tốn 10x. |
| 🧩 **Model phù hợp từng bên** | Write dùng domain model, Read dùng projection | Có thể **tổng hợp dữ liệu từ nhiều service** vào một read model (dashboard xem order + user + payment) mà write side không cần biết. |
| 🔒 **Bảo mật tốt hơn** | Query side không lộ command logic | Read API chỉ expose field đã chọn để hiển thị; không "accidentally leak" internal pricing columns. Thêm nữa: read side **vật lý không thể** mutation → giảm blast radius khi bị tấn công. |
| 👥 **Tách được team & công nghệ** | (Ưu điểm thường bỏ sót) | Người làm write (cần hiểu domain sâu) khác người làm read (cần tối ưu query). Có thể chọn tech khác nhau cho hai đường. |
| 🧪 **Giảm tranh chấp lock** | (Ưu điểm hiệu năng) | Đọc không đụng bảng write → không lock contention giữa report chạy 20s và đơn hàng đang tạo. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🔀 **Đồng bộ phức tạp** | Read/Write lệch nhau (eventual consistency) | Người dùng tạo đơn xong refresh → **đơn chưa hiện**! Xử lý thật: (a) **read-your-own-writes** bằng cách route request đọc về write store cho cùng session, hoặc (b) UI optimistic + "đang xử lý". *Giảm thiểu:* ở mức 1–3 (single DB), không có vấn đề này — đừng tự tạo ra nó. |
| 📦 **Nhiều code hơn** | 2 model, 2 handler, sync logic | Gấp đôi handler + projector + event + sync infrastructure + cơ chế rebuild read model. Ước tính: **1.5–2.5×** effort so với CRUD thường cho cùng tính năng. |
| 🧠 **Khó hiểu lúc đầu** | Dev quen CRUD đơn giản sẽ bối rối | "Tại sao không đọc lại từ cái mình vừa ghi?" — câu hỏi lặp lại mãi trong team mới dùng CQRS. |
| 🏗️ **Overkill CRUD đơn giản** | Đọc/ghi đơn giản không cần tách | Với app ít đọc hơn ghi, hoặc query không phức tạp, CQRS thêm chi phí **không đổi lấy gì**. |
| 🛠️ **Rebuild read model** | (Vấn đề vận hành ít được nhắc) | Thêm cột mới vào `ProductReadModel` → phải rebuild **toàn bộ** từ đầu. Cần chiến lược replay/blue-green projection, có khi downtime đọc. |
| 🧵 **Debug 2 nguồn sự thật** | Dữ liệu lệch nhau giữa write & read | Khi user khiếu nại "giá sai", phải xác định: data gốc sai hay projector bỏ sót event nào? Cần **projection lag metric** + reconcile job. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Tỷ lệ đọc:ghi lệch nhau rất lớn (100:1, 1000:1) | ✅ Phù hợp | Đây là **dấu hiệu số 1** để cân nhắc CQRS. Đọc nhiều → cần read model + cache + replica chuyên dụng. |
| Write model phức tạp, read model đơn giản (hoặc ngược lại) | ✅ Phù hợp | Hai nhu cầu khác hẳn nhau → ép chung một model sẽ luôn tệ cho một phía. |
| Cần scale đọc/ghi độc lập (chi phí hạ tầng) | ✅ Phù hợp | Read scale ngang với stateless cache/replica, write giữ nhỏ → tiết kiệm rõ. |
| Kết hợp Event Sourcing | ✅ Rất phù hợp | ES cung cấp event stream miễn phí → projector xây read model từ stream, có thể **nhiều** read model từ cùng nguồn. |
| Cần nhiều "góc nhìn" khác nhau trên cùng dữ liệu (search, analytics, dashboard) | ✅ Phù hợp | Từ một write model → nhiều projection cho từng use case đọc. |
| CRUD đơn giản, ít chênh lệch đọc/ghi | ❌ Overkill | Tách mức 1 (method) thôi, đừng tách DB. |
| Yêu cầu consistency ngay tức thì (core banking, inventory chặt) | ❌ Cân nhắc | Phải xử lý eventual consistency ở cả UI → chi phí thiết kế UX lớn. |
| Team nhỏ, chưa quen async/event | ⚠️ Bắt đầu mức 1–2 | Chỉ tách handler/class, chung 1 DB → hưởng 60% lợi ích, gần 0 chi phí. |

---

## 🔗 Liên quan

- **1.9 Event Sourcing** — Cặp bài trùng: CQRS + Event Sourcing rất phổ biến
- **1.2 Microservices** — Mỗi service có thể dùng CQRS riêng
- **1.7 DDD** — Command side thường dùng domain model DDD

| | CQRS | Event Sourcing |
|---|---|---|
| Trả lời câu hỏi | **Tách** model đọc và ghi | **Lưu trữ** state bằng cách nào |
| Bắt buộc nhau? | Không | Không |
| Kết hợp | Write side = ES, Read side = projections → cặp phổ biến nhất |

---

## 📁 Cấu trúc thư mục ví dụ

```
1.8-cqrs/
├── README.md           # File này
└── examples/
    └── index.ts        # Product Catalog demo (chạy: npx tsx examples/index.ts)
```

Layout theo mức 3:

```text
src/products/
├── commands/        # CreateProductCommand, UpdatePriceCommand, handler
├── queries/         # GetProductQuery, ListProductsQuery, handler (read model)
├── domain/          # Product aggregate (write model)
├── projections/     # ProductReadModel projector (build from events)
└── infrastructure/  # write-repo (pg), read-repo (es/redis)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.8-cqrs
npx tsx examples/index.ts
```

Hãy để ý: sau khi chạy `CreateProduct`, demo gọi `ListProducts` → output đến từ **read model khác** (denormalized), không phải từ entity vừa tạo. Đó chính là "segregation" đang hoạt động.

---

## 📚 Tài liệu tham khảo

- 📖 [CQRS - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- 📖 [CQRS - Greg Young](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf)
- 📖 [CQRS Journey - Microsoft](https://learn.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10))

---

## ⏭️ Bài tiếp theo

→ [1.9 Event Sourcing](../1.9-event-sourcing/README.md)
