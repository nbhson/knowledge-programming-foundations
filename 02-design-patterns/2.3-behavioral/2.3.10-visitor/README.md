# 🧳 2.3.10 Visitor Pattern

> Tách **operation (làm gì)** khỏi **object structure (làm trên cái gì)** — thêm operation mới mà không sửa class của các element.

---

## 🎯 Vấn đề

Bạn có **cấu trúc object ổn định** (AST, document gồm Paragraph/Image/Table) nhưng **operation thay đổi liên tục** (export HTML, export Markdown, kiểm tra chính tả, đếm từ). Nếu nhét operation vào từng class → mỗi lần thêm operation phải **sửa mọi class**:

```
❌ Không Visitor — operation nằm trong element
class Paragraph { exportHtml() {...} exportMarkdown() {...} /* thêm exportPdf → sửa class */ }
class Image     { exportHtml() {...} exportMarkdown() {...} /* thêm exportPdf → sửa class */ }
// Thêm 1 operation = sửa N class. Thêm 1 element = sửa M operation. ❌

// ✅ GIẢI PHÁP: element chỉ biết accept(visitor),
//    visitor chứa operation cho từng loại element
paragraph.accept(new HtmlExportVisitor());     // <p>...</p>
paragraph.accept(new MarkdownExportVisitor()); // ...
// Thêm operation mới = thêm 1 Visitor class, KHÔNG sửa element. ✅
```

**Bản chất Visitor:** đảo ngược trách nhiệm — thay vì element biết mọi operation, mỗi operation (visitor) biết cách xử lý mọi element. Kỹ thuật nền là **double dispatch**: `element.accept(visitor)` gọi ngược `visitor.visitX(element)` đúng kiểu.

**Scenario điển hình:** compiler/AST (type-check, optimize, codegen), export document nhiều định dạng, lint/tree-shaking, báo cáo trên org chart.

**Phân biệt Visitor vs Strategy vs Template Method:**
- **Visitor:** thêm **operation mới** trên **nhiều loại element** mà không sửa element.
- **Strategy** (2.3.1): đổi **thuật toán** của **1 context** lúc runtime.
- **Template Method** (2.3.5): khung cố định, subclass điền **bước con**.

---

## 🧩 Cấu trúc

```
┌──────────────────────────────────────────────────────┐
│  Element (interface)                                  │
│  ─ accept(visitor: Visitor): string                  │
│         ▲                    ▲                       │
│  ┌──────┴──────┐      ┌──────┴──────┐                 │
│  │ Paragraph   │      │ Image       │                 │
│  │ accept(v) → │      │ accept(v) → │                 │
│  │ v.visitParagraph(this) │ v.visitImage(this)       │
│  └─────────────┘      └─────────────┘                 │
│                                                      │
│  Visitor (interface)                                  │
│  ─ visitParagraph(p): string                         │
│  ─ visitImage(i): string                             │
│         ▲                    ▲                       │
│  ┌──────┴──────────┐  ┌──────┴──────────────┐         │
│  │HtmlExportVisitor│  │MarkdownExportVisitor│         │
│  └─────────────────┘  └─────────────────────┘         │
└──────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Client: doc = [new Paragraph("Hi"), new Image("a.png")]
  → p.accept(new HtmlExportVisitor())
    → visitor.visitParagraph(p) → "<p>Hi</p>"
  → img.accept(new MarkdownExportVisitor())
    → visitor.visitImage(img) → "![](a.png)"
// Double dispatch: lần 1 chọn element, lần 2 chọn đúng visitX
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Visitor — 1 method cho mỗi loại element
interface Visitor {
  visitParagraph(p: Paragraph): string;
  visitImage(i: Image): string;
}

// Element — chỉ biết accept, không biết chi tiết operation
interface Element {
  accept(visitor: Visitor): string;
}

class Paragraph implements Element {
  constructor(readonly text: string) {}
  accept(visitor: Visitor): string {
    return visitor.visitParagraph(this); // double dispatch
  }
}

class Image implements Element {
  constructor(readonly src: string) {}
  accept(visitor: Visitor): string {
    return visitor.visitImage(this);
  }
}

// Operation 1: export HTML
class HtmlExportVisitor implements Visitor {
  visitParagraph(p: Paragraph): string { return `<p>${p.text}</p>`; }
  visitImage(i: Image): string { return `<img src="${i.src}" />`; }
}

// Operation 2: export Markdown (thêm mới — KHÔNG sửa Paragraph/Image)
class MarkdownExportVisitor implements Visitor {
  visitParagraph(p: Paragraph): string { return `${p.text}\n`; }
  visitImage(i: Image): string { return `![](${i.src})`; }
}

// Client
const doc: Element[] = [new Paragraph('Hi'), new Image('a.png')];
const html = doc.map((el) => el.accept(new HtmlExportVisitor()));
console.log(html); // ["<p>Hi</p>", '<img src="a.png" />']
```

