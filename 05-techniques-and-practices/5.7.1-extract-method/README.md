# ✂️ 5.7.1 Extract Method

> Tách một đoạn code dài (validate + tính toán + định dạng) thành các **method nhỏ có tên** — mỗi method chỉ làm MỘT việc, hành vi không đổi.

---

## 🎯 Vấn đề

Một hàm dài làm mọi thứ rất khó đọc, khó test, khó tái dùng:

```
❌ TRƯỚC — print() dồn hết: validate + subtotal + VIP + gift + format

✅ SAU — mỗi bước là 1 method nhỏ:
   hasItems() → validate() → subtotal() → applyVip() → applyGift() → format()
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ TRƯỚC — một hàm dài
function print(items: OrderItem[], isVip: boolean): string {
  // validate items...
  let total = 0;
  for (const item of items) total += item.qty * item.price;
  if (isVip) total *= 0.9;
  if (totalQty >= 5) total *= 0.85;
  return `Tổng: ${total} đồng`;
}

// ✅ SAU — mỗi bước một method
function print(items: OrderItem[], isVip: boolean): string {
  if (!hasItems(items)) return "Hóa đơn rỗng";
  validate(items);
  return format(applyGift(applyVip(subtotal(items), isVip), items));
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 📖 **Đọc như bảng mục lục** | `print()` chỉ còn các bước đặt tên rõ nghĩa |
| 🧪 **Test riêng được** | Mỗi method test độc lập, không cần chạy cả luồng |
| ♻️ **Tái dùng** | `subtotal()`, `validate()` dùng lại ở nhiều nơi |
| 🐞 **Dễ fix bug** | Biết ngay lỗi nằm ở bước applyVip hay format |

> ⚠️ Đừng tách quá nhỏ thành "sốt ruột" — method vô nghĩa (1 dòng, tên thừa) thường bị **Inline** ngược lại (xem 5.7.3).

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.1-extract-method
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.2 Rename Variable/Method](../5.7.2-rename-variable-method/README.md)