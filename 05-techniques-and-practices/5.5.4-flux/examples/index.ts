/**
 * 5.5.4 Flux — Unidirectional data flow (Dispatcher → Store → View)
 *
 * Kiến trúc Flux của Facebook: dữ liệu chỉ chảy MỘT CHIỀU
 *   View → Action → Dispatcher → Store → View
 *
 * - Dispatcher: trung tâm nhận action, broadcast cho mọi store đã đăng ký
 * - Store: giữ state + logic, lắng nghe action, phát sự kiện "change"
 * - View: subscribe store, nhận action từ user rồi dispatch lại
 */

// ──────────────────────────────── Action ────────────────────────────────────
interface FluxActionType {
  type: "ADD_TODO" | "TOGGLE_TODO" | "REMOVE_TODO";
  payload?: unknown;
}

// ─────────────────────────────── Dispatcher ─────────────────────────────────
class FluxDispatcher {
  private readonly handlers: Array<(action: FluxActionType) => void> = [];

  register(handler: (action: FluxActionType) => void): void {
    this.handlers.push(handler);
  }

  // Broadcast action đến TẤT CẢ store đã đăng ký — theo thứ tự
  dispatch(action: FluxActionType): void {
    console.log(`   📣 Dispatcher nhận action "${action.type}" → broadcast ${this.handlers.length} store`);
    this.handlers.forEach((h) => h(action));
  }
}

// ────────────────────────────────── Store ───────────────────────────────────
interface FluxTodo {
  id: number;
  text: string;
  done: boolean;
}

class FluxTodoStore {
  private todos: FluxTodo[] = [];
  private readonly listeners = new Set<() => void>();
  private nextId = 1;

  constructor(private readonly dispatcher: FluxDispatcher) {
    // Store đăng ký với dispatcher ở constructor
    dispatcher.register((action) => {
      switch (action.type) {
        case "ADD_TODO":
          this.todos = [
            ...this.todos,
            { id: this.nextId++, text: action.payload as string, done: false },
          ];
          this.emitChange();
          break;
        case "TOGGLE_TODO":
          this.todos = this.todos.map((t) =>
            t.id === (action.payload as number) ? { ...t, done: !t.done } : t
          );
          this.emitChange();
          break;
        case "REMOVE_TODO":
          this.todos = this.todos.filter((t) => t.id !== (action.payload as number));
          this.emitChange();
          break;
      }
    });
  }

  getTodos(): FluxTodo[] {
    return this.todos;
  }

  // View subscribe để nhận "change" → render lại
  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitChange(): void {
    this.listeners.forEach((l) => l());
  }
}

// ────────────────────────────────── View ────────────────────────────────────
class FluxTodoView {
  constructor(
    private readonly store: FluxTodoStore,
    private readonly dispatcher: FluxDispatcher
  ) {
    store.onChange(() => this.render());
  }

  render(): void {
    const items = this.store
      .getTodos()
      .map((t) => `${t.done ? "✅" : "⬜"} ${t.text}`)
      .join(" | ");
    console.log(`   👀 View render: ${items || "(trống)"}`);
  }

  // User thao tác → View dispatch action (KHÔNG sửa store trực tiếp)
  addTodo(text: string): void {
    this.dispatcher.dispatch({ type: "ADD_TODO", payload: text });
  }

  toggleTodo(id: number): void {
    this.dispatcher.dispatch({ type: "TOGGLE_TODO", payload: id });
  }

  removeTodo(id: number): void {
    this.dispatcher.dispatch({ type: "REMOVE_TODO", payload: id });
  }
}

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== Flux Demo ===");
console.log("");

const dispatcher = new FluxDispatcher();
const store = new FluxTodoStore(dispatcher);
const view = new FluxTodoView(store, dispatcher);

console.log("1️⃣ View thêm 2 todo (dispatch ADD_TODO):");
view.addTodo("Học kiến trúc Flux");
view.addTodo("Áp dụng một chiều");
console.log("");

console.log("2️⃣ View toggle todo id=1 (dispatch TOGGLE_TODO):");
view.toggleTodo(1);
console.log("");

console.log("3️⃣ View xóa todo id=2 (dispatch REMOVE_TODO):");
view.removeTodo(2);
console.log("");

console.log("✅ Flux: dữ liệu chảy một chiều Action→Dispatcher→Store→View. Store KHÔNG bị view sửa trực tiếp, tất cả qua dispatch — dễ debug (ai dispatch gì đều rõ).");
export {};