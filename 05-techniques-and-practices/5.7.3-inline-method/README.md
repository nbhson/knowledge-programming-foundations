# 🪢 5.7.3 Inline Method

> Khi một method chỉ là **wrapper quá đơn giản** (đi đường vòng), hãy inline nó vào chỗ gọi. Ngược lại, method có **ý nghĩa nghiệp vụ** riêng thì GIỮ lại.

---

## 🎯 Vấn đề

```
❌ NÊN INLINE:
   checkout() → netWithTax(price, qty) + fee
   netWithTax() chỉ là `price * qty * (1 + tax)` — 1 dòng, 1 phép toán

✅ SAU: checkout() tính thẳng
   price * qty * (1 + ImTaxRate) + ImShippingFee

⚠️ KHÔNG INLINE:
   isOvertimeWeek(hours) → `hours > 40` là một QUY TẮC nghiệp vụ
   — giữ lại để 1 nơi duy nhất định nghĩa "bao nhiêu giờ là overtime"
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ TRƯỚC — wrapper thừa
class Checkout {
  private netWithTax(price: number, qty: number): number {
    return price * qty * (1 + TAX_RATE);
  }
  checkout(price: number, qty: number): number {
    return this.netWithTax(price, qty) + SHIPPING_FEE;
  }
}

// ✅ SAU — inline thẳng
class Checkout {
  checkout(price: number, qty: number): number {
    return price * qty * (1 + TAX_RATE) + SHIPPING_FEE;
  }
}
```

---

## 📏 Khi nào INLINE / Khi nào GIỮ

| Tình huống | Quyết định |
|------------|------------|
| Chỉ gọi 1 method khác, tên không thêm nghĩa | ✅ INLINE |
| Tên nói lên ý định nghiệp vụ (`isOvertimeWeek`) | 🚫 GIỮ |
| Được dùng ở nhiều nơi | 🚫 GIỮ |
| Logic có thể đổi sau này (1 chỗ để sửa) | 🚫 GIỮ |

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.3-inline-method
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.4 Move Method](../5.7.4-move-method/README.md)