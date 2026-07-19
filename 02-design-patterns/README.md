# 🔧 Lớp 2: Design Patterns (Mẫu Thiết Kế)

> **Design Patterns** là các **giải pháp thiết kế đã được kiểm chứng** cho các vấn đề thường gặp trong lập trình.
> Chúng không phải code cụ thể, mà là **template/mô hình** để giải quyết vấn đề.
>
> **Ví dụ:** Kỹ thuật xây dựng cụ thể — đặt gạch theo mẫu nào, lắp cửa ra sao.

---

## 2.1 Creational Patterns (Mẫu Tạo Đối Tượng)

> Giải quyết vấn đề: **Tạo đối tượng một cách linh hoạt và phù hợp**.

| Pattern | Mô Tả | Khi Nào Dùng |
|---------|-------|-------------|
| **Singleton** | Đảm bảo chỉ có 1 instance duy nhất | Database connection pool, Logger, Configuration manager |
| **Factory Method** | Tạo đối tượng mà không chỉ rõ class cụ thể | Tạo nhiều loại đối tượng tùy context |
| **Abstract Factory** | Tạo gia đình các đối tượng liên quan | Hệ thống nhiều theme, multi-platform |
| **Builder** | Xây dựng đối tượng phức tạp từng bước | Object có nhiều optional parameters |
| **Prototype** | Clone đối tượng từ prototype có sẵn | Tạo đối tượng phức tạp tốn tài nguyên |

---

## 2.2 Structural Patterns (Mẫu Cấu Trúc)

> Giải quyết vấn đề: **Kết hợp các đối tượng và classes thành cấu trúc lớn hơn**.

| Pattern | Mô Tả | Khi Nào Dùng |
|---------|-------|-------------|
| **Adapter** | Chuyển giao diện class này thành giao diện khác | Tích hợp hệ thống mới với cũ |
| **Decorator** | Thêm hành vi mới linh hoạt mà không sửa class gốc | Thêm功能 mà không sửa code gốc |
| **Facade** | Cung cấp interface đơn giản hóa cho subsystem phức tạp | Đơn giản hóa API cho client |
| **Proxy** | Đại diện cho đối tượng khác để kiểm soát truy cập | Lazy loading, caching, protection |
| **Composite** | Cấu trúc tree, treat individual và composition uniformly | FileSystem, Menu, UI components |
| **Bridge** | Tách abstraction khỏi implementation | Cả hai có thể thay đổi độc lập |

---

## 2.3 Behavioral Patterns (Mẫu Hành Vi)

> Giải quyết vấn đề: **Cách các đối tượng giao tiếp và phân phối trách nhiệm**.

| Pattern | Mô Tả | Khi Nào Dùng |
|---------|-------|-------------|
| **Observer** | Mối quan hệ 1-nhiều — thay đổi tự động thông báo | Events, Pub/Sub, Reactive |
| **Strategy** | Một family algorithms, interchangeable | Runtime thay đổi algorithm |
| **Command** | Đóng gói request thành đối tượng | Undo/Redo, Queue, Logging |
| **State** | Đối tượng thay đổi hành vi khi state thay đổi | Order status, FSM |
| **Iterator** | Truy cập elements của collection | Custom collection traversal |
| **Chain of Responsibility** | Request pass qua chain of handlers | Middleware, Validation chain |
| **Template Method** | Skeleton algorithm trong base class | Algorithm framework |
| **Mediator** | Đối tượng điều phối giao tiếp | Chat room, Air traffic control |