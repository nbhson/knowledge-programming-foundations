# ⚔️ 1.8 CQRS (Command Query Responsibility Segregation)

> Tách **Command** (ghi, thay đổi trạng thái) và **Query** (đọc, không thay đổi) thành 2 mô hình riêng. Cho phép tối ưu schema, scaling độc lập.

---

## 🎯 Kiến trúc này là gì?

CQRS (Greg Young) tách **đọc** và **ghi** thành 2 đường riêng biệt. Thay vì 1 model dùng chung cho cả đọc lẫn ghi, ta có:

- **Command Side:** Xử lý ghi (Create, Update, Delete) — thay đổi trạng thái
- **Query Side:** Xử lý đọc (Get, List) — không thay đổi trạng thái

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

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Tách model** | Write model (domain) khác Read model (projection) |
| **Tách DB (tùy chọn)** | Có thể dùng 2 DB riêng hoặc 1 DB 2 schema |
| **Đồng bộ** | Event, CDC (Change Data Capture), hoặc job |
| **Command trả kết quả tối thiểu** | Chỉ trả id/status, không trả dữ liệu phức tạp |

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
│  └──────────────────────┘        └──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Command Side:** `ProductCommandHandler` (CreateProduct, UpdatePrice)
- **Query Side:** `ProductQueryHandler` (GetProduct, ListProducts)
- **Event Store:** `InMemoryEventStore`
- **Read Model:** `ProductReadModel` (denormalized — dữ liệu sẵn sàng hiển thị)

> 💡 Read model có thể chứa dữ liệu dư thừa (denormalized) để query nhanh, không cần join.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| ⚡ **Tối ưu riêng cho đọc/ghi** | Read model denormalized → query nhanh; Write model đúng domain |
| 📈 **Scale độc lập** | Scale read replicas riêng, write riêng |
| 🧩 **Model phù hợp từng bên** | Write dùng domain model, Read dùng projection |
| 🔒 **Bảo mật tốt hơn** | Query side không lộ command logic |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🔀 **Đồng bộ phức tạp** | Read/Write lệch nhau (eventual consistency) |
| 📦 **Nhiều code hơn** | 2 model, 2 handler, sync logic |
| 🧠 **Khó hiểu lúc đầu** | Dev quen CRUD đơn giản sẽ bối rối |
| 🏗️ **Overkill CRUD đơn giản** | Đọc/ghi đơn giản không cần tách |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Đọc nhiều hơn ghi, cần tối ưu query | ✅ Phù hợp |
| Write model phức tạp, read model đơn giản | ✅ Phù hợp |
| Cần scale đọc/ghi độc lập | ✅ Phù hợp |
| Kết hợp Event Sourcing | ✅ Rất phù hợp |
| CRUD đơn giản, ít chênh lệch đọc/ghi | ❌ Overkill |

---

## 🔗 Liên quan

- **1.9 Event Sourcing** — Cặp bài trùng: CQRS + Event Sourcing rất phổ biến
- **1.2 Microservices** — Mỗi service có thể dùng CQRS riêng
- **1.7 DDD** — Command side thường dùng domain model DDD

---

## 📁 Cấu trúc thư mục ví dụ

```
1.8-cqrs/
├── README.md           # File này
└── examples/
    └── index.ts        # Product Catalog demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.8-cqrs
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [CQRS - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- 📖 [CQRS - Greg Young](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf)
- 📖 [CQRS Journey - Microsoft](https://learn.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10))

---

## ⏭️ Bài tiếp theo

→ [1.9 Event Sourcing](../1.9-event-sourcing/README.md)