# 🍰 1.4 Layered Architecture

> Phân lớp theo chiều dọc: **Presentation → Business → Persistence → Database**. Mỗi lớp chỉ gọi lớp dưới. Kiến trúc phổ biến nhất, dễ hiểu, nền tảng của hầu hết ứng dụng doanh nghiệp.

---

## 🎯 Kiến trúc này là gì?

Layered Architecture (N-tier) chia ứng dụng thành các lớp xếp chồng. **Quy tắc:** lớp trên chỉ gọi lớp dưới, không gọi ngang, không nhảy tầng.

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

> 📌 **Quy tắc (nghiêm ngặt):** Lớp trên gọi lớp dưới. Lớp dưới **không biết** lớp trên. Không nhảy tầng (Presentation không gọi thẳng Persistence). Thực tế có biến thể **relaxed/open layering** cho phép bỏ qua tầng trung gian khi cần tối ưu.

---

## 📐 4 lớp

| Lớp | Trách nhiệm | Ví dụ |
|-----|-------------|-------|
| **① Presentation** | Nhận input, hiển thị output | Controllers, Views, API routes |
| **② Business Logic** | Xử lý nghiệp vụ, validation | `OrderService`, `PaymentService` |
| **③ Persistence** | Truy cập dữ liệu | `OrderRepository`, DAOs |
| **④ Database** | Lưu trữ vật lý | PostgreSQL, Redis, S3 |

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

> 💡 Demo bỏ Presentation/DB layer cho gọn. Thực tế: Controller (Presentation) gọi Service, Repository gọi DB.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🚀 **Đơn giản, dễ hiểu** | Cấu trúc quen thuộc, dễ onboarding |
| 🧩 **Tách trách nhiệm** | Mỗi lớp 1 việc rõ ràng |
| 🔄 **Dễ thay đổi lớp** | Đổi DB không đụng Presentation |
| 📚 **Phổ biến** | Nhiều framework hỗ trợ sẵn |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🔗 **Phụ thuộc chiều dọc** | Lớp trên phụ thuộc lớp dưới, khó test độc lập |
| 🐌 **Performance overhead** | Dữ liệu đi qua nhiều lớp trung gian, tăng latency |
| 🌀 **Anemic model** | Business logic dồn Service, Model chỉ là data |
| 🚫 **Khó nhảy tầng** | Đôi khi cần truy cập thẳng, bị chặn bởi quy tắc nghiêm ngặt (strict layering) |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Ứng dụng doanh nghiệp tiêu chuẩn | ✅ Rất phù hợp |
| CRUD, quản lý dữ liệu | ✅ Phù hợp |
| Team nhiều dev, cần cấu trúc dễ hiểu | ✅ Phù hợp |
| Nghiệp vụ phức tạp, cần domain model mạnh | ⚠️ Cân nhắc Clean/DDD |

---

## 🔗 Liên quan

- **1.3 Clean** — Cải tiến: đảo dependency hướng vào trong
- **1.5 Hexagonal** — Cải tiến: cô lập core khỏi infrastructure
- **1.11 MVC** — Presentation layer thường dùng MVC

---

## 📁 Cấu trúc thư mục ví dụ

```
1.4-layered-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Processing demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.4-layered-architecture
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Layered Architecture - Software Architecture Patterns](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch01.html)
- 📖 [Layered Architecture - Wikipedia](https://en.wikipedia.org/wiki/Multitier_architecture)

---

## ⏭️ Bài tiếp theo

→ [1.5 Hexagonal Architecture](../1.5-hexagonal-architecture/README.md)