# 🏗️ 14.4 Code Structure (Cấu Trúc Code)

> **Code structure** không phải là quy tắc cứng — nó là cách tổ chức sao cho code **dễ đọc, dễ sửa, dễ test**.

---

## 🎯 Function Size Rules (Quy Tắc Kích Thước Function)

```
✅ Một function nên làm 1 việc duy nhất          ❌ Function dài đọc không xuể
function calculateDiscount(price, user) {       function processOrder(order) {
  const base = price * 0.9;                        // validate input
  return base;                                     check stock...
}                                                  apply coupon...
                                                  calculate tax...
                                                  handle payment...
                                                  send confirmation...
                                                  update inventory...
                                                  return receipt...
}
```

**Quy tắc ngón tay cái:**
- Dưới **20 dòng** là lý tưởng
- Trên **40 dòng** → xem xét tách nhỏ
- Nếu cần scroll ngang → chắc chắn quá dài

---

## 🔢 Argument Limits (Giới Hạn Tham Số)

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

// ❌ Quá nhiều args — khó đọc, khó remember
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
| Số args | Hành động |
|---------|-----------|
| 0-2 | Viết bình thường |
| 3 | Dùng interface/object |
| 4+ | Chắc chắn cần refactor |

---

## 🔄 DRY vs WET — Khi Nào Dùng Gì?

```
DRY  = Don't Repeat Yourself        ✅ Tránh copy-paste logic giống nhau
WET  = Write Everything Twice      ⚠️ Đôi khi lặp lại là OK
```

### DRY đúng chỗ

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

---

## 🎯 Single Responsibility trong Functions

```typescript
// ❌ Một function làm 3 việc
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

// ✅ Tách rõ ràng từng trách nhiệm
async function registerUser(data: RegisterData): Promise<User> {
  const validated = validateRegistration(data);
  const user = await saveUser(validated);
  await sendWelcomeEmail(user.email);
  return user;
}

function validateRegistration(data: RegisterData): ValidatedData {
  // only validation logic
}

async function saveUser(data: ValidatedData): Promise<User> {
  // only DB logic
}

async function sendWelcomeEmail(email: string): Promise<void> {
  // only email logic
}
```

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế |
|----------|-------------|
| Function > 40 dòng | Tách thành các hàm con |
| 4+ tham số riêng lẻ | Đóng gói vào interface |
| Function làm 3 việc | Mỗi function 1 job |
| Copy-paste code | Abstract thành shared function |
| Nested function quá sâu (>3 level) | Flatten bằng helper functions |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Giữ function dưới 20 dòng | Viết function dài cả trang |
| Dùng object/interfact cho 3+ args | Thêm args dài ngoằng |
| Mỗi function = 1 responsibility | "Swiss army knife" functions |
| DRY khi logic thực sự giống nhau | DRY khi tạo abstraction phức tạp |

---

## 📚 Tài liệu

- 📖 [The Art of Readable Code](https://www.oreilly.com/library/view/the-art-of/9781449387000/)
- 📖 [Clean Code: Functions — Robert C. Martin](https://www.oreilly.com/library/view/clean-code/9780132350884/)

---

## ⏭️ Bài tiếp theo → [14.5 DRY Principle](../14.5-dry-principle/README.md)
