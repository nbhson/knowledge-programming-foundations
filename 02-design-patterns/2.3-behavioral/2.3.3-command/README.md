# 🔘 2.3.3 Command Pattern

> Đóng gói yêu cầu thành object riêng biệt — cho phép tham số hóa, lưu lịch sử, undo/redo, queue.

---

## 🎯 Vấn đề

Bạn muốn tách **nơi gọi** (invoker) khỏi **nơi thực thi** (receiver), và cần undo/redo:

```
❌ Gọi trực tiếp — hard-code, không undo được
button.onClick() → editor.write("Hello");

✅ GIẢI PHÁP: Đóng gói thành Command object
┌──────────┐   execute()   ┌──────────┐  write()  ┌──────────┐
│ Invoker  │──────────────▶│ Command  │──────────▶│ Receiver │
│ History  │   undo()      │ WriteCmd │           │  Editor  │
└──────────┘               └──────────┘           └──────────┘
```

**Scenario điển hình:** Text editor undo/redo, macro, queue job, transactional operation — cần đóng gói hành động thành object.

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
    this.commands.push(cmd); this.index++;
  }
  undo(): void { if (this.index >= 0) this.commands[this.index--].undo(); }
  redo(): void { if (this.index < this.commands.length - 1) this.commands[++this.index].execute(); }
}

const editor = new TextEditor();
const history = new History();
history.execute(new WriteCommand(editor, "Hello "));
history.execute(new WriteCommand(editor, "World!"));
console.log(editor.getText()); // "Hello World!"
history.undo(); // "Hello "
history.redo(); // "Hello World!"
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| ↩️ **Undo/Redo** | Mỗi command biết cách revert |
| 📝 **Lưu lịch sử** | Queue, log, replay |
| 🧩 **Tách Invoker/Receiver** | Invoker không biết receiver làm gì |
| 🧱 **Composite command** | Macro = nhiều command gộp |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Nhiều class** | Mỗi hành động 1 command |
| 💾 **Tốn memory** | Lưu toàn bộ lịch sử |
| 🧠 **Phức tạp hơn gọi trực tiếp** | Chỉ đáng khi cần queue/undo |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Cần undo/redo | ✅ Phù hợp |
| Queue, schedule, transactional | ✅ Phù hợp |
| Macro (gộp nhiều thao tác) | ✅ Phù hợp |
| Chỉ gọi 1 lần, không cần lịch sử | ❌ Gọi trực tiếp |

---

## 🔗 Liên quan

- **2.3.8 Chain of Responsibility** — Chain chuyền request, Command đóng gói request
- **2.3.5 Template Method** — Template khung cố định, Command đóng gói hành động
- **2.2.1 Adapter** — Adapter đổi interface, Command tách invoker

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

---

## ⏭️ Bài tiếp theo

→ [2.3.4 State](../2.3.4-state/README.md)
