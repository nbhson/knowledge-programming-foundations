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

**2 trường hợp chính cần Prototype:**
1. **Performance:** khởi tạo expensive (DB, network, heavy computation), clone nhanh hơn.
2. **Decouple:** client không muốn biết concrete class của prototype — muốn clone qua interface chung.

**Lưu ý quan trọng:** Prototype pattern KHÔNG PHẢI là cách để "tránh inheritance". Nó giải quyết vấn đề khác — nếu bạn muốn "clone behavior" → inheritance hoặc composition. Nếu bạn muốn "clone instance with data" → Prototype.

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

### Shallow vs Deep Copy — điểm quan trọng nhất

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
                  chung                        mới
                  nested                       nested
```

- **Shallow copy:** clone fields trực tiếp, nested objects **share reference** giữa original và clone → mutation ở clone ảnh hưởng original.
- **Deep copy:** clone toàn bộ tree → original và clone hoàn toàn độc lập.

**Quy tắc thực tiễn:** mutable nested object → deep clone. Immutable (string, number) → shallow là đủ.

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

**JavaScript built-in: `structuredClone` (2022+)**

```typescript
const original = { a: 1, nested: { b: 2 } };
const copy = structuredClone(original);  // deep clone native
```

**ES6 class với `Object.assign` (shallow clone)**

```typescript
class Point {
  constructor(public x: number, public y: number) {}
  clone(): Point {
    return Object.assign(new Point(0, 0), this);
  }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🚀 **Nhanh** | Không khởi tạo lại từ đầu, chỉ clone | Deep clone thường < 1ms so với 500ms DB query. Tiết kiệm resource đáng kể. |
| 🎯 **Ẩn chi tiết** | Client không cần biết cách khởi tạo | Client chỉ biết interface Prototype, không cần biết `new Report()` tốn gì. |
| 🔄 **Linh hoạt** | Clone rồi sửa từng phần | Start from existing + patch = reduce construction cost. |
| 🧩 **Giảm phụ thuộc** | Không cần constructor phức tạp | Object có thể clone từ nhiều nguồn khác nhau (DB, file, network) mà client không quan tâm. |
| 🧬 **Prototype chain** | JavaScript native hỗ trợ | JS object prototype là built-in mechanism — pattern này rất "native" trong JS ecosystem. |
| 🧪 **Test friendly** | Clone object state đã biết → predictability | Tạo test data từ prototype đã validate → đảm bảo state hợp lệ. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🐛 **Deep copy khó** | Nested object phải clone thủ công | Recursive clone = complex, dễ漏. *Giảm thiểu:* dùng `structuredClone` (native) hoặc thư viện clone (lodash.cloneDeep). |
| 🔗 **Circular reference** | Object tham chiếu vòng khó clone | A → B → A → stack overflow khi deep clone. *Gi giảm thiểu:* detect cycle + handle (JSON replacer strategy, WeakMap). |
| 🧩 **Phức tạp** | Overkill cho object đơn giản | Object có 2 field primitive → clone = thừa abstraction. |
| 🧨 **Mutation confusion** | Shallow vs deep copy nhầm | Programmer expect deep clone nhưng nhận shallow → bug khó phát hiện. *Giảm thiểu:* document rõ ràng, mặc định deep clone. |
| 📦 **Memory leak risk** | Object giữ reference cũ lâu | Prototype reference giữ object sống → GC không thu hồi. *Giảm thiểu:* `clone()` không giữ reference, tạo object mới sạch. |
| 👻 **Không phù hợp immutable data** | Immutable đã clone by design | Record, Readonly, frozen object — không cần clone pattern. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Khởi tạo tốn kém (DB, file, network) | ✅ Rất phù hợp | Clone cost ≪ initialization cost. |
| Cần nhiều bản tương tự, khác ít | ✅ Phù hợp | Patching base object → faster than rebuilding. |
| Object có cấu trúc phức tạp, nhiều nested | ✅ Phù hợp | `structuredClone` handle recursive structures well. |
| Object đơn giản, khởi tạo rẻ | ⚠️ Không cần thiết | `new Foo()` nhanh hơn `clone()` phức tạp. |
| Client đã biết concrete class | ⚠️ Factory đơn giản hơn | Nếu client biết class → factory method đủ. |
| Immutable architecture (Redux, Immer) | ❌ Không cần | Immutable means no mutation → clone là create new. |

**Performance benchmark rough guide:**
| Creation method | Cost | Khi nào chọn |
|-----------------|------|--------------|
| `new Constructor()` | ~0.001ms | Simple objects, few fields |
| `Object.assign({}, proto)` | ~0.002ms | Shallow copy needed |
| `structuredClone(obj)` | ~0.01ms | Deep copy, nested objects |
| `JSON.parse(JSON.stringify(obj))` | ~0.1ms | Simple deep clone, no functions |
| Custom clone method | varies | Most efficient, full control |

---

## 🔗 Liên quan

- **2.1.2 Factory Method** — Factory có thể dùng Prototype để tạo object (create từ base instance).
- **2.1.4 Builder** — Builder xây từng bước, Prototype clone nguyên khối.
- **2.2.1 Adapter** — Adapter có thể clone object trước khi chuyển đổi format.
- **5.12.1 Immutability** — Prototype + immutable = pattern phổ biến trong functional programming.

**Prototype trong JavaScript ecosystem:** JS native prototype mechanism (class inheritance via `__proto__`) đã là "built-in prototype pattern" — đây là điều làm JS khác biệt so với Java/C# (nơi Prototype pattern explicit).

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
- 📖 [MDN structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)

---

## ⏭️ Bài tiếp theo

→ [2.2 Structural Patterns](../../2.2-structural/README.md)
