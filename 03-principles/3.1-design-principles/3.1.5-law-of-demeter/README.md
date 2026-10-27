# 🤝 3.1.5 Law of Demeter (LoD)

> **Chỉ nói chuyện với bạn thân, không nói chuyện với người lạ.**
> Object chỉ gọi method của: chính nó, tham số, thuộc tính của nó, object nó tạo ra.

---

## 🎯 Vấn đề

Chuỗi method gọi xuyên qua nhiều object:

- **Coupling cao** — biết quá sâu cấu trúc bên trong object khác
- **Khó sửa** — đổi cấu trúc 1 object vỡ nhiều nơi gọi
- **Khó test** — phải mock cả chuỗi object
- **Vi phạm encapsulation** — lộ cấu trúc nội bộ

```
❌ VI PHẠM LoD                      ✅ TUÂN THỦ LoD
┌─────────────────────┐            ┌─────────────────────┐
│ customer            │            │ customer            │
│   .getAddress()     │            │   .getAddress()     │
│   .getCity()        │  ──LoD──▶  │   .getCity()        │
│   .getZipCode()     │            │   .getZipCode()     │
│   .getCountry()     │            │                     │
│                     │            │ customer            │
│ a.b.c.d.method()    │            │   .getFullAddress() │
└─────────────────────┘            └─────────────────────┘
```

---

## 🧩 Dấu hiệu vi phạm

```
DẤU HIỆU VI PHẠM LoD
│
├─ Chuỗi gọi: a.b.c.d.method()
│
├─ Object biết quá sâu cấu trúc object khác
│
├─ "Train wreck" — đoàn tàu method chaining dài
│
├─ Sửa 1 object phải sửa nhiều nơi gọi
│
└─ Gọi method của object trả về từ method khác
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Train wreck — biết quá sâu cấu trúc
const country = customer.getAddress().getCity().getCountry();

// ✅ GOOD: Hỏi object trực tiếp
const country = customer.getCountry();
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🔒 **Encapsulation** | Cấu trúc nội bộ không bị lộ |
| 🔧 **Dễ sửa** | Đổi cấu trúc 1 object không vỡ nơi khác |
| 🧪 **Dễ test** | Mock ít object hơn |
| 🤝 **Coupling thấp** | Object ít phụ thuộc lẫn nhau |

---

## ⚠️ Lưu ý

| Lưu ý | Giải thích |
|-------|------------|
| **Không áp dụng cứng nhắc** | Đôi khi chain hợp lý (ví dụ: builder pattern, stream API) |
| **Không tạo method trung gian quá nhiều** | Cân bằng — đừng thêm hàng trăm method "delegate" |
| **Phân biệt với method chaining** | Builder `.setA().setB()` là OK — cùng 1 object |

> 💡 **Nguyên tắc:** Object nên gọi method của **bạn thân** (friends), không gọi method của **bạn của bạn thân** (strangers).

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Chuỗi gọi a.b.c.d.method() | ✅ Áp dụng LoD |
| Object biết quá sâu cấu trúc khác | ✅ Áp dụng LoD |
| Builder pattern `.setA().setB()` | ❌ Không áp dụng — cùng object |
| Stream API `.map().filter().reduce()` | ❌ Không áp dụng — cùng object |
| Cần truy cập sâu 1 lần hiếm khi | ⚠️ Cân nhắc |

---

## 🔗 Liên quan

- **3.2.1 SRP** — Class 1 trách nhiệm giúp giảm nhu cầu gọi sâu
- **2.2.3 Facade** — Pattern cung cấp interface đơn giản, giảm gọi sâu
- **2.2.4 Proxy** — Pattern kiểm soát truy cập object

---

## 📁 Cấu trúc thư mục

```
3.1.5-law-of-demeter/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.5-law-of-demeter
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Law of Demeter - Wikipedia](https://en.wikipedia.org/wiki/Law_of_Demeter)

---

## ⏭️ Bài tiếp theo

→ [3.1.6 Composition over Inheritance](../3.1.6-composition-over-inheritance/README.md)