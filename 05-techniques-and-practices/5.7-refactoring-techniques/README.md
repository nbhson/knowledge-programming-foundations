# 🔄 5.7 Refactoring Techniques (Kỹ Thuật Refactoring)

> **Refactoring** là cải thiện cấu trúc code mà **không thay đổi hành vi** — làm code sạch hơn, dễ đọc, dễ bảo trì. Refactoring không phải là "viết lại từ đầu"; nó là **từng bước nhỏ có kiểm soát** khiến codebase tiến gần hơn tới ideal.

---

## 🎯 Refactoring — Tư duy cốt lõi

**Refactoring ≠ Feature.** Bạn thêm tính năng mới khi business requirement thay đổi. Bạn refactor khi **code hiện tại đang che khuất ý định** — khiến thay đổi tiếp theo khó, rủi ro, tốn thời gian.

**Nguyên tắc vàng (Martin Fowler):**
1. **Small steps** — mỗi refactor là 1 commit, chạy test trước/sau để đảm bảo behavior không đổi.
2. **Test là safety net** — không refactor nếu không có test bao phủ logic bị thay đổi.
3. **Refactor before adding feature** — "Boy Scout Rule": để code sạch hơn lúc bạn rời đi.
4. **Đọc code nhiều hơn viết** — 70% thời gian là đọc, 30% viết. Code dễ đọc = cost thấp hơn.

**Khi nào nên refactor?**
- **Before feature:** Code phức tạp đang cản trở feature mới → refactor phần liên quan trước.
- **Triple rule:** Cùng logic xuất hiện **3 lần** → extract thành function/method. (2 lần có thể là coincidence.)
- **Code review feedback:** Reviewer hỏi "đoạn này ý gì?" → tên sai hoặc logic quá phức tạp.
- **Bug fix reveal:** Sửa bug lộ ra code region "đáng sợ" (everyone avoids touching) → refactor vùng đó.

> 💡 **Misconception:** "Refactoring làm chậm delivery." — Nghiên cứu của Microsoft (2019) trên 15.000 repositories: teams refactor thường xuyên có **velocity cao hơn 50%** về dài hạn, vì codebase vẫn maintainable.

---

## 📚 Mục Lục

| # | Kỹ Thuật | Mục Đích |
|---|----------|----------|
| 5.7.1 | [Extract Method](../5.7.1-extract-method/README.md) | Tách logic thành hàm riêng |
| 5.7.2 | [Rename Variable/Method](../5.7.2-rename-variable-method/README.md) | Đặt tên rõ nghĩa hơn |
| 5.7.3 | [Inline Method](../5.7.3-inline-method/README.md) | Gộp method đơn giản |
| 5.7.4 | [Move Method](../5.7.4-move-method/README.md) | Di chuyển method đến class phù hợp |
| 5.7.5 | [Decompose Conditional](../5.7.5-decompose-conditional/README.md) | Tách logic điều kiện phức tạp |
| 5.7.6 | [Replace Magic Number](../5.7.6-replace-magic-number/README.md) | Dùng named constant |

---

## 5.7.1 Extract Method — Tách Logic Thành Hàm Riêng

**Vấn đề:** Function dài (>20 dòng) chứa nhiều ý tưởng lẫn lộn → đọc để hiểu **mục đích** phải parse toàn bộ logic.

**Cách làm:** Chọn 1 đoạn logic **góc cạnh** (có purpose rõ), đặt nó vào function mới có **tên mô tả mục đích** (không mô tả implementation).

```typescript
// ❌ TRƯỚC: Một function làm 4 việc lẫn lộn
function processOrder(order: Order): string {
  // 1. Validate
  if (!order.items || order.items.length === 0) {
    return 'Order is empty';
  }
  if (!order.customer?.email) {
    return 'Missing customer email';
  }

  // 2. Calculate total
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }

  // 3. Apply discount
  if (order.customer.isVIP) {
    total *= 0.9;
  }

  // 4. Format output
  return `Total: $${total.toFixed(2)}`;
}

// ✅ SAU: Mỗi method 1 responsibility
function processOrder(order: Order): string {
  if (!validateOrder(order)) {
    return 'Invalid order';
  }

  const subtotal = calculateSubtotal(order);
  const total = applyDiscount(subtotal, order.customer);

  return formatResult(total);
}

// Tên method = mục đích, không phải implementation
function validateOrder(order: Order): boolean {
  return !!order.items?.length && !!order.customer?.email;
}

function calculateSubtotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function applyDiscount(subtotal: number, customer?: Customer): number {
  return customer?.isVIP ? subtotal * 0.9 : subtotal;
}

function formatResult(total: number): string {
  return `Total: $${total.toFixed(2)}`;
}
```

