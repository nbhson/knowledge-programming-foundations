# 🗂️ 5.5 State Management (Quản Lý State)

> **State Management** là cách tổ chức, lưu trữ và cập nhật trạng thái ứng dụng một cách có hệ thống — giải quyết vấn đề dữ liệu "ở khắp mọi nơi" khiến bug khó truy vết, render không dự đoán được, và code khó bảo trì.

---

## 🎯 State Management — Vấn đề cốt lõi

Trước khi chọn công cụ, cần hiểu **tại sao cần state management**. Một ứng dụng React/Vue/Angular không có state management có xu hướng:

1. **State tràn lan:** Cùng một `user.name` nằm ở 3 component, 2 hook, 1 context — update chỗ này chỗ kia không đồng bộ → UI sai lệch.
2. **Prop drilling:** Cần đẩy dữ liệu qua 5–6 tầng component chỉ để `GrandChild` hiển thị nó.
3. **Race conditions:** Hai async actions cập nhật cùng state đồng thời → kết quả cuối cùng phụ thuộc thứ tự event loop, không kiểm soát được.
4. **Khó test:** Component vừa render, vừa fetch, vừa update local state → test phải mock cả network + DOM.
5. **Time-travel debug khó:** Không có "hồ sơ" các lần thay đổi state → reproduce bug production gần như không thể.

**Nguyên tắc vàng của state management:** **单一 nguồn thực sự (single source of truth)** — mọi thứ đọc được từ **một chỗ**, mọi thứ viết đi qua **một quy trình rõ ràng**. Không có ngoại lệ. Khi đó bạn có thể:
- DevTools liệt kê mọi action + state trước/sau → debug như xem phim.
- Memoization chính xác: component chỉ re-render khi state **thực sự** thay đổi.
- Test nghiệp vụ pure: gọi reducer với input cũ + action → dự đoán được output mới.

> 📌 **Hiểu lầm phổ biến:** "Redux/NgRx là overkill cho app nhỏ." — Đúng, nhưng câu hỏi thật là: **app này sẽ sống đến mức nào?** Nếu bạn biết trước nó sẽ phát triển thành dashboard phức tạp, đầu tư vào một pattern state management ngay từ đầu rẻ hơn refactor sau này. Nếu là prototype 2 tuần thì `useState` + `useReducer` đủ.

---

## 📚 Mục Lục

| # | Framework | Mục Đích |
|---|-----------|----------|
| 5.5.1 | [Redux](../5.5.1-redux/README.md) | Centralized state cho React |
| 5.5.2 | [NgRx](../5.5.2-ngrx/README.md) | State management cho Angular |
| 5.5.3 | [XState](../5.5.3-xstate/README.md) | Quản lý state bằng state machine |
| 5.5.4 | [Flux](../5.5.4-flux/README.md) | Luồng dữ liệu một chiều (dispatcher → store → view) |
| 5.5.5 | [EventEmitter](../5.5.5-event-emitter/README.md) | Publish/subscribe đơn giản |

---

## 🎯 Redux — Centralized Store

**Mô tả:** Redux là **container state predictable** với 3 nguyên tắc cốt lõi:
1. **Single source of truth** — toàn bộ app state nằm trong **một object tree** duy nhất (`store.getState()`).
2. **State read-only** — không ai được phép sửa state trực tiếp; bắt buộc phải **emit action** (plain object `{ type, payload }`).
3. **Changes via pure functions** — `reducer(state, action) → newState` không side-effect, luôn cùng input cho cùng output.

```
┌─────────────────────────────────────────────────────────────┐
│  Redux Architecture                                        │
│                                                             │
│  Component ──dispatch──▶ Action Creator                    │
│                            ↓                               │
│                       Store.dispatch(action)               │
│                            ↓                               │
│                    reducer(currentState, action)           │
│                            ↓                               │
│                    nextState (pure, immutable)             │
│                            ↓                               │
│              Component re-render (selective)               │
│                                                             │
│  Middleware (redux-thunk, redux-saga, RTK Query)           │
│  chạy xuyên suốt chain: dispatch → middleware → reducer    │
└─────────────────────────────────────────────────────────────┘
```

