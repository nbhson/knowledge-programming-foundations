# 🧼 1.3 Clean Architecture

> Phân lớp theo **Dependency Rule**: phụ thuộc luôn hướng từ ngoài vào trong. Entities (nghiệp vụ cốt lõi) ở trung tâm, framework/DB/UI ở ngoài cùng. Độc lập công nghệ, dễ test.

---

## 🎯 Kiến trúc này là gì?

Clean Architecture (Robert C. Martin) tổ chức code thành 4 vòng tròn đồng tâm. **Dependency Rule**: source code dependency chỉ hướng vào trong — lớp ngoài phụ thuộc lớp trong, không bao giờ ngược lại.

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
│   │   │   │   ┌─────────────────────────────┐   │   │   │   │
│   │   │   │   │ ④ ENTITIES (trong cùng)     │   │   │   │   │
│   │   │   │   │   Enterprise business rules │   │   │   │   │
│   │   │   │   │   (Order, User, Product)    │   │   │   │   │
│   │   │   │   └─────────────────────────────┘   │   │   │   │
│   │   │   └─────────────────────────────────────┘   │   │   │
│   │   └─────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Dependency: ① → ② → ③ → ④ (chỉ hướng vào trong)          │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Dependency Rule:** Lớp ngoài phụ thuộc lớp trong. Lớp trong **không biết** lớp ngoài tồn tại. Framework/DB/UI có thể thay đổi mà không đụng business logic.

---

## 📐 4 lớp

| Lớp | Trách nhiệm | Ví dụ |
|-----|-------------|-------|
| **① Frameworks & Drivers** | Công nghệ cụ thể: web, DB, queue | React, Express, MongoDB |
| **② Interface Adapters** | Chuyển đổi dữ liệu giữa use case và framework | Controllers, Presenters, Gateways |
| **③ Use Cases** | Business rules của ứng dụng | `CreateOrder`, `ProcessPayment` |
| **④ Entities** | Business rules cốt lõi, độc lập mọi thứ | `Order`, `User`, `Product` |

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

> 💡 Demo đơn giản hóa (entity + use case). Thực tế thêm controllers, presenters, gateways ở lớp ngoài.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔌 **Độc lập framework** | Đổi React→Vue, MongoDB→Postgres không đụng core |
| 🧪 **Dễ test** | Test use case/entity không cần DB/framework |
| 🎯 **Business logic tập trung** | Rule nghiệp vụ rõ ràng, không lẫn công nghệ |
| 🔄 **Dễ thay đổi công nghệ** | Lớp ngoài thay được, core giữ nguyên |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📝 **Nhiều boilerplate** | Nhiều lớp, interface, DTO chuyển đổi |
| 🧠 **Phức tạp** | Học đường cong cao, khó hình dung lúc đầu |
| 🏗️ **Overkill dự án nhỏ** | CRUD đơn giản không cần nhiều lớp |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Ứng dụng doanh nghiệp, vòng đời dài | ✅ Rất phù hợp |
| Nghiệp vụ phức tạp, cần test kỹ | ✅ Phù hợp |
| Có thể đổi framework/DB trong tương lai | ✅ Phù hợp |
| Dự án nhỏ, CRUD đơn giản | ❌ Overkill |

---

## 🔗 Liên quan

- **1.6 Onion** — Ý tưởng tương tự: domain trung tâm, phụ thuộc hướng vào trong
- **1.5 Hexagonal** — Bổ sung: Ports & Adapters cho ranh giới
- **1.7 DDD** — Cung cấp khái niệm Entity, Use Case cho Clean

---

## 📁 Cấu trúc thư mục ví dụ

```
1.3-clean-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Processing demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.3-clean-architecture
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [The Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- 📖 [Clean Architecture - Wikipedia](https://en.wikipedia.org/wiki/Clean_architecture)

---

## ⏭️ Bài tiếp theo

→ [1.4 Layered Architecture](../1.4-layered-architecture/README.md)