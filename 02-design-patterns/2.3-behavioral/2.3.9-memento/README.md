# 🕰️ 2.3.9 Memento Pattern

> Chụp **snapshot trạng thái** của object để **khôi phục (undo)** sau này — mà không lộ chi tiết nội bộ của object.

---

## 🎯 Vấn đề

Bạn cần chức năng **undo/redo** (editor, game checkpoint, form), nhưng để lưu trạng thái lại phải **lộ field nội bộ** ra ngoài, phá vỡ encapsulation:

```
❌ Không Memento — lộ nội bộ hoặc mất khả năng undo
editor.content = "v1"; // sửa trực tiếp, không lưu vết
editor.content = "v2"; // "v1" mất vĩnh viễn, không undo được
// Muốn undo → phải expose getter/setter toàn bộ state ra ngoài

✅ GIẢI PHÁP: Originator tự chụp snapshot (Memento),
   Caretaker chỉ giữ snapshot, không đọc/ghi nội dung bên trong
Editor ──save()──▶ Memento("v1") ──▶ History stack
   sửa thành "v2"...
History.undo() ──restore──▶ Editor trở lại "v1"
```

**Bản chất Memento:** ủy quyền việc **lưu/khôi phục state** cho chính Originator (nó hiểu rõ nội bộ mình nhất), còn Caretaker chỉ làm **kho giữ hộ opaque snapshot**. Encapsulation được bảo toàn.

**Scenario điển hình:** undo/redo trong editor, checkpoint trong game, rollback transaction, lịch sử form.

**Phân biệt Memento vs Command vs Prototype:**
- **Memento:** lưu **state** để khôi phục (undo). Snapshot là dữ liệu thụ động.
- **Command:** đóng gói **hành động** thành object (2.3.3) — undo bằng cách chạy ngược action.
- **Prototype:** **clone** object để tạo mới (2.1.5) — không gắn với lịch sử/khôi phục.

---

## 🧩 Cấu trúc

```
┌──────────────────────────────────────────────────────┐
│  Originator (Editor)                                  │
│  ─ state nội bộ: content                             │
│  ─ save(): Memento        (tự chụp snapshot)         │
│  ─ restore(m: Memento)    (tự khôi phục)              │
│                                                      │
│  Memento (EditorMemento)                              │
│  ─ snapshot bất biến: content, timestamp              │
│  ─ opaque với Caretaker (chỉ Originator đọc được)     │
│                                                      │
│  Caretaker (History)                                  │
│  ─ stack: Memento[]                                   │
│  ─ push(m), undo(): Memento | null                   │
│  ─ KHÔNG đọc/sửa nội dung Memento                    │
└──────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
editor.write("v1"); history.push(editor.save());
editor.write("v2"); history.push(editor.save());
editor.write("v3 (lỗi)...");
history.undo() → editor.restore(memento "v2") → content = "v2"
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Memento — snapshot bất biến, opaque với Caretaker
class EditorMemento {
  constructor(
    readonly content: string,
    readonly timestamp: Date,
  ) {}
}

// Originator — chỉ nó hiểu và khôi phục được state của mình
class Editor {
  private content = '';

  write(text: string): void { this.content = text; }
  read(): string { return this.content; }

  save(): EditorMemento {
    return new EditorMemento(this.content, new Date());
  }

  restore(m: EditorMemento): void {
    this.content = m.content;
  }
}

// Caretaker — kho giữ hộ, không đọc/sửa snapshot
class History {
  private stack: EditorMemento[] = [];

  push(m: EditorMemento): void { this.stack.push(m); }

  undo(): EditorMemento | null {
    return this.stack.pop() ?? null;
  }
}

// Client
const editor = new Editor();
const history = new History();
editor.write('v1'); history.push(editor.save());
editor.write('v2 (lỗi)');
const prev = history.undo();
if (prev) editor.restore(prev);
console.log(editor.read()); // "v1"
```

**Real-world example — game checkpoint:**

