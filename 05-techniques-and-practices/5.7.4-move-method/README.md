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

## ❌ BAD — thêm 1 case: move sang chỗ "tiện tay" thay vì chỗ sở hữu dữ liệu

```typescript
// ❌ BAD — chuyển shipping sang OrderUtils "cho gọn": logic vẫn xa dữ liệu,
// utils phình thành bãi rác, location vẫn nằm ở Customer
class OrderUtils {
  static shippingFee(customer: Customer, weightKg: number): number {
    if (customer.address.location.urban) return weightKg * URBAN_RATE;
    // ... vẫn đọc sâu vào Customer qua 3 lớp getter
    return weightKg * STANDARD_RATE;
  }
}

// ✅ GOOD — chuyển về Customer, nơi SỞ HỮU location (xem ví dụ chính ở trên)
class Customer {
  shippingFeeFor(weightKg: number): number { /* dùng this.location trực tiếp */ return 0; }
}
```

> Move Method = chuyển về **chủ sở hữu dữ liệu**, không phải chuyển về chỗ "trông gọn". Utils/helper tĩnh là điểm đến sai 90% trường hợp.

---

## ⚖️ Trade-off: move vs giữ nguyên

| Tình huống | Quyết định | Vì sao |
|------------|------------|--------|
| Method đọc sâu `a.b.c.d` của object khác ≥ 2 chỗ | ✅ Move sang chủ dữ liệu | Giảm coupling, rút ngắn chuỗi gọi |
| Method dùng dữ liệu 2 class ngang nhau | ⚖️ Tách đôi hoặc move + delegate | Mỗi nửa về 1 chủ; giữ delegate cũ nếu là public API |
| Method là public API nhiều caller | ⚖️ Move + giữ delegate deprecated | Tránh vỡ caller trong 1 bước |
| Chỉ gọi object khác 1 lần, còn lại dùng field cục bộ | 🚫 Giữ nguyên | Chưa phải Feature Envy, move là thừa |
| Chưa chắc "ai sở hữu dữ liệu" | 🚫 Khoan move | Thiết kế còn mờ — move bừa thành chuyển rác |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Move sang Utils/Helper tĩnh | Bãi rác thủ tục, logic xa dữ liệu hơn cả trước | Điểm đến phải là class sở hữu dữ liệu |
| Quên cập nhật callers (sửa tay từng chỗ) | Sót chỗ gọi cũ → runtime lỗi | Dùng Move refactoring của IDE, chạy full test sau move |
| Move cả method đang là seam test | Test cũ mock sai chỗ, xanh giả | Kiểm tra test nào stub method đó, chuyển mock theo |
| Move qua lại (A→B rồi B→A) giữa 2 PR | Diff nhiễu, history rối | Quyết định chủ sở hữu trước khi move (vẽ phụ thuộc 5 phút) |

---

## ✅ Checklist khi review

- [ ] Method mới nằm ở class sở hữu dữ liệu nó dùng nhiều nhất?
- [ ] Chuỗi gọi `a.b.c.d` đã rút ngắn (không còn Feature Envy)?
- [ ] Mọi callers (kể cả test) đã được cập nhật, full test xanh?
- [ ] Điểm đến không phải Utils/Helper tĩnh?
- [ ] Nếu là public API: có giữ delegate + đánh dấu deprecated cho caller cũ?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.4-move-method
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.5 Decompose Conditional](../5.7.5-decompose-conditional/README.md)