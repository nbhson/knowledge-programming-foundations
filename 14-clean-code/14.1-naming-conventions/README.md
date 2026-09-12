# 🏷️ 14.1 Naming Conventions

> Tên biến, hàm, class phải **tự nói lên ý nghĩa** — không cần comment giải thích. Đọc code như đọc văn bản tiếng Anh là mục tiêu.

---

## 🎯 Tại sao Naming quan trọng?

```
❌ BAD:                    ✅ GOOD:
let d;                     let daysSinceLastLogin;
function proc()            function calculateTotalPrice()
let flag = true            let isLoggedIn = true
let data                   let userRoles;
```

> 💡 **Martin Fowler:** *"There are only two hard things in Computer Science: cache invalidation and naming things."*

---

## 📐 Quy tắc chung

| Quy tắc | Ví dụ đúng ✅ | Ví dụ sai ❌ |
|---------|---------------|--------------|
| **PascalCase** cho Class/Interface | `UserProfile`, `PaymentService` | `userProfile`, `Userprofile` |
| **camelCase** cho variable/function | `userName`, `calculatePrice()` | `user_name`, `Calculate_Price()` |
| **UPPER_SNAKE** cho constant | `MAX_RETRY_COUNT`, `API_BASE_URL` | `maxRetryCount`, `apiBaseUrl` |
| **Boolean** dùng `is/has/can` | `isLoading`, `hasPermission` | `flag`, `status` |
| **Tránh abbreviation** trừ phổ biến | `customerId` | `cid`, `custId` |

---

## 🔤 Quy tắc TypeScript

### Variable & Constant

```typescript
// ✅ Rõ nghĩa
const MAX_RETRY_COUNT = 3;
let userName: string = "Sơn";
let isActive: boolean = true;
const apiBaseUrl: string = "https://api.example.com";

// ❌ Ngẫu nhiên - khó hiểu
let x: number = 3;
let flag: boolean = true;    // flag là gì?
let data: any;               // data là gì?
```

### Function

```typescript
// ✅ Tên động + tân ngữ
function calculateTotalPrice(items: Item[]): number { ... }
function getUserById(id: string): User | null { ... }
function isValidEmail(email: string): boolean { ... }

// ❌ Không rõ hành động
function process(data: any): void { ... }   // process gì?
function handle(input: any): void { ... }   // handle cái gì?
```

### Class & Interface

```typescript
// ✅ PascalCase
class UserService { ... }
interface PaymentGateway { ... }
type UserProfileData = { ... };

// ❌ lowerCase cho class
class userService { ... }     // sai convention
interface gateway { ... }     // sai convention
```

---

## 🚩 Boolean Naming (quan trọng)

```typescript
// ❌ Tệ — flag, status, result không nói lên gì
let flag = true;
let status = false;
let result = true;

// ✅ Tốt — đọc như câu tiếng Anh
let isLoggedIn = true;
let hasPermission = false;
let canDelete = true;
let isLoading = false;
let isVerified = true;
```

> ⚠️ Tránh `isEnabled`, `isActive` — nên cụ thể hơn: `isPremium`, `isPublished`.

---

## 🎯 When to use which

```
Class / Interface / Type  → PascalCase       UserService, PaymentGateway
Function / Variable       → camelCase        getUserById, maxRetries
Constant                  → UPPER_SNAKE      API_KEY, DEFAULT_TIMEOUT
Private field             → _camelCase       _cache, _httpClient
Event handler             → onXxx            onClick, onUserLogin
```

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Tên tự giải thích mục đích | Tên ngắn tối nghĩa (`d`, `data`, `tmp`) |
| Dùng động từ cho function | Tên hàm không nói hành động |
| Boolean có tiền tố `is/has/can` | `flag`, `status`, `val` |
| Nhất quán trong project | Trộn lẫn style |

---

## 📚 Tài liệu

- 📖 [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html#naming)
- 📖 [Convention over Configuration](https://en.wikipedia.org/wiki/Convention_over_configuration)

---

## ⏭️ Bài tiếp theo

→ [14.2 Comments Guide](../14.2-comments-guide/README.md)
