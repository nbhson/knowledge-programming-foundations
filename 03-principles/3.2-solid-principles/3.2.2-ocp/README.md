# 🔓 3.2.2 OCP — Open/Closed Principle

> **Mở rộng được, đóng sửa đổi.**
> Thêm tính năng mới bằng code mới, không sửa code cũ.

---

## 🎯 Vấn đề

Mỗi lần thêm tính năng phải sửa code cũ:

- **Rủi ro vỡ** — sửa code đang chạy tốt
- **Khó test** — phải test lại toàn bộ
- **Vi phạm SRP** — class phình to vì thêm nhánh mới
- **Khó mở rộng** — mỗi tính năng mới = sửa nhiều chỗ

```
❌ VI PHẠM OCP                      ✅ TUÂN THỦ OCP
┌─────────────────────┐            ┌─────────────────────┐
│ PaymentProcessor    │            │ PaymentProcessor    │
│  if (type == "card")│            │  └─ interface       │
│  if (type == "cash")│  ──OCP──▶  │     ├─ CardPayment  │
│  if (type == "bank")│            │     ├─ CashPayment  │
│  // thêm mới = sửa │            │     └─ BankPayment  │
│  // code cũ         │            │  // thêm mới = thêm │
└─────────────────────┘            │  // class mới       │
                                   └─────────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: thêm payment mới phải sửa if/else
function processPayment(type: string, amount: number) {
  if (type === "card") { /* ... */ }
  else if (type === "cash") { /* ... */ }
  // thêm "bank" → phải sửa hàm này
}

// ✅ GOOD: thêm payment mới = thêm class mới
interface PaymentMethod {
  pay(amount: number): void;
}
class CardPayment implements PaymentMethod { pay(amount: number) { /* ... */ } }
class CashPayment implements PaymentMethod { pay(amount: number) { /* ... */ } }
// thêm "bank" → thêm class BankPayment, không sửa code cũ
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🔧 **An toàn** | Code cũ không bị sửa, không vỡ |
| 🚀 **Mở rộng nhanh** | Thêm tính năng = thêm class mới |
| 🧪 **Dễ test** | Test class mới riêng, không đụng code cũ |
| 📖 **Dễ đọc** | Không if/else dài lê thê |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Nhiều if/else theo type | ✅ Dùng polymorphism/strategy |
| Thêm tính năng thường xuyên | ✅ Thiết kế mở rộng |
| Code ổn định, ít thay đổi | ⚠️ Đừng over-engineer |
| Chỉ 1-2 loại cố định | ❌ Không cần abstraction |

> 💡 **Kiểm tra:** "Thêm tính năng mới có phải sửa code cũ không?"

---

## 🔗 Liên quan

- **2.3.1 Strategy** — Pattern hoán đổi behavior, thực thi OCP
- **2.2.2 Decorator** — Pattern thêm behavior không sửa class gốc
- **3.2.5 DIP** — Phụ thuộc abstraction giúp mở rộng dễ

---

## 📁 Cấu trúc thư mục

```
3.2.2-ocp/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.2-solid-principles/3.2.2-ocp
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [3.2.3 LSP — Liskov Substitution Principle](../3.2.3-lsp/README.md)