**Real-world example — AST của compiler:**

```typescript
// Element: NumberNode, AddNode, VarNode (accept visitor)
// Visitor: TypeCheckVisitor, OptimizeVisitor, CodegenVisitor
// Thêm pass mới (ví dụ MinifyVisitor) → không sửa node nào
interface AstVisitor<T> {
  visitNumber(n: NumberNode): T;
  visitAdd(n: AddNode): T;
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| ➕ **Thêm operation dễ** | Operation mới = 1 Visitor class mới | Không sửa element nào — đúng Open/Closed với chiều operation. |
| 🧩 **Gom logic liên quan** | Mọi xử lý của 1 operation nằm 1 chỗ | Export HTML của mọi element trong `HtmlExportVisitor` — không rải rác N class. |
| 🔀 **Double dispatch** | Chọn đúng handler theo kiểu runtime | Không cần `instanceof` / switch-case trong client. |
| 🧪 **Test isolation** | Test từng visitor độc lập | Mock element đơn giản, assert output từng `visitX`. |
| 🔄 **Duyệt cấu trúc phức tạp** | Visitor đi khắp Composite/AST | Kết hợp Composite (2.2.5) + Visitor = duyệt cây + operation tách rời. |

---

## ⚠️ Lưu Ý

| Lưu ý | Giải thích | Giảm thiểu |
|-------|------------|------------|
| ➕ **Thêm element mới tốn kém** | Element mới → thêm method vào Visitor interface → sửa MỌI visitor | Chỉ dùng khi **object structure ổn định**, operation hay đổi. Ngược lại (element hay đổi) → không hợp. |
| 🔓 **Lộ nội bộ element** | Visitor cần đọc state element → phải public | Cân bằng encapsulation: expose readonly field tối thiểu. |
| 🧱 **Phức tạp** | Double dispatch khó hiểu với người mới | Document luồng `accept → visitX`; giữ visitor nhỏ, 1 nhiệm vụ. |
| 📝 **Boilerplate** | Mỗi element cần `accept`, mỗi visitor cần N method | Structure nhỏ (< 3 loại) → `instanceof` đơn giản hơn. |
| 🔁 **Khó thay đổi thứ tự duyệt** | Logic duyệt nằm trong element/composite | Muốn đổi thứ tự → sửa element hoặc dùng Iterator (2.3.6) điều khiển duyệt. |

---

## 🎯 Khi nào dùng

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Structure ổn định + operation hay thêm mới (AST pass, export nhiều định dạng) | ✅ Rất phù hợp | Use case kinh điển của Visitor. |
| Báo cáo/lint trên cây object (org chart, DOM) | ✅ Phù hợp | Mỗi báo cáo = 1 visitor, không sửa node. |
| Muốn gom operation rải rác về 1 chỗ | ✅ Phù hợp | Hết logic `exportX` nằm trong từng element. |
| Object structure hay đổi (liên tục thêm loại element) | ❌ Không dùng | Mỗi element mới phá vỡ mọi visitor. |
| Chỉ 1-2 operation, ít đổi | ⚠️ instanceof đủ | Visitor over-engineering. |
| Cần giữ kín nội bộ element | ⚠️ Cân nhắc | Visitor đòi expose state. |

---

## 🔗 Liên quan

- **2.2.5 Composite** — Visitor thường duyệt Composite tree (AST, DOM, file system).
- **2.3.6 Iterator** — Iterator lo **duyệt**, Visitor lo **làm gì** với từng node; có thể kết hợp.
- **2.3.1 Strategy** — Strategy đổi algorithm của 1 object; Visitor thêm operation trên nhiều loại object.
- **2.3.11 Interpreter** — Interpreter của AST có thể implement bằng Visitor (mỗi `visitX` = 1 quy tắc interpret).
- **Double Dispatch** — Kỹ thuật nền của Visitor (lần dispatch 1: `accept`, lần 2: `visitX`).

**Visitor trong TypeScript thực tế:**
- TypeScript compiler API: `ts.forEachChild` + visitorOS pass
- ESLint rule: visitor `Program > Identifier(node)` trên AST
- Babel plugin: visitor transform AST

---

## 📁 Cấu trúc thư mục

```
2.3.10-visitor/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.10-visitor
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu

- 📖 [Visitor - Refactoring Guru](https://refactoring.guru/design-patterns/visitor)
- 📖 [Visitor - Source Making](https://sourcemaking.com/design_patterns/visitor)
- 📖 [Design Patterns - GoF (Visitor chapter)](https://en.wikipedia.org/wiki/Visitor_pattern)

---

## ⏭️ Bài tiếp theo

→ [2.3.11 Interpreter Pattern](../2.3.11-interpreter/README.md)
