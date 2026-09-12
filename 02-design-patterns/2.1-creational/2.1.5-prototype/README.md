# 🧬 2.1.5 Prototype Pattern

> Tạo đối tượng mới bằng cách **sao chép (clone) một đối tượng hiện có** (prototype) thay vì khởi tạo từ đầu.
> Tránh chi phí khởi tạo tốn kém và phụ thuộc vào constructor.

---

## 🎯 Vấn đề

Khi tạo object tốn kém (gọi DB, parse file, tính toán phức tạp) và cần tạo **nhiều bản tương tự**:

```
❌ VẤN ĐỀ: Khởi tạo lại từ đầu
┌────────────────────────────────────────────┐
│  new Report()                              │
│  → query DB (500ms)                        │
│  → parse 10MB file (300ms)                 │
│  → tính toán (200ms)                       │
│  Tổng: 1000ms mỗi lần tạo                 │
└────────────────────────────────────────────┘

✅ GIẢI PHÁP: Prototype
┌────────────────────────────────────────────┐
│  report.clone()                            │
│  → sao chép object có sẵn (1ms)            │
│  → chỉ sửa phần khác biệt                  │
└────────────────────────────────────────────┘
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────┐
│  Prototype (interface)      │
│─────────────────────────────│
│  + clone(): Prototype       │
└─────────────┬───────────────┘
              │ implements
              ▼
┌─────────────────────────────┐
│  ConcretePrototype          │
│─────────────────────────────│
│  - fieldA: string           │
│  - fieldB: number           │
│  - nested: NestedObject     │
│─────────────────────────────│
│  + clone(): ConcretePrototype│  ← shallow/deep copy
└─────────────────────────────┘
```

### Shallow vs Deep Copy

```
Shallow Copy:              Deep Copy:
┌──────────────┐           ┌──────────────┐
│ Prototype    │           │ Prototype    │
│  ├─ fieldA   │           │  ├─ fieldA   │
│  └─ nested ──┼──┐        │  └─ nested ──┼──┐
└──────────────┘  │        └──────────────┘  │
┌──────────────┐  │        ┌──────────────┐  │
│ Clone        │  │        │ Clone        │  │
│  ├─ fieldA   │  │        │  ├─ fieldA   │  │
│  └─ nested ──┼──┘  ←     │  └─ nested ──┼──┘  ←
└──────────────┘  dùng     └──────────────┘  tạo
                  chung                      mới
                  nested                     nested
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface Prototype {
  clone(): Prototype;
}

class Report implements Prototype {
  constructor(
    public title: string,
    public data: number[],
    public metadata: { author: string; createdAt: Date }
  ) {}

  // Deep copy — clone nested object
  clone(): Report {
    return new Report(
      this.title,
      [...this.data],
      { ...this.metadata, createdAt: new Date(this.metadata.createdAt) }
    );
  }
}

// Sử dụng
const original = new Report("Sales", [1, 2, 3], {
  author: "Alice",
  createdAt: new Date(),
});

const copy = original.clone();
copy.title = "Sales Q2"; // chỉ sửa bản copy
copy.data.push(4);       // không ảnh hưởng original (deep copy)
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🚀 **Nhanh** | Không khởi tạo lại từ đầu, chỉ clone |
| 🎯 **Ẩn chi tiết** | Client không cần biết cách khởi tạo |
| 🔄 **Linh hoạt** | Clone rồi sửa từng phần |
| 🧩 **Giảm phụ thuộc** | Không cần constructor phức tạp |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🐛 **Deep copy khó** | Nested object phải clone thủ công |
| 🔗 **Circular reference** | Object tham chiếu vòng khó clone |
| 🧩 **Phức tạp** | Overkill cho object đơn giản |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Khởi tạo tốn kém (DB, file, network) | ✅ Rất phù hợp |
| Cần nhiều bản tương tự, khác ít | ✅ Phù hợp |
| Object có cấu trúc phức tạp | ✅ Phù hợp |
| Object đơn giản, khởi tạo rẻ | ⚠️ Không cần thiết |

---

## 🔗 Liên quan

- **2.1.2 Factory Method** — Factory có thể dùng Prototype để tạo object
- **2.1.4 Builder** — Builder xây từng bước, Prototype clone nguyên khối
- **2.2.1 Adapter** — Adapter có thể clone object trước khi chuyển đổi

---

## 📁 Cấu trúc thư mục

```
2.1.5-prototype/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.1-creational/2.1.5-prototype
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Prototype - Refactoring Guru](https://refactoring.guru/design-patterns/prototype)
- 📖 [Prototype - Source Making](https://sourcemaking.com/design_patterns/prototype)

---

## ⏭️ Bài tiếp theo

→ [2.2 Structural Patterns](../../2.2-structural/README.md)