**Cơ chế hoạt động chi tiết:**
- Khi `dispatch(action)` được gọi, Redux **không** modify `currentState`. Nó gọi `reducer(currentState, action)` — function thuần túy — nhận state cũ + action, trả về **state mới hoàn toàn** (immutable update).
- Component con `connect` vào store qua `useSelector` hoặc `mapStateToProps` — chỉ re-render khi selector **thực sự** trả về value khác (Reference equality check).
- Middleware như `redux-thunk` cho phép dispatch **function** thay vì plain object → xử lý async:
  ```typescript
  const fetchUser = (id: string) => async (dispatch: Dispatch) => {
    dispatch({ type: 'USER_FETCHING' });
    try {
      const user = await api.getUser(id);
      dispatch({ type: 'USER_FETCHED', payload: user });
    } catch (e) {
      dispatch({ type: 'USER_FETCH_FAILED', error: e });
    }
  };
  ```

**Redux Toolkit (RTK)** — hiện đại hóa Redux, giảm boilerplate đáng kể:
```typescript
import { configureStore, createSlice } from '@reduxjs/toolkit';

// Slice = actions + reducer (bundle together)
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    // "mutating" logic — RTK dùng Immer, thật ra vẫn tạo immutable copy
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

// Tự động generate action creators & action types
export const { increment, decrement, incrementByAmount } = counterSlice.actions;

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    // user: userSlice.reducer,  ← merge nhiều slice
    // cart: cartSlice.reducer,
  },
  // Middleware mặc định: thunk + immutable-check + serializable-check
});

// Usage trong component
const count = useSelector((state) => state.counter.value);
dispatch(increment());
```

> 💡 **Immer trong RTK:** Câu lệnh `state.value += 1` nghe như "mutate" nhưng thực tế Immer tạo **draft** — bạn sửa bản nháp, Immer sinh immutable state mới. Developer được trải nghiệm mutation API, runtime vẫn đảm bảo immutability.

✅ **Ưu điểm:**
- **Predictable:** Cùng action + state → luôn ra cùng result (deterministic).
- **DevTools mạnh mẽ:** Time-travel debugging, action timeline, state diff → công cụ debug UI hiếm có.
- **Middleware ecosystem:** thunk (async đơn giản), saga (workflow phức tạp), query (data fetching).
- **Testable:** Reducer là pure function → unit test cực dễ, không cần mock gì.
- **Community + ecosystem:** Thư viện, template, tutorial phong phú.

❌ **Nhược điểm:**
- **Boilerplate** (cũ Redux): action type, action creator, switch/case reducer → nhiều file cho 1 tính năng nhỏ.
- **Learning curve:** Hiểu được Redux model (dispatch, reducer, store, middleware) cần thời gian.
- **Overhead memory:** Giữ toàn bộ state trong RAM → app lớn (social network feed) có thể nặng.
- **Phức tạp với local/temporary state:** Dùng Redux cho "isModalOpen" hay "inputValue" là phản pattern — `useState` đủ.

**Khi nào dùng Redux:** App thương mại phức tạp, nhiều người cùng maintain, cần time-travel debug, hoặc cần share state giữa nhiều framework/component không liên quan trực tiếp.

---

## 🅰️ NgRx — Redux pattern cho Angular

**Mô tả:** NgRx là implementation chính thức của Redux pattern trong hệ sinh thái Angular, kết hợp **RxJS Observable** để reactive stream. Không chỉ là "Redux cho Angular" — nó tận dụng được sức mạnh của reactive programming.

**4 thành phần cốt lõi:**
1. **Store** — chứa state, tương tự Redux store.
2. **Actions** — plain class/func đại diện cho sự kiện.
3. **Reducers** — pure function xử lý action, trả về state mới.
4. **Selectors** — memoized function trích xuất portion state (giống `useSelector`).

```typescript
// action.ts
import { createAction, props } from '@ngrx/store';

export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');
export const incrementBy = createAction(
  '[Counter] Increment By',
  props<{ amount: number }>()
);

// reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as CounterActions from './action';

export interface CounterState {
  count: number;
  lastAction?: string;
}

export const initialState: CounterState = { count: 0 };

export const counterReducer = createReducer(
  initialState,
  on(CounterActions.increment, state => ({ count: state.count + 1 })),
  on(CounterActions.decrement, state => ({ count: state.count - 1 })),
  on(CounterActions.incrementBy, (state, { amount }) => ({ count: state.count + amount }))
);

// selector.ts
import { createSelector, createFeatureSelector } from '@ngrx/store';

export const selectCounterState = createFeatureSelector<CounterState>('counter');

export const selectCount = createSelector(
  selectCounterState,
  state => state.count
);

export const selectDoubledCount = createSelector(
  selectCount,
  count => count * 2
);
```