```typescript
// Originator: Player (máu, vị trí, level)
// Memento: PlayerSnapshot { hp, x, y, level }
// Caretaker: CheckpointManager — lưu snapshot mỗi màn,
//   game over → restore về checkpoint gần nhất
class CheckpointManager {
  private checkpoints: PlayerSnapshot[] = [];
  saveCheckpoint(s: PlayerSnapshot): void { this.checkpoints.push(s); }
  rollback(): PlayerSnapshot | null { return this.checkpoints.pop() ?? null; }
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔒 **Giữ encapsulation** | Caretaker không chạm vào state nội bộ | Chỉ Originator đọc/ghi Memento — không cần public getter/setter cho mọi field. |
| ↩️ **Undo/redo đơn giản** | Stack snapshot = lịch sử | `push` khi đổi, `pop` khi undo — không cần logic đảo ngược từng action. |
| 🧩 **Tách trách nhiệm** | Originator lo state, Caretaker lo lịch sử | Mỗi class 1 nhiệm vụ, dễ test riêng. |
| 🛡️ **Snapshot bất biến** | Memento readonly → lịch sử không bị sửa | Undo luôn khôi phục đúng trạng thái đã lưu. |
| 🔌 **Mở rộng dễ** | Thêm redo = thêm 1 stack nữa | Không sửa Originator/Memento. |

---

## ⚠️ Lưu Ý

| Lưu ý | Giải thích | Giảm thiểu |
|-------|------------|------------|
| 💾 **Tốn RAM khi state lớn** | Mỗi snapshot copy toàn bộ state | Chỉ snapshot khi cần (trước thao tác nguy hiểm); giới hạn độ sâu stack (ví dụ 50 bước). |
| 🐢 **Copy sâu tốn kém** | State chứa object lồng nhau → shallow copy sai | Dùng deep copy / structuredClone cho snapshot; benchmark nếu state lớn. |
| 🕰️ **Memento lỗi thời** | Class đổi field mà snapshot cũ vẫn còn | Version hóa Memento hoặc làm snapshot tương thích ngược. |
| 📝 **Boilerplate** | 3 class (Originator, Memento, Caretaker) | Pattern nhỏ — chấp nhận được; đừng over-engineer cho nhu cầu "lưu 1 bản nháp". |
| 🔀 **Undo phức tạp (nhánh)** | Undo rồi edit mới → lịch sử phân nhánh | Quyết định rõ: xóa redo-stack khi có edit mới (như editor) hay giữ cây lịch sử. |

---

## 🎯 Khi nào dùng

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Undo/redo trong editor, canvas, form | ✅ Rất phù hợp | Use case kinh điển của Memento. |
| Game checkpoint / save-load | ✅ Phù hợp | Snapshot state → rollback khi thua. |
| Rollback transaction, thử-nghiệm-rồi-hoàn-tác | ✅ Phù hợp | Lưu trước khi làm, lỗi thì restore. |
| Chỉ cần lưu 1 bản nháp đơn giản | ⚠️ Biến thể nhẹ | 1 Memento duy nhất, không cần stack Caretaker. |
| State quá lớn (video buffer, dataset GB) | ⚠️ Cân nhắc | Snapshot full tốn RAM — dùng Command (đảo action) hoặc incremental diff. |
| Cần audit ai-đổi-gì (event log) | ❌ Dùng Event Sourcing | Memento chỉ lưu state, không lưu lịch sử hành động. |

---

## 🔗 Liên quan

- **2.3.3 Command** — Command undo bằng cách đảo action; Memento undo bằng snapshot state. Thường kết hợp: Command giữ Memento của Receiver trước khi execute.
- **2.3.4 State** — State đổi hành vi theo trạng thái hiện tại; Memento lưu/khôi phục trạng thái đã qua.
- **2.1.5 Prototype** — Prototype clone để tạo mới; Memento clone để khôi phục.
- **Event Sourcing** — Lưu chuỗi event thay vì snapshot; Memento là "snapshot 1 điểm".

**Memento trong TypeScript thực tế:**
- `history.pushState` / `popstate` của browser (snapshot URL+state)
- Redux DevTools time-travel (lưu state mỗi action → nhảy về)
- `structuredClone(state)` trước thao tác nguy hiểm

---

## 📁 Cấu trúc thư mục

```
2.3.9-memento/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.9-memento
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu

- 📖 [Memento - Refactoring Guru](https://refactoring.guru/design-patterns/memento)
- 📖 [Memento - Source Making](https://sourcemaking.com/design_patterns/memento)
- 📖 [Design Patterns - GoF (Memento chapter)](https://en.wikipedia.org/wiki/Memento_pattern)

---

## ⏭️ Bài tiếp theo

→ [2.3.10 Visitor Pattern](../2.3.10-visitor/README.md)
