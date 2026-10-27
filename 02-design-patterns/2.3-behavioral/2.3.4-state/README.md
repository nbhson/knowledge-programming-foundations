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

**State pattern là specialized form của Strategy pattern.** Cùng cấu trúc (context + strategy), khác mục đích:
- **Strategy:** client chọn algorithm tại runtime.
- **State:** context thay đổi internal state → algorithm changes automatically.

```typescript
// Strategy — client explicit chọn
order.setShipping(new ExpressShipping());

// State — internal auto-change
order.next(); // Draft → Submitted (internal state transition)
```

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
  setState(s: OrderState): void { 
    this.state = s; 
    console.log(`→ ${s.getStatus()}`); 
  }
  next(): void { this.state.next(this); }
  cancel(): void { this.state.cancel(this); }
}
```

> 💡 **Quy tắc quan trọng:** `setState` nên là `private`/`internal` để chỉ State mới đổi được, tránh client ép trạng thái trái phép. Nếu client có thể `setState(ArpovedState)` → pattern vô dụng, invariant bị phá vỡ.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🧹 **Hết if/else trạng thái** | Mỗi state tự xử lý | Không còn `if (status === 'draft')` scattered everywhere. |
| 🧩 **Single Responsibility** | Mỗi state 1 class | `DraftState` chỉ biết logic của Draft. |
| 🔄 **Dễ thêm trạng thái** | Thêm class, không sửa Context | Open/Closed principle maintained. |
| 🛡️ **Chuyển tiếp an toàn** | State tự chặn chuyển sai | Approved state reject `cancel()` → invariant protected. |
| 🎯 **Explicit state machine** | Transitions visible in code | State diagram = code structure. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Nhiều class** | Trạng thái + chuyển tiếp nhiều | 4 trạng thái × N methods = N×4 classes. *Gi giảm thiểu:* chỉ tạo state class khi có logic đủ phức tạp. |
| 🧠 **Phức tạp nếu ít trạng thái** | 2 trạng thái dùng enum đủ | State pattern overkill cho simple state machine. *Gi giảm thiểu:* rule "≥ 4 states → State pattern". |
| 🔀 **State explosion** | Nhiều trạng thái × nhiều hành vi | Nếu mỗi state có 5 methods → 5×4 = 20 methods across classes. *Gi giảm thiểu:* shared base state class for common behavior. |
| 👻 **Coupling Context ↔ State** | State phải biết Context type | Circular dependency risk. *Gi giảm thiểu:* pass context as parameter (as shown), or use WeakRef. |
| 🧨 **Invalid transitions** | State không enforce valid path | Client có thể bypass if setState public. *Gi giảm thiểu:* private setState, validate in constructor. |
| 📉 **Debug difficulty** | Trạng thái ẩn trong object | Khó hiểu current state tại runtime. *Gi giảm thiểu:* `toString()` / debug log. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Nhiều trạng thái, hành vi khác nhau | ✅ Rất phù hợp | Order workflow, payment status, ticket lifecycle. |
| Chuyển trạng thái có quy tắc chặt | ✅ Phù hợp | Finite State Machine (FSM) compliance. |
| Chỉ 2-3 trạng thái đơn giản | ⚠️ Dùng enum/flag | State pattern overhead not worth it. |
| Trạng thái không ảnh hưởng hành vi | ❌ Không cần | Nếu all states same behavior → flag/enums. |
| State transitions complex (many combinations) | ✅ Phù hợp | Game character states, network protocol states. |
| Need serialization of state | ⚠️ Consider Memento | State pattern không hỗ trợ save/restore easily. |

---

## 🔗 Liên quan

- **2.3.1 Strategy** — Strategy do client chọn, State tự chuyển theo nội bộ.
- **2.3.3 Command** — Command đóng gói hành động, State đổi hành vi theo trạng thái.
- **2.3.5 Template Method** — Template khung cố định, State đa hình theo trạng thái.
- **5.6.3 Saga Pattern** — Saga = sequence of state transitions with compensation.

**State vs Strategy decision:**

| Câu hỏi | Trả lời | Chọn |
|---------|---------|------|
| Client có chọn strategy không? | Có → Strategy |
| State thay đổi tự động theo context? | Có → State |
| Có transition rules? | Có → State |
| Multiple algorithms for same operation? | Yes → Strategy |

---

## 📁 Cấu trúc thư mục

```
2.3.4-state/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx tsx examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.4-state
npx tsx examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [State - Refactoring Guru](https://refactoring.guru/design-patterns/state)
- 📖 [State - Source Making](https://sourcemaking.com/design_patterns/state)
- 📖 [Finite State Machines](https://en.wikipedia.org/wiki/Finite-state_machine)

---

## ⏭️ Bài tiếp theo

→ [2.3.5 Template Method](../2.3.5-template-method/README.md)
