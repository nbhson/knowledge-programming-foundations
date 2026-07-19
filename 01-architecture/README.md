# 🏛️ Lớp 1: Architecture (Kiến Trúc Phần Mềm)

> **Architecture** là cách bạn **tổ chức và cấu trúc** toàn bộ hệ thống phần mềm —
> bao gồm cách các modules, services, layers giao tiếp với nhau,
> cách dữ liệu chảy qua hệ thống, và cách hệ thống được chia nhỏ thành các thành phần.
>
> **Ví dụ:** Nhà thầu tư vấn thiết kế — vẽ bức tranh lớn cho toàn bộ tòa nhà.

---

## Danh Sách Các Kiến Trúc

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

## Mối Quan Hệ

```
Architecture  ← Bức tranh lớn nhất (toàn bộ hệ thống)
    └── Design Patterns  ← Giải pháp thiết kế cụ thể
        └── Principles  ← Nguyên tắc định hướng
            └── Paradigms  ← Triết lý tư duy
                └── Techniques  ← Cách thực hành hàng ngày
                    └── DSA  ← Nền tảng toán học