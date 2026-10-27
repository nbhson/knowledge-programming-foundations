# 🏗️ 14.4 Code Structure (Cấu Trúc Code)

> **Code structure** không phải là quy tắc cứng — nó là cách tổ chức sao cho code **dễ đọc, dễ sửa, dễ test**. Structure tốt giảm cognitive load khi đọc code.

---

## 🎯 Function Size Rules (Quy Tắc Kích Thước Function)

Hàm dài là tín hiệu rõ nhất của code smell. Nguyên nhân thường là **multiple responsibilities** gộp chung.

```
✅ Một function nên làm 1 việc duy nhất          ❌ Function dài đọc không xuể
function calculateDiscount(price, user) {       function processOrder(order) {
  const base = price * 0.9;                        // validate input
  return base;                                       check stock...
}                                                  apply coupon...
                                                   calculate tax...
                                                   handle payment...
                                                   send confirmation...
                                                   update inventory...
                                                   return receipt...
}
```

**Quy tắc ngón tay cái:**
- Dưới **20 dòng** là lý tưởng — đủ để đọc trong 1 lần scroll
- Trên **40 dòng** → xem xét tách nhỏ ngay
- Nếu cần scroll ngang (line > 100 chars) → chắc chắn quá dài hoặc phức tạp

**Testability correlation:** function 20 dòng có thể test trong 1 test case. Function 100 dòng cần 5–10 test case để cover hết paths → chi phí test tăng phi tuyến.

---

## 🔢 Argument Limits (Giới Hạn Tham Số)

Tham số quá nhiều là dấu hiệu class/hàm đang làm quá nhiều việc hoặc thiếu encapsulation.

```typescript
// ✅ 0-2 args: tự nhiên và rõ ràng
function createUser(name: string, email: string): User { ... }

// ✅ 3 args: dùng object destructuring
function sendEmail({
  to: string;
  subject: string;
  body: string;
  attachments?: File[];
}): Promise<void> { ... }

// ❌ Quá nhiều args — khó đọc, khó remember, khó extend
function connect(host, port, timeout, retries, ssl, proxy, user, pass) { ... }

// ✅ Dùng config object thay thế
interface ConnectionConfig {
  host: string;
  port: number;
  timeout: number;
  ssl: boolean;
  proxy?: string;
  credentials?: { user: string; pass: string };
}
function connect(config: ConnectionConfig): Connection { ... }
```

**Giới hạn khuyến nghị:**

| Số args | Hành động | Lý do |
|---------|-----------|-------|
| 0–2 | Viết bình thường | Đọc dễ, gọi dễ |
| 3 | Dùng interface/object destructuring | Giảm cognitive load khi gọi |
| 4+ | Chắc chắn cần refactor | Khả năng cao là multiple responsibilities |

> 💡 **Pattern: Parameter Object** — gom các arg liên quan thành 1 interface. Lợi ích: thêm field mới không phá signature, gọi hàm rõ nghĩa hơn (`connect({ host, port })` vs `connect(host, port, ...)`).

---

## 🔄 DRY vs WET — Khi Nào Dùng Gì?

```
DRY  = Don't Repeat Yourself        ✅ Tránh copy-paste logic giống nhau
WET  = Write Everything Twice      ⚠️ Đôi khi lặp lại là OK
```

### DRY đúng chỗ

Khi logic **thực sự giống nhau về ngữ nghĩa** (semantic identity), DRY là bắt buộc:

```typescript
// ✅ Cùng logic → abstract thành function
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  return /^\d{10,11}$/.test(phone);
}

// Form validation reuses pattern
function validateField(field: string, value: string): ValidationResult {
  if (!value.trim()) return { valid: false, error: 'Required' };
  if (field === 'email' && !validateEmail(value)) return { valid: false, error: 'Invalid email' };
  return { valid: true };
}
```

### WET đúng chỗ (đừng DRY quá mức)

DRY mù quáng tạo **abstraction overhead** — chi phí hiểu hàm abstract lớn hơn lợi ích tránh lặp:

