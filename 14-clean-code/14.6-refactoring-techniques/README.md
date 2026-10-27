# 🔨 14.6 Refactoring Techniques (Kỹ Thuật Refactoring)

> **Refactoring** là cải thiện code mà **không thay đổi behavior** — giúp code sạch hơn, dễ đọc hơn, dễ bảo trì hơn. Đây là kỹ năng phân biệt junior vs senior developer.

---

## 🎯 Common Refactoring Moves

### 1. Extract Function

Dùng khi: hàm quá dài, có đoạn logic có thể đặt tên rõ, hoặc logic lặp ở nhiều nơi.

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

// ✅ After — tách thành các hàm nhỏ, mỗi hàm 1 job
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

**Quy tắc:** function mới phải có tên rõ nghĩa hơn đoạn code đã tách. Nếu phải giải thích bằng comment thì tên chưa đủ tốt.

### 2. Extract Class

Dùng khi: class đang làm nhiều việc (vi phạm SRP), hoặc có nhóm method/field luôn đi cùng nhau.

```typescript
// ❌ Before — class làm quá nhiều việc
class ReportGenerator {
  fetchData()    { /* HTTP request */ }
  transformData(){ /* mapping logic */ }
  renderHTML()   { /* DOM rendering */ }
  exportPDF()    { /* file write */ }
  sendEmail()    { /* SMTP */ }
}

// ✅ After — mỗi class 1 trách nhiệm
class DataFetcher    { fetchData()    { /* HTTP */ } }
class DataTransformer { transformData(){ /* mapping */ } }
class ReportRenderer  { renderHTML()   { /* DOM */ } }
class PDFExporter     { exportPDF()    { /* file write */ } }
class EmailSender     { sendEmail()    { /* SMTP */ } }
```

**Dấu hiệu nên extract class:**
- Class có > 5 trách nhiệm rõ ràng
- Một nhóm method luôn được gọi cùng nhau
- Class có private fields chỉ dùng bởi subset methods

### 3. Replace Conditional với Polymorphism

Dùng khi: có `if/switch` dài kiểm tra type/condition và mỗi branch có logic riêng.

```typescript
// ❌ Before — conditional dài, thêm type mới = sửa function
function get_price(product: Product): number {
  if (product.type === 'book')         return product.basePrice * 0.9;
  if (product.type === 'electronics')  return product.basePrice * 1.1;
  if (product.type === 'food')         return product.basePrice;
  throw new Error('Unknown product type');
}

// ✅ After — polymorphism, thêm type mới = thêm class con
abstract class Product { abstract getPrice(): number; }
class Book        extends Product { getPrice() { return this.basePrice * 0.9; } }
class Electronics extends Product { getPrice() { return this.basePrice * 1.1; } }
class Food        extends Product { getPrice() { return this.basePrice; } }
```

> 💡 **Open/Closed Principle:** class mở để extend (thêm subclass), đóng để modify (sửa superclass). Polymorphism thực thi OCP.

### 4. Inline Function

Dùng khi: hàm wrapper quá đơn giản, tên không thêm giá trị so với body.

```typescript
// ❌ Wrapper không cần thiết
function getPrice(item: Item): number {
  return item.price;
}
const total = getPrice(item);  // getName() equivalent — redundant

// ✅ Inline — đọc thẳng
const total = item.price;
```

**Quy tắc:** inline khi function body ≤ 1 dòng và tên không clearer hơn call site.

---

## 🚩 Code Smell Detection (Phát Hiện Code Độc)

```
┌─────────────────┬─────────────────────────────┬──────────────────────────┐
│ Smell           │ Dấu hiệu                    │ Hướng khắc phục          │
├─────────────────┼─────────────────────────────┼──────────────────────────┤
│ Long function   │ > 20 dòng, nhiều step       │ Extract Method           │
│                 │ không liên quan trực tiếp    │                          │
├─────────────────┼─────────────────────────────┼──────────────────────────┤
│ Divergent change│ Cùng file thay đổi vì nhiều  │ Split class theo         │
│                 │ lý do khác nhau              │ responsibility            │
├─────────────────┼─────────────────────────────┼──────────────────────────┤
│ Shotgun surgery │ Cùng thay đổi ở nhiều nơi   │ Centralize logic vào     │
│                 │ (fix bug A phải sửa 10 file) │ 1 hàm/class              │
├─────────────────┼─────────────────────────────┼──────────────────────────┤
│ Feature envy    │ Class A gọi nhiều method    │ Move Method → B          │
│                 │ của class B hơn chính nó    │                          │
├─────────────────┼─────────────────────────────┼──────────────────────────┤
│ Data clump      │ Cùng group field lặp lại    │ Extract Class →          │
│                 │ trong nhiều nơi              │ Parameter Object         │
├─────────────────┼─────────────────────────────┼──────────────────────────┤
│ Primitive       │ String/number thay vì       │ Replace with             │
│ obsession       │ object có nghĩa              │ Reference/Class          │
└─────────────────┴─────────────────────────────┴──────────────────────────┘
```

**Mẹo nhận Feature Envy (dễ bỏ qua):** nếu class A có 5 method gọi `b.getX()`, `b.setY()`, `b.validate()` và chỉ 1 method gọi `this.*`, thì method đó nên nằm ở B.

---

## 🎯 Refactoring Checklist

```
✅ Luôn chạy test trước khi refactor
✅ Refactor từng bước nhỏ, commit sau mỗi bước
✅ Không refactor và thêm tính năng cùng lúc
✅ Đọc lại code sau refactor — phải rõ hơn trước
✅ Không refactor nếu deadline cận kề
✅ Commit message ghi rõ "refactor: ..." để phân biệt với feature/fix
```

**Trigger để bắt đầu refactor:**
- Bạn phải đọc 3 lần mới hiểu 1 function
- Thêm 1 tính năng nhỏ nhưng phải sửa 5 file không liên quan
- Test case phải setup phức tạp chỉ để test 1 function đơn giản
- Bạn cảm thấy "sợ" khi touch code này

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Refactor = viết lại từ đầu" | Refactor là **small incremental change** có test bao phủ. Rewrite là dự án riêng |
| "Code cũ không cần refactor" | Code cũ = debt có lãi suất cao nhất. Refactor sớm = tiết kiệm nhất |
| "Refactor chỉ làm architect" | Boy Scout Rule: ai cũng refactor nhỏ mỗi ngày khi touch code |
| "Refactor làm chậm release" | Short-term slowdown, long-term acceleration. Debt compound interest |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Tách nhỏ function/class | Giữ code dính chùm |
| Dùng polymorphism thay conditional dài | Thêm if/else dài không giới hạn |
| Refactor khi phát hiện smell | Bỏ qua code xấu |
| Commit từng bước refactor | Refactor ẩu rồi commit ầm |
| Test bao phủ trước khi refactor | Refactor không có safety net |

---

## 📚 Tài liệu

- 📖 [Refactoring — Martin Fowler](https://refactoring.com/)
- 📖 [Clean Code: Functions — Chapter 5]
- 📖 [Working Effectively with Legacy Code — Michael Feathers]

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 14-clean-code/14.6-refactoring-techniques
npx tsx examples/index.ts
```

---

## ⏭️ Bạn đã hoàn thành Nhóm 14: Clean Code! 🎉
