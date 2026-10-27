# 🧠 2.3 Behavioral Patterns

> Behavioral Patterns tập trung vào **giao tiếp và phân phối trách nhiệm** giữa các object — ai làm gì, giao tiếp với ai, phối hợp thế nào.

---

## 📚 Mục lục

| # | Pattern | Mục đích | Ví dụ thực tế |
|---|---------|----------|---------------|
| 2.3.1 | [Strategy](2.3.1-strategy/README.md) | Chọn thuật toán lúc runtime | Nhiều cách tính giá/ship |
| 2.3.2 | [Observer](2.3.2-observer/README.md) | Thông báo thay đổi cho nhiều đối tượng | Event, pub-sub, DOM listener |
| 2.3.3 | [Command](2.3.3-command/README.md) | Đóng gói hành động thành object | Undo/redo, queue task |
| 2.3.4 | [State](2.3.4-state/README.md) | Thay đổi hành vi theo trạng thái | Máy trạng thái, order status |
| 2.3.5 | [Template Method](2.3.5-template-method/README.md) | Khung xử lý, sub-class điền chi tiết | Quy trình nhiều bước |
| 2.3.6 | [Iterator](2.3.6-iterator/README.md) | Duyệt collection không lộ cấu trúc | for-of, list traversal |
| 2.3.7 | [Mediator](2.3.7-mediator/README.md) | Trung gian giảm coupling giữa các object | Chat room, form dialog |
| 2.3.8 | [Chain of Responsibility](2.3.8-chain-of-responsibility/README.md) | Chuyền request qua chuỗi handler | Middleware, approval flow |
| 2.3.9 | [Memento](2.3.9-memento/README.md) | Snapshot state để undo/khôi phục | Editor history, game checkpoint |
| 2.3.10 | [Visitor](2.3.10-visitor/README.md) | Tách operation khỏi object structure | AST pass, export nhiều định dạng |
| 2.3.11 | [Interpreter](2.3.11-interpreter/README.md) | Grammar + interpret ngôn ngữ mini | Expression evaluator, rule engine |

---

## 🗺️ Bản đồ lựa chọn

```
VẤN ĐỀ CỦA BẠN?
│
├─ Cần đổi thuật toán lúc chạy?
│   └─→ 2.3.1 Strategy
│
├─ Cần thông báo khi có thay đổi?
│   └─→ 2.3.2 Observer
│
├─ Cần undo/redo hoặc hàng đợi thao tác?
│   └─→ 2.3.3 Command
│
├─ Hành vi thay đổi theo trạng thái, if/else quá nhiều?
│   └─→ 2.3.4 State
│
├─ Nhiều bước giống nhau, chỉ khác chi tiết?
│   └─→ 2.3.5 Template Method
│
├─ Cần duyệt collection đa dạng?
│   └─→ 2.3.6 Iterator
│
├─ Nhiều object giao tiếp chằng chịt?
│   └─→ 2.3.7 Mediator
│
├─ Request đi qua chuỗi xử lý (middleware)?
│   └─→ 2.3.8 Chain of Responsibility
│
├─ Cần undo/khôi phục trạng thái cũ?
│   └─→ 2.3.9 Memento
│
├─ Structure ổn định, muốn thêm operation không sửa class?
│   └─→ 2.3.10 Visitor
│
└─ Cần diễn giải ngôn ngữ mini / biểu thức (rule, công thức)?
    └─→ 2.3.11 Interpreter
```

---

## 🔗 Mối quan hệ

```
┌─────────────────────────────────────────────────────────┐
│          Behavioral Patterns — phối hợp, không loại trừ  │
│                                                         │
│  Strategy ──đổi thuật toán──▶ (dùng trong) State        │
│  Observer ──thông báo──▶ (dùng trong) Mediator          │
│  Command ──đóng gói──▶ (dùng trong) Undo/Redo           │
│  Template ──khung──▶ (dùng trong) Chain of Responsibility│
│  Iterator ──duyệt──▶ (dùng trong) hầu hết collections   │
└─────────────────────────────────────────────────────────┘
```

> 💡 **Lưu ý:** Thường kết hợp nhau. Ví dụ: **Command + Observer** trong event system, **State + Strategy** trong UI machine, **Template + Chain** trong pipeline xử lý.

---

## 🆚 So sánh nhanh

