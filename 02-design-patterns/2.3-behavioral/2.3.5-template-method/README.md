# 📋 2.3.5 Template Method Pattern

> Định nghĩa khung thuật toán trong lớp cha, cho phép lớp con ghi đè bước chi tiết mà không đổi cấu trúc chung.

---

## 🎯 Vấn đề

Nhiều class có quy trình giống nhau, chỉ khác vài bước (import CSV vs JSON đều: đọc file → parse → validate → lưu):

```
❌ Duplicate khung quy trình ở mỗi class

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

**Scenario điển hình:** ETL, import/export, build process — khung giống nhau, chi tiết khác.

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

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🧹 **Chống duplicate** | Khung chung 1 chỗ |
| 🔄 **Dễ thêm biến thể** | Thêm class con, không sửa khung |
| 🛡️ **Kiểm soát thứ tự** | Template giữ thứ tự bước |
| 🪝 **Hook linh hoạt** | Bước mặc định có thể override tùy chọn |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Kế thừa cứng** | Phải extends, khó đổi runtime |
| 🧠 **Khó hiểu nếu nhiều hook** | Nhiều bước abstract → phức tạp |
| 🔒 **Vi phạm composition over inheritance** | Nếu lạm dụng |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Quy trình khung giống nhau, chi tiết khác | ✅ Phù hợp |
| Muốn chống duplicate khung | ✅ Phù hợp |
| Cần linh hoạt runtime | ⚠️ Dùng Strategy/Composition |

---

## 🔗 Liên quan

- **2.3.1 Strategy** — Strategy đổi toàn bộ thuật toán, Template giữ khung đổi bước
- **2.1.2 Factory Method** — Factory Method thường là 1 bước trong Template
- **2.3.4 State** — State đổi hành vi theo trạng thái, Template đổi bước theo subclass

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
