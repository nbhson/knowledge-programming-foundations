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

## ❌ BAD — thêm 1 case: inline luôn cả rule nghiệp vụ

```typescript
const OVERTIME_THRESHOLD = 40;

// ❌ BAD — "tiện tay" inline cả quy tắc nghiệp vụ vào chỗ gọi
function payroll(hours: number, rate: number): number {
  const overtime = hours > 40 ? (hours - 40) * rate * 1.5 : 0; // 40 là gì? mai đổi 44 thì tìm ở đâu?
  return hours * rate + overtime;
}

// ✅ GOOD — giữ rule có tên, inline chỉ phần phép toán thuần túy
function isOvertimeWeek(hours: number): boolean {
  return hours > OVERTIME_THRESHOLD; // 1 nơi duy nhất định nghĩa "overtime là gì"
}
function payroll(hours: number, rate: number): number {
  const overtime = isOvertimeWeek(hours) ? (hours - OVERTIME_THRESHOLD) * rate * 1.5 : 0;
  return hours * rate + overtime;
}
```

> Inline **phép toán**, giữ **quy tắc**. Số `40` gắn với luật lao động thì phải có tên; `price * qty` thì inline thẳng được.

---

## ⚖️ Trade-off: inline vs extract (2 chiều ngược nhau)

| Tình huống | Quyết định | Vì sao |
|------------|------------|--------|
| Wrapper 1 dòng, tên không thêm nghĩa | ✅ Inline | Bớt 1 lớp indirection |
| Rule nghiệp vụ có thể đổi (ngưỡng, công thức) | 🚫 Giữ method | 1 nơi để sửa, dễ tìm bằng tên |
| Method dùng ở ≥ 2 nơi | 🚫 Giữ method | Inline là nhân bản code |
| Method là seam để test/mock | 🚫 Giữ method | Inline làm mất điểm cắt để stub |
| Đang dọn "hàm sốt ruột" sau extract quá tay | ✅ Inline | Cân bằng lại với 5.7.1 |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Inline hàm có side effect gọi 2 lần | `getAndIncrement()` inline thành 2 chỗ gọi → đếm 2 lần | Chỉ inline hàm **pure** hoặc gọi đúng 1 lần |
| Inline làm biểu thức khổng lồ (> 80 ký tự, lồng 3 tầng) | Khó đọc hơn cả bản wrapper | Ngưỡng: inline xong vẫn đọc được trong 1 hơi |
| Inline method của class khác (phá encapsulation) | Lộ field private, caller phụ thuộc implementation | Chỉ inline trong cùng class/phạm vi sở hữu |
| Inline + sửa logic cùng lúc | Không phân biệt được "dọn" hay "đổi hành vi" | Inline y nguyên trước, test xanh rồi mới sửa |

---

## ✅ Checklist khi review

- [ ] Method bị inline có phải wrapper vô nghĩa (không phải rule nghiệp vụ)?
- [ ] Hàm được inline là pure (không side effect, không đếm gọi)?
- [ ] Sau inline, chỗ gọi vẫn đọc được trong 1 hơi (không biểu thức khổng lồ)?
- [ ] Không phá vỡ encapsulation (không lôi field private ra ngoài)?
- [ ] Diff chứng minh hành vi không đổi (test xanh, không lẫn sửa logic)?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.3-inline-method
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.4 Move Method](../5.7.4-move-method/README.md)