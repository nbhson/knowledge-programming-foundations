# 🏷️ 14.1 Naming Conventions

> Tên biến, hàm, class phải **tự nói lên ý nghĩa** — không cần comment giải thích. Đọc code như đọc văn bản tiếng Anh là mục tiêu.

---

## 🎯 Tại sao Naming quan trọng?

Name là **công cụ biểu đạt mạnh nhất** trong lập trình. Một tên đúng truyền đạt intent, context, và constraint — ba thứ mà comment thường cố gắng bù đắp.

```
❌ BAD:                          ✅ GOOD:
let d;                           let daysSinceLastLogin;
function proc()                  function calculateTotalPrice()
let flag = true                  let isLoggedIn = true
let data                         let userRoles;
```

> 💡 **Martin Fowler:** *"There are only two hard things in Computer Science: cache invalidation and naming things."*

**Ba lý do naming quan trọng:**
1. **Thời gian đọc hiểu:** Research cho thấy developer spends ~70% time reading code. Tên tốt giảm thời gian này.
2. **Searchability:** `grep MAX_RETRY_COUNT` tìm ra tất cả nơi dùng. `grep 3` không phân biệt được 3 cái ghế hay 3 lần retry.
3. **Self-documenting:** Tên tốt loại bỏ nhu cầu comment "what" — comment chỉ còn cần giải thích "why".

---

## 📐 Quy tắc chung

| Quy tắc | Giải thích | Ví dụ đúng ✅ | Ví dụ sai ❌ |
|---------|------------|---------------|--------------|
| **PascalCase** cho Class/Interface | Phân biệt class với variable | `UserProfile`, `PaymentService` | `userProfile`, `Userprofile` |
| **camelCase** cho variable/function | Phân biệt class với instance | `userName`, `calculatePrice()` | `user_name`, `Calculate_Price()` |
| **UPPER_SNAKE** cho constant | Chỉ ra giá trị không đổi | `MAX_RETRY_COUNT`, `API_BASE_URL` | `maxRetryCount`, `apiBaseUrl` |
| **Boolean** dùng `is/has/can` | Read như câu tiếng Anh | `isLoading`, `hasPermission` | `flag`, `status`, `enable` |
| **Tránh abbreviation** trừ phổ biến | Abbreviation làm giảm searchability | `customerId` | `cid`, `custId` |
| **Nhất quán trong project** | Chọn 1 convention, tuân thủ suốt | `get/fetch/retrieve` — chọn 1 | Trộn lẫn `getUser`, `fetchUser`, `retrieveUser` |

> 📌 **Lưu ý:** `const` trong TypeScript không đồng nghĩa với "giá trị không bao giờ đổi". `const` chỉ nghĩa **không thể reassign binding**. Để chỉ ra hằng số thực sự, dùng `UPPER_SNAKE`.

---

## 🔤 Quy tắc TypeScript chi tiết

### Variable & Constant

```typescript
// ✅ Rõ nghĩa — đọc như câu tiếng Việt
const MAX_RETRY_COUNT = 3;
let userName: string = "Sơn";
let isActive: boolean = true;
const apiBaseUrl: string = "https://api.example.com";
const defaultTimeoutMs = 5000;  // suffix đơn vị giúp clear

// ❌ Ngẫu nhiên — phải đọc thân hàm mới biết ý nghĩa
let x: number = 3;
let flag: boolean = true;     // flag là gì? điều gì?
let data: any;                // data là gì? từ đâu?
const tmp = getSomething();   // tmp = temporary của gì?
```

**Quy tắc suffix cho constant có đơn vị:**

```typescript
const timeoutMs = 5000;       // ✅ Rõ là ms
const maxRetries = 3;         // ✅ Rõ là count
const priceVnd = 100000;      // ✅ Rõ là VND
```

### Function

```typescript
// ✅ Tên động + tân ngữ — đọc như mệnh lệnh
function calculateTotalPrice(items: Item[]): number { ... }
function getUserById(id: string): User | null { ... }
function isValidEmail(email: string): boolean { ... }
function sendOrderConfirmation(order: Order): Promise<void> { ... }

// ❌ Không rõ hành động — generic verb
function process(data: any): void { ... }   // process gì?
function handle(input: any): void { ... }   // handle cái gì?
function doWork(): void { ... }             // work là gì?
```

