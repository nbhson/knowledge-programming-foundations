# 🔨 14.6 Refactoring Techniques (Kỹ Thuật Refactoring)

> **Refactoring** là cải thiện code mà **không thay đổi behavior** — giúp code sạch hơn, dễ đọc hơn, dễ bảo trì hơn.

---

## 🎯 Common Refactoring Moves

### 1. Extract Function

```typescript
// ❌ Before — logic dính vào function lớn
function handleCheckout(cart: Cart): Receipt {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.1;
  const discount = cart.coupon ? applyCoupon(subtotal, cart.coupon) : 0;
  const total = subtotal + tax - discount;
  const receipt = { items: cart.items, subtotal, tax, discount, total };
  saveToDB(receipt);
  sendEmail(cart.user.email, receipt);
  return receipt;
}

// ✅ After — tách thành các hàm nhỏ
function calculateCheckout(cart: Cart): CheckoutCalc {
  const subtotal = calcSubtotal(cart);
  const tax = calcTax(subtotal);
  const discount = calcDiscount(subtotal, cart.coupon);
  return { subtotal, tax, discount, total: subtotal + tax - discount };
}

function executeCheckout(cart: Cart): Receipt {
  const calc = calculateCheckout(cart);
  const receipt = buildReceipt(cart, calc);
  persistReceipt(receipt);
  notifyUser(cart.user.email, receipt);
  return receipt;
}
```

### 2. Extract Class

```typescript
// ❌ Before — class làm quá nhiều việc
class ReportGenerator {
  fetchData() { /* HTTP */ }
  transformData() { /* mapping */ }
  renderHTML() { /* DOM */ }
  exportPDF() { /* file write */ }
  sendEmail() { /* email */ }
}

// ✅ After — mỗi class 1 trách nhiệm
class DataFetcher    { fetchData() { /* HTTP */ } }
class DataTransformer { transformData() { /* mapping */ } }
class ReportRenderer  { renderHTML() { /* DOM */ } }
class PDFExporter     { exportPDF() { /* file write */ } }
class EmailSender     { sendEmail() { /* email */ } }
```

### 3. Replace Conditional với Polymorphism

```typescript
// ❌ Before — conditional dài
function get_price(product: Product): number {
  if (product.type === 'book')   return product.basePrice * 0.9;
  if (product.type === 'electronics') return product.basePrice * 1.1;
  if (product.type === 'food')   return product.basePrice;
  throw new Error('Unknown product type');
}

// ✅ After — polymorphism
abstract class Product { abstract getPrice(): number; }
class Book extends Product { getPrice() { return this.basePrice * 0.9; } }
class Electronics extends Product { getPrice() { return this.basePrice * 1.1; } }
class Food extends Product { getPrice() { return this.basePrice; } }
```

---

## 🚩 Code Smell Detection (Phát Hiện Code Độc)

```
┌─────────────────┬─────────────────────────────┬──────────────────┐
│ Smell           │ Dấu hiệu                    │ Hướng khắc phục  │
├─────────────────┼─────────────────────────────┼──────────────────┤
│ Long function   | > 20 dòng                  | Extract method   │
│ Divergent change| Cùng file thay đổi vì nhiều│ Split class      │
│                 | lý do khác nhau              |                  │
│ Shotgun surgery | Cùng thay đổi ở nhiều nơi  | Centralize logic │
│ Feature envy    | Class A gọi nhiều method   | Move method      │
│                 | của class B                 |                  │
│ Data clump      | Cùng group field lặp lại   | Extract class    │
│                 | trong nhiều nơi             |                  │
│ Primitive obsession| String/number thay vì    | Replace with     │
│                 | object có nghĩa              | reference        │
└─────────────────┴─────────────────────────────┴──────────────────┘
```

---

## 🎯 Refactoring Checklist

```
✅ Luôn chạy test trước khi refactor
✅ Refactor từng bước nhỏ, commit sau mỗi bước
✅ Không refactor và thêm tính năng cùng lúc
✅ Đọc lại code sau refactor — phải rõ hơn trước
✅ Không refactor nếu deadline cận kề
```

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Tách nhỏ function/class | Giữ code dính chùm |
| Dùng polymorphism thay conditional | Thêm if/else dài |
| Refactor khi phát hiện smell | Bỏ qua code xấu |
| Commit từng bước refactor | Refactor ẩu rồi commit ầm |

---

## 📚 Tài liệu

- 📖 [Refactoring — Martin Fowler](https://refactoring.com/)
- 📖 [Clean Code: Functions — Chapter 5]

---

## ⏭️ Bạn đã hoàn thành Nhóm 14: Clean Code! 🎉
