# 🌳 2.2.5 Composite Pattern

> Xử lý **cấu trúc cây** — cho phép client thao tác **cá nhân lẫn nhóm** bằng cùng cách (cùng interface).

---

## 🎯 Vấn đề

Có cấu trúc phân cấp: file trong folder, folder trong folder. Client phải phân biệt "leaf" (file) và "container" (folder) — logic rẽ nhánh phức tạp.

**Composite pattern giải quyết bằng cách:** ép leaf và container cùng thực hiện interface chung, sao cho client có thể xử lý cả cây mà không cần `instanceof` check.

**Phân biệt Composite vs Decorator vs Strategy:**
- **Composite:** tập hợp N object thành 1 aggregate — "is-a-group-of"
- **Decorator:** bọc 1 object thêm behavior — "is-wrapped-by"
- **Strategy:** chọn 1 algorithm — "uses-a-strategy"

```
❌ Client phải kiểm tra từng loại
if (item.isFolder) { for (item.children) ... } else { item.open() }

✅ Composite — cùng interface, client không cần biết
Client gọi item.open() → leaf mở file / folder mở tất cả con
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────┐
│  Component (interface) — open(), size()     │
│      ▲                 ▲                    │
│      │                 │                    │
│  Leaf            Composite                  │
│  (file)          (folder — chứa children)   │
└─────────────────────────────────────────────┘

Folder
 ├── File A (leaf)
 ├── File B (leaf)
 └── SubFolder (composite)
      └── File C (leaf)
```

### Luồng hoạt động

```
Client gọi rootFolder.show()
         │
         ▼
Folder: for each child → child.show()
         │
         ├─ File → in tên (leaf — tự xử lý)
         └─ SubFolder → đệ quy gọi con của nó
```

**Key insight:** Composite **đệ quy tự nhiên** — Folder chứa Folder chứa File. Cùng 1 interface `show()` hoạt động đúng ở mọi mức độ lồng.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface FileSystemItem {
  show(indent: string): void;
}

// Leaf — không có con
class File implements FileSystemItem {
  constructor(private name: string) {}
  show(indent: string): void {
    console.log(`${indent}📄 ${this.name}`);
  }
}

// Composite — có thể chứa con (file hoặc folder khác)
class Folder implements FileSystemItem {
  private children: FileSystemItem[] = [];

  constructor(private name: string) {}

  add(item: FileSystemItem): void {
    this.children.push(item);
  }

  show(indent: string): void {
    console.log(`${indent}📁 ${this.name}/`);
    for (const child of this.children) {
      child.show(indent + "  ");
    }
  }
}

// Client — thao tác cùng cách, không phân biệt
const root = new Folder("src");
const docs = new Folder("docs");
docs.add(new File("guide.md"));
root.add(new File("index.ts"));
root.add(docs);
root.show("");
// 📁 src/
// 📄 index.ts
// 📁 docs/
// 📄 guide.md
```

**Real-world example — DOM tree:**

```typescript
// HTMLElement là Composite pattern trong browser
const div = document.createElement('div');
div.appendChild(p1);
div.appendChild(p2);
document.body.appendChild(div);  // recursive rendering
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🎯 **Đơn giản** | Client thao tác đồng nhất leaf & composite | Không cần `if instanceof File else Folder` — code sạch hơn. |
| 🌳 **Cấu trúc cây** | Hỗ trợ đệ quy tự nhiên | Tree traversal = một loop trong composite. |
| ➕ **Mở rộng** | Thêm loại mới không sửa code client | Thêm `SymbolicLink` chỉ cần implement `FileSystemItem`. |
| 🧪 **Testable** | Test leaf và composite riêng biệt | Mỗi component unit test được độc lập. |
| 🔁 **Uniform treatment** | Client code không thay đổi khi thêm node | `remove(item)` hoạt động đúng ở mọi level. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| ⚠️ **Quá tổng quát** | Khó phân biệt leaf/composite khi cần | Khi cần thao tác đặc thù cho leaf (rename file) vs composite (add child). *Giảm thiểu:* type guards, `instanceof` check khi cần thiết. |
| 🐛 **Design mơ hồ** | Có thể vi phạm interface segregation | Interface `FileSystemItem` có `add()` nhưng leaf không cần. *Gi giảm thiểu:* split interface (Leaf chỉ có `show()`, Composite có `add()` + `show()`). |
| 🧨 **Cây bị mutate** | Thêm/xóa node ở runtime có thể gây inconsistency | Parent-child reference must stay in sync. *Gi giảm thiểu:* immutable tree hoặc snapshot strategy. |
| 👻 **Depth limit risk** | Cây quá sâu gây stack overflow | Recursive `show()` với depth 1000 → call stack exceeded. *Gi giảm thiểu:* iterative traversal, tail recursion. |
| 📝 **Interface bloat** | Composite method leak into leaf | `remove()` ở leaf nên throw hoặc no-op — gây confusion. *Gi giảm thiểu:* document rõ method contracts. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Cây thư mục, cây DOM, cây tổ chức | ✅ Rất phù hợp | Use case kinh điển nhất. |
| Menu lồng nhau, vùng UI lồng | ✅ Phù hợp | Component tree, widget hierarchy. |
| Phân cấp công việc (task, subtask) | ✅ Phù hợp | Task tree với recursive operations. |
| Expression tree (compiler, eval) | ✅ Phù hợp | AST nodes — leaf là literal, composite là operator. |
| JSON/YAML tree traversal | ✅ Phù hợp | Recursive parsing without type checks. |
| Flat list (không có structure) | ❌ Overkill | Composite chỉ cần khi có hierarchy. |
| Không cần uniform treatment | ⚠️ Không cần | Nếu leaf và composite cần xử lý khác nhau → two classes. |

---

## 🔗 Liên quan

- **2.2.2 Decorator** — Decorator bọc 1 component, Composite chứa nhiều.
- **2.3.5 Iterator** — Iterator duyệt cây composite.
- **2.3.6 Chain of Responsibility** — Cả 2 pattern dùng composition, nhưng mục đích khác.
- **5.8.1 Repository** — Repository có thể trả về composite của entities.

---

## 📁 Cấu trúc thư mục

```
2.2.5-composite/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.2-structural/2.2.5-composite
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Composite - Refactoring Guru](https://refactoring.guru/design-patterns/composite)
- 📖 [Composite - Source Making](https://sourcemaking.com/design_patterns/composite)

---

## ⏭️ Bài tiếp theo

→ [2.2.6 Bridge](../2.2.6-bridge/README.md)
