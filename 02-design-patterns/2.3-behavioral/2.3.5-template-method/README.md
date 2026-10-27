# 📋 2.3.5 Template Method Pattern

> Định nghĩa khung thuật toán trong lớp cha, cho phép lớp con ghi đè bước chi tiết mà không đổi cấu trúc chung.

---

## 🎯 Vấn đề

Nhiều class có quy trình giống nhau, chỉ khác vài bước: import CSV vs JSON đều phải qua `read → parse → validate → save`. Copy-paste khung là **duplicate code** — thay đổi 1 bước phải sửa nhiều nơi (Dijkstra: "duplicate code is the root of all evil").

Template Method giải bằng cách **định nghĩa skeleton của algorithm** ở abstract class, để subclass override những bước cụ thể.

**Phân biệt Template Method vs Strategy vs State:**

| Pattern | Cơ chế | Khi nào đổi behavior |
|---------|--------|---------------------|
| **Template Method** | Inheritance — override methods | Compile-time subclass selection |
| **Strategy** | Composition — inject strategy object | Runtime explicit selection |
| **State** | Composition — internal state change | Automatic based on context state |

```
❌ Duplicate khung quy trình ở mỗi class
class CsvImporter {
  importFile(path) {
    const data = this.readData(path);  // duplicate
    const parsed = this.parseData(data);  // custom
    const cleaned = this.validateAndClean(parsed);  // custom
    this.save(cleaned);  // duplicate
  }
}
// JsonImporter cũng copy-paste read/save...

✅ GIẢI PHÁP: Khung ở abstract class, bước riêng là abstract method
┌─────────────────────┐
│  DataImporter       │  importFile() { read(); parse(); validate(); } ← template
│  ─ readData()       │  parseData() / validateAndClean() ← abstract
└──────────┬──────────┘
     ┌─────┴─────┐
┌────┴────┐ ┌────┴────┐
│CsvImport│ │JsonImport│  ← implement bước riêng
└─────────┘ └─────────┘
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────────────┐
│  AbstractClass (DataImporter)                        │
│  ─ templateMethod() { step1(); step2(); step3(); }  │
│  ─ step1() { chung }                                │
│  ─ abstract step2(), step3()  ← lớp con điền        │
│                  ▲                                   │
│    ┌─────────────┼─────────────┐                    │
│ ┌──┴──────┐ ┌────┴─────┐ ┌─────┴─────┐              │
│ │ConcreteA│ │ConcreteB │ │ConcreteC  │              │
│ └─────────┘ └──────────┘ └───────────┘              │
└─────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
new CsvImporter().importFile("data.csv")
  → readData() [chung] → parseData() [CSV] → validateAndClean() [CSV]

new JsonImporter().importFile("data.json")
  → readData() [chung] → parseData() [JSON] → validateAndClean() [JSON]
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
abstract class DataImporter {
  // Template method — khung cố định
  importFile(path: string): void {
    const data = this.readData(path);
    const parsed = this.parseData(data);
    const cleaned = this.validateAndClean(parsed);
    console.log(`✅ Import xong: ${cleaned.length} records`);
  }
  protected readData(path: string): string {
    console.log(`📖 Đọc file: ${path}`);
    return "raw";
  }
  protected abstract parseData(raw: string): string[];
  protected abstract validateAndClean(data: string[]): string[];
  // Có thể có hook: protected hook() {} ← lớp con override tùy chọn
}

class CsvImporter extends DataImporter {
  protected parseData(raw: string): string[] {
    console.log("🧩 Parse CSV → tách theo dấu phẩy");
    return ["a", "b"];
  }
  protected validateAndClean(data: string[]): string[] {
    console.log("🧹 Validate CSV: bỏ dòng trống");
    return data.filter(d => d.trim() !== "");
  }
}

class JsonImporter extends DataImporter {
  protected parseData(raw: string): string[] {
    console.log("🧩 Parse JSON → JSON.parse");
    return ["x", "y", "z"];
  }
  protected validateAndClean(data: string[]): string[] {
    console.log("🧹 Validate JSON: kiểm tra schema");
    return data;
  }
}
```

**Hook method (optional override):** pattern mở rộng cho phép subclass override method mặc định mà không bắt buộc:

```typescript
abstract class Pipeline {
  run() {
    this.step1(); // always
    this.step2(); // always
    this.hook();  // optional — default is no-op
    this.step3(); // always
  }
  protected hook(): void {}  // subclasses may override
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🧹 **Chống duplicate** | Khung chung 1 chỗ | Thay đổi khung = sửa 1 lần, tất cả subclass hưởng lợi. |
| 🔄 **Dễ thêm biến thể** | Thêm class con, không sửa khung | Open/Closed principle enforcement. |
| 🛡️ **Kiểm soát thứ tự** | Template giữ thứ tự bước | Không thể vô tình reorder steps — invariant được bảo vệ. |
| 🪝 **Hook linh hoạt** | Bước mặc định có thể override tùy chọn | Subclass có tùy chọn tùy chỉnh, không bắt buộc. |
| 📐 **Hollywood principle** | "Don't call us, we'll call you" | Base class control flow, subclasses provide implementation. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Kế thừa cứng** | Phải extends, khó đổi runtime | Cannot swap algorithm at runtime like Strategy. *Gi giảm thiểu:* dùng Strategy khi cần runtime flexibility. |
| 🧠 **Khó hiểu nếu nhiều hook** | Nhiều bước abstract → phức tạp | Subclass phải biết bao nhiêu methods cần override. *Gi giảm thiểu:* document clearly, use IDE contracts. |
| 🔒 **Vi phạm composition over inheritance** | Nếu lạm dụng | Deep inheritance hierarchies fragile. *Gi giảm thiểu:* prefer composition when variation points > 2. |
| 👻 **Fragile base class** | Sửa base class ảnh hưởng tất cả subclass | Base class change = potential break for all subclasses. *Gi giảm thiểu:* minimal interface, document contract. |
| 📉 **Hard to test in isolation** | Template method liên quan cả base + subclass | Unit test phải create concrete subclass. *Giảm thiểu:* extract logic thành independent functions. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Quy trình khung giống nhau, chi tiết khác | ✅ Rất phù hợp | ETL pipeline, build process, report generation. |
| Muốn chống duplicate khung | ✅ Phù hợp | DRY — don't repeat yourself. |
| Cần linh hoạt runtime | ⚠️ Dùng Strategy/Composition | Template Method compile-time only. |
| Chỉ 1 subclass duy nhất | ❌ Overhead không worth | Direct implementation simpler. |
| Variations > 3 | ⚠️ Cân nhắc Strategy pattern | Nhiều biến thể → inheritance bloat. |
| Steps depend on each other | ⚠️ Không nên | Template method enforce order — nếu các bước independent → composition better. |

---

## 🔗 Liên quan

- **2.3.1 Strategy** — Strategy đổi toàn bộ thuật toán, Template giữ khung đổi bước.
- **2.1.2 Factory Method** — Factory Method thường là 1 bước trong Template (subclass decides which factory to use).
- **2.3.4 State** — State đổi hành vi theo trạng thái, Template đổi bước theo subclass.
- **5.3 Pipeline patterns** — Data pipeline (ingest → transform → load) = Template Method instance.

---

## 📁 Cấu trúc thư mục

```
2.3.5-template-method/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.5-template-method
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Template Method - Refactoring Guru](https://refactoring.guru/design-patterns/template-method)
- 📖 [Template Method - Source Making](https://sourcemaking.com/design_patterns/template-method)

---

## ⏭️ Bài tiếp theo

→ [2.3.6 Iterator](../2.3.6-iterator/README.md)
