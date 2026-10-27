# 🪣 5.5.4 Flux (Architecture Pattern)

> **Flux** là kiến trúc một chiều flow dữ liệu, nền tảng cho Redux và nhiều thư viện state management khác.

---

## 🎯 Vấn đề

```
❌ MVC truyền thống (bidirectional)
├─ View thay đổi Model → Model thay đổi View (vòng lặp)
├─ Khó trace khi có nhiều component tương tác
└─ Data flow hỗn loạn

✅ Flux (unidirectional)
├─ Action → Dispatcher → Store → View
├─ Dữ liệu chảy 1 chiều, dễ trace
└─ Mỗi component subscribe store, không mutate trực tiếp
```

---

## 🧩 Kiến trúc Flux

```
┌─────────────────────────────────────────────────────┐
│                    VIEW                              │
│  (React Component / Angular View)                   │
│         │                                            │
│         │ dispatch()                                │
│         ▼                                            │
│  ┌─────────────┐    register()    ┌─────────────┐   │
│  │  ACTION     │────────────────▶│  DISPATCHER │   │
│  │  (Events)   │                │  (Bus)      │   │
│  └─────────────┘                └──────┬──────┘   │
│                                        │ broadcast │
│                                        ▼           │
│                              ┌─────────────────┐   │
│                              │    STORES       │   │
│                              │  (State + Logic)│   │
│                              └────────┬────────┘   │
│                                       │ listen      │
│                                       ▼             │
│                              ┌─────────────────┐   │
│                              │       VIEW      │   │
│                              └─────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ===== 1. ACTION TYPES =====
const ActionTypes = {
  ADD_TODO: 'ADD_TODO',
  TOGGLE_TODO: 'TOGGLE_TODO',
  REMOVE_TODO: 'REMOVE_TODO'
};

// ===== 2. DISPATCHER =====
class Dispatcher {
  private callbacks = new Map<string, Function[]>();

  register(id: string, callback: Function) {
    if (!this.callbacks.has(id)) {
      this.callbacks.set(id, []);
    }
    this.callbacks.get(id)!.push(callback);
  }

  unregister(id: string) {
    this.callbacks.delete(id);
  }

  dispatch(payload: any) {
    this.callbacks.forEach(callbacks => {
      callbacks.forEach(callback => callback(payload));
    });
  }
}

const AppDispatcher = new Dispatcher();

// ===== 3. STORE =====
class TodoStore {
  private todos: Todo[] = [];
  private listeners = new Set<() => void>();

  constructor() {
    AppDispatcher.register((payload: any) => {
      switch (payload.type) {
        case ActionTypes.ADD_TODO:
          this.todos.push(payload.todo);
          this.emit();
          break;
        case ActionTypes.TOGGLE_TODO:
          this.todos = this.todos.map(t =>
            t.id === payload.id ? { ...t, done: !t.done } : t
          );
          this.emit();
          break;
      }
    });
  }

  getTodos() { return this.todos; }
  
  onChange(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach(l => l());
  }
}

const TodoStore = new TodoStore();

// ===== 4. ACTIONS =====
function addTodo(text: string) {
  AppDispatcher.dispatch({
    type: ActionTypes.ADD_TODO,
    todo: { id: Date.now(), text, done: false }
  });
}

function toggleTodo(id: number) {
  AppDispatcher.dispatch({
    type: ActionTypes.TOGGLE_TODO,
    id
  });
}

// ===== 5. VIEW =====
class TodoView {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    TodoStore.onChange(() => this.render());
  }

  render() {
    const todos = TodoStore.getTodos();
    this.container.innerHTML = todos.map(todo => `
      <li>
        <input type="checkbox" ${todo.done ? 'checked' : ''}>
        ${todo.text}
      </li>
    `).join('');
  }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔍 Predictable | Data flow 1 chiều, dễ debug |
| 📊 Traceable | Mỗi action đều được log |
| 🧪 Testable | Dispatcher, Store, Action tách biệt |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Boilerplate nhiều | Dùng Redux ( abstraction trên Flux) |
| 🟡 Phức tạp | Chỉ dùng cho app lớn |

---

## 🎯 Khi nào dùng Flux?

| Scenario | Khuyến nghị |
|----------|-------------|
| App lớn, complex state | ✅ Flux hoặc Redux |
| React app | ⚠️ Redux hay dùng hơn |
| App nhỏ | ❌ Context API đủ |

---

## 🔗 Liên quan

- **5.5.1 Redux** — Redux là implementation hiện đại của Flux
- **5.5.5 EventEmitter** — Dispatcher dựa trên Observer pattern

---

## 📚 Tài liệu tham khảo

- 📖 [Flux Architecture](https://facebook.github.io/flux/docs/in-depth-overview)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.5.4-flux
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.5.5 EventEmitter](../5.5.5-event-emitter/README.md)
