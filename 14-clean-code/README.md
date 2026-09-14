# ✨ Lớp 14: Clean Code & Refactoring (Code Sạch & Tái Cấu Trúc)

> **Clean Code** là nghệ thuật viết code **dễ đọc, dễ hiểu, dễ bảo trì** — code mà bất kỳ lập trình viên nào cũng có thể tiếp nhận và phát triển tiếp.
> **Refactoring** là quá trình **cải thiện cấu trúc code mà không thay đổi hành vi**.

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm |
|---|--------|-----------|
| 14.1 | [Naming Conventions](14.1-naming-conventions/README.md) | Quy ước đặt tên |
| 14.2 | [Comments Guide](14.2-comments-guide/README.md) | Hướng dẫn comment |
| 14.3 | [Error Handling](14.3-error-handling/README.md) | Xử lý lỗi |
| 14.4 | [Code Structure](14.4-code-structure/README.md) | Cấu trúc code |
| 14.5 | [DRY Principle](14.5-dry-principle/README.md) | Nguyên tắc DRY |
| 14.6 | [Refactoring Techniques](14.6-refactoring-techniques/README.md) | Kỹ thuật refactor |

---

## 📑 Mục Lục

- [1. Tổng Quan](#1-tổng-quan)
- [2. Clean Code Fundamentals](#2-clean-code-fundamentals)
- [3. Naming Conventions](#3-naming-conventions)
- [4. Functions & Methods](#4-functions--methods)
- [5. Code Smells](#5-code-smells)
- [6. Refactoring Techniques](#6-refactoring-techniques)
- [7. Comments & Documentation](#7-comments--documentation)
- [8. Error Handling](#8-error-handling)
- [9. Tổng Kết](#9-tổng-kết)

---

## 1. Tổng Quan

### Clean Code là gì?

Code sạch là code mà **con người** có thể đọc và hiểu được, không chỉ máy tính. Máy tính có thể chạy được code bẩn — nhưng con người sẽ phải sống với nó trong nhiều năm.

```
"Any fool can write code that a computer can understand.
 Good programmers write code that humans can understand."
    — Martin Fowler
```

**Câu nói này hàm chứa một sự thật quan trọng:** khi bạn viết code, bạn đang viết cho chính mình trong tương lai (3 tháng sau, khi đã quên context) và cho đồng nghiệp (người chưa từng nhìn code của bạn). Code bẩn không phải "code khó đọc" — nó là **code gây tốn thời gian đọc hiểu gấp 5–10 lần so với code sạch**, và chi phí đó tích lũy theo năm tháng.

### Tại sao quan trọng?

| Yếu tố | Code bẩn | Code sạch | Giải thích sâu |
|---------|-----------|-----------|----------------|
| **Đọc hiểu** | Mất hàng giờ | Vài phút | Developer trung bình dành 70% thời gian đọc code, chỉ 30% viết mới. Code bẩn biến đọc thành giải mã. |
| **Debug** | Khó tìm bug | Bug dễ phát hiện | Code sạch có cấu trúc rõ → stack trace có ý nghĩa → vị trí bug cô lập được nhanh. Code bẩn thường ẩn bug trong sự phức tạp không cần thiết. |
| **Mở rộng** | Sợ thay đổi | Tự tin thay đổi | Mỗi dòng code thêm vào phải đi qua "bẫy đọc hiểu". Code sạch giảm số bẫy xuống gần bằng 0. |
| **Onboarding** | Mất hàng tuần | Vài ngày | Code sạch tự tài liệu hóa. Dev mới đọc tên biến/hàm là hiểu ý đồ, không cần hỏi ai. |
| **Chi phí** | Tăng theo thời gian | Ổn định | Technical debt có lãi suất kép. 1 ngày debt = 1 ngày lãi. Code sạch là cách duy nhất giữ lãi suất bằng 0. |

> 📌 **Quan niệm sai lầm phổ biến:** "Code sạch là code không có comment" — Sai. Code sạch có comment khi cần giải thích **tại sao** (not **cái gì**). Xem 14.2.

---

## 2. Clean Code Fundamentals

### Các nguyên tắc cốt lõi

```
┌─────────────────────────────────────────┐
│         CLEAN CODE PILLARS              │
├─────────────────────────────────────────┤
│                                         │
│  📖 Readable    — Dễ đọc                │
│  🎯 Simple      — Đơn giản              │
│  🔍 Testable    — Dễ test               │
│  🔄 Maintainable — Dễ bảo trì          │
│  📐 Consistent  — Nhất quán             │
│                                         │
└─────────────────────────────────────────┘
```

**Giải thích mối quan hệ giữa các pillar:**
- **Readable** là nền tảng — nếu không đọc được thì không thể test, refactor, hay mở rộng.
- **Simple** không đồng nghĩa với "đơn giản hóa mọi thứ" — nó có nghĩa là **không có abstraction thừa**. Mỗi lớp trừu tượng phải mua được giá trị thực.
- **Testable** là hệ quả tự nhiên của Simple + Readable. Code dính chùm (tightly coupled) không thể unit test mà không mock đến vỡ.
- **Maintainable** là kết quả của ba yếu tố trên + Consistency. Code sạch là code mà người đến sau **không sợ chạm vào**.

### Boy Scout Rule

> "Luôn để code sạch hơn khi bạn tìm thấy nó"

Đây là triết lý **improve-in-place** — mỗi lần bạn sửa bug, thêm tính năng, hay review PR, hãy tìm một thứ có thể cải thiện nhỏ và cải thiện nó. Không cần chờ "refactor session" cả ngày thứ bảy.

**3 cấp độ áp dụng:**

| Mức | Hành động | Ví dụ |
|-----|-----------|-------|
| **Micro** | Sửa trong PR, không cần commit riêng | Đổi tên biến `d` → `daysElapsed`, xóa dòng comment redundant |
| **Small** | 1–2 phút, commit riêng nhỏ | Tách hàm nhỏ từ method dài, đổi magic number thành const |
| **Medium** | Cần 30 phút–1 giờ, có scope rõ | Renaming lớn trong 1 module, tách class quá tải |

> ⚠️ **Giới hạn:** Boy Scout Rule không áp dụng cho **structural refactor** lớn. Đó là work riêng, cần planning, review, và commit message rõ ràng. Đừng biến mọi PR thành "vừa sửa bug vừa refactor lung tung".

---

## 3. Naming Conventions

Tên đúng là công cụ powerful nhất trong việc làm code dễ hiểu. Một tên tốt có thể thay thế 3 dòng comment.

```typescript
// ❌ Tên xấu — người đọc phải suy luận
let d;
const r = await fetch('/api/u');
const flag = true;

// ✅ Tên tốt — đọc như câu tiếng Việt
const daysSinceLastLogin = 3;
const user = await fetchUser(id);
const isPremiumMember = true;
```

Quy ước chi tiết xem tại [14.1 Naming Conventions](14.1-naming-conventions/README.md).

---

## 4. Functions & Methods

Function là đơn vị nhỏ nhất của logic có thể đọc và test. Function sạch phải **làm một việc, và làm tốt**.

```
┌─────────────────────────────────────────┐
│         CLEAN FUNCTIONS                 │
├─────────────────────────────────────────┤
│                                         │
│  1. SMALL — Ngắn gọn (< 20 dòng)       │
│  2. DO ONE THING — Chỉ làm 1 việc      │
│  3. ONE LEVEL — Cùng mức abstraction    │
│  4. FEW ARGS — Ít tham số (≤ 3)        │
│  5. NO SIDE EFFECTS — Không tác dụng phụ│
│                                         │
└─────────────────────────────────────────┘
```

**ONE LEVEL OF ABSTRACTION** là nguyên tắc bị bỏ sót nhiều nhất: mọi câu lệnh trong hàm phải ở cùng độ trừu tượng. Nếu có câu lệnh chi tiết hơn (hoặc trừu tượng hơn) thì đã đến lúc **Extract Method**.

```typescript
// ❌ Hai level abstraction lẫn lộn
function processOrder(order: Order): Promise<void> {
  const items = order.items;                           // trừu tượng cao
  for (let i = 0; i < items.length; i++) {            // triển khai chi tiết
    const item = items[i];
    if (item.price < 0) throw new Error('Bad price');
  }
  await db.save(order);                                // chi tiết IO
}

// ✅ Một level — orchestration thuần
async function processOrder(order: Order): Promise<void> {
  validateOrderItems(order);
  await persistOrder(order);
  await notifyWarehouse(order);
}

function validateOrderItems(order: Order): void {
  for (const item of order.items) {
    if (item.price < 0) throw new InvalidPriceError(item.productId);
  }
}
```

**Command-Query Separation (CQS):** 함수는 either **thay đổi state** HOẶC **trả về giá trị**, không làm cả hai.

```typescript
// ❌ Vừa thay đổi state vừa trả về — vi phạm CQS
function addItem(cart: Cart, item: Item): number {
  cart.items.push(item);
  return cart.items.length;  // side effect + return
}

// ✅ Tách rời
function addItem(cart: Cart, item: Item): void {
  cart.items.push(item);
}
const itemCount = cart.items.length;  // gọi riêng, rõ ràng
```

---

## 5. Code Smells

Code smell là **dấu hiệu bề mặt** cho thấy có vấn đề sâu hơn bên trong — như đau răng cảnh báo sâu răng.

```
┌─────────────────────────────────────────────────────┐
│              CODE SMELLS                            │
├──────────────────┬──────────────────────────────────┤
│ Bloaters         │ Long Method, Large Class,        │
│                  │ Long Parameter List,             │
│                  │ Primitive Obsession              │
├──────────────────┼──────────────────────────────────┤
│ OO Abusers       │ Switch Statements,               │
│                  │ Refused Bequest,                 │
│                  │ Temporary Field                  │
├──────────────────┼──────────────────────────────────┤
│ Change Preventers│ Divergent Change,                │
│                  │ Shotgun Surgery,                 │
│                  │ Parallel Inheritance             │
├──────────────────┼──────────────────────────────────┤
│ Dispensables     │ Dead Code, Duplicate Code,       │
│                  │ Lazy Class, Speculative          │
│                  │ Generality                       │
├──────────────────┼──────────────────────────────────┤
│ Couplers         │ Feature Envy, Inappropriate      │
│                  │ Intimacy, Message Chains,        │
│                  │ Middle Man                       │
└──────────────────┴──────────────────────────────────┘
```

**Phân biệt Level 1 (dễ phát hiện) và Level 2 (ẩn sâu):**

| Level | Smell | Dấu hiệu nhận biết | Hậu quả |
|-------|-------|--------------------|---------|
| 1 | Long Method | Hàm > 30 dòng, cần scroll | Khó test, khó reuse |
| 1 | Large Class | Class > 500 dòng, > 20 methods | SRP bị phá vỡ |
| 1 | Duplicate Code | Cùng đoạn xuất hiện ≥ 2 nơi | Sửa 1 chỗ quên chỗ kia |
| 2 | Feature Envy | Class A gọi 5+ method của class B | A đang "ghen tị" B → nên Move Method |
| 2 | Shotgun Surgery | 1 thay đổi nghiệp vụ phải sửa 10+ file | Divergent Change — class thiếu cohesive |
| 2 | Dead Code | Hàm không còn ai gọi, vẫn nằm đó | Gây nhầm lẫn, che logic thật |

> 💡 **Ghi nhớ:** Code smell ≠ bug. Code smell là **rủi ro tương lai** — hiện tại code chạy đúng, nhưng sẽ tốn kém hơn để sửa sau này.

---

## 6. Refactoring Techniques

Refactoring là **cải thiện cấu trúc nội tại mà không đổi behavior**. Mục tiêu: giảm chi phí bảo trì, tăng tốc phát triển tính năng mới.

```
┌──────────────────────────────────────────────┐
│         REFACTORING TECHNIQUES               │
├──────────────────────────────────────────────┤
│                                              │
│  📦 Extract Method                           │
│     Tách phần code thành hàm riêng           │
│                                              │
│  📦 Extract Class                            │
│     Tách trách nhiệm thành class mới         │
│                                              │
│  🔄 Rename Variable/Method/Class             │
│     Đổi tên cho rõ nghĩa hơn                │
│                                              │
│  📥 Inline Method                            │
│     Gộp hàm quá đơn giản vào caller          │
│                                              │
│  🔀 Move Method/Field                        │
│     Di chuyển đến class phù hợp hơn          │
│                                              │
│  🎭 Replace Conditional with Polymorphism    │
│     Thay if/switch bằng đa hình              │
│                                              │
│  📋 Introduce Parameter Object               │
│     Gom nhiều params thành object            │
│                                              │
│  🛡️ Replace Magic Number with Constant       │
│     Thay số magic bằng hằng số có tên         │
│                                              │
└──────────────────────────────────────────────┘
```

### Quy trình Refactoring an toàn

```
         ┌──────────┐
         │ Có Tests │
         │  Pass?   │
         └────┬─────┘
              │ Yes
              ▼
     ┌────────────────┐
     │ Thay đổi nhỏ   │◄──────┐
     │ (1 refactoring) │       │
     └────────┬────────┘       │
              │                │
              ▼                │
     ┌────────────────┐        │
     │  Chạy Tests    │        │
     └────────┬────────┘       │
              │                │
         ┌────┴────┐           │
         │ Pass?   │───No──► Revert
         └────┬────┘
              │ Yes
              ▼
     ┌────────────────┐
     │   Commit       │
     └────────┬────────┘
              │
              ▼
     ┌────────────────┐
     │  Tiếp tục?     │───Yes──┘
     └────────┬────────┘
              │ No
              ▼
           Done ✅
```

**Luật vàng:**
1. Luôn có test bao phủ trước khi refactor (test = safety net).
2. Mỗi bước refactor là 1 commit nhỏ — nếu có vấn đề, revert 1 commit là đủ.
3. Không bao giờ refactor + thêm tính năng cùng lúc trong 1 commit.

---

## 7. Comments & Documentation

Comment không phải là thay thế cho code rõ — nó là **bổ sung khi code không thể tự nói**.

> 💡 Quy tắc 3 giây: nếu đọc code mất > 3 giây để hiểu ý đồ, đừng thêm comment — **đổi tên** cho rõ hơn.

| Loại comment | Nên dùng? | Ví dụ |
|-------------|-----------|-------|
| **TODO** | ✅ Có | `// TODO: migrate sang v2 khi endpoint deprecated` |
| **Legal** | ✅ Có | `// Copyright 2024 Company Inc.` |
| **Warning** | ✅ Có | `// ⚠️ Gọi hàm này đồng bộ — blocking main thread` |
| **Explanation of intent** | ✅ Có | `// Tạm disable retry vì API rate-limit 429` |
| **Redundant** | ❌ Không | `// Returns the name` trên `getName()` |
| **Mandated** | ❌ Không | Javadoc trên mọi hàm getter |
| **Journal** | ❌ Không | Changelog trong code, dùng git |
| **Noise** | ❌ Không | `// Default constructor` |

Xem chi tiết tại [14.2 Comments Guide](14.2-comments-guide/README.md).

---

## 8. Error Handling

Xử lý lỗi sạch là **thiết kế cách hệ thống phản hồi khi điều gì đó sai**, không phải là bắt `try-catch` ở khắp nơi.

```
┌─────────────────────────────────────────────┐
│        CLEAN ERROR HANDLING                 │
├─────────────────────────────────────────────┤
│                                             │
│  1. Use Exceptions, Not Error Codes         │
│  2. Write Try-Catch First                   │
│  3. Provide Context in Exceptions           │
│  4. Don't Return Null                       │
│  5. Don't Pass Null                         │
│  6. Create Specific Exception Classes       │
│  7. Handle at the Right Level               │
│                                             │
└─────────────────────────────────────────────┘
```

**Tại sao KHÔNG nên return null?** Null là "cỗ xe tăng" (null object) nuốt mọi exception rồi biến chúng thành bug im lặng. Nếu hàm không tìm thấy gì, hãy:
- Throw specific exception (nếu "không tìm thấy" là lỗi nghiệp vụ)
- Return `Optional<T>` / `T \| null` (nếu caller phải xử lý both cases)

Xem chi tiết tại [14.3 Error Handling](14.3-error-handling/README.md).

---

## 9. Tổng Kết

### Clean Code Checklist

```
┌─────────────────────────────────────────────┐
│        ✅ CLEAN CODE CHECKLIST              │
├─────────────────────────────────────────────┤
│                                             │
│  □ Tên biến/hàm/class rõ ràng?             │
│  □ Hàm ngắn và chỉ làm 1 việc?            │
│  □ Không có duplicate code?                 │
│  □ Code dễ đọc không cần comment?           │
│  □ Error handling đúng cách?                │
│  □ Có unit tests?                           │
│  □ Không có magic numbers?                  │
│  □ Consistent coding style?                 │
│  □ Không có dead code?                      │
│  □ Dễ hiểu cho người mới?                  │
│                                             │
└─────────────────────────────────────────────┘
```

### Sách tham khảo

| Sách | Tác giả | Trọng tâm |
|------|---------|-----------|
| **Clean Code** | Robert C. Martin | Nguyên tắc viết code sạch |
| **Refactoring** | Martin Fowler | Kỹ thuật cải thiện code |
| **The Pragmatic Programmer** | Hunt & Thomas | Thực hành lập trình |
| **Code Complete** | Steve McConnell | Xây dựng phần mềm toàn diện |
| **Working Effectively with Legacy Code** | Michael Feathers | Refactor code không có test |

> 💡 **Ghi nhớ:** *"Clean code is not written by following a set of rules.*
>*You don't become a software craftsman by learning a list of heuristics.*
>*Professionalism and craftsmanship come from values that drive disciplines."*
>— Robert C. Martin

---

## 🔗 Liên quan

- **14.1 Naming Conventions** — Quy ước đặt tên biến, hàm, class
- **14.2 Comments Guide** — Khi nào comment, khi nào không
- **14.3 Error Handling** — Custom error classes, Result type
- **14.4 Code Structure** — Function size, argument limits, DRY vs WET
- **14.5 DRY Principle** — Tránh lặp code, khi nào không nên DRY
- **14.6 Refactoring Techniques** — Extract Method, Replace Conditional...

---

## ⏭️ Bài tiếp theo

→ [14.1 Naming Conventions](14.1-naming-conventions/README.md)
