# 🗂️ 5.5.1 Redux (State Management Pattern)

> **Redux** là thư viện quản lý state cho ứng dụng JavaScript, tuân theo nguyên tắc single source of truth.

---

## 🎯 Vấn đề

```
❌ Quản lý state không có Redux
├─ State nằm rải rác nhiều component
├─ Props drilling: truyền qua nhiều tầng
├─ Khó debug: không biết ai thay đổi state
└─ Hard to test: state phụ thuộc vào component hierarchy

✅ Redux giải quyết bằng:
├─ Centralized state (1 store duy nhất)
├─ State chỉ thay đổi qua action
├─ Pure function reducer xử lý state change
└─ DevTools time-travel debugging
```

---

## 🧩 Kiến trúc Redux

```
┌──────────────────────────────────────────────────────┐
│                    COMPONENT                         │
│                                                      │
│  onClick() ──▶ dispatch(ACTION)                     │
│            └────────────────▶ STORE                 │
│                                │                     │
│                           reducer(state, action)    │
│                                │                     │
│                           newState                  │
│                                │                     │
│                           subscribe()               │
│                                │                     │
│                           Component rerender        │
└──────────────────────────────────────────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// ===== 1. DEFINE STATE =====
interface CounterState {
  value: number;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
};

// ===== 2. CREATE SLICE (actions + reducer) =====
const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    incrementAsync: (state, action: PayloadAction<number>) => {
      // Async thunk example
      setTimeout(() => {
        state.value += action.payload;
      }, 1000);
    },
  },
});

// Export actions
export const { increment, decrement, incrementByAmount, incrementAsync } = counterSlice.actions;

// Export reducer
export const counterReducer = counterSlice.reducer;

// ===== 3. CREATE STORE =====
const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

// ===== 4. TYPES =====
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
```

**Sử dụng trong Component:**
```typescript
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement } from './counterSlice';

function Counter() {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  );
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 📦 Single source of truth | Tất cả state trong 1 store |
| 🔍 Predictable | State chỉ thay đổi qua action rõ ràng |
| 🛠 DevTools | Time-travel debugging, action history |
| 🧪 Easy test | Reducer là pure function |
| 🔄 Middleware | Extensible (logging, async, etc.) |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Boilerplate nhiều | Dùng Redux Toolkit (RTK) |
| 🟡 Học curve | Tài liệu phong phú, pattern rõ ràng |
| 🟡 Overkill cho app nhỏ | Dùng Context API thay thế |

---

## 🎯 Khi nào dùng Redux?

| Scenario | Khuyến nghị |
|----------|-------------|
| App lớn, nhiều state phức tạp | ✅ Redux Toolkit |
| Cần global state (theme, auth) | ✅ Redux |
| App nhỏ, state đơn giản | ❌ Context API đủ |
| Real-time updates | ⚠️ Kết hợp với WebSocket |

---

## 🔗 Liên quan

- **5.5.2 NgRx** — Redux pattern cho Angular
- **5.5.3 XState** — State machine approach
- **5.5.4 Flux** — Kiến trúc nền tảng của Redux

---

## 📚 Tài liệu tham khảo

- 📖 [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- 📖 [Redux Official Tutorial](https://redux.js.org/tutorials/fundamentals/part-1-overview)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.5.1-redux
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.5.2 NgRx](../5.5.2-ngrx/README.md)
