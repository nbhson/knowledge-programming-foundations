# 🔄 2.3.4 State Pattern

> Cho phép object thay đổi hành vi khi trạng thái nội bộ thay đổi — như thể đổi class lúc runtime.

---

## 🎯 Vấn đề

Object có nhiều trạng thái (Draft → Submitted → Approved/Cancelled) và hành vi khác nhau theo trạng thái. Dùng `if/else` kiểm tra trạng thái khắp nơi:

```
❌ if (status === "draft") ... else if (status === "submitted") ... // lặp lại, dễ sót

✅ GIẢI PHÁP: Mỗi trạng thái = 1 class riêng, tự quyết định chuyển tiếp
┌──────────┐   next()/cancel()   ┌────────────────┐
│  Order   │────────────────────▶│   State        │
│ hold:State│                   │ Draft/Submitted│
└──────────┘                    │ Approved/Cancel│
                                └────────────────┘
```

**Scenario điển hình:** Order workflow, TCP connection, game character — hành vi phụ thuộc trạng thái.

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────────────┐
│  Context (Order)                                     │
│  ─ state: OrderState                                 │
│  ─ next(), cancel() → delegate to state             │
│                  │                                   │
│          OrderState (interface)                      │
│          ─ next(order), cancel(order), getStatus()  │
│                  ▲                                   │
│   ┌──────────────┼──────────────┬──────────────┐     │
│ ┌─┴──────┐ ┌────┴────┐ ┌───────┴──┐ ┌────────┴──┐  │
│ │Draft   │ │Submitted│ │Approved  │ │Cancelled │  │
│ └────────┘ └─────────┘ └──────────┘ └───────────┘  │
└─────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Order khởi tạo → DraftState
Order.next() → Draft.next(order) → order.setState(new SubmittedState())
Order.next() → Submitted.next(order) → Approved
Order.cancel() ở Approved → log "không thể hủy"
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface OrderState {
  next(order: Order): void;
  cancel(order: Order): void;
  getStatus(): string;
}

class DraftState implements OrderState {
  next(order: Order): void { order.setState(new SubmittedState()); }
  cancel(order: Order): void { order.setState(new CancelledState()); }
  getStatus(): string { return "📝 Draft"; }
}

class SubmittedState implements OrderState {
  next(order: Order): void { order.setState(new ApprovedState()); }
  cancel(order: Order): void { order.setState(new CancelledState()); }
  getStatus(): string { return "📨 Submitted"; }
}

class ApprovedState implements OrderState {
  next(_o: Order): void { console.log("Đã duyệt — không thể chuyển tiếp"); }
  cancel(_o: Order): void { console.log("Đã duyệt — không thể hủy"); }
  getStatus(): string { return "✅ Approved"; }
}

class Order {
  private state: OrderState = new DraftState();
  setState(s: OrderState): void { this.state = s; console.log(`→ ${s.getStatus()}`); }
  next(): void { this.state.next(this); }
  cancel(): void { this.state.cancel(this); }
}
```

> 💡 `setState` nên là `private`/`internal` để chỉ State mới đổi được, tránh client ép trạng thái trái phép.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🧹 **Hết if/else trạng thái** | Mỗi state tự xử lý |
| 🧩 **Single Responsibility** | Mỗi state 1 class |
| 🔄 **Dễ thêm trạng thái** | Thêm class, không sửa Context |
| 🛡️ **Chuyển tiếp an toàn** | State tự chặn chuyển sai |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Nhiều class** | Trạng thái + chuyển tiếp nhiều |
| 🧠 **Phức tạp nếu ít trạng thái** | 2 trạng thái dùng enum đủ |
| 🔀 **State explosion** | Nhiều trạng thái × nhiều hành vi |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Nhiều trạng thái, hành vi khác nhau | ✅ Phù hợp |
| Chuyển trạng thái có quy tắc chặt | ✅ Phù hợp |
| Chỉ 2-3 trạng thái đơn giản | ⚠️ Dùng enum/flag |
| Trạng thái không ảnh hưởng hành vi | ❌ Không cần |

---

## 🔗 Liên quan

- **2.3.1 Strategy** — Strategy do client chọn, State tự chuyển theo nội bộ
- **2.3.3 Command** — Command đóng gói hành động, State đổi hành vi theo trạng thái
- **2.3.5 Template Method** — Template khung cố định, State đa hình theo trạng thái

---

## 📁 Cấu trúc thư mục

```
2.3.4-state/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.4-state
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [State - Refactoring Guru](https://refactoring.guru/design-patterns/state)
- 📖 [State - Source Making](https://sourcemaking.com/design_patterns/state)

---

## ⏭️ Bài tiếp theo

→ [2.3.5 Template Method](../2.3.5-template-method/README.md)
