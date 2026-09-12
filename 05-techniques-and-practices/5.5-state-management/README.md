# 🗂️ 5.5 State Management (Quản Lý State)

> **State Management** là cách tổ chức, lưu trữ và cập nhật trạng thái ứng dụng một cách có hệ thống.

---

## 🎯 Redux

**Mô tả:** Centralized state container với 3 nguyên tắc: single source of truth, state read-only, changes via pure functions.

```
┌─────────────────────────────────────────────────────────────┐
│  Redux Architecture                                        │
│                                                             │
│  Component → Action Creator → Dispatch → Store             │
│                                  ↓                          │
│                         Reducer (pure function)             │
│                                  ↓                          │
│                         New State → Re-render               │
└─────────────────────────────────────────────────────────────┘
```

```typescript
import { configureStore, createSlice } from '@reduxjs/toolkit';

// Slice = actions + reducer
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});
```

✅ **Ưu điểm:** Predictable, devtools, middleware support
❌ **Nhược điểm:** Boilerplate, learn curve

---

## 🅰️ NgRx (Angular)

**Mô tả:** Redux pattern cho Angular, sử dụng Observable.

```typescript
// Action
export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');

// Reducer
const counterReducer = createReducer(
  initialState,
  on(increment, state => ({ count: state.count + 1 })),
  on(decrement, state => ({ count: state.count - 1 }))
);

// Selector
export const selectCount = createSelector(
  selectCounterState,
  state => state.count
);

// Component
count$ = this.store.select(selectCount);
```

---

## 🔄 XState (State Machine)

**Mô tả:** State machine-based management, visualize state transitions.

```typescript
import { createMachine, interpret } from 'xstate';

const lightMachine = createMachine({
  id: 'light',
  initial: 'green',
  states: {
    green: { on: { TIMER: 'yellow' } },
    yellow: { on: { TIMER: 'red' } },
    red: { on: { TIMER: 'green' } }
  }
});

const service = interpret(lightMachine).start();
service.send('TIMER'); // green → yellow
```

✅ **Ưu điểm:** Explicit state, visualizable, bug-resistant
❌ **Nhược điểm:** Steep learning curve

---

## 🪣 Flux Pattern

**Luồng dữ liệu một chiều:**
```
Action → Dispatcher → Store → View
                    ↓
              (re-compute state)
```

```javascript
// Dispatcher
const dispatcher = new Flux.Dispatcher();

// Store
class TodoStore {
  constructor() {
    this.todos = [];
    dispatcher.register((action) => {
      if (action.type === 'ADD_TODO') {
        this.todos.push(action.text);
        this.emit('change');
      }
    });
  }
}
```

---

## 📡 EventEmitter Pattern

**Publish-Subscribe đơn giản:**

```typescript
class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach(listener => listener(...args));
  }

  off(event: string, listener: Function) {
    const listeners = this.events.get(event) || [];
    this.events.set(event, listeners.filter(l => l !== listener));
  }
}

// Usage
const emitter = new EventEmitter();
emitter.on('user:logged-in', (user) => console.log('Welcome', user.name));
emitter.emit('user:logged-in', { name: 'John' });
```

---

## 🧭 Bảng chọn state management

| Framework | Recommended | Alternative |
|-----------|-------------|-------------|
| React | Redux Toolkit | Zustand, Recoil, Jotai |
| Angular | NgRx | Akita, Elf |
| Vue | Pinia | Vuex |
| Any | XState | Zustand |
| Simple | Context API | useState |

---

## 🔗 Liên quan

- **2.3.2 Observer** — EventEmitter dùng Observer pattern
- **1.3 Clean Architecture** — State management nằm trong domain layer

---

## 📚 Tài liệu tham khảo

- 📖 [Redux Toolkit](https://redux-toolkit.js.org/)
- 📖 [XState Docs](https://xstate.js.org/)
- 📖 [NgRx](https://ngrx.io/)
- 📖 [Flux Architecture](https://facebook.github.io/flux/docs/in-depth-overview)

---

## ⏭️ Bài tiếp theo

→ [5.6 Error Handling Techniques](../5.6-error-handling-techniques/README.md)
