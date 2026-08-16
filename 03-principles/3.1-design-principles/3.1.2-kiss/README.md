# 🧘 3.1.2 KISS (Keep It Simple, Stupid)

> **Giữ mọi thứ đơn giản.** Code đơn giản = dễ đọc, dễ hiểu, dễ sửa.
> Phức tạp hóa không cần thiết là kẻ thù của maintainability.

---

## 🎯 Vấn đề

Code phức tạp quá mức dẫn đến:

- **Khó hiểu** — người khác (và chính bạn sau 6 tháng) không đọc nổi
- **Khó sửa** — sửa 1 chỗ phải hiểu cả hệ thống
- **Dễ bug** — càng nhiều nhánh, càng nhiều chỗ sai
- **Tốn thời gian** — viết lâu, review lâu, maintain lâu

```
❌ PHỨC TẠP HÓA                    ✅ ĐƠN GIẢN HÓA
┌─────────────────────┐            ┌─────────────────────┐
│ Generic<T>          │            │ function            │
│ AbstractFactory     │  ──KISS──▶ │   rõ ràng,          │
│ 20 layers deep      │            │   đúng việc         │
│ Over-engineering    │            │   đúng lúc          │
└─────────────────────┘            └─────────────────────┘
```

---

## 🧩 Dấu hiệu code phức tạp

```
DẤU HIỆU VI PHẠM KISS
│
├─ Cần suy nghĩ quá lâu để hiểu 1 function
│
├─ Generic/abstraction dùng cho 1 trường hợp duy nhất
│
├─ Nested ternary, nested if quá sâu
│
├─ Class hierarchy quá nhiều tầng
│
└─ "Chỉ cần 1 dòng, sao phải 50 dòng?"
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Over-engineered
type ProcessResult<T> = T extends string ? StringProcessor<T> : NumberProcessor<T>;
abstract class BaseProcessor<T> { abstract process(input: T): T; }

// ✅ GOOD: Simple and clear
function processInput(input: string): string {
  return input.trim().toLowerCase();
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 📖 **Dễ đọc** | Hiểu ngay không cần suy nghĩ |
| 🔧 **Dễ sửa** | Thay đổi nhỏ, ít rủi ro |
| 🐛 **Ít bug** | Ít nhánh, ít phức tạp, ít sai |
| 👥 **Dễ review** | Đồng đội duyệt nhanh, góp ý tốt hơn |

---

## ⚠️ Lưu ý

| Lưu ý | Giải thích |
|-------|------------|
| **Đơn giản ≠ sơ sài** | Vẫn đủ chức năng, chỉ bỏ phức tạp thừa |
| **Đơn giản theo ngữ cảnh** | Bài toán phức tạp thì code phức tạp là đúng |
| **Đơn giản hóa dần** | Viết đơn giản trước, thêm phức tạp khi thực sự cần |

> 💡 **Nguyên tắc:** Nếu bạn cần suy nghĩ quá nhiều để hiểu code → code quá phức tạp.

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Code bắt đầu phức tạp hóa | ✅ Áp dụng KISS |
| Generic dùng 1 lần | ✅ Bỏ generic, viết cụ thể |
| Abstraction nhiều tầng không cần thiết | ✅ Giảm tầng |
| Bài toán thực sự phức tạp | ⚠️ Phức tạp là hợp lý, nhưng tách nhỏ |
| Cần performance tối ưu | ⚠️ Cân bằng đơn giản vs hiệu năng |

---

## 🔗 Liên quan

- **3.1.3 YAGNI** — KISS đơn giản hóa cái có, YAGNI đừng thêm cái chưa cần
- **3.2.1 SRP** — Class 1 trách nhiệm giúp code đơn giản hơn
- **2.1.4 Builder** — Pattern giúp giữ constructor đơn giản khi object phức tạp

---

## 📁 Cấu trúc thư mục

```
3.1.2-kiss/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.2-kiss
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [KISS - Wikipedia](https://en.wikipedia.org/wiki/KISS_principle)

---

## ⏭️ Bài tiếp theo

→ [3.1.3 YAGNI](../3.1.3-yagni/README.md)