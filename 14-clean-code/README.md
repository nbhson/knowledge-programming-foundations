# ✨ Lớp 14: Clean Code & Refactoring (Code Sạch & Tái Cấu Trúc)

> **Clean Code** là nghệ thuật viết code **dễ đọc, dễ hiểu, dễ bảo trì** —
> code mà bất kỳ lập trình viên nào cũng có thể tiếp nhận và phát triển tiếp.
> **Refactoring** là quá trình **cải thiện cấu trúc code mà không thay đổi hành vi**.

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

Code sạch là code mà **con người** có thể đọc và hiểu được, không chỉ máy tính:

```
"Any fool can write code that a computer can understand.
 Good programmers write code that humans can understand."
    — Martin Fowler
```

### Tại sao quan trọng?

| Yếu tố | Code bẩn | Code sạch |
|---------|-----------|-----------|
| **Đọc hiểu** | Mất hàng giờ | Vài phút |
| **Debug** | Khó tìm bug | Bug dễ phát hiện |
| **Mở rộng** | Sợ thay đổi | Tự tin thay đổi |
| **Onboarding** | Mất hàng tuần | Vài ngày |
| **Chi phí** | Tăng theo thời gian | Ổn định |

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

### Boy Scout Rule

> "Luôn để code sạch hơn khi bạn tìm thấy nó"

- Mỗi lần chạm vào code → cải thiện một chút
- Không cần refactor lớn → nhiều cải thiện nhỏ
- Tích lũy dần → codebase ngày càng tốt hơn

---

## 3. Naming Conventions

### Nguyên tắc đặt tên

```
❌ BAD                          ✅ GOOD
─────────────────────────────────────────
int d;                          int elapsedDays;
String s;                       String customerName;
void proc();                    void calculateTax();
List<int> list1;                List<int> activeUserIds;
bool flag;                      bool isAuthenticated;
```

### Quy tắc đặt tên

| Quy tắc | Giải thích | Ví dụ |
|---------|------------|-------|
| **Intention-Revealing** | Tên thể hiện mục đích | `getUserAge()` thay vì `get()` |
| **Pronounceable** | Đọc được thành tiếng | `timestamp` thay vì `tstmp` |
| **Searchable** | Tìm kiếm được | `MAX_RETRY_COUNT` thay vì `7` |
| **No Encoding** | Không mã hóa kiểu | `name` thay vì `strName` |
| **Consistent** | Nhất quán trong project | Chọn `get/fetch/retrieve` và dùng xuyên suốt |

### Class vs Method Naming

```
Classes  → Danh từ:     User, OrderService, PaymentGateway
Methods  → Động từ:     calculateTotal(), sendEmail(), validateInput()
Booleans → is/has/can:  isActive, hasPermission, canDelete
```

---

## 4. Functions & Methods

### Nguyên tắc viết hàm sạch

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

### Ví dụ minh họa

```
❌ BAD — Hàm làm quá nhiều việc:
function processOrder(order) {
    validate(order);
    calculateDiscount(order);
    updateInventory(order);
    sendConfirmationEmail(order);
    logTransaction(order);
}

✅ GOOD — Mỗi hàm một trách nhiệm:
function processOrder(order) {
    const validOrder = validateOrder(order);
    const pricedOrder = applyPricing(validOrder);
    fulfillOrder(pricedOrder);
    notifyCustomer(pricedOrder);
}
```

### Command-Query Separation (CQS)

```
Command → Thay đổi state, không trả về gì
  void setAge(int age)
  void addItem(Item item)

Query → Trả về data, không thay đổi state
  int getAge()
  boolean isValid()
```

---

## 5. Code Smells

### Danh sách Code Smells phổ biến

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

### Nhận biết Code Smells

| Dấu hiệu | Code Smell | Giải pháp |
|-----------|------------|-----------|
| Hàm > 30 dòng | Long Method | Extract Method |
| Class > 500 dòng | Large Class | Extract Class |
| > 3 parameters | Long Param List | Parameter Object |
| Copy-paste code | Duplicate Code | Extract Method/Class |
| if/switch lồng nhau | Complex Conditional | Replace with Polymorphism |
| Comment giải thích "why" code phức tạp | Unclear Code | Rename + Simplify |

---

## 6. Refactoring Techniques

### Catalog các kỹ thuật Refactoring

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
│     Gom nhiều params thành object             │
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

---

## 7. Comments & Documentation

### Khi nào nên và không nên comment

```
❌ BAD COMMENTS — Không cần thiết:
// Increment i by 1
i++;

// Set age
this.age = age;

// Check if user is active
if (user.isActive) { ... }

✅ GOOD COMMENTS — Giải thích WHY:
// Business rule: Users under 18 need parental consent
if (user.age < 18) { ... }

// Workaround for API bug #1234 — remove after v2.0
response.data = normalizeResponse(response.data);

// RFC 7519: JWT tokens expire after 24h per compliance
TOKEN_EXPIRY = 86400;
```

### Quy tắc Comment

| Loại | Nên dùng? | Ví dụ |
|------|-----------|-------|
| **TODO** | ✅ Có | `// TODO: Implement caching` |
| **Legal** | ✅ Có | `// Copyright 2024 Company` |
| **Warning** | ✅ Có | `// WARNING: Not thread-safe` |
| **Explanation of intent** | ✅ Có | `// We use retry because API is flaky` |
| **Redundant** | ❌ Không | `// Returns the name` trên `getName()` |
| **Mandated** | ❌ Không | Javadoc trên mọi hàm getter |
| **Journal** | ❌ Không | Changelog trong code, dùng git |
| **Noise** | ❌ Không | `// Default constructor` |

---

## 8. Error Handling

### Nguyên tắc xử lý lỗi sạch

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

### Ví dụ

```
❌ BAD — Return null:
User findUser(String id) {
    if (exists(id)) return getUser(id);
    return null;  // Caller phải check null
}

✅ GOOD — Throw meaningful exception:
User findUser(String id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(
            "User not found with id: " + id
        ));
}

✅ GOOD — Return Optional:
Optional<User> findUser(String id) {
    return userRepository.findById(id);
}
```

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

---

> 💡 **Ghi nhớ:** *"Clean code is not written by following a set of rules.*
> *You don't become a software craftsman by learning a list of heuristics.*
> *Professionalism and craftsmanship come from values that drive disciplines."*
> — Robert C. Martin