**Component subscribe Observable:**
```typescript
// counter.component.ts
@Component({
  selector: 'app-counter',
  template: `
    <p>Số đếm: {{ count$ | async }}</p>
    <button (click)="increment()">+1</button>
    <button (click)="decrement()">−1</button>
  `
})
export class CounterComponent {
  // Observable — không unsubscribe thủ công nhờ async pipe
  count$ = this.store.select(selectCount);

  constructor(private store: Store<{ counter: CounterState }>) {}

  increment() { this.store.dispatch(increment()); }
  decrement() { this.store.dispatch(decrement()); }
}
```

> 💡 **Tại sao `async pipe`?** Nó tự động subscribe/unsubscribe, tránh memory leak — điểm mạnh Angular so với React (nơi phải nhớ `useEffect` cleanup).

✅ **Ưu điểm:**
- **Reactive first:** State là Observable → component "phản ứng" khi state đổi, không poll.
- **Angular integration:** Cung cấp NgRx Effects (như middleware) cho side-effects phức tạp.
- **DevTools Angular:** Debug state, action history tích hợp Chrome DevTools.

❌ **Nhược điểm:**
- **Boilerplate nhiều hơn Redux:** Action class, reducer tách riêng selector, Effects file.
- **Khó上手 cho team React:** Phải quen RxJS — curve steep.
- **Quá sức với app nhỏ:** Angular app CRUD đơn giản không cần store.

**Alternatives:** Akita (nhẹ hơn, imperative API), Elf (functional, immutable first), Nx+NgRx (enterprise scale).

---

## 🔄 XState — State Machine Management

**Mô tả:** XState quản lý state **dựa trên finite state machine (FSM)** — bạn khai báo **tất cả trạng thái hợp lệ** và **các chuyển đổi giữa chúng**. Kết quả: state space được **bao phủ đầy đủ**, không thể tồn tại "trạng thái không hợp lệ" (ví dụ: order đang "shipping" nhưng chưa "paid").

**Tại sao FSM quan trọng?** Trong app thực, bug thường xảy ra khi state **"lẫn"** — ví dụ: form đang `submitting` nhưng user bấm submit thêm lần nữa; hoặc payment đang xử lý nhưng UI đã hiện "success". XState giải quyết bằng cách **enumerates every valid state** và cấm transition không được định nghĩa.

```typescript
import { createMachine, interpret, assign } from 'xstate';

const fetchMachine = createMachine({
  id: 'fetch',
  initial: 'idle',
  states: {
    idle: {
      // Transitions được định nghĩa EXPLICITLY
      on: { FETCH: 'loading' }
      // Không có transition nào khác → không thể bị "pending"
    },
    loading: {
      on: {
        SUCCESS: 'success',
        FAILURE: 'error',
        // Không có FETCH ở đây → double-submit impossible
      },
      // Entry action: chạy khi ENTER state
      entry: 'startFetch',
    },
    success: {
      type: 'final', // Terminal state
    },
    error: {
      on: { RETRY: 'loading' }
    }
  }
});

const service = interpret(fetchMachine).start();

// Visualize: service.getSnapshot() → { value: 'loading', ... }
service.send('FETCH');    // idle → loading
service.send('SUCCESS');  // loading → success
// service.send('FETCH')  → ❌ XState throws: không có transition từ 'success'
```

**Tích hợp với React (xstate/react):**
```typescript
import { useMachine } from '@xstate/react';

function FetchComponent() {
  const [state, send] = useMachine(fetchMachine);

  return (
    <div>
      {state.matches('loading') && <Spinner />}
      {state.matches('success') && <DataDisplay data={state.context.data} />}
      {state.matches('error') && <RetryButton onRetry={() => send('RETRY')} />}
      <button onClick={() => send('FETCH')}>Load</button>
    </div>
  );
}
```

