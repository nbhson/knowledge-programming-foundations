# 🏗️ 01 - Architecture

> Tổng quan về các kiến trúc phần mềm phổ biến, cách chúng giải quyết vấn đề về tổ chức code, phân tách trách nhiệm (Separation of Concerns) và khả năng mở rộng (Scalability).

---

## 📚 Mục lục

| # | Chủ đề | Mô tả ngắn |
|---|--------|------------|
| 1.1 | [Monolithic](#11-monolithic) | Toàn bộ ứng dụng trong 1 codebase - deployment unit |
| 1.2 | [Microservices](#12-microservices) | Tách nhỏ thành nhiều service độc lập |
| 1.3 | [Clean Architecture](#13-clean-architecture) | Phân lớp theo hướng Dependency Rule |
| 1.4 | [Layered Architecture](#14-layered-architecture) | Phân lớp theo chiều dọc (UI → DB) |
| 1.5 | [Hexagonal Architecture](#15-hexagonal-architecture) | Cô lập domain khỏi infrastructure qua Ports & Adapters |
| 1.6 | [Onion Architecture](#16-onion-architecture) | Domain ở trung tâm, phụ thuộc hướng vào trong |
| 1.7 | [Domain-Driven Design](#17-domain-driven-design) | Thiết kế dựa trên nghiệp vụ domain |
| 1.8 | [CQRS](#18-cqrs) | Tách Command (ghi) và Query (đọc) |
| 1.9 | [Event Sourcing](#19-event-sourcing) | Lưu trạng thái bằng chuỗi sự kiện |
| 1.10 | [Event-Driven Architecture](#110-event-driven-architecture) | Giao tiếp qua sự kiện bất đồng bộ |
| 1.11 | [MVC](#111-mvc) | Model - View - Controller |
| 1.12 | [MVP](#112-mvp) | Model - View - Presenter |
| 1.13 | [MVVM](#113-mvvm) | Model - View - ViewModel |
| 1.14 | [Modular Monolith](#114-modular-monolith) | Kết hợp ưu điểm Monolith & Microservices |

---

## 🌍 Kiến trúc là gì?

**Kiến trúc phần mềm (Software Architecture)** là cách ta **tổ chức các thành phần** của hệ thống và **quy định cách chúng tương tác** với nhau. Nó bao gồm:

- **Cấu trúc (Structure):** Các thành phần/module/class được sắp xếp thế nào.
- **Hành vi (Behavior):** Các thành phần phối hợp với nhau ra sao.
- **Ràng buộc (Constraints):** Quy tắc mà toàn hệ thống phải tuân theo.

### Tại sao kiến trúc quan trọng?

```
┌────────────────────────────────────────────────────────────────┐
│                    KHÔNG CÓ KIẾN TRÚC                          │
│  Mọi thứ đan xen → Sửa 1 chỗ → Vỡ nhiều chỗ                     │
│  Big Ball of Mud 🐌                                              │
├────────────────────────────────────────────────────────────────┤
│                    CÓ KIẾN TRÚC                                │
│  Thay đổi cục bộ → Ít rủi ro → Dễ test → Dễ mở rộng 🚀         │
└────────────────────────────────────────────────────────────────┘
```

### Các yếu tố kiến trúc tốt

| Yếu tố | Ý nghĩa |
|--------|---------|
| 🧩 **Modularity** | Code chia thành module độc lập, dễ hiểu, dễ thay thế |
| 🔗 **Loosely Coupled** | Các module ít phụ thuộc lẫn nhau |
| 🎯 **High Cohesion** | Các phần trong module có cùng mục đích |
| 🔄 **Testability** | Dễ viết test nhờ dependency injection |
| 📈 **Scalability** | Dễ mở rộng khi tải tăng |
| 🛡️ **Security** | Phân tách vùng tin cậy, kiểm soát truy cập |

---

## 🧭 Bản đồ lựa chọn kiến trúc

```
BẮT ĐẦU: Dự án của bạn như thế nào?
│
├─ Quy mô nhỏ, team nhỏ, muốn đơn giản?
│   └─→ 1.1 Monolithic hoặc 1.14 Modular Monolith
│
├─ Ứng dụng doanh nghiệp phức tạp, nghiệp vụ nhiều?
│   ├─ Vòng đời dài, cần bảo trì: → 1.3 Clean / 1.6 Onion
│   ├─ Tập trung nghiệp vụ, nói chuyện với domain expert: → 1.7 DDD
│   └─ Cần tách infra (DB, queue...): → 1.5 Hexagonal
│
├─ Hệ thống lớn, team nhiều, cần scale độc lập?
│   └─→ 1.2 Microservices (nhưng thận trọng!)
│
├─ Cần UI tương tác nhiều, desktop/mobile?
│   ├─ Web truyền thống: → 1.11 MVC
│   ├─ Cần testable, tách logic khỏi View: → 1.12 MVP / 1.13 MVVM
│   └─ Reactive UI (SwiftUI, Compose, WPF...): → 1.13 MVVM
│
├─ Cần đồng bộ giữa nhiều service, xử lý sự kiện?
│   └─→ 1.10 Event-Driven / 1.9 Event Sourcing
│
└─ Đọc nhiều hơn ghi, cần tối ưu riêng cho đọc/ghi?
    └─→ 1.8 CQRS
```

---

## 🔗 Mối quan hệ giữa các kiến trúc

```
┌─────────────────────────────────────────────────────────────────────┐
│                     KHÔNG PHẢI CÁI NÀY HAY HƠN CÁI KIA                │
│         Mỗi kiến trúc giải quyết 1 nhóm vấn đề khác nhau             │
│                                                                     │
│   Monolithic ──mở rộng──→ Modular Monolith ──tách nhỏ──→ Microservices│
│        │                        │                         │          │
│        │                        │                    Event-Driven      │
│        │                        │                    CQRS             │
│        ▼                        ▼                         │          │
│   Về tổ chức code bên trong:                        Event Sourcing      │
│   Layered / Clean / Hexagonal / Onion / DDD                        │
│        │                                                           │
│        ▼                                                           │
│   Về giao diện người dùng:  MVC / MVP / MVVM                       │
└─────────────────────────────────────────────────────────────────────┘
```

> 💡 **Lưu ý:** Các kiến trúc này **không loại trừ nhau**. Ví dụ: bạn có thể dùng **Clean Architecture + CQRS + Event Sourcing** trong cùng một **Microservice**, hoặc dùng **MVVM** cho UI của một hệ thống **Layered Architecture**.

---

## 📖 Chi tiết từng mục

### 1.1 Monolithic

Một codebase, một deployment unit, chạy toàn bộ tính năng.

```
┌─────────────────────────────────────────┐
│             MONOLITH APP                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │  UI     │ │ Business│ │  Data   │    │
│  │ Handlers│ │  Logic  │ │  Access │    │
│  └─────────┘ └─────────┘ └─────────┘    │
│  ┌─────────────────────────────────┐    │
│  │          DATABASE              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- ✅ **Ưu:** Đơn giản, dễ deploy, dễ debug, chi phí thấp
- ❌ **Nhược:** Khó scale từng phần, code lớn khó bảo trì, phụ thuộc công nghệ

📂 → [Chi tiết: 1.1-monolithic](1.1-monolithic/README.md)

---

### 1.2 Microservices

Tách ứng dụng thành nhiều service nhỏ, độc lập, giao tiếp qua network.

```
Client → [API Gateway] → Service A ──→ DB A
                        → Service B ──→ DB B
                        → Service C ──→ DB C
```

- ✅ **Ưu:** Scale độc lập, team độc lập, công nghệ đa dạng, cô lập lỗi
- ❌ **Nhược:** Phức tạp (network, distributed transaction), khó debug, chi phí vận hành cao

📂 → [Chi tiết: 1.2-microservices](1.2-microservices/README.md)

---

### 1.3 Clean Architecture

Phân lớp theo **Dependency Rule** - phụ thuộc luôn hướng từ ngoài vào trong.

```
        ┌──────────────────────────┐
        │      Frameworks &        │  ← Ngoài cùng
        │     Drivers (React,      │
        │    Express, Mongo...)     │
        └────────────┬─────────────┘
        ┌────────────▼─────────────┐
        │ Interface Adapters       │  ← Controllers, Presenters, Gateways
        └────────────┬─────────────┘
        ┌────────────▼─────────────┐
        │ Use Cases                │  ← Application business rules
        └────────────┬─────────────┘
        ┌────────────▼─────────────┐
        │ Entities                 │  ← Enterprise business rules (trong cùng)
        └──────────────────────────┘
```

- ✅ **Ưu:** Độc lập framework, dễ test, dễ thay đổi công nghệ
- ❌ **Nhược:** Nhiều lớp boilerplate, phức tạp với dự án nhỏ

📂 → [Chi tiết: 1.3-clean-architecture](1.3-clean-architecture/README.md)

---

### 1.4 Layered Architecture

Phân lớp theo chiều dọc: Presentation → Business → Persistence → Database.

```
┌──────────────────────────────┐
│        Presentation          │  ← UI, Controllers
├──────────────────────────────┤
│        Business Logic        │  ← Services, Rules
├──────────────────────────────┤
│        Persistence           │  ← Repositories, DAOs
├──────────────────────────────┤
│         Database             │  ← DB, Cache
└──────────────────────────────┘
```

- ✅ **Ưu:** Đơn giản, dễ hiểu, phổ biến nhất
- ❌ **Nhược:** Phụ thuộc chiều dọc, khó test layer trên nếu layer dưới chưa xong

📂 → [Chi tiết: 1.4-layered-architecture](1.4-layered-architecture/README.md)

---

### 1.5 Hexagonal Architecture (Ports & Adapters)

Domain ở trung tâm, giao tiếp với thế giới bên ngoài qua **Ports** (interface) và **Adapters** (implement).

```
        ┌──────────┐
        │  Driver  │          ┌──────────────┐
        │ Adapters │◄────────►│              │◄────────►┐
        │(HTTP, CLI│          │   DOMAIN     │          │ Driven
        │  Queue)  │  Ports   │   (Core)     │  Ports   │ Adapters
        └──────────┘          │              │          │ (DB, External
                              └──────────────┘          │  API, SMTP)
                                                       └──────────┘
```

- ✅ **Ưu:** Domain độc lập hoàn toàn với công nghệ, dễ swap adapter
- ❌ **Nhược:** Nhiều interface, boilerplate, khó hình dung lúc đầu

📂 → [Chi tiết: 1.5-hexagonal-architecture](1.5-hexagonal-architecture/README.md)

---

### 1.6 Onion Architecture

Giống Hexagonal nhưng nhấn mạnh phân lớp hình tròn, phụ thuộc hướng vào trong.

```
                ┌─────────────────────────────┐
                │   Infrastructure / UI        │  ← Ngoài cùng
                │   ┌───────────────────────┐  │
                │   │  Application Services │  │
                │   │  ┌─────────────────┐  │  │
                │   │  │  Domain Model   │  │  │  ← Trung tâm
                │   │  │ (Entities, VOs) │  │  │
                │   │  └─────────────────┘  │  │
                │   └───────────────────────┘  │
                └─────────────────────────────┘
```

- ✅ **Ưu:** Domain cô lập, dễ test, dễ mở rộng
- ❌ **Nhược:** Nhiều tầng gián tiếp, học đường cong dốc

📂 → [Chi tiết: 1.6-onion-architecture](1.6-onion-architecture/README.md)

---

### 1.7 Domain-Driven Design (DDD)

Thiết kế dựa trên **nghiệp vụ (domain)** - ngôn ngữ chung (Ubiquitous Language), Bounded Context, Entities, Value Objects, Aggregates, Repositories.

```
┌───────────────────────────────────────────────┐
│            Bounded Context: Orders            │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐   │
│  │  Order   │  │  Item    │  │ Repository │   │
│  │ (Entity) │  │ (ValueObj)│  │  Interface │   │
│  └──────────┘  └──────────┘  └────────────┘   │
│  ┌───────────────────────────────────────┐     │
│  │  Domain Service / Domain Events       │     │
│  └───────────────────────────────────────┘     │
└───────────────────────────────────────────────┘
```

- ✅ **Ưu:** Phản ánh đúng nghiệp vụ, dễ trao đổi với domain expert, mô hình ổn định
- ❌ **Nhược:** Cần domain expert, phức tạp, overkill cho dự án CRUD đơn giản

📂 → [Chi tiết: 1.7-domain-driven-design](1.7-domain-driven-design/README.md)

---

### 1.8 CQRS (Command Query Responsibility Segregation)

Tách **Command** (thay đổi trạng thái) và **Query** (đọc dữ liệu) thành 2 đường riêng, có thể dùng 2 model/db khác nhau.

```
Client ──Command──→ Command Handler ──→ Write DB
   │                    ↑
   └───────Query──────→ Query Handler ──→ Read DB (có thể là cache/denormalized)
```

- ✅ **Ưu:** Tối ưu riêng cho đọc/ghi, scale độc lập, model phù hợp từng bên
- ❌ **Nhược:** Phức tạp, cần đồng bộ dữ liệu, overkill cho CRUD đơn giản

📂 → [Chi tiết: 1.8-cqrs](1.8-cqrs/README.md)

---

### 1.9 Event Sourcing

Không lưu trạng thái hiện tại mà lưu **chuỗi sự kiện** (event log). Trạng thái hiện tại = replay toàn bộ sự kiện.

```
Events: [Created] → [ItemAdded] → [Shipped] → [Delivered]
                  │ replay    │           │
                  ▼           ▼           ▼
    State v1 = f(events)  State v2   State v3
```

- ✅ **Ưu:** Audit trail đầy đủ, có thể tái dựng trạng thái bất kỳ lúc nào, temporal query
- ❌ **Nhược:** Event schema khó thay đổi, learning curve cao, snapshot cần thiết khi event nhiều

📂 → [Chi tiết: 1.9-event-sourcing](1.9-event-sourcing/README.md)

---

### 1.10 Event-Driven Architecture

Các thành phần giao tiếp qua **sự kiện** bất đồng bộ, không gọi trực tiếp lẫn nhau.

```
Producer ──publish──→ Event Bus (Kafka, RabbitMQ...) ──subscribe──→ Consumer A
                                                              └──→ Consumer B
```

- ✅ **Ưu:** Loose coupling, scale độc lập, xử lý bất đồng bộ tốt
- ❌ **Nhược:** Khó debug, eventual consistency, khó đảm bảo ordering

📂 → [Chi tiết: 1.10-event-driven-architecture](1.10-event-driven-architecture/README.md)

---

### 1.11 MVC (Model-View-Controller)

Tách UI thành 3 thành phần: **Model** (dữ liệu), **View** (hiển thị), **Controller** (xử lý input, điều phối).

```
User Input → Controller → cập nhật Model → View render
                ↑                              │
                └─────────── đọc ──────────────┘
```

- ✅ **Ưu:** Phổ biến, dễ hiểu, tách rõ trách nhiệm
- ❌ **Nhược:** Controller dễ phình to (fat controller), View phụ thuộc Model

📂 → [Chi tiết: 1.11-mvc](1.11-mvc/README.md)

---

### 1.12 MVP (Model-View-Presenter)

**View** thụ động, **Presenter** điều phối toàn bộ: nhận input từ View, xử lý, cập nhật View.

```
View (thụ động) ←── Presenter ──→ Model
       │  user event                │
       └──────────►─────────────────┘
```

- ✅ **Ưu:** View dễ test (mock), tách UI logic triệt để, phù hợp desktop/mobile
- ❌ **Nhược:** Presenter phình to, view dài dòng nếu giao diện phức tạp

📂 → [Chi tiết: 1.12-mvp](1.12-mvp/README.md)

---

### 1.13 MVVM (Model-View-ViewModel)

**ViewModel** phơi bày state/data binding, **View** tự động cập nhật khi ViewModel thay đổi (2-way binding).

```
View ←── data binding ──→ ViewModel ──→ Model
   │  user event (command)    │
   └─────────────────────────►┘
```

- ✅ **Ưu:** Tách View khỏi logic, 2-way binding giảm boilerplate, test ViewModel dễ
- ❌ **Nhược:** Binding phức tạp khó debug, overkill cho màn hình đơn giản

📂 → [Chi tiết: 1.13-mvvm](1.13-mvvm/README.md)

---

### 1.14 Modular Monolith

Một deployment unit như Monolith, nhưng bên trong chia thành **module** biệt lập theo bounded context (giống Microservices).

```
┌────────────────────────────────────────────────┐
│            MODULAR MONOLITH APP                │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │  Module   │ │  Module   │ │  Module   │     │
│  │  Orders   │ │  Payment  │ │  Users    │     │
│  └───────────┘ └───────────┘ └───────────┘     │
│  Giao tiếp qua interface (in-process)          │
│  ┌────────────────────────────────────────┐    │
│  │  1 DATABASE (nhưng schema tách module)  │    │
│  └────────────────────────────────────────┘    │
└────────────────────────────────────────────────┘
```

- ✅ **Ưu:** Đơn giản deploy như Monolith, ranh giới rõ như Microservices, dễ migrate dần sang microservices
- ❌ **Nhược:** Vẫn single point of failure, module có thể "thân nhau quá" nếu không kỷ luật

📂 → [Chi tiết: 1.14-modular-monolith](1.14-modular-monolith/README.md)

---

## 🆚 So sánh nhanh

| Tiêu chí | Monolith | Modular Monolith | Microservices |
|----------|----------|-----------------|---------------|
| Deploy | 1 unit | 1 unit | Nhiều unit |
| Scale | Toàn bộ | Toàn bộ | Từng service |
| Độ phức tạp | Thấp | Trung bình | Cao |
| Team độc lập | Không | Một phần | Hoàn toàn |
| Lỗi ảnh hưởng | Toàn hệ thống | Toàn hệ thống | Cô lập |

---

## 📚 Tài liệu tham khảo

- 📖 [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- 📖 [The Onion Architecture - Jeffrey Palermo](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- 📖 [Ports & Adapters - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- 📖 [Domain-Driven Design - Eric Evans](https://dddcommunity.org/)
- 📖 [Microservices - Martin Fowler](https://martinfowler.com/articles/microservices.html)
- 📖 [CQRS - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- 📖 [Event Sourcing - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- 📖 [Event-Driven Architecture - AWS](https://aws.amazon.com/event-driven-architecture/)

---

## ⏭️ Bài tiếp theo

→ [02-design-patterns](../02-design-patterns/README.md)