**Tiêu chí chọn đoạn để extract:**
- **Purpose clarity test:** Đoạn code này làm **một việc**? (validate, calculate, format, transform...)
- **Abstraction level:** Cùng level với xung quanh? (Đừng extract "total += price" ra method — quá chi tiết, phá abstraction)
- **Single responsibility:** Không có side-effect ngoài phạm vi method mới.

> 💡 **Rule of thumb:** Nếu đọc method mới **cần nhảy xuống implement** để hiểu, nó chưa tách đủ. Nếu tên method đủ truyền đạt ý tưởng, đã đủ.

✅ **Ưu điểm:** Reusable, testable (unit test method riêng), readable (main flow như table of contents).
❌ **Nhược điểm:** Method quá nhỏ (1–2 dòng) gây noise; naming đúng đôi khi khó → để tên chung chung (`processData`) = không cải thiện gì.

---

## 5.7.2 Rename Variable/Method — Đặt Tên Đúng Ý Định

**Vấn đề:** Tên misleading hoặc quá ngắn → reader phải suy luận, dễ hiểu sai ý định.

**Quy tắc đặt tên (từ sạch sẽ đến messy):**

| Loại | ❌ Bad | ✅ Good | Lý do |
|------|--------|---------|-------|
| Variable | `d`, `tmp`, `data` | `daysSinceRegistration`, `tempFileHandle`, `userList` | Mô tả **what**, không phải **type** |
| Method | `proc()`, `doThing()` | `processOrder()`, `calculateShippingFee()` | Verb + noun, rõ purpose |
| Boolean | `flag`, `ok`, `check` | `isValid`, `hasPermission`, `isExpired` | Đọc như câu hỏi |
| Constant | `3.14`, `18`, `1000` | `PI`, `MINIMUM_AGE`, `MS_PER_SECOND` | Named constant = self-documenting |

```typescript
// ❌ TRƯỚC
const d = Date.now() - user.createdAt;
function proc(o: Order) {
  if (o.s > 1000000) { /* ... */ }
}

// ✅ SAU
const daysSinceRegistration = Math.floor(
  (Date.now() - user.createdAt) / MS_PER_DAY
);
function processOrder(order: Order) {
  if (order.total > HIGH_VALUE_THRESHOLD) {
    requireManagerApproval(order);
  }
}
```

> 💡 **Naming là khó nhất trong CS.** Kent Beck nói: "There are only two hard things in Computer Science: cache invalidation and naming things." Đừng vội — nếu không tìm được tên tốt, code đang thiếu abstraction.

**Anti-pattern: "verb-noun" sai:**
- `getUsers()` → `fetchUsers()` nếu có network call, `listUsers()` nếu pure query.
- `getUser()` vs `findUserById()` — phân biệt **default behavior** vs **explicit search**.

✅ **Ưu điểm:** Zero cost, zero risk, improvement ngay lập tức.
❌ **Nhược điểm:** Rename method có thể break callers — cần tool support (IDE refactor), test coverage.

---

## 5.7.3 Inline Method — Gộp Method Quá Đơn Giản

**Vấn đề:** Method chỉ là **wrapper vô nghĩa** xung quanh method khác — thêm layer không cần thiết.

```typescript
// ❌ TRƯỚC: Inline-worthy method
function getArea(shape: Shape): number {
  return calculateArea(shape); // Chỉ 1 dòng, không thêm giá trị
}

// ✅ SAU: Gọi trực tiếp
const area = calculateArea(shape);
```

**Khi nào nên inline:**
- Method body = **1 dòng duy nhất** gọi method khác.
- Method name **không thêm thông tin** mới (giống y chang tên method gọi).
- Method quá trivial, việc đọc call site đã clear.

