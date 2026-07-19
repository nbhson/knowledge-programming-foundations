# 🏛️ Lớp 1: Architecture (Kiến Trúc Phần Mềm)

> **Architecture** là cách bạn **tổ chức và cấu trúc** toàn bộ hệ thống phần mềm —
> bao gồm cách các modules, services, layers giao tiếp với nhau,
> cách dữ liệu chảy qua hệ thống, và cách hệ thống được chia nhỏ thành các thành phần.
>
> **Ví dụ:** Nhà thầu tư vấn thiết kế — vẽ bức tranh lớn cho toàn bộ tòa nhà.

---

## Tổng Quan

| # | Kiến Trúc | Mô Tả |
|---|-----------|-------|
| 1.1 | **Monolithic Architecture** | Tất cả thành phần trong 1 ứng dụng duy nhất. Đơn giản, dễ deploy nhưng khó scale. |
| 1.2 | **Microservices Architecture** | Chia thành nhiều service nhỏ, độc lập. Scale riêng, fault isolation nhưng phức tạp hơn. |
| 1.3 | **Clean Architecture** | Phân thành các vòng tròn同心 với Dependency Rule — code bên trong không biết gì về bên ngoài. |
| 1.4 | **Hexagonal Architecture (Ports & Adapters)** | Core business ở trung tâm, giao tiếp qua Ports và Adapters. |
| 1.5 | **Onion Architecture** | Dependency luôn hướng vào trong — domain models ở trung tâm. |
| 1.6 | **MVC (Model-View-Controller)** | Phân tách thành Model (dữ liệu), View (UI), Controller (điều phối). |
| 1.7 | **MVVM (Model-View-ViewModel)** | ViewModel là lớp trung gian, binding data 2 chiều giữa View và Model. |
| 1.8 | **MVP (Model-View-Presenter)** | Presenter xử lý logic, giao tiếp giữa View (Passive) và Model. |
| 1.9 | **CQRS** | Tách biệt đọc (Query) và ghi (Command) thành 2 model riêng. |
| 1.10 | **Event Sourcing** | Lưu toàn bộ lịch sử sự kiện thay vì trạng thái hiện tại. |
| 1.11 | **Event-Driven Architecture** | Hệ thống giao tiếp chủ yếu qua sự kiện (events). |
| 1.12 | **Domain-Driven Design (DDD)** | Thiết kế phần mềm tập trung vào business domain. |
| 1.13 | **Serverless Architecture** | Không quản lý server, code chạy trên managed functions. |
| 1.14 | **Layered Architecture (N-Tier)** | Hệ thống chia thành các lớp rõ ràng, mỗi layer chỉ giao tiếp với layer liền kề. |

---

## 1.1 Monolithic Architecture

**Mô tả:** Tất cả các thành phần (frontend, backend, database) được triển khai như **một ứng dụng duy nhất**.

**Ưu điểm:**
- Đơn giản để phát triển ban đầu
- Dễ deploy (một lần deploy cho tất cả)
- Dễ debug (mọi thứ cùng một process)
- Không có network latency giữa các module

**Nhược điểm:**
- Khó scale riêng lẻ từng thành phần
- Codebase lớn → khó quản lý
- 1 lỗi có thể crash toàn bộ hệ thống
- Khó thay đổi công nghệ từng phần

**Khi nào dùng:** MVP, ứng dụng nhỏ, team nhỏ (< 10 người).

---

## 1.2 Microservices Architecture

**Mô tả:** Hệ thống được chia thành nhiều **service nhỏ, độc lập**, mỗi service xử lý 1 chức năng cụ thể, giao tiếp qua HTTP/gRPC/Message Queue.

**Ưu điểm:**
- Scale riêng lẻ từng service
- Team khác nhau có thể phát triển service khác nhau
- Fault isolation — 1 service crash không ảnh hưởng service khác
- Đa công nghệ (mỗi service dùng ngôn ngữ/framework khác nhau)

**Nhược điểm:**
- Phức tạp khi deploy & quản lý (cần Kubernetes, Docker)
- Network latency giữa các service
- Khó debug distributed system
- Cần quản lý data consistency phân tán

**Ví dụ thực tế:** Netflix, Amazon, Uber

---

## 1.3 Clean Architecture (Uncle Bob)

**Mô tả:** Hệ thống được phân thành các **vòng tròn同心** với nguyên tắc **Dependency Rule** — code bên trong không biết gì về bên ngoài.

```
┌─────────────────────────────────────────┐
│           Frameworks & Drivers          │  ← Outermost (ngoài cùng)
│  ┌───────────────────────────────────┐  │
│  │       Interface Adapters          │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │      Use Cases              │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │   Entities            │  │  │  │  ← Innermost (bên trong)
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

- **Entities:** Business objects thuần túy (không phụ thuộc framework)
- **Use Cases:** Các tác vụ business cụ thể
- **Interface Adapters:** Chuyển đổi dữ liệu giữa use cases và external
- **Frameworks & Drivers:** Database, Web Framework, UI

**Ưu điểm:**
- Business logic tách biệt hoàn toàn với framework
- Dễ thay đổi UI, database mà không ảnh hưởng business logic
- Dễ test (mock các adapter)

---

## 1.4 Hexagonal Architecture (Ports & Adapters)

**Mô tả:** Ứng dụng có **core business logic** ở trung tâm, giao tiếp với thế giới bên ngoài qua **Ports** (cổng) và **Adapters** (bộ chuyển đổi).

```
          [Database Adapter] ←→ [Port] ←→ [Core Business] ←→ [Port] ←→ [API Adapter]
