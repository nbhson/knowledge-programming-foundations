# ⬡ 1.5 Hexagonal Architecture (Ports & Adapters)

> **Domain** ở trung tâm, giao tiếp với thế giới bên ngoài qua **Ports** (interface) và **Adapters** (implement). Domain độc lập hoàn toàn với công nghệ — đổi DB, đổi framework không đụng core.

---

## 🎯 Kiến trúc này là gì?

Hexagonal Architecture (Alistair Cockburn) cô lập **domain core** khỏi mọi thứ bên ngoài. Bên ngoài gọi vào qua **driving adapters** (HTTP, CLI). Core gọi ra qua **driven ports** (interface) được implement bởi **driven adapters** (DB, external API).

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

> 📌 **Port = interface** (hợp đồng). **Adapter = implement** (công nghệ cụ thể). Core gọi Port, không biết Adapter nào đang chạy.

---

## 📐 Thành phần chính

| Thành phần | Trách nhiệm | Ví dụ |
|------------|-------------|-------|
| **Domain Core** | Business logic, không biết công nghệ | `OrderService`, `Order` |
| **Port (driving)** | Interface cho bên ngoài gọi vào | `OrderUseCase` |
| **Adapter (driving)** | Nhận input từ bên ngoài, gọi Port | `OrderController` (HTTP) |
| **Port (driven)** | Interface core gọi ra | `OrderRepository`, `PaymentGateway` |
| **Adapter (driven)** | Implement Port, giao tiếp công nghệ | `PostgresOrderRepository`, `StripePaymentGateway` |

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

> 💡 Muốn đổi DB? Viết `PostgresOrderRepository` implement cùng interface — core không đổi dòng nào.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **Domain độc lập** | Core không biết DB/framework/UI |
| 🔄 **Dễ swap adapter** | Đổi DB, đổi HTTP→gRPC không đụng core |
| 🧪 **Test dễ** | Test core bằng mock adapter |
| 🧩 **Tách rõ ranh giới** | Port/Adapter phân định rõ trách nhiệm |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📝 **Nhiều interface** | Mỗi port 1 interface, boilerplate |
| 🧠 **Khó hình dung** | Khái niệm port/adapter trừu tượng lúc đầu |
| 🏗️ **Overkill dự án nhỏ** | CRUD đơn giản không cần nhiều lớp gián tiếp |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Có thể đổi DB/framework trong tương lai | ✅ Rất phù hợp |
| Nghiệp vụ phức tạp, cần cô lập core | ✅ Phù hợp |
| Nhiều adapter cho cùng 1 port (nhiều DB, nhiều gateway) | ✅ Phù hợp |
| Dự án nhỏ, công nghệ cố định | ❌ Overkill |

---

## 🔗 Liên quan

- **1.3 Clean** — Cùng ý tưởng: core độc lập, dependency hướng vào trong
- **1.6 Onion** — Tương tự: domain trung tâm, phân lớp hình tròn
- **1.7 DDD** — Core thường chứa domain model của DDD

---

## 📁 Cấu trúc thư mục ví dụ

```
1.5-hexagonal-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Processing demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.5-hexagonal-architecture
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- 📖 [Ports & Adapters - Wikipedia](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))

---

## ⏭️ Bài tiếp theo

→ [1.6 Onion Architecture](../1.6-onion-architecture/README.md)