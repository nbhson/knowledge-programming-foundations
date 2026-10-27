# 🔧 02 - Design Patterns (Mẫu Thiết Kế)

> **Design Patterns** là các **giải pháp thiết kế đã được kiểm chứng** cho các vấn đề thường gặp trong lập trình.
> Chúng không phải code cụ thể, mà là **template/mô hình** để giải quyết vấn đề.
>
> **Ví dụ:** Kỹ thuật xây dựng cụ thể — đặt gạch theo mẫu nào, lắp cửa ra sao.

---

## 📚 Mục lục

| # | Nhóm | Mô tả | Patterns |
|---|------|-------|----------|
| 2.1 | [Creational](#21-creational-patterns-mẫu-tạo-đối-tượng) | Tạo đối tượng linh hoạt | Singleton, Factory Method, Abstract Factory, Builder, Prototype |
| 2.2 | [Structural](#22-structural-patterns-mẫu-cấu-trúc) | Kết hợp đối tượng thành cấu trúc lớn | Adapter, Decorator, Facade, Proxy, Composite, Bridge, Flyweight |
| 2.3 | [Behavioral](#23-behavioral-patterns-mẫu-hành-vi) | Giao tiếp & phân phối trách nhiệm | Observer, Strategy, Command, State, Iterator, Chain of Responsibility, Template Method, Mediator, Memento, Visitor, Interpreter |

---

## 🎯 Design Pattern là gì?

**Design Pattern** = giải pháp tái sử dụng cho vấn đề thiết kế lặp lại. Không phải code cụ thể, mà là **mô tả cách giải quyết** — bạn áp dụng vào ngữ cảnh của mình.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   VẤN ĐỀ LẶP LẠI          DESIGN PATTERN        GIẢI PHÁP    │
│   ┌────────────┐          ┌────────────┐      ┌──────────┐   │
│   │ Cần đảm bảo│          │  Singleton │      │ 1 instance│  │
│   │ 1 instance │ ───────▶ │  (mẫu)    │ ───▶ │ + global  │  │
│   │ duy nhất   │          └────────────┘      │  access  │   │
│   └────────────┘                               └──────────┘   │
│                                                             │
│   Pattern = template. Bạn implement theo ngữ cảnh của mình.  │
└─────────────────────────────────────────────────────────────┘
```

### 3 thành phần của 1 pattern

| Thành phần | Ý nghĩa |
|------------|---------|
| **Context** | Tình huống vấn đề xảy ra |
| **Problem** | Vấn đề cần giải quyết (kèm ràng buộc) |
| **Solution** | Cách giải quyết — cấu trúc, quan hệ, trách nhiệm |

### Phân loại theo mục đích

```
┌─────────────────────────────────────────────────────────────┐
│                    DESIGN PATTERNS                          │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │  CREATIONAL     │ │  STRUCTURAL     │ │  BEHAVIORAL   │  │
│  │  (Tạo đối tượng)│ │  (Cấu trúc)     │ │  (Hành vi)    │  │
│  │                 │ │                 │ │               │  │
│  │  • Singleton    │ │  • Adapter      │ │  • Observer   │  │
│  │  • Factory      │ │  • Decorator    │ │  • Strategy   │  │
│  │  • Abstract     │ │  • Facade       │ │  • Command    │  │
│  │    Factory      │ │  • Proxy        │ │  • State      │  │
│  │  • Builder      │ │  • Composite    │ │  • Iterator   │  │
│   │  • Prototype    │ │  • Bridge       │ │  • Chain of   │  │
│   │                 │ │  • Flyweight    │ │    Resp.      │  │
│  │                 │ │                 │ │    Resp.      │  │
│  │  "Làm sao tạo   │ │  "Làm sao kết   │ │  • Template   │  │
│  │   object?"      │ │   hợp object?"  │ │    Method     │  │
│   │                 │ │                 │ │  • Mediator   │  │
│   │                 │ │                 │ │  • Memento    │  │
│   │                 │ │                 │ │  • Visitor    │  │
│   │                 │ │                 │ │  • Interpreter│  │
│  │                 │ │                 │ │               │  │
│  │                 │ │                 │ │  "Làm sao     │  │
│  │                 │ │                 │ │   giao tiếp?" │  │
│  └─────────────────┘ └─────────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧭 Bản đồ lựa chọn pattern

```
BẮT ĐẦU: Bạn đang gặp vấn đề gì?
│
├─ VỀ TẠO ĐỐI TƯỢNG (Creational)
│   ├─ Cần đúng 1 instance toàn cục? → Singleton
│   ├─ Tạo object theo loại, không biết class cụ thể? → Factory Method
│   ├─ Tạo gia đình object liên quan (theme, platform)? → Abstract Factory
│   ├─ Object phức tạp, nhiều optional param? → Builder
│   └─ Tạo object tốn kém, muốn clone? → Prototype
│
├─ VỀ CẤU TRÚC (Structural)
│   ├─ Interface cũ không khớp interface mới? → Adapter
│   ├─ Thêm chức năng động, không sửa class gốc? → Decorator
│   ├─ Subsystem phức tạp, muốn interface đơn giản? → Facade
│   ├─ Kiểm soát truy cập / lazy load object? → Proxy
│   ├─ Cấu trúc cây, xử lý đồng nhất leaf & composite? → Composite
│   ├─ Tách abstraction khỏi implementation? → Bridge
│   └─ Nhiều object trùng dữ liệu, muốn tiết kiệm RAM? → Flyweight
│
└─ VỀ HÀNH VI (Behavioral)
    ├─ 1 thay đổi → nhiều object được thông báo? → Observer
    ├─ Đổi thuật toán lúc runtime? → Strategy
    ├─ Đóng gói request, hỗ trợ undo/queue? → Command
    ├─ Hành vi đổi theo trạng thái? → State
    ├─ Duyệt collection không lộ cấu trúc? → Iterator
    ├─ Request đi qua chuỗi handler? → Chain of Responsibility
    ├─ Skeleton algorithm, subclass override bước? → Template Method
    ├─ Nhiều object giao tiếp, muốn giảm coupling? → Mediator
    ├─ Snapshot state để undo/khôi phục? → Memento
    ├─ Thêm operation lên structure ổn định? → Visitor
    └─ Diễn giải ngôn ngữ mini / biểu thức? → Interpreter
```

---

## 📖 Chi tiết từng pattern

### 2.1 Creational Patterns (Mẫu Tạo Đối Tượng)

> Giải quyết vấn đề: **Tạo đối tượng một cách linh hoạt và phù hợp**.

| # | Pattern | Mục đích | Chi tiết |
|---|---------|----------|----------|
| 2.1.1 | **Singleton** | Đảm bảo 1 class chỉ có 1 instance | [→ Xem](2.1-creational/2.1.1-singleton/README.md) |
| 2.1.2 | **Factory Method** | Tạo object không chỉ rõ class cụ thể | [→ Xem](2.1-creational/2.1.2-factory-method/README.md) |
| 2.1.3 | **Abstract Factory** | Tạo gia đình object liên quan | [→ Xem](2.1-creational/2.1.3-abstract-factory/README.md) |
| 2.1.4 | **Builder** | Xây dựng object phức tạp từng bước | [→ Xem](2.1-creational/2.1.4-builder/README.md) |
| 2.1.5 | **Prototype** | Clone object từ prototype có sẵn | [→ Xem](2.1-creational/2.1.5-prototype/README.md) |

### 2.2 Structural Patterns (Mẫu Cấu Trúc)

> Giải quyết vấn đề: **Kết hợp các đối tượng và classes thành cấu trúc lớn hơn**.

| # | Pattern | Mục đích | Chi tiết |
|---|---------|----------|----------|
| 2.2.1 | **Adapter** | Chuyển interface này sang interface khác | [→ Xem](2.2-structural/2.2.1-adapter/README.md) |
| 2.2.2 | **Decorator** | Thêm hành vi động, không sửa class gốc | [→ Xem](2.2-structural/2.2.2-decorator/README.md) |
| 2.2.3 | **Facade** | Interface đơn giản cho subsystem phức tạp | [→ Xem](2.2-structural/2.2.3-facade/README.md) |
| 2.2.4 | **Proxy** | Đại diện kiểm soát truy cập | [→ Xem](2.2-structural/2.2.4-proxy/README.md) |
| 2.2.5 | **Composite** | Cấu trúc cây, xử lý đồng nhất | [→ Xem](2.2-structural/2.2.5-composite/README.md) |
| 2.2.6 | **Bridge** | Tách abstraction khỏi implementation | [→ Xem](2.2-structural/2.2.6-bridge/README.md) |
| 2.2.7 | **Flyweight** | Chia sẻ state dùng chung, tiết kiệm RAM | [→ Xem](2.2-structural/2.2.7-flyweight/README.md) |

### 2.3 Behavioral Patterns (Mẫu Hành Vi)

> Giải quyết vấn đề: **Cách các đối tượng giao tiếp và phân phối trách nhiệm**.

| # | Pattern | Mục đích | Chi tiết |
|---|---------|----------|----------|
| 2.3.1 | **Strategy** | Đổi thuật toán lúc runtime | [→ Xem](2.3-behavioral/2.3.1-strategy/README.md) |
| 2.3.2 | **Observer** | 1-nhiều, tự động thông báo | [→ Xem](2.3-behavioral/2.3.2-observer/README.md) |
| 2.3.3 | **Command** | Đóng gói request, undo/queue | [→ Xem](2.3-behavioral/2.3.3-command/README.md) |
| 2.3.4 | **State** | Hành vi đổi theo trạng thái | [→ Xem](2.3-behavioral/2.3.4-state/README.md) |
| 2.3.5 | **Template Method** | Skeleton algorithm, subclass override | [→ Xem](2.3-behavioral/2.3.5-template-method/README.md) |
| 2.3.6 | **Iterator** | Duyệt collection không lộ cấu trúc | [→ Xem](2.3-behavioral/2.3.6-iterator/README.md) |
| 2.3.7 | **Mediator** | Điều phối giao tiếp, giảm coupling | [→ Xem](2.3-behavioral/2.3.7-mediator/README.md) |
| 2.3.8 | **Chain of Responsibility** | Request qua chuỗi handler | [→ Xem](2.3-behavioral/2.3.8-chain-of-responsibility/README.md) |
| 2.3.9 | **Memento** | Snapshot state để undo/khôi phục | [→ Xem](2.3-behavioral/2.3.9-memento/README.md) |
| 2.3.10 | **Visitor** | Tách operation khỏi object structure | [→ Xem](2.3-behavioral/2.3.10-visitor/README.md) |
| 2.3.11 | **Interpreter** | Grammar + interpret ngôn ngữ mini | [→ Xem](2.3-behavioral/2.3.11-interpreter/README.md) |

---

## 🆚 So sánh các pattern dễ nhầm lẫn

| Cặp pattern | Khác nhau |
|-------------|-----------|
| **Factory Method vs Abstract Factory** | Factory Method: 1 method tạo 1 loại. Abstract Factory: 1 interface tạo cả gia đình object |
| **Adapter vs Facade** | Adapter: đổi interface cho khớp. Facade: đơn giản hóa interface phức tạp |
| **Decorator vs Proxy** | Decorator: thêm hành vi. Proxy: kiểm soát truy cập (cùng interface) |
| **Strategy vs State** | Strategy: client chọn thuật toán. State: object tự đổi hành vi theo trạng thái |
| **Command vs Strategy** | Command: đóng gói request + undo. Strategy: đóng gói thuật toán thay thế |
| **Observer vs Mediator** | Observer: 1-nhiều, publisher-subscriber. Mediator: trung tâm điều phối nhiều-nhiều |

---

## 📁 Cấu trúc thư mục

```
02-design-patterns/
├── README.md                    # File này (overview)
├── 2.1-creational/
│   ├── README.md                # Tổng quan nhóm Creational
│   ├── 2.1.1-singleton/
│   │   ├── README.md            # Tutorial Singleton
│   │   └── examples/index.ts    # Code ví dụ
│   ├── 2.1.2-factory-method/
│   ├── 2.1.3-abstract-factory/
│   ├── 2.1.4-builder/
│   └── 2.1.5-prototype/
├── 2.2-structural/
│   ├── README.md                # Tổng quan nhóm Structural
│   ├── 2.2.1-adapter/
│   ├── 2.2.2-decorator/
│   ├── 2.2.3-facade/
│   ├── 2.2.4-proxy/
│   ├── 2.2.5-composite/
│   ├── 2.2.6-bridge/
│   └── 2.2.7-flyweight/
└── 2.3-behavioral/
    ├── README.md                # Tổng quan nhóm Behavioral
    ├── 2.3.1-strategy/
    ├── 2.3.2-observer/
    ├── 2.3.3-command/
    ├── 2.3.4-state/
    ├── 2.3.5-template-method/
    ├── 2.3.6-iterator/
    ├── 2.3.7-mediator/
    ├── 2.3.8-chain-of-responsibility/
    ├── 2.3.9-memento/
    ├── 2.3.10-visitor/
    └── 2.3.11-interpreter/
```

---

## 📚 Tài liệu tham khảo

- 📖 [Design Patterns - GoF (Gang of Four)](https://en.wikipedia.org/wiki/Design_Patterns)
- 📖 [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)
- 📖 [Source Making - Design Patterns](https://sourcemaking.com/design_patterns)
- 📖 [Head First Design Patterns](https://www.oreilly.com/library/view/head-first-design/0596007124/)

---

## ⏭️ Bài tiếp theo

→ [03-principles](../03-principles/README.md)