```

- **Port:** Interface xác định cách core giao tiếp với thế giới bên ngoài
- **Adapter:** Implementation cụ thể của port (PostgreSQL, REST API, CLI...)

**Ưu điểm:**
- Thay đổi adapter mà không ảnh hưởng core
- Test được core logic bằng mock adapter

---

## 1.5 Onion Architecture

**Mô tả:** Giống Clean/Hexagonal nhưng nhấn mạnh **dependency luôn hướng vào trong** — domain models ở trung tâm, infrastructure ở ngoài.

```
         Infrastructure (ORM, Email, File System)
              ↓
         Application Services (Use Cases)
              ↓
         Domain Services (Business Logic)
              ↓
         Domain Models (Entities, Value Objects)  ← Tâm của hành tinh
```

---

## 1.6 MVC (Model-View-Controller)

**Mô tả:** Phân tách ứng dụng thành 3 thành phần:
- **Model:** Dữ liệu & business logic
- **View:** Giao diện người dùng
- **Controller:** Xử lý input, điều phối giữa Model và View

**Ví dụ:** Ruby on Rails, Django, Laravel, AngularJS

---

## 1.7 MVVM (Model-View-ViewModel)

**Mô tả:**
- **Model:** Dữ liệu
- **View:** Giao diện
- **ViewModel:** Lớp trung gian, binding data 2 chiều giữa View và Model

**Ví dụ:** Angular (2+), WPF, Vue.js, Knockout.js

---

## 1.8 MVP (Model-View-Presenter)

**Mô tả:**
- **Model:** Dữ liệu
- **View:** Giao diện (Passive — không biết gì về logic)
- **Presenter:** Xử lý logic, giao tiếp giữa View và Model

**Ví dụ:** Android (traditional), Windows Forms

---

## 1.9 CQRS (Command Query Responsibility Segregation)

**Mô tả:** Tách biệt **đọc (Query)** và **ghi (Command)** thành 2 model riêng biệt.

```
Write Side (Command)  →  Write Database  →  Event  →  Read Database  ←  Read Side (Query)
```

**Ưu điểm:**
- Scale đọc và ghi độc lập
- Tối ưu hóa từng bên riêng biệt
- Phù hợp hệ thống đọc nhiều hơn ghi

**Nhược điểm:**
- Phức tạp hơn (cần sync giữa 2 database)
- Eventual consistency

---

## 1.10 Event Sourcing

**Mô tả:** Thay vì lưu **trạng thái hiện tại**, lưu **toàn bộ lịch sử sự kiện**. Trạng thái hiện tại được tái tạo bằng cách replay các event.

```
Account State = Event1 (Create) + Event2 (Deposit $100) + Event3 (Withdraw $30)
```

**Ưu điểm:**
- Audit trail hoàn chỉnh
- Có thể travel back in time
- Debug dễ dàng

**Nhược điểm:**
- Phức tạp hơn CRUD truyền thống
- Cần event store
- Snapshotting cần thiết cho performance

---

## 1.11 Event-Driven Architecture

**Mô tả:** Hệ thống giao tiếp chủ yếu qua **sự kiện (events)**. Components publish events và các components khác subscribe để xử lý.

```
Component A → [Event Bus/Message Queue] → Component B
                                            Component C
```

**Components:**
- **Event Producer:** Tạo và gửi events
- **Event Channel:** Kafka, RabbitMQ, Redis Pub/Sub
- **Event Consumer:** Nhận và xử lý events

---

## 1.12 Domain-Driven Design (DDD)

**Mô tả:** Tiếp cận thiết kế phần mềm tập trung vào **business domain** (lĩnh vực kinh doanh).

**Các khái niệm chính:**
- **Domain:** Lĩnh vực kinh doanh (VD: Banking, E-commerce)
- **Bounded Context:** Boundary rõ ràng cho mỗi subdomain
- **Ubiquitous Language:** Ngôn ngữ chung giữa dev và business
- **Entities:** Đối tượng có identity (VD: User, Order)
- **Value Objects:** Đối tượng không có identity (VD: Address, Money)
- **Aggregates:** Nhóm các entity bảo vệ business invariants
- **Repositories:** Truy xuất aggregates từ persistence
- **Domain Events:** Sự kiện xảy ra trong domain

**Ví dụ:**
```
E-commerce Domain:
├── Catalog Context     (Products, Categories)
├── Ordering Context    (Orders, OrderItems)
├── Payment Context     (Payments, Invoices)
└── Shipping Context    (Shipments, Tracking)
```

---

## 1.13 Serverless Architecture

**Mô tả:** Không quản lý server. Code chạy trên **managed functions** của cloud provider.

**Ví dụ:** AWS Lambda, Azure Functions, Google Cloud Functions

**Ưu điểm:**
- Không cần quản lý infrastructure
- Scale tự động (0 → ∞)
- Chỉ trả tiền khi code chạy

**Nhược điểm:**
- Cold start latency
- Khó debug
- Vendor lock-in

---

## 1.14 Layered Architecture (N-Tier)

**Mô tả:** Hệ thống được chia thành **các lớp (layers)** rõ ràng, mỗi layer chỉ giao tiếp với layer liền kề.

```
┌──────────────────────┐
│   Presentation Layer │  ← UI, Controllers
├──────────────────────┤
│   Business Layer     │  ← Services, Business Logic
├──────────────────────┤
│   Persistence Layer  │  ← Repositories, DAOs
├──────────────────────┤
│   Database Layer     │  ← Tables, Schemas
└──────────────────────┘
```

---

## Mối Quan Hệ

```
Architecture  ← Bức tranh lớn nhất (toàn bộ hệ thống)
    └── Design Patterns  ← Giải pháp thiết kế cụ thể
        └── Principles  ← Nguyên tắc định hướng
            └── Paradigms  ← Triết lý tư duy
                └── Techniques  ← Cách thực hành hàng ngày
                    └── DSA  ← Nền tảng toán học