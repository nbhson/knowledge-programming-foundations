# 🌳 2.2.5 Composite Pattern

> Xử lý **cấu trúc cây** — cho phép client thao tác **cá nhân lẫn nhóm** bằng cùng cách (cùng interface).

---

## 🎯 Vấn đề

Có cấu trúc phân cấp: file trong folder, folder trong folder. Client phải phân biệt "leaf" (file) và "container" (folder) — logic rẽ nhánh phức tạp.

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
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **Đơn giản** | Client thao tác đồng nhất leaf & composite |
| 🌳 **Cấu trúc cây** | Hỗ trợ đệ quy tự nhiên |
| ➕ **Mở rộng** | Thêm loại mới không sửa code client |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| ⚠️ **Quá tổng quát** | Khó phân biệt leaf/composite khi cần |
| 🐛 **Design mơ hồ** | Có thể vi phạm interface segregation |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Cây thư mục, cây DOM, cây tổ chức | ✅ Phù hợp |
| Menu lồng nhau, vùng UI lồng | ✅ Phù hợp |
| Phân cấp công việc (task, subtask) | ✅ Phù hợp |

---

## 🔗 Liên quan

- **2.2.2 Decorator** — Decorator bọc 1 component, Composite chứa nhiều
- **2.3.5 Iterator** — Iterator duyệt cây composite

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