**Verb conventions:**
| Hành động | Verb recommended |
|-----------|-----------------|
| Lấy dữ liệu | `get`, `fetch`, `find`, `load` |
| Đổi state | `set`, `update`, `create`, `delete` |
| Kiểm tra | `isValid`, `hasPermission`, `canDelete` |
| Gửi notification | `send`, `notify`, `emit` |
| Chuyển đổi | `map`, `transform`, `serialize` |

### Class & Interface

```typescript
// ✅ PascalCase
class UserService { ... }
interface PaymentGateway { ... }
type UserProfileData = { ... };

// ❌ lowerCase cho class — gây nhầm lẫn với variable
class userService { ... }     // sai convention
interface gateway { ... }     // sai convention
```

**Interface naming:**
- Interface mô tả **contract** → dùng `Noun` hoặc `Noun + er`: `Logger`, `Repository`, `Formatter`
- Interface mô tả **capability** → dùng `Adjective + er`: `Serializable`, `Comparable`
- TypeScript-specific: interface callback thường endings bằng `-Handler`, `-Callback`, `-Listener`

---

## 🚩 Boolean Naming (quan trọng đặc biệt)

Boolean là loại variable dễ đặt tên xấu nhất — vì temptation đặt `flag`, `result`, `status` là quá lớn.

```typescript
// ❌ Tệ — flag, status, result không nói lên gì
let flag = true;
let status = false;
let result = true;

// ✅ Tốt — đọc như câu tiếng Anh khẳng định/negative
let isLoggedIn = true;
let hasPermission = false;
let canDelete = true;
let isLoading = false;
let isVerified = true;
let isEnabled = false;

// ❌ Vẫn chưa đủ cụ thể
let isEnabled = true;      // enable cái gì? feature? user? notification?
let isActive = true;       // active user? active session? active subscription?

// ✅ Phải cụ thể hơn
let isPremiumSubscriptionActive = true;
let isUserAccountActive = true;
```

> ⚠️ Tránh `isEnabled`, `isActive` — nên cụ thể hơn: `isPremium`, `isPublished`, `isAccountLocked`.

**Kiểm tra quick:** đọc câu "`if (variableName)`" — nếu đọc như tiếng Anh tự nhiên thì đúng, nếu cần giải thích thêm là sai.

```typescript
// ✅ Đọc tự nhiên
if (isLoggedIn) { ... }
if (hasPermission) { ... }
if (isLoading) { ... }

// ❌ Phải giải thích
if (flag) { ... }        // flag là gì?
if (status) { ... }      // status = true hay false? truthy hay numeric?
```

---

## 🎯 When to use which — Bảng tổng hợp

```
Class / Interface / Type  → PascalCase       UserService, PaymentGateway
Function / Variable       → camelCase        getUserById, maxRetries
Constant                  → UPPER_SNAKE      API_KEY, DEFAULT_TIMEOUT
Private field             → _camelCase       _cache, _httpClient
Event handler             → onXxx            onClick, onUserLogin
Type parameter            → T, U, K, V       T extends Base, K extends string
```

**Ngoại lệ cho Type Parameter:**
- Generic collection: `T` (item type), `K` (key), `V` (value)
- React component: `P` (props), `S` (state) — nhưng `Props`/`State` rõ hơn
- Promise: `Promise<T>` — T là resolved value type

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Tên dài = tốt" | Tên dài nhưng mơ hồ (`userRegistrationDataObject`) tệ hơn tên ngắn rõ (`userRegData`) |
| "Dùng abbreviation để ngắn" | `usrNm` không searchable, `userId` thì `grep userId` tìm ra ngay |
| "Prefix kiểu (mstrName, nAge)" | Duplicated type info — TypeScript type system đã nói rồi |
| "Đặt tên theo implementation" | `LinkedListNode` expose implementation detail — nên `Node` hoặc `LinkNode` |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Tên tự giải thích mục đích | Tên ngắn tối nghĩa (`d`, `data`, `tmp`) |
| Dùng động từ cho function | Tên hàm không nói hành động |
| Boolean có tiền tố `is/has/can` | `flag`, `status`, `val` |
| Nhất quán trong project | Trộn lẫn style |
| Suffix đơn vị cho constant số | Magic number không label |

---

## 📚 Tài liệu

- 📖 [Google TypeScript Style Guide — Naming](https://google.github.io/styleguide/tsguide.html#naming)
- 📖 [Convention over Configuration](https://en.wikipedia.org/wiki/Convention_over_configuration)
- 📖 [Clean Code: Naming — Robert C. Martin, Chapter 3]

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 14-clean-code/14.1-naming-conventions
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [14.2 Comments Guide](../14.2-comments-guide/README.md)
