# 🚫 YAGNI - Vi phạm & Cách xử lý

## Tình huống 1: Code cho tính năng "có thể cần sau"

**Vi phạm:**

```typescript
// ❌ BAD: Thêm tính năng thanh toán quốc tế khi app mới chỉ bán nội địa
class PaymentService {
  async processPayment(order: Order, currency: string) {
    if (currency === "VND") {
      // xử lý VND
    } else if (currency === "USD") {
      // dự phòng cho tương lai
    } else if (currency === "EUR") {
      // dự phòng cho tương lai
    }
    // ... thêm 10 dòng code cho tính năng chưa cần
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: chỉ code cái đang cần
class PaymentService {
  async processPayment(order: Order) {
    // chỉ xử lý VND hiện tại
  }
}
// Khi nào cần USD/EUR → thêm sau
```

---

## Tình huống 2: Generic/abstraction cho trường hợp chưa tồn tại

**Vi phạm:**

```typescript
// ❌ BAD: Tạo generic Repository<T> khi chỉ có 2 entity
class GenericRepository<T> {
  async findAll(): Promise<T[]> { /* ... */ }
  async findById(id: string): Promise<T> { /* ... */ }
  async create(data: Partial<T>): Promise<T> { /* ... */ }
  async update(id: string, data: Partial<T>): Promise<T> { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
}

// Cả app chỉ có User và Product, không có kế hoạch thêm entity khác
```

**Cách xử lý:**

```typescript
// ✅ GOOD: concrete repository cho từng entity
class UserRepository {
  async findAll(): Promise<User[]> { /* ... */ }
  async findById(id: string): Promise<User> { /* ... */ }
}

class ProductRepository {
  async findAll(): Promise<Product[]> { /* ... */ }
  async findById(id: string): Promise<Product> { /* ... */ }
}
```

---

## Tình huống 3: Thêm logging, monitoring, caching tràn lan

**Vi phạm:**

```typescript
// ❌ BAD: Thêm logging ở mọi method dù app mới phát triển
class UserService {
  async createUser(data: CreateUserDto) {
    this.logger.info(`Creating user: ${JSON.stringify(data)}`); // chưa cần
    const user = await this.repo.create(data);
    this.logger.info(`User created: ${user.id}`); // chưa cần
    this.cache.set(`user:${user.id}`, user); // chưa cần
    return user;
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: thêm logging/caching khi thực sự cần
class UserService {
  async createUser(data: CreateUserDto) {
    return await this.repo.create(data);
  }
}
// Khi app lớn, có vấn đề performance → thêm logging/caching sau
```

---

## Tình huống 4: Tạo utility functions cho trường hợp hypothetical

**Vi phạm:**

```typescript
// ❌ BAD: Tạo hàm formatCurrency cho nhiều currency
function formatCurrency(amount: number, currency: string): string {
  switch (currency) {
    case "VND": return `${amount.toLocaleString()} đ`;
    case "USD": return `$${amount.toFixed(2)}`;
    case "EUR": return `€${amount.toFixed(2)}`;
    // ... 20 currencies
  }
}
// App chỉ cần VND, không có kế hoạch mở rộng
```

**Cách xử lý:**

```typescript
// ✅ GOOD: chỉ code cho VND hiện tại
function formatVND(amount: number): string {
  return `${amount.toLocaleString()} đ`;
}
// Khi nào cần USD/EUR → thêm vào sau
```

---

## Tình huống 5: Extra validation / safety checks không cần thiết

**Vi phạm:**

```typescript
// ❌ BAD: Validate input 5 lần ở nhiều layer
class OrderService {
  async createOrder(input: any) {
    // Layer 1: validate ở controller
    if (!input.userId) throw new Error("Missing userId");
    if (!input.productId) throw new Error("Missing productId");

    // Layer 2: validate ở service
    if (!input.userId) throw new Error("Missing userId"); // lặp
    if (!input.productId) throw new Error("Missing productId"); // lặp

    // Layer 3: validate thêm type checking
    if (typeof input.userId !== "number") throw new Error("Invalid type");
    if (typeof input.productId !== "number") throw new Error("Invalid type");

    // ...
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: validate 1 lần ở 1 chỗ (controller hoặc DTO)
class OrderService {
  async createOrder(input: CreateOrderDto) {
    // input đã được validate bởi DTO class
    return this.repo.create(input);
  }
}
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm YAGNI | Cách xử lý |
|-----------------------|------------|
| Code cho tính năng tương lai | Xóa, code khi thực sự cần |
| Generic quá mức cho 2-3 entity | Dùng concrete class |
| Logging/caching nơi không cần | Bỏ, thêm sau khi profiling cho thấy vấn đề |
| Utility functions cho trường hợp hypothetical | Xóa, tạo khi có nhu cầu thực tế |
| Validate nhiều lần ở nhiều layer | Chỉ validate 1 lần ở 1 chỗ |