| Tiêu chí | Strategy | State | Template | Chain |
|----------|----------|-------|----------|-------|
| Thay đổi | Thuật toán | Trạng thái | Các bước con | Handler |
| Quan hệ | Has-a | Has-a | Is-a (kế thừa) | Chuỗi |
| Runtime đổi | ✅ | ✅ | ❌ (compile) | ✅ |
| Phức tạp | Thấp | TB | Thấp | TB |

---

## 📖 Chi tiết từng mục

### 2.3.1 Strategy

```
┌──────────────┐
│  Context     │──has-a──▶ Strategy (interface)
│  (Order)     │              ▲
└──────────────┘              │
              ┌───────────────┼───────────────┐
              │               │               │
        (NormalPrice)   (DiscountPrice)  (VIPPrice)
```

✅ Chọn thuật toán lúc runtime | ❌ Nhiều class nhỏ

### 2.3.2 Observer

```
Subject ──notify──▶ Observer A
   │                Observer B
   │                Observer C
```

✅ 1 thay đổi → nhiều nơi cập nhật | ❌ Khó debug thứ tự, memory leak nếu quên unsubscribe

### 2.3.3 Command

```
Invoker ──▶ Command ──▶ Receiver
(Button)    (SaveCmd)    (Document)
```

✅ Tách nơi gọi và nơi thực thi, undo/redo | ❌ Nhiều class

### 2.3.4 State

```
State A ──event──▶ State B ──event──▶ State C
(Draft)            (Submitted)        (Approved)
```

✅ Hành vi theo trạng thái, hết if/else | ❌ Nhiều class, chuyển trạng thái rải rác

### 2.3.5 Template Method

```
AbstractClass.templateMethod()
  1. Bước chung (abstract class làm)
  2. Bước riêng (sub-class override)
  3. Bước chung
```

✅ Tái sử dụng khung | ❌ Ràng buộc kế thừa, khó sửa thứ tự

### 2.3.6 Iterator

```
Client ──▶ Iterator ──▶ Collection
            hasNext()/next()
```

✅ Duyệt không lộ cấu trúc | ❌ Đơn giản → không cần pattern

### 2.3.7 Mediator

```
        ┌──▶ Mediator ◀──┐
        │     (central)   │
Component A  Component B  Component C
```

✅ Giảm coupling N:N → N:1 | ❌ Mediator dễ phình to

### 2.3.8 Chain of Responsibility

```
Request ──▶ Handler A ──▶ Handler B ──▶ Handler C
             (nếu xử lý được → dừng, không → chuyền tiếp)
```

✅ Tách người gửi/người nhận, thêm handler dễ | ❌ Request có thể rơi qua chuỗi không ai xử lý

### 2.3.9 Memento

```
Editor ──save()──▶ Memento ──▶ History stack (push/undo)
   sửa... ──restore──▶ quay lại snapshot cũ
```

✅ Undo đơn giản, giữ encapsulation | ❌ Snapshot state lớn tốn RAM

### 2.3.10 Visitor

```
Element.accept(visitor) ──▶ visitor.visitX(element)
Paragraph / Image          HtmlExport / MarkdownExport
```

✅ Thêm operation không sửa element | ❌ Thêm element mới phải sửa mọi visitor

### 2.3.11 Interpreter

```
Cây Expression: Add(Var(a), Multiply(Var(b), Num(2)))
  .interpret({a: 3, b: 4}) → 11
```

✅ Grammar thành class, an toàn hơn eval | ❌ Grammar lớn → bùng nổ class, nên dùng parser generator

---

## 📁 Cấu trúc thư mục

```
2.3-behavioral/
├── README.md                    # File này
├── 2.3.1-strategy/
│   ├── README.md
│   └── examples/index.ts
├── 2.3.2-observer/
│   ├── README.md
│   └── examples/index.ts
├── ... (tương tự cho các pattern còn lại)
├── 2.3.8-chain-of-responsibility/
│   ├── README.md
│   └── examples/index.ts
├── 2.3.9-memento/
│   ├── README.md
│   └── examples/index.ts
├── 2.3.10-visitor/
│   ├── README.md
│   └── examples/index.ts
└── 2.3.11-interpreter/
    ├── README.md
    └── examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Behavioral Patterns - Refactoring Guru](https://refactoring.guru/design-patterns/behavioral-patterns)
- 📖 [GoF Design Patterns - Wikipedia](https://en.wikipedia.org/wiki/Behavioral_pattern)

---

## ⏭️ Bài tiếp theo

→ [03 Principles](../../03-principles/README.md)