```typescript
// ❌ DRY quá mức — thêm complexity vô ích
function formatUserDisplay(user: User, showEmail: boolean): string {
  const parts = [user.name];
  if (showEmail) parts.push(user.email);
  if (user.phone) parts.push(user.phone);
  return parts.join(', ');
}

// ✅ Hai format khác nhau → hai function riêng
function formatAdminDisplay(user: User): string {
  return `${user.name} (${user.email}, ${user.role})`;
}

function formatPublicDisplay(user: User): string {
  return user.name;
}
```

**Khi nào chấp nhận WET:**
- Hai đoạn code **giống hình thức nhưng khác ngữ nghĩa** (format date ≠ format phone number)
- Mỗi đoạn có **rate of change khác nhau** (một bên thay đổi thường xuyên, bên kia ổn định)
- **Prototype/MVP** — speed > purity, refactor sau khi validate

---

## 🎯 Single Responsibility trong Functions

SRP (Single Responsibility Principle) áp dụng cho function: mỗi function nên có **một và chỉ một lý do để thay đổi**.

```typescript
// ❌ Một function làm 3 việc — 3 lý do để sửa
async function handleUserRegistration(data: RegisterData) {
  // 1. Validate
  if (!data.email) throw new Error('Email required');
  if (!data.password) throw new Error('Password required');

  // 2. Save to DB
  const user = await db.users.create({ data });

  // 3. Send email
  await emailService.sendWelcome(user.email);

  return user;
}

// ✅ Tách rõ ràng từng trách nhiệm — mỗi hàm 1 lý do thay đổi
async function registerUser(data: RegisterData): Promise<User> {
  const validated = validateRegistration(data);
  const user = await saveUser(validated);
  await sendWelcomeEmail(user.email);
  return user;
}

function validateRegistration(data: RegisterData): ValidatedData {
  // only validation logic — sửa rule validation không động đến DB/email
}

async function saveUser(data: ValidatedData): Promise<User> {
  // only DB logic — đổi DB không động đến validation/email
}

async function sendWelcomeEmail(email: string): Promise<void> {
  // only email logic — đổi template/email provider không động đến validation/DB
}
```

**Kiểm tra SRP cho function:** đọc tên function — nếu cần "và" trong tên (`validateAndSaveAndNotify`), đó là dấu hiệu vi phạm.

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế | Giải thích |
|----------|-------------|-----------|
| Function > 40 dòng | Tách thành các hàm con | Đọc hết function mất >1 lần scroll |
| 4+ tham số riêng lẻ | Đóng gói vào interface | Gây lỗi swapping arg order |
| Function làm 3 việc | Mỗi function 1 job | Vi phạm SRP → khó test, khó reuse |
| Copy-paste code | Abstract thành shared function | One change = must update N places |
| Nested function quá sâu (>3 level) | Flatten bằng helper functions | Cognitive load tăng theo cấp số nhân |
| Generic wrapper function | Giữ cụ thể cho domain | `handleInput(input)` không nói gì hơn `validateEmail(email)` |

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Function phải ngắn, bất kể nội dung" | 20 dòng rõ nghĩa tốt hơn 5 dòng bí ẩn. Độ dài không phải mục tiêu, clarity mới là |
| "Param object luôn tốt" | Với 1–2 arg, param object thêm boilerplate không cần thiết. Dùng khi ≥ 3 arg |
| "DRY luôn đúng" | DRY đúng khi logic thực sự giống nhau về **ngữ nghĩa**, không chỉ hình thức |
| "Càng nhiều function con càng tốt" | Mỗi function mới là 1 nơi developer phải navigate. Over-fragmentation cũng tệ |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Giữ function dưới 20 dòng | Viết function dài cả trang |
| Dùng object/interface cho 3+ args | Thêm args dài ngoằng |
| Mỗi function = 1 responsibility | "Swiss army knife" functions |
| DRY khi logic thực sự giống nhau | DRY khi tạo abstraction phức tạp |
| Chấp nhận WET khi diff semantics | DRY mù quáng |

---

## 📚 Tài liệu

- 📖 [The Art of Readable Code](https://www.oreilly.com/library/view/the-art-of/9781449387000/)
- 📖 [Clean Code: Functions — Robert C. Martin, Chapter 5]
- 📖 [The Truth About Micro-Optimizations — V8 Blog](https://v8.dev/blog/mathematical-optimizations)

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 14-clean-code/14.4-code-structure
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [14.5 DRY Principle](../14.5-dry-principle/README.md)
