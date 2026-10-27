# 🧱 3.1.6 Composition over Inheritance

> **Kết hợp (composition) thay vì kế thừa (inheritance).**
> Object xây dựng từ các object nhỏ hơn thay vì thừa kế từ class cha.

---

## 🎯 Vấn đề

Kế thừa sâu gây ra:

- **Ràng buộc cứng** — class con không thể thoát khỏi class cha
- **Override vụng về** — class cha thay đổi, class con vỡ
- **Kim cương** — đa kế thừa (multi-inheritance) gây xung đột
- **Khó test** — phải khởi tạo cả cây kế thừa

```
❌ KẾ THỪA SÂU                     ✅ COMPOSITION
┌─────────────────────┐            ┌─────────────────────┐
│ Bird                │            │ Bird                │
│  └─ FlyingBird      │            │  ├─ Flyable         │
│      └─ Penguin     │  ──CoI──▶  │  └─ Speakable       │
│          (🤷 có cánh│            │ Penguin             │
│           nhưng     │            │  ├─ Swimable        │
│           không bay)│            │  └─ Speakable       │
└─────────────────────┘            └─────────────────────┘
```

---

## 🧩 Dấu hiệu nên dùng composition

```
DẤU HIỆU NÊN DÙNG COMPOSITION
│
├─ Class con override nhiều method chỉ để "vô hiệu hóa" (vd: Penguin.bark())
│
├─ Kế thừa sâu nhiều tầng, khó hiểu
│
├─ Chỉ muốn tái sử dụng 1-2 method từ class khác
│
├─ Hành vi (behavior) đa dạng — kết hợp nhiều loại
│
└─ "IS-A" không còn đúng: Penguin "IS-A" Bird nhưng không bay
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Inheritance — Penguin phải override fly() để vô hiệu hóa
class Bird {
  fly() { return "Flying"; }
}
class Penguin extends Bird {
  fly() { return "Can't fly 😢"; } // override vụng về
}

// ✅ GOOD: Composition — chỉ kết hợp behavior cần thiết
class Penguin {
  constructor(private swimmer: Swimmer, private speaker: Speaker) {}
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🔧 **Linh hoạt** | Thêm/bớt behavior bằng cách kết hợp |
| 🔒 **Ít ràng buộc** | Không phụ thuộc class cha |
| 🧪 **Dễ test** | Mock từng phần nhỏ |
| ♻️ **Tái sử dụng** | Behavior là object riêng, dùng được nhiều nơi |

---

## ⚠️ Khi nào vẫn nên dùng inheritance?

| Tình huống | Khuyến nghị |
|------------|-------------|
| "IS-A" thật sự đúng, quan hệ bền vững | ✅ Inheritance |
| Cần polymorphism (dùng chung interface) | ✅ Interface/extend |
| Chỉ tái sử dụng method | ❌ Composition |
| Hành vi đa dạng, thay đổi theo ngữ cảnh | ❌ Composition |

> 💡 **Nguyên tắc:** "Favor composition over inheritance" — ưu tiên composition,
> nhưng inheritance vẫn hữu ích khi quan hệ IS-A thật sự chặt chẽ.

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Class con override method để vô hiệu hóa | ✅ Composition |
| Kế thừa sâu > 2 tầng | ✅ Composition |
| Hành vi đa dạng (bay, bơi, chạy...) | ✅ Composition |
| IS-A chặt chẽ, ổn định | ❌ Inheritance |
| Cần dùng chung interface | ❌ Interface (không phải class kế thừa) |

---

## 🔗 Liên quan

- **2.2.6 Bridge** — Pattern tách abstraction khỏi implementation (dùng composition)
- **2.2.2 Decorator** — Pattern thêm behavior bằng composition
- **2.3.1 Strategy** — Pattern hoán đổi behavior bằng composition
- **1.7 Domain-Driven Design** — Mô hình hóa domain theo hành vi thật

---

## 📁 Cấu trúc thư mục

```
3.1.6-composition-over-inheritance/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx tsx examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.6-composition-over-inheritance
npx tsx examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Composition over Inheritance - Wikipedia](https://en.wikipedia.org/wiki/Composition_over_inheritance)

---

## ⏭️ Bài tiếp theo

→ [3.1.7 GRASP](../3.1.7-grasp/README.md)