✅ **Ưu điểm:**
- **Explicit state graph:** Nhìn machine definition = nhìn toàn bộ flow của feature.
- **Bug-resistant:** Không thể vào state không hợp lệ → giảm 90% class of UI bugs.
- **Visualize:** XState Visualizer vẽ statechart đẹp mắt, hữu ích cho documentation.
- **Predictable tests:** Machine là deterministic — test = gửi sequence event, check final state.

❌ **Nhược điểm:**
- **Steep learning curve:** Phải tư duy như FSM engineer, không phải "state object thông thường".
- **Overhead với UI đơn giản:** Form login 2 field không cần machine.
- **Debug tool:** Mặc dù có DevTools, nhưng khó hiểu hơn Redux DevTools với dev mới.

**Khi nào dùng XState:** Workflow phức tạp (checkout flow, form đa bước, approval pipeline), nơi state invalid gây hậu quả nghiêm trọng (financial, medical), hoặc team muốn "self-documenting" UI flow.

---

## 🪣 Flux Pattern — Kiến trúc gốc của Redux

**Mô tả:** Flux là **kiến trúc dữ liệu một chiều** do Facebook phát triển (2014) — nền tảng Redux xây dựng lên. Khác Redux có **một store**, Flux có **nhiều store** và **Dispatcher** là trung tâm.

```
┌─────────────────────────────────────────────────────────────┐
│  Flux Data Flow (One-Way)                                  │
│                                                             │
│  View (React Component)                                    │
│       │  User Action                                         │
│       ▼                                                      │
│  Action Creator → Dispatcher (single channel)              │
│                          │                                  │
│                          ▼                                  │
│                    Stores (multiple,各司其职)                │
│                          │                                  │
│                          ▼                                  │
│                    View re-renders                           │
│                                                             │
│  ❌ Không có circular dependency                            │
│  ❌ Không có mutable state trong store                      │
└─────────────────────────────────────────────────────────────┘
```

**Khác Redux:**
| | Flux | Redux |
|--|------|-------|
| Số store | Nhiều store | Một store duy nhất |
| Dispatcher | Bắt buộc (Facebook cung cấp) | Không có (dispatch trực tiếp đến reducer) |
| State immutability | Không enforce | Enforce (pure reducer) |
| DevTools | Khó tích hợp | Chuẩn (Redux DevTools) |

```javascript
// Dispatcher — "bus" duy nhất cho mọi action
const AppDispatcher = new Flux.Dispatcher();

// Store
class TodoStore {
  constructor() {
    this.todos = [];
    // Register với dispatcher
    AppDispatcher.register((payload) => {
      switch (payload.actionType) {
        case 'ADD_TODO':
          this.todos.push({ id: Date.now(), text: payload.text, done: false });
          this.emit('change'); // broadcast đến component
          break;
        case 'TOGGLE_TODO':
          this.todos = this.todos.map(t =>
            t.id === payload.id ? { ...t, done: !t.done } : t
          );
          this.emit('change');
          break;
      }
    });
  }

  onChange(listener) {
    this.on('change', listener);
  }

  getTodos() {
    return this.todos;
  }
}

const todoStore = new TodoStore();
```

✅ **Ưu điểm:** Đơn giản, không boilerplate, dễ hiểu flow.
❌ **Nhược điểm:** Không có immutability enforcement → dễ mutate state vô tình; scalability kém khi nhiều store giao tiếp nhau.

---

## 📡 EventEmitter Pattern — Giao tiếp không gian trạng thái

**Mô tả:** EventEmitter là pattern **Publish/Subscribe** đơn giản — component "nghe" event và phản hồi, không cần biết ai "gửi" event. Thích hợp cho **local communication** (cùng component tree) hoặc **cross-cutting concerns** (analytics, toast notifications).

```typescript
class EventEmitter {
  private events = new Map<string, Function[]>();

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  emit(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(listener => listener(...args));
  }

  off(event: string, listener: Function): void {
    const listeners = this.events.get(event) || [];
    this.events.set(event, listeners.filter(l => l !== listener));
  }

  once(event: string, listener: Function): void {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      listener(...args);
    };
    this.on(event, wrapper);
  }
}

// Usage
const emitter = new EventEmitter();

// Publisher
emitter.emit('user:logged-in', { name: 'Alice', id: 'u123' });

// Subscriber
emitter.on('user:logged-in', (user) => {
  console.log(`Welcome ${user.name}`);
  analytics.track('login', user.id);
});

// Safer cleanup
emitter.once('session:end', () => {
  // Chỉ chạy 1 lần, tự động deregister
});
```

