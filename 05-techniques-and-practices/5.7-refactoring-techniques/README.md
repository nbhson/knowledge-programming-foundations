# 🔄 5.7 Refactoring Techniques (Kỹ Thuật Refactoring)

> **Refactoring** là cải thiện cấu trúc code mà **không thay đổi hành vi** — làm code sạch hơn, dễ đọc, dễ bảo trì.

---

## 📚 Mục Lục

| # | Kỹ Thuật | Mục Đích |
|---|----------|----------|
| 5.7.1 | [Extract Method](#571-extract-method) | Tách logic thành hàm riêng |
| 5.7.2 | [Rename Variable/Method](#572-rename-variablemethod) | Đặt tên rõ nghĩa hơn |
| 5.7.3 | [Inline Method](#573-inline-method) | Gộp method đơn giản |
| 5.7.4 | [Move Method](#574-move-method) | Di chuyển method đến class phù hợp |
| 5.7.5 | [Decompose Conditional](#575-decompose-conditional) | Tách logic điều kiện phức tạp |
| 5.7.6 | [Replace Magic Number](#576-replace-magic-number) | Dùng named constant |

---

## 5.7.1 Extract Method

**Tách đoạn code dài thành hàm riêng có tên rõ nghĩa.**

```typescript
// ❌ TRƯỚC: Hàm quá dài, khó đọc
function processOrder(order: Order): string {
  // Validate
  if (!order.items || order.items.length === 0) {
    return 'Order is empty';
  }
  if (!order.customer?.email) {
    return 'Missing customer email';
  }

  // Calculate total
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }

  // Apply discount
  if (order.customer.isVIP) {
    total *= 0.9;
  }

  // Format output
  return `Total: $${total.toFixed(2)}`;
}

// ✅ SAU: Tách thành các method nhỏ
function processOrder(order: Order): string {
  if (!validateOrder(order)) {
    return 'Invalid order';
  }

  const total = calculateTotal(order);
  const discountedTotal = applyDiscount(total, order.customer);

  return formatResult(discountedTotal);
}

function validateOrder(order: Order): boolean {
  return !!order.items?.length && !!order.customer?.email;
}

function calculateTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function applyDiscount(total: number, customer?: Customer): number {
  return customer?.isVIP ? total * 0.9 : total;
}

function formatResult(total: number): string {
  return `Total: $${total.toFixed(2)}`;
}
```

✅ **Ưu điểm:** Reusable, testable, readable
❌ **Nhược điểm:** Nhiều method nhỏ có thể gây overhead

---

## 5.7.2 Rename Variable/Method

**Đặt tên rõ nghĩa, mô tả đúng ý định.**

```typescript
// ❌ TRƯỚC
const d = Date.now() - user.createdAt; // d = days? duration?
function proc(o: Order) { ... } // proc = process? produce?

// ✅ SAU
const daysSinceRegistration = Date.now() - user.createdAt;
function processOrder(order: Order) { ... }
```

**Quy tắc đặt tên:**
- Dùng **verb** cho methods: `calculateTotal`, `sendNotification`
- Dùng **noun** cho variables: `customerName`, `orderTotal`
- Boolean: `isActive`, `hasPermission`
- Tránh abbreviation: `num` → `count`, `qty` → `quantity`

---

## 5.7.3 Inline Method

**Gộp method quá đơn giản vào caller.**

```typescript
// ❌ TRƯỚC: Method chỉ gọi method khác
function getArea(shape: Shape) {
  return calculateArea(shape); // Chỉ 1 dòng
}

// ✅ SAU: Inline lại
function getArea(shape: Shape) {
  return calculateArea(shape);
}
// → Chỉ gọi calculateArea() trực tiếp
```

⚠️ **Chỉ inline khi method quá đơn giản và tên không thêm giá trị.**

---

## 5.7.4 Move Method

**Di chuyển method đến class phù hợp hơn.**

```typescript
// ❌ TRƯỚC
class Order {
  customer: Customer;
  items: Item[];

  calculateShipping(): number {
    // Logic này liên quan đến Customer hơn là Order
    return this.customer.calculateShippingCost();
  }
}

class Customer {
  location: Location;

  calculateShippingCost(): number {
    // Shipping logic based on customer location
  }
}

// ✅ SAU: Di chuyển sang Customer
class Order {
  customer: Customer;
  items: Item[];
  // Bỏ calculateShipping()
}

class Customer {
  location: Location;

  calculateShipping(): number {
    return this.calculateShippingCost();
  }
}
```

---

## 5.7.5 Decompose Conditional

**Tách điều kiện phức tạp thành function có tên.**

```typescript
// ❌ TRƯỚC
if ((date > summerStart && date < summerEnd) ||
    (isHoliday && date < closingDate)) {
  chargePremium();
}

// ✅ SAU
if (isSummerOrHoliday(date)) {
  chargePremium();
}

function isSummerOrHoliday(date: Date): boolean {
  const inSummer = date > summerStart && date < summerEnd;
  const isHolidayClosing = isHoliday && date < closingDate;
  return inSummer || isHolidayClosing;
}
```

---

## 5.7.6 Replace Magic Number

**Thay số "ma" bằng named constant.**

```typescript
// ❌ TRƯỚC
if (user.age >= 18) { /* ... */ }
const tax = price * 0.15;
const maxRetries = 3;

// ✅ SAU
const MINIMUM_AGE = 18;
const TAX_RATE = 0.15;
const MAX_RETRIES = 3;

if (user.age >= MINIMUM_AGE) { /* ... */ }
const tax = price * TAX_RATE;
const maxRetries = MAX_RETRIES;
```

---

## 🐝 Code Smells (Mùi Hỏng)

| Smell | Dấu hiệu | Fix |
|-------|----------|-----|
| Long Method | Function > 20 dòng | Extract Method |
| Large Class | Class > 200 dòng | Decompose Class |
| Duplicated Code | Code giống nhau ở nhiều nơi | Extract Method + Dedup |
| Primitive Obsession | Dùng raw type thay object | Replace Primitive w/ Object |
| Feature Envy | Method dùng object khác nhiều hơn của nó | Move Method |
| Data Clumps | Nhóm field luôn đi cùng nhau | Extract Class |
| Shotgun Surgery | 1 change cần sửa nhiều nơi | Consolidate |

---

## 🧭 Khi nào refactoring?

| Scenario | Khuyến nghị |
|----------|-------------|
| Thêm feature mới vào code cũ | ✅ Refactor trước |
| Code duplications xuất hiện | ✅ Extract Method |
| Function quá dài (>30 dòng) | ✅ Decompose |
| Tên biến/method khó hiểu | ✅ Rename |
| Trước merge PR | ✅ Quick cleanup |

---

## 🔗 Liên quan

- **3.1.1 DRY** — Refactoring chính là áp dụng DRY
- **3.2.1 SRP** — Move Method giúp giữ SRP

---

## 📚 Tài liệu tham khảo

- 📖 [Refactoring - Martin Fowler](https://refactoring.com/)
- 📖 [Clean Code - Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

---

## ⏭️ Bài tiếp theo

→ [5.8 Data Handling Techniques](../5.8-data-handling/README.md)
