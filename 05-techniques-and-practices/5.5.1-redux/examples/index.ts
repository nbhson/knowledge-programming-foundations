/**
 * 5.5.1 Redux — Store mini tự viết (subscribe / getState / dispatch / reducer)
 *
 * Minh họa 3 nguyên tắc Redux:
 * - Single source of truth: một store duy nhất
 * - State chỉ đọc, thay đổi qua action
 * - Reducer là pure function trả về state MỚI (bất biến)
 *
 * Kèm combineReducers để gộp nhiều slice như Redux Toolkit.
 */

// ─────────────────────────────── Types ──────────────────────────────────────
interface ReduxAction {
  type: string;
  payload?: unknown;
}

type ReduxReducer<TState> = (state: TState, action: ReduxAction) => TState;

// ──────────────────────────────── Store ─────────────────────────────────────
class ReduxStore<TState> {
  private state: TState;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly reducer: ReduxReducer<TState>,
    initialState: TState
  ) {
    this.state = initialState;
  }

  getState(): TState {
    return this.state;
  }

  dispatch(action: ReduxAction): void {
    // Reducer trả về state MỚI → thay thế toàn bộ (bất biến)
    this.state = this.reducer(this.state, action);
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// ──────────────────────────── combineReducers ───────────────────────────────
function combineReducers<TState extends Record<string, unknown>>(
  slices: { [K in keyof TState]: ReduxReducer<TState[K]> }
): ReduxReducer<TState> {
  return (state, action) => {
    const next = {} as TState;
    (Object.keys(slices) as Array<keyof TState>).forEach((key) => {
      next[key] = slices[key](state[key], action);
    });
    return next;
  };
}

// ─────────────────────────────── Reducers ───────────────────────────────────
interface ReduxCounterState {
  value: number;
}

const counterInitial: ReduxCounterState = { value: 0 };

const counterReducer: ReduxReducer<ReduxCounterState> = (state, action) => {
  switch (action.type) {
    case "counter/increment":
      return { value: state.value + 1 };
    case "counter/decrement":
      return { value: state.value - 1 };
    case "counter/incrementBy":
      return { value: state.value + (action.payload as number) };
    default:
      return state;
  }
};

interface ReduxTodoState {
  items: string[];
}

const todoInitial: ReduxTodoState = { items: [] };

const todoReducer: ReduxReducer<ReduxTodoState> = (state, action) => {
  switch (action.type) {
    case "todos/add":
      return { items: [...state.items, action.payload as string] };
    case "todos/remove":
      return {
        items: state.items.filter((item) => item !== (action.payload as string)),
      };
    default:
      return state;
  }
};

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== Redux Demo ===");
console.log("");

const store = new ReduxStore(
  combineReducers({
    counter: counterReducer,
    todos: todoReducer,
  }),
  { counter: counterInitial, todos: todoInitial }
);

const unsub = store.subscribe(() => {
  console.log(`   🔄 State: ${JSON.stringify(store.getState())}`);
});

console.log("1️⃣ Dispatch action counter/increment × 3:");
store.dispatch({ type: "counter/increment" });
store.dispatch({ type: "counter/increment" });
store.dispatch({ type: "counter/increment" });
console.log("");

console.log("2️⃣ Dispatch action counter/incrementBy với payload=5:");
store.dispatch({ type: "counter/incrementBy", payload: 5 });
console.log("");

console.log("3️⃣ Thêm + xóa todo qua todos/add & todos/remove:");
store.dispatch({ type: "todos/add", payload: "học Redux" });
store.dispatch({ type: "todos/add", payload: "viết store mini" });
store.dispatch({ type: "todos/remove", payload: "học Redux" });
console.log("");

console.log("4️⃣ Unsubscribe — không còn nhận thông báo đổi state:");
unsub();
store.dispatch({ type: "counter/decrement" });
console.log(`   (sau unsubscribe, không log nhưng state vẫn đổi → value = ${(store.getState().counter as ReduxCounterState).value})`);
console.log("");

console.log("✅ Redux: một store, state thay đổi DUY NHẤT qua dispatch(action), reducer là pure function trả state mới (bất biến), combineReducers gộp nhiều slice. Thêm subscribe để view cập nhật.");
export {};