**Khi nào KHÔNG inline:**
- Method có **doc comment** giải thích intent → giữ lại để tài liệu hóa.
- Method là **interface implementation** (cần tồn tại cho polymorphism).
- Method được **override/extend** trong subclass.
- Method name giúp **readability** (ví dụ: `getCurrentTemperature()` thay vì `sensor.read()` — rõ intent hơn).

> 💡 **Quy tắc:** "Inline when the wrapper adds no value; extract when the implementation obscures intent."

⚠️ **Chỉ inline khi method quá đơn giản và tên không thêm giá trị.** Đừng inline method có side-effect (log, network call) — có thể vô tình thay đổi behavior.

---

## 5.7.4 Move Method — Di Chuyển Method Đến Class Phù Hợp Hơn

**Vấn đề:** Method nằm ở **class sai** — class đó không có đủ context để implement method đó đúng, hoặc method đang "ghép vào" class không liên quan.

**Nguyên tắc Grady Booch (khi nào move):**
1. Class hiện tại **không dùng** method nhiều bằng class khác.
2. Class hiện tại **không có data** method cần (phải nhận qua parameter).
3. Class đích **dùng method** nhiều hơn + có đủ data nội tại.

```typescript
// ❌ TRƯỚC: calculateShipping nằm ở Order, nhưng logic dựa vào Customer.location
class Order {
  customer: Customer;
  items: Item[];
  total: number;

  calculateShipping(): number {
    // Logic này liên quan đến Customer location, không phải Order
    return this.customer.calculateShippingCost();
  }
}

class Customer {
  location: Location;

  calculateShippingCost(): number {
    // Distance-based shipping logic
    const baseRate = 5.00;
    const distanceRate = 0.50;
    return baseRate + distanceRate * this.location.distanceToWarehouse;
  }
}

// ✅ SAU: Di chuyển sang Customer — class sở hữu data cần thiết
class Order {
  customer: Customer;
  items: Item[];
  total: number;
  // Bỏ calculateShipping() — đã move sang Customer
}

class Customer {
  location: Location;

  calculateShipping(): number {
    // Bây giờ Customer có thể access this.location directly
    const baseRate = 5.00;
    const distanceRate = 0.50;
    return baseRate + distanceRate * this.location.distanceToWarehouse;
  }
}

// Call site gọn hơn
const shipping = order.customer.calculateShipping();
// Không còn: order.calculateShipping() → cần lookup customer rồi delegate
```

**Lợi ích kép:**
- **SRP (Single Responsibility):** Customer chịu trách nhiệm shipping calculation — đúng vì shipping dựa trên location.
- **Encapsulation:** `location` là internal của Customer, không expose ra Order.
- **Reusability:** Method `calculateShipping` có thể dùng từ nhiều context (Order, Subscription, GiftCard).

> 💡 **Dấu hiệu cần Move Method:** "Feature envy" — method dùng object khác nhiều hơn object hiện tại (truy cập nhiều field của object khác hơn của chính nó).

✅ **Ưu điểm:** Code đúng chỗ, SRP được giữ, encapsulation tốt hơn.
❌ **Nhược điểm:** Phá call sites cũ → cần refactor tất cả caller (dễ với IDE hỗ trợ).

---

## 5.7.5 Decompose Conditional — Tách Điều Kiện Phức Tạp

**V Vấn đề:** Biểu thức `if` dài, phức tạp, đọc như "word salad" — người đọc phải decode logic trước khi hiểu intent.

```typescript
// ❌ TRƯỚC: Điều kiện 4 dòng, khó parse
function shouldChargePremium(date: Date, config: Config): boolean {
  if ((date > config.summerStart && date < config.summerEnd) ||
      (config.isHoliday && date < config.closingDate)) {
    return true;
  }
  return false;
}

// ✅ SAU: Biến điều kiện thành function có tên
function shouldChargePremium(date: Date, config: Config): boolean {
  return isSummerPeriod(date, config) || isHolidayEarlyClose(date, config);
}

function isSummerPeriod(date: Date, config: Config): boolean {
  return date > config.summerStart && date < config.summerEnd;
}

function isHolidayEarlyClose(date: Date, config: Config): boolean {
  return config.isHoliday && date < config.closingDate;
}
```

