# 📦 5.7.4 Move Method

> Khi một method dùng dữ liệu của class KHÁC nhiều hơn dữ liệu của chính nó (**Feature Envy**), hãy chuyển method sang class sở hữu dữ liệu đó. Behavior giữ nguyên, trách nhiệm đặt đúng chỗ (SRP).

---

## 🎯 Vấn đề

```
❌ TRƯỚC — Feature Envy:
   Order.shippingFee() đọc `customer.address.location` đến 3 chỗ
   → Order dùng dữ liệu của Customer nhiều hơn dữ liệu của chính nó

✅ SAU — Move Method:
   Customer.shippingFeeFor(weightKg) — location nằm ở Customer
   Order.shippingFee() chỉ còn: return customer.shippingFeeFor(weightKg)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ TRƯỚC — shipping tính toan sai chỗ
class Order {
  shippingFee(): number {
    const loc = this.customer.address.location;
    if (loc.urban) return weightKg * URBAN_RATE;
    if (loc.province === "Hà Nội") return weightKg * HANOI_RATE;
    return weightKg * STANDARD_RATE;
  }
}

// ✅ SAU — logic chuyển sang Customer
class Customer {
  shippingFeeFor(weightKg: number): number {
    if (this.location.urban) return weightKg * URBAN_RATE;
    if (this.location.province === "Hà Nội") return weightKg * HANOI_RATE;
    return weightKg * STANDARD_RATE;
  }
}

class Order {
  shippingFee(): number {
    return this.customer.shippingFeeFor(this.weightKg);
  }
}
```

---

## 🔍 Dấu hiệu Feature Envy

- Method gọi `this.xxx.xxx.yyy()` nhiều hơn dùng field cục bộ
- Method liên tục lấy dữ liệu từ object khác qua getter dài
- Sửa quy tắc liên quan object khác → phải mở class này ra sửa

> 💡 Dấu hiệu đối nghịch: method nằm **ở đúng class** nhưng mọi thứ nó dùng đều qua một đối tượng khác (vd `this.data.getX()`) — cân nhắc chuyển hẳn.

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.4-move-method
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.5 Decompose Conditional](../5.7.5-decompose-conditional/README.md)