⚠️ **Cảnh báo — "Wall of Noise":** EventEmitter dễ thành "mê hồn trận" — ai gửi event gì, ở đâu, ai lắng nghe, không ai biết. Khi project lớn:
- Memory leak: component unmount nhưng quên `off`.
- Hard to trace: event name kiểu `'foo:bar:baz'` — debugger không giúp được.
- Circular event: A emit → B handle → B emit → A handle → infinite loop.

> 💡 **Best practice:** Giới hạn EventEmitter cho **cross-component notification** (toast, theme change, notification badge count). Không dùng thay Redux/NgRx cho app-level state.

---

## 🧭 Bảng chọn state management

| Scenario | Recommended | Lập luận |
|----------|-------------|----------|
| React app lớn, cần debug phức tạp | Redux Toolkit | DevTools + Immer + ecosystem phong phú nhất |
| React app nhỏ/trung bình | Zustand hoặc Jotai | Less boilerplate, API tối giản, tree-shakeable |
| Angular enterprise app | NgRx | Reactive-first, tích hợp sâu Angular DI system |
| Angular中小型 app | NGXS hoặc Akita | Nhẹ hơn NgRx, API closer Vuex |
| Workflow phức tạp (checkout, form đa bước) | XState | FSM prevent invalid states, visualizable |
| Vue 3 app | Pinia | Default choice, officially recommended by Vue team |
| Cross-component notification only | EventEmitter / pubsub-js | Không cần store, chỉ cần event routing |
| Global UI state (theme, locale) | Context API + useReducer | Không cần thư viện ngoài |
| Real-time collaborative app | Yjs / CRDTs + state store | Conflict-free replicated data types |

**Rule of thumb:** Nếu state cần **share giữa ≥3 component không có quan hệ cha-con gần**, hoặc state ảnh hưởng **cross-cutting** (permission, theme, notifications), hãy cân nhắc global store. Nếu chỉ parent→child hoặc sibling gần, **lift state up** hoặc **Context** đủ.

---

## 🧠 Anti-patterns phổ biến

| Anti-pattern | Dấu hiệu | Fix |
|-------------|----------|-----|
| **LocalStorage = State** | Dùng `localStorage.getItem()` trong component render | Move vào store, localStorage chỉ là persistence layer |
| **Multiple sources of truth** | Same data ở Redux + URL params + component state | Chuẩn hóa: một nguồn duy nhất cho mỗi事实 |
| **Store = God Object** | 1 store chứa 100+ slices, không chia theo domain | Chia store theo module/domain (feature-based slicing) |
| **Middleware for everything** | Mọi async logic nhồi vào thunk/saga | Dùng RTK Query hoặc TanStack Query cho data fetching |
| **Emmiter thay thế Store** | 50+ event listeners, không ai biết ai lắng nghe gì | Chuyển state quan trọng vào store, EventEmitter chỉ cho notification |

---

## 🔗 Liên quan

- **5.5.1 Redux** — Chi tiết Redux Toolkit
- **5.5.2 NgRx** — Chi tiết NgRx cho Angular
- **5.5.3 XState** — Chi tiết State Machine
- **5.5.4 Flux** — Kiến trúc gốc
- **5.5.5 EventEmitter** — Pub/Sub pattern
- **2.3.2 Observer** — EventEmitter dùng Observer pattern
- **1.3 Clean Architecture** — State management nên nằm ở application/ports layer

---

## 📚 Tài liệu tham khảo

- 📖 [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- 📖 [XState Docs](https://xstate.js.org/)
- 📖 [NgRx Documentation](https://ngrx.io/)
- 📖 [Flux Architecture Overview](https://facebook.github.io/flux/docs/in-depth-overview)
- 📖 [State Management in React — Kent C. Dodds](https://kentcdodds.com/blog/application-state-management-with-react)
- 📖 [You Might Not Need Redux — Dan Abramov](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf36f)

---

## ⏭️ Bài tiếp theo

→ [5.6 Error Handling Techniques](../5.6-error-handling-techniques/README.md)