**Khi nào decompose:**
- Biểu thức `if`/`&&`/`||` dài **> 1 dòng**.
- Điều kiện xuất hiện **nhiều lần** (DRY violation).
- Điều kiện có **business meaning** riêng (ví dụ: "summer period", "holiday schedule").

**Advanced — Guard Clauses:**
Thay vì nested if/else, dùng **guard clause** (early return) để giảm nesting:

```typescript
// ❌ TRƯỚC: Nested deeply
function calculateDiscount(order: Order): number {
  if (order.customer) {
    if (order.customer.isVIP) {
      if (order.total > 100) {
        return order.total * 0.1;
      }
    }
  }
  return 0;
}

// ✅ SAU: Guard clauses — shallow structure
function calculateDiscount(order: Order): number {
  if (!order.customer) return 0;
  if (!order.customer.isVIP) return 0;
  if (order.total <= 100) return 0;
  return order.total * 0.1;
}
```

✅ **Ưu điểm:** Readability cao, điều kiện có tên = self-documenting, dễ test từng condition riêng.
❌ **Nhược điểm:** Quá nhiều helper function nhỏ có thể gây "context switching" nếu đọc chậm.

---

## 5.7.6 Replace Magic Number — Dùng Named Constant

**Vấn đề:** Số "ma" (magic number) — literal number xuất hiện trong code mà **không giải thích ý nghĩa**, buộc reader phải tra documentation hoặc suy luận.

```typescript
// ❌ TRƯỚC: Magic numbers
function calculateLateFee(daysLate: number): number {
  return daysLate * 5;
}

function validatePassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

const MAX_RETRIES = 3;
if (attempts >= 3) { /* ... */ } // magic number 3

// ✅ SAU: Named constants — self-documenting
const LATE_FEE_PER_DAY = 5; // $5 per day overdue
const MIN_PASSWORD_LENGTH = 8;
const REQUIRED_UPPERCASE = /[A-Z]/;
const REQUIRED_DIGIT = /\d/;
const MAX_LOGIN_ATTEMPTS = 3;

function calculateLateFee(daysLate: number): number {
  return daysLate * LATE_FEE_PER_DAY;
}

function validatePassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH
      && REQUIRED_UPPERCASE.test(password)
      && REQUIRED_DIGIT.test(password);
}

if (attempts >= MAX_LOGIN_ATTEMPTS) { /* ... */ }
```

**Phân loại magic số:**
| Loại | Ví dụ | Hành động |
|------|-------|-----------|
| Business constant | Tax rate 0.15, discount 0.10 | `const TAX_RATE = 0.15` |
| System constant | TIMEOUT_MS = 30000, PAGE_SIZE = 20 | `const DEFAULT_PAGE_SIZE = 20` |
| Threshold | retries = 3, max age = 18 | `const MAX_RETRY_COUNT = 3` |
| Currency/Locale | $100, 1000ms | Always name + comment |

> 💡 **Ngoại lệ:** `0` và `1` đôi khi chấp nhận được (zero-based index, singleton pattern) — nhưng `0` trong `setTimeout(fn, 0)` nên đặt tên `IMMEDIATE_TIMEOUT_MS = 0` để rõ intent.

✅ **Ưu điểm:** Self-documenting, dễ tweak (CHANGE 1 place, không search 10 chỗ), compile-time type safety.
❌ **Nhược điểm:** Quá nhiều constant file = maintenance overhead; constant name sai = worse than magic number.

---

## 🐝 Code Smells — Dấu Hiệu Cần Refactor

| Smell | Dấu hiệu | Refactor pattern | Impact |
|-------|----------|------------------|--------|
| **Long Method** | Function > 20 dòng | Extract Method | +Readability, +Testability |
| **Large Class** | Class > 200 dòng, nhiều responsibility | Decompose Class / Extract Class | +SRP, -Coupling |
| **Duplicated Code** | Logic giống ở ≥2 nơi | Extract Method / Template Method | +DRY, -Maintenance |
| **Primitive Obsession** | Dùng `string`/`number` thay object | Replace Primitive w/ Object | +Type safety, +Encapsulation |
| **Feature Envvy** | Method dùng object khác nhiều hơn | Move Method | +Cohesion, +SRP |
| **Data Clumps** | Nhóm field luôn đi cùng nhau | Extract Class / Value Object | +Cohesion |
| **Shotgun Surgery** | 1 change cần sửa nhiều class | Consolidate / Extract Class | +Maintainability |
| **Long Parameter List** | Function > 3 params | Replace Params w/ Object / Destructuring | +Readability |
| **Dead Code** | Code không bao giờ called | Remove | -Bloat, -Confusion |
| **Switch on Type** | `if (type === 'A') ... else if (type === 'B')` | Polymorphism / Strategy Pattern | +Extensibility |

