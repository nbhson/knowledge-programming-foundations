# 🔘 2.3.3 Command Pattern

> Đóng gói yêu cầu thành object riêng biệt — cho phép tham số hóa, lưu lịch sử, undo/redo, queue.

---

## 🎯 Vấn đề

Bạn muốn tách **nơi gọi** (invoker) khỏi **nơi thực thi** (receiver), và cần undo/redo, queue, hoặc log.

**Command pattern là nền tảng của:** undo/redo trong editor, macro systems, transaction management, job queues (Redis, Bull), web frameworks (request/response middleware), GUI frameworks (button actions).

```
❌ Gọi trực tiếp — hard-code, không undo được
button.onClick() → editor.write("Hello");

✅ GIẢI PHÁP: Đóng gói thành Command object
┌──────────┐   execute()   ┌──────────┐  write()  ┌──────────┐
│ Invoker  │──────────────▶│ Command  │──────────▶│ Receiver │
│ History  │   undo()      │ WriteCmd │           │  Editor  │
└──────────┘               └──────────┘           └──────────┘
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────────────┐
│  Invoker (History)                                   │
│  ─ commands: Command[], index                        │
│  ─ execute(cmd), undo(), redo()                     │
│                  │                                   │
│           Command (interface)                        │
│           ─ execute(), undo()                        │
│                  ▲                                   │
│            ┌─────┴─────┐                            │
│            │ WriteCommand│  ← hold Receiver + params  │
│            └─────┬─────┘                            │
│                  │                                   │
│            Receiver (TextEditor)                     │
│            ─ write(), deleteLast()                  │
└─────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Invoker.execute(new WriteCommand(editor, "Hello "))
  → Command.execute() → editor.write("Hello ")
  → History lưu stack

Invoker.undo() → Command.undo() → editor.deleteLast(...)
Invoker.redo() → Command.execute() lại
```

**2 biến thể Command:**
- **Simple Command:** 1 action, 1 undo — `WriteCommand`, `DeleteCommand`.
- **Composite Command:** multiple actions as 1 — `MacroCommand`, useful for batch operations.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface Command { execute(): void; undo(): void; }

class TextEditor {
  private text = '';
  write(t: string): void { this.text += t; }
  deleteLast(n: number): void { this.text = this.text.slice(0, -n); }
  getText(): string { return this.text; }
}

class WriteCommand implements Command {
  constructor(private editor: TextEditor, private text: string) {}
  execute(): void { this.editor.write(this.text); }
  undo(): void { this.editor.deleteLast(this.text.length); }
}

class History {
  private commands: Command[] = [];
  private index = -1;
  execute(cmd: Command): void {
    cmd.execute();
    this.commands = this.commands.slice(0, this.index + 1);
    this.commands.push(cmd); 
    this.index++;
  }
  undo(): void { 
    if (this.index >= 0) 
      this.commands[this.index--].undo(); 
  }
  redo(): void { 
    if (this.index < this.commands.length - 1) 
      this.commands[++this.index].execute(); 
  }
}

const editor = new TextEditor();
const history = new History();
history.execute(new WriteCommand(editor, "Hello "));
history.execute(new WriteCommand(editor, "World!"));
console.log(editor.getText()); // "Hello World!"
history.undo(); // "Hello "
history.redo(); // "Hello World!"
```

**Real-world application — restaurant order system:**

```typescript
interface OrderCommand { execute(): void; undo(): void; }

class Kitchen {
  prepare(item: string) { console.log(`🍳 Preparing ${item}`); }
  clear() { console.log(`🧹 Cleared`); }
}

class AddOrderCommand implements OrderCommand {
  constructor(private kitchen: Kitchen, private item: string) {}
  execute() { this.kitchen.prepare(this.item); }
  undo() { this.kitchen.clear(); }
}

// Invoker
const tickets: OrderCommand[] = [];
tickets.push(new AddOrderCommand(kitchen, "Burger"));
tickets.push(new AddOrderCommand(kitchen, "Fries"));
tickets.forEach(t => t.execute());
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| ↩️ **Undo/Redo** | Mỗi command biết cách revert | Implement by storing previous state. |
| 📝 **Lưu lịch sử** | Queue, log, replay | Audit trail cho operations. |
| 🧩 **Tách Invoker/Receiver** | Invoker không biết receiver làm gì | Loose coupling giữa UI và business logic. |
| 🧱 **Composite command** | Macro = nhiều command gộp | Batch operations, transaction-like grouping. |
| 📥 **Queue & Schedule** | Command có thể được queue | Async execution, background jobs. |
| 🧪 **Testable** | Test command đơn lẻ | Isolate execute/undo behavior. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Nhiều class** | Mỗi hành động 1 command | Simple call → 3 classes (Command interface + Concrete + Invoker). *Gi giảm thiểu:* function-based command for simple cases. |
| 💾 **Tốn memory** | Lưu toàn bộ lịch sử | Long-running app → history bloat. *Gi giảm thiểu:* limit history size, or use ring buffer. |
| 🧠 **Phức tạp hơn gọi trực tiếp** | Chỉ đáng khi cần queue/undo | Overhead không worth nếu chỉ 1 call. *Gi giảm thiểu:* direct call cho simple cases. |
| 🔀 **Undo semantic risk** | Undo không phải lúc nào cũng reversible | Payment undo = refund flow phức tạp. *Gi giảm thiểu:* document undo semantics, test edge cases. |
| 👻 **Command sprawl** | (Failure mode) | Hàng trăm command classes = maintenance nightmare. *Gi giảm thiểu:* command registry, or use function closures. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Cần undo/redo | ✅ Rất phù hợp | Text editor, drawing app, design tool. |
| Queue, schedule, transactional | ✅ Phù hợp | Job queues, saga pattern (5.6.3). |
| Macro (gộp nhiều thao tác) | ✅ Phù hợp | Batch operations, workflow automation. |
| Chỉ gọi 1 lần, không cần lịch sử | ❌ Gọi trực tiếp | Command overkill. |
| Simple getter/setter | ❌ Không cần | Use property accessors directly. |

---

## 🔗 Liên quan

- **2.3.8 Chain of Responsibility** — Chain chuyền request, Command đóng gói request.
- **2.3.5 Template Method** — Template khung cố định, Command đóng gói hành động.
- **2.2.1 Adapter** — Adapter đổi interface, Command tách invoker.
- **5.6.3 Saga Pattern** — Saga = sequence of commands with compensating transactions.

**Command trong TypeScript thực tế:**
- React `onClick={() => dispatch(action)}` — action là command
- Redux actions — serialized commands
- GUI frameworks (WPF, Swing) — command pattern core
- Jest test hooks — beforeEach/afterEach là command pattern

---

## 📁 Cấu trúc thư mục

```
2.3.3-command/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.3-command
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Command - Refactoring Guru](https://refactoring.guru/design-patterns/command)
- 📖 [Command - Source Making](https://sourcemaking.com/design_patterns/command)
- 📖 [Memento Pattern](https://refactoring.guru/design-patterns/memento) — thường kết hợp với Command để save state.

---

## ⏭️ Bài tiếp theo

→ [2.3.4 State](../2.3.4-state/README.md)
