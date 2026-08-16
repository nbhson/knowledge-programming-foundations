# ✂️ 3.2.4 ISP — Interface Segregation Principle

> **Nhiều interface nhỏ, chuyên biệt hơn 1 interface to.**
> Client không nên phụ thuộc method nó không dùng.

---

## 🎯 Vấn đề

Interface to, class phải implement method không cần:

- **Class "câm"** — implement method chỉ để ném exception
- **Khó hiểu** — interface dài, không rõ trách nhiệm
- **Khó mở rộng** — thêm method vào interface vỡ mọi class

```
❌ VI PHẠM ISP                      ✅ TUÂN THỦ ISP
┌─────────────────────┐            ┌─────────────────────┐
│ Worker              │            │ Workable            │
│  work()             │  ──ISP──▶  │  ├─ Workable        │
│  eat()              │            │  └─ Eatable         │
│  sleep()            │            │ Robot: Workable     │
│  └─ Robot           │            │ Human: Workable +   │
│     eat() 🤷        │            │        Eatable      │
└─────────────────────┘            └─────────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Robot phải implement eat(), sleep() — không dùng
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}
class Robot implements Worker {
  work() { /* ... */ }
  eat() { throw new Error("Robot doesn't eat"); } // 🤷
  sleep() { throw new Error("Robot doesn't sleep"); } // 🤷
}

// ✅ GOOD: interface nhỏ, chuyên biệt
interface Workable { work(): void; }
interface Eatable { eat(): void; }
class Robot implements Workable { work() { /* ... */ } }
class Human implements Workable, Eatable { work() { /* ... */ } eat() { /* ... */ } }
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| ✂️ **Gọn** | Class chỉ implement cái nó dùng |
| 🔧 **Dễ mở rộng** | Thêm interface mới không vỡ class cũ |
| 📖 **Rõ ràng** | Interface nhỏ, nhìn hiểu ngay |
| 🧪 **Dễ test** | Mock interface nhỏ dễ hơn |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Class implement method "câm" | ✅ Tách interface |
| Interface > 3-4 method | ✅ Xem xét tách |
| Client chỉ dùng 1 phần interface | ✅ Tách interface |
| Interface nhỏ, chuyên biệt | ❌ Không cần tách thêm |

> 💡 **Kiểm tra:** "Class nào phải implement method nó không dùng?"

---

## 🔗 Liên quan

- **3.2.1 SRP** — ISP là SRP áp dụng cho interface
- **2.2.1 Adapter** — Pattern chuyển interface cho client
- **2.2.4 Proxy** — Pattern kiểm soát truy cập interface

---

## 📁 Cấu trúc thư mục

```
3.2.4-isp/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.2-solid-principles/3.2.4-isp
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [3.2.5 DIP — Dependency Inversion Principle](../3.2.5-dip/README.md)