**Đánh giá severity:**
- 🔴 **Critical:** Large Class + Shotgun Surgery → risk high, refactor ASAP.
- 🟡 **Warning:** Long Method + Duplicated Code → improves velocity.
- 🟢 **Nitpick:** Naming inconsistencies → improve during next feature work.

---

## 🎯 Khi nào refactoring?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Thêm feature mới vào code cũ (vùng liên quan messy) | ✅ Refactor trước | Feature thêm vào code messy → logic lan tỏa, bug nhiều hơn |
| Code duplications xuất hiện lần 3 | ✅ Extract Method | Lần 2 = coincidence; lần 3 = pattern cần abstract |
| Function quá dài (>30 dòng) | ✅ Decompose | >30 dòng = nhiều ý tưởng, cần tách |
| Tên biến/method khó hiểu (reviewer hỏi) | ✅ Rename ngay | Naming delay = technical debt accumulates |
| Trước merge PR | ✅ Quick cleanup | PR review dễ hơn khi code sạch; đừng push dirty → clean later |
| Bug fix lộ ra vùng code đáng sợ | ✅ Refactor vùng đó | "Everyone avoids touching this" = future bug trap |
| Code base đã < 6 tháng, sạch sẽ | ⏸️ Chờ | Chưa có pain → chưa có motivation refactor đúng chỗ |

**Quy tắc vàng:** **Refactor trong cùng commit với feature** — không bao giờ "refactor trước rồi mới add feature" riêng biệt. Lý do: commit tách biệt tăng risk merge conflict, và feature chưa chạy được trong giai đoạn refactor.

---

## 🧠 Misconceptions about Refactoring

| Hiểu lầm | Sự thật |
|----------|----------|
| "Refactoring là viết lại từ đầu" | ❌ Refactor = small, incremental, behavior-preserving changes. Rewrite = new codebase. |
| "Refactoring làm chậm release" | ❌ Dữ liệu Microsoft: teams refactor thường xuyên có velocity cao hơn 50% dài hạn. |
| "Chỉ code tệ mới cần refactor" | ❌ Code mới viết cũng có mùi — phát hiện sớm = giá rẻ. |
| "Refactor xong là sạch mãi mãi" | ❌ Code rot là tự nhiên; cần refactor định kỳ (technical debt sprint). |
| "Refactor không cần test" | ❌ Thiếu test = refactor blind — rất rủi ro. Test là safety net. |

---

## 🔗 Liên quan

- **3.1.1 DRY** — Refactoring chính là áp dụng DRY (loại bỏ duplication)
- **3.2.1 SRP** — Move Method, Decompose Class giúp giữ SRP
- **5.7.1 Extract Method** — Chi tiết kỹ thuật
- **5.7.2 Rename Variable/Method** — Chi tiết kỹ thuật
- **5.7.3 Inline Method** — Chi tiết kỹ thuật
- **5.7.4 Move Method** — Chi tiết kỹ thuật
- **5.7.5 Decompose Conditional** — Chi tiết kỹ thuật
- **5.7.6 Replace Magic Number** — Chi tiết kỹ thuật

---

## 📚 Tài liệu tham khảo

- 📖 [Refactoring — Martin Fowler](https://refactoring.com/)
- 📖 [Clean Code — Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- 📖 [The Little Book of Refactoring (Free)](https://lp.lulu.com/products/the-little-book-of-refactoring)
- 📖 [Refactoring to Collections — Refactoring.guru](https://refactoring.guru/refactoring/techniques)
- 📖 [Technical Debt — Microsoft Research](https://www.microsoft.com/en-us/research/publication/technical-debt/)

---

## ⏭️ Bài tiếp theo

→ [5.8 Data Handling Techniques](../5.8-data-handling/README.md)
