# 🔄 5.5.3 XState (State Machine Pattern)

> **XState** là thư viện state machine và statechart cho JavaScript/TypeScript — mô hình hóa state một cách tường minh.

---

## 🎯 Vấn đề

```
❌ State trong code thông thường
├─ State là object bình thường → khó trace transitions
├─ Nhiều branch logic trong component
└─ Khó visualize workflow

✅ XState giải quyết bằng:
├─ State là nodes trong diagram
├─ Transition được định nghĩa rõ ràng
├─ Visualize được state machine
└─ Debug dễ dàng qua state history
```

---

## 🧩 Kiến trúc XState

```
        ┌─────────────────────────────────────┐
        │           STATE MACHINE             │
        │                                     │
        │    ┌─────┐   TIMER   ┌─────┐       │
        │    │GREEN│──────────▶│YELLOW│       │
        │    └──┬──┘           └──┬──┘       │
        │       │                 │           │
        │    TIMER│             TIMER│        │
        │       ▼                 ▼         │
        │    ┌─────┐   TIMER   ┌─────┐       │
        │    │ RED │◀──────────│GREEN│       │
        │    └─────┘           └─────┘       │
        │                                     │
        └─────────────────────────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
import { createMachine, interpret, assign } from 'xstate';

// ===== 1. Define Machine =====
const lightMachine = createMachine({
  id: 'light',
  initial: 'green',
  states: {
    green: {
      on: {
        TIMER: 'yellow'
      }
    },
    yellow: {
      on: {
        TIMER: 'red'
      }
    },
    red: {
      on: {
        TIMER: 'green'
      }
    }
  }
});

// ===== 2. Interpret & Actuate =====
const service = interpret(lightMachine).start();

// Transition
service.send('TIMER'); // green → yellow
service.send('TIMER'); // yellow → red
service.send('TIMER'); // red → green

console.log(service.state.value); // 'green'
```

**Phức tạp hơn — Form workflow:**
```typescript
const formMachine = createMachine({
  id: 'form',
  initial: 'idle',
  states: {
    idle: {
      on: { START: 'filling' }
    },
    filling: {
      on: {
        SUBMIT: 'validating',
        CANCEL: 'cancelled'
      }
    },
    validating: {
      invoke: {
        src: 'validateForm',
        onDone: { target: 'submitting' },
        onError: { target: 'error' }
      }
    },
    submitting: {
      invoke: {
        src: 'submitForm',
        onDone: { target: 'success' },
        onError: { target: 'error' }
      }
    },
    success: { type: 'done' },
    error: {
      on: { RETRY: 'filling' }
    },
    cancelled: { type: 'done' }
  }
});
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔍 Explicit states | Không còn "magic strings" |
| 📊 Visualizable | Dùng XState Viz để vẽ state diagram |
| 🛡️ Type-safe | Full TypeScript support |
| 🧪 Testable | Dễ test từng transition |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Learning curve | Bắt đầu với simple machines |
| 🟡 Overkill cho app nhỏ | Dùng khi state phức tạp |

---

## 🎯 Khi nào dùng XState?

| Scenario | Khuyến nghị |
|----------|-------------|
| Workflow phức tạp (form, checkout) | ✅ XState |
| State transitions rõ ràng | ✅ XState |
| App đơn giản | ❌ useState đủ |
| UI animation states | ✅ XState + Framer Motion |

---

## 🔗 Liên quan

- **5.5.1 Redux** — Alternative approach
- **5.2.3 XP** — State machine + TDD works well

---

## 📚 Tài liệu tham khảo

- 📖 [XState Official Docs](https://xstate.js.org/)
- 📖 [XState Viz](https://xstate.js.org/viz)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.5.3-xstate
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.5.4 Flux](../5.5.4-flux/README.md)
