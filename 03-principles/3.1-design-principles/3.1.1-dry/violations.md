# 🚫 DRY - Vi phạm & Cách xử lý

## Tình huống 1: Code validate trùng lặp giữa nhiều function

**Vi phạm:**

```typescript
// ❌ BAD: cùng 1 logic email được copy 3 lần
function validateUser(user: any) {
  if (!user.email || !user.email.includes("@")) {
    throw new Error("Invalid email");
  }
  // ... các check khác
}

function validateAdmin(admin: any) {
  if (!admin.email || !admin.email.includes("@")) {
    throw new Error("Invalid email"); // trùng!
  }
  // ... các check khác
}

function validateGuest(guest: any) {
  if (!guest.email || !guest.email.includes("@")) {
    throw new Error("Invalid email"); // trùng!
  }
  // ... các check khác
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: tách thành hàm riêng, dùng lại
function isValidEmail(email: string): boolean {
  return !!email && email.includes("@");
}

function validateUser(user: any) {
  if (!isValidEmail(user.email)) throw new Error("Invalid email");
  // ...
}

function validateAdmin(admin: any) {
  if (!isValidEmail(admin.email)) throw new Error("Invalid email");
  // ...
}
```

---

## Tình huống 2: Logic tính toán giá bị lặp trong nhiều chỗ

**Vi phạm:**

```typescript
// ❌ BAD: công thức tính thuếcopy ở 5 chỗ
function calculateTotal(order: Order) {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * 0.1; // thuế 10%
  return subtotal + tax;
}

function calculateInvoice(invoice: Invoice) {
  const subtotal = invoice.lines.reduce((s, l) => s + l.amount, 0);
  const tax = subtotal * 0.1; // cùng công thức!
  return subtotal + tax;
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: đóng gói thành hàm reusable
const TAX_RATE = 0.1;

function calculateTax(subtotal: number): number {
  return subtotal * TAX_RATE;
}

function calculateTotal(items: { price: number; qty: number }[]): number {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return subtotal + calculateTax(subtotal);
}
```

---

## Tình huống 3: Cấu hình hardcode nhiều nơi

**Vi phạm:**

```typescript
// ❌ BAD: email template, regex, error message cứng ở nhiều chỗ
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ... 5 file khác cũng định nghĩa regex này

const ERROR_MESSAGES = {
  notFound: "Không tìm thấy",
  forbidden: "Không có quyền",
};
// ... copy nguyên block vào 3 file khác
```

**Cách xử lý:**

```typescript
// ✅ GOOD: tập trung config vào 1 file
// config/constants.ts
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ERROR_MESSAGES = {
  notFound: "Không tìm thấy",
  forbidden: "Không có quyền",
};

// các file khác import từ đây
import { EMAIL_REGEX, ERROR_MESSAGES } from "./config/constants";
```

---

## Tình huống 4: Repetitive boilerplate code

**Vi phạm:**

```typescript
// ❌ BAD: CRUD template copy-paste cho mỗi entity
class UserController {
  async getAll() {
    const db = await connectDB();
    const users = await db.query("SELECT * FROM users");
    return users;
  }
  async getById(id: number) {
    const db = await connectDB();
    const user = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return user;
  }
  // ...
}

class ProductController {
  async getAll() {
    const db = await connectDB(); // lặp lại
    const products = await db.query("SELECT * FROM products");
    return products;
  }
  // ...giống y chang
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: dùng base class / generic repository
class BaseRepository<T> {
  constructor(private table: string) {}
  async getAll() {
    const db = await connectDB();
    return await db.query(`SELECT * FROM ${this.table}`);
  }
  async getById(id: number) {
    const db = await connectDB();
    return await db.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }
}

class UserRepository extends BaseRepository<User> {
  constructor() { super("users"); }
}
class ProductRepository extends BaseRepository<Product> {
  constructor() { super("products"); }
}
```

---

## Tình huống 5: Error handling trùng lặp

**Vi phạm:**

```typescript
// ❌ BAD: try-catch block copy đi copy lại
async function createUser(req, res) {
  try {
    const user = await db.insert(req.body);
    res.json(user);
  } catch (err) {
    if (err.code === "EINVAL") res.status(400).json({ error: err.message });
    else if (err.code === "ECONN") res.status(503).json({ error: "DB down" });
    else res.status(500).json({ error: "Internal error" });
  }
}

async function updateUser(req, res) {
  try {
    const user = await db.update(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    if (err.code === "EINVAL") res.status(400).json({ error: err.message }); // lặp
    else if (err.code === "ECONN") res.status(503).json({ error: "DB down" }); // lặp
    else res.status(500).json({ error: "Internal error" }); // lặp
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: tạo hàm handleResponse dùng lại
function handleResponse(res: any, fn: () => Promise<any>) {
  return fn().then(data => res.json(data)).catch(err => {
    if (err.code === "EINVAL") return res.status(400).json({ error: err.message });
    if (err.code === "ECONN")  return res.status(503).json({ error: "DB down" });
    return res.status(500).json({ error: "Internal error" });
  });
}

async function createUser(req, res) {
  handleResponse(res, () => db.insert(req.body));
}
async function updateUser(req, res) {
  handleResponse(res, () => db.update(req.params.id, req.body));
}
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm DRY | Cách xử lý |
|---------------------|------------|
| Cùng 1 đoạn code xuất hiện ≥ 2 lần | Tách thành hàm / constant riêng |
| Cùng 1 công thức tính toán ở nhiều nơi | Đóng gói thành hàm reusable |
| Config / regex / message hardcode lặp | Tập trung vào 1 file constants |
| Boilerplate giống hệt nhau | Dùng generic, base class, factory |
| Error handling pattern lặp lại | Tạo wrapper handler dùng chung |