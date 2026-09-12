# 🎯 3.2.1 SRP — Single Responsibility Principle

> **1 class chỉ có 1 lý do để thay đổi.**
> Mỗi class lo 1 trách nhiệm duy nhất. Đây là nguyên tắc nền tảng nhất của SOLID.

---

## 🎯 Vấn đề

Class làm quá nhiều việc:

- **Khó sửa** — sửa 1 chức năng ảnh hưởng chức năng khác
- **Khó test** — phải test cả đống trách nhiệm
- **Khó hiểu** — class dài, nhìn không biết lo việc gì
- **Khó tái sử dụng** — muốn dùng 1 phần phải kéo cả class
- **Vi phạm DRY** — code trùng lặp lan tỏa giữa các trách nhiệm

```
❌ VI PHẠM SRP                              ✅ TUÂN THỦ SRP
┌─────────────────────┐                    ┌─────────────────────┐
│ UserService         │                    │ UserValidator       │
│  ├─ validate()      │   ──SRP──▶        │ UserRepository      │
│  ├─ save()          │                    │ UserEmailService    │
│  ├─ sendEmail()     │                    │ UserReportService   │
│  └─ generateReport()│                    └─────────────────────┘
└─────────────────────┘
```

> 📌 **Quy tắc kiểm tra:** "Class này có đúng 1 lý do duy nhất để thay đổi không?" Nếu trả lời "không" → vi phạm SRP.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: 1 class 4 trách nhiệm — khó test, khó sửa, khó tái sử dụng
class UserService {
  validate(user: any) { /* ... */ }
  save(user: any) { /* ... */ }
  sendEmail(user: any) { /* ... */ }
  generateReport(user: any) { /* ... */ }
}

// ✅ GOOD: mỗi class 1 trách nhiệm — dễ test, dễ sửa, dễ tái sử dụng
class UserValidator { validate(user: any) { /* ... */ } }
class UserRepository { save(user: any) { /* ... */ } }
class UserEmailService { sendEmail(user: any) { /* ... */ } }
class UserReportService { generateReport(user: any) { /* ... */ } }
```

---

## 🔍 Phân tích chi tiết

### Dấu hiệu vi phạm SRP

| Dấu hiệu | Giải thích | Cách khắc phục |
|----------|------------|----------------|
| Class > 200 dòng | Quá nhiều trách nhiệm gộp chung | Tách theo responsibility |
| Nhiều `if/else` branch lớn | Mỗi branch là 1 trách nhiệm khác | Extract thành method/class riêng |
| Tên class mang tính "god" | UserService, DataManager, Helper | Đổi tên theo trách nhiệm chính |
| Method có dấu chấm phẩy phân cách | `save(); sendEmail();` | Tách thành các service riêng |
| Test class cần mock nhiều thứ | Vì class làm nhiều việc | Tách ra, test từng phần |

### Ví dụ thực tế:违反 SRP

```typescript
// ❌ BAD: OrderService làm 3 việc khác nhau
class OrderService {
  createOrder(order: Order) {
    // 1. Validate
    if (!order.items.length) throw new Error("No items");
    // 2. Save to DB
    this.repo.save(order);
    // 3. Send email notification
    this.email.send(order.customerEmail, "Order confirmed");
  }
}

// ✅ GOOD: tách thành 3 class
class OrderValidator {
  validate(order: Order): void {
    if (!order.items.length) throw new Error("No items");
  }
}

class OrderRepository {
  save(order: Order): void { /* ... */ }
}

class OrderNotificationService {
  sendConfirmation(customerEmail: string): void { /* ... */ }
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích | Ví dụ |
|---------|------------|-------|
| 🔧 **Dễ sửa** | Sửa 1 trách nhiệm không đụng trách nhiệm khác | Fix email → không ảnh hưởng DB |
| 🧪 **Dễ test** | Test từng class riêng biệt, không cần mock nhiều | Mock UserValidator → test riêng |
| 📖 **Dễ đọc** | Class ngắn, tên rõ trách nhiệm | `UserEmailService` → rõ là gửi email |
| ♻️ **Tái sử dụng** | Dùng riêng từng phần | `UserValidator` dùng được ở nhiều nơi |
| 👥 **Dễ hợp tác** | Mỗi dev phụ trách 1 class | Không xung đột khi commit |

---

## ⚠️ Khi nào KHÔNG nên tách?

| Tình huống | Khuyến nghị | Lý do |
|------------|-------------|-------|
| Class nhỏ (< 50 dòng), 1 việc duy nhất | ❌ Không cần tách | Over-engineering |
|相关业务逻辑 tightly coupled | ⚠️ Cân nhắc | Tách ra sẽ phức tạp hóa |
| Microservice boundaries | ✅ Tách thành service | SRP ở cấp service |
| One-off script | ❌ Không cần | Đơn giản là ưu tiên |

> 💡 **Kiểm tra nhanh:** Nếu class có `// --- Section X ---` comment → đang vi phạm SRP.

---

## 🔗 Mối quan hệ với các nguyên tắc khác

| Nguyên tắc | Mối quan hệ |
|-----------|-------------|
| **3.1.1 DRY** | SRP + DRY → không trùng lặp giữa các class |
| **3.1.4 SoC** | SRP là dạng vi mô của SoC (separation of concerns) |
| **3.2.2 OCP** | Class có SRP tốt → dễ mở rộng không sửa code cũ |
| **3.2.5 DIP** | Tách trách nhiệm giúp phụ thuộc abstraction dễ hơn |

---

## 🏭 Real-world Example

```typescript
// E-commerce Order System

// ❌ VI PHẠM SRP — 1 class làm tất cả
class OrderProcessor {
  validate(order: Order) { /* ... */ }
  calculateTotal(order: Order) { /* ... */ }
  processPayment(order: Order) { /* ... */ }
  shipOrder(order: Order) { /* ... */ }
  sendConfirmation(order: Order) { /* ... */ }
}

// ✅ TUÂN THỦ SRP — tách thành các class chuyên biệt
class OrderValidator { validate(order: Order): boolean { /* ... */ } }
class OrderPricer { calculateTotal(order: Order): number { /* ... */ } }
class PaymentProcessor { process(order: Order): PaymentResult { /* ... */ } }
class ShippingService { ship(order: Order): Shipment { /* ... */ } }
class NotificationService { sendConfirmation(order: Order): void { /* ... */ } }
```

---

## 📁 Cấu trúc thư mục

```
3.2.1-srp/
├── README.md           # File này
├── violations.md        # Các vi phạm SRP phổ biến
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.2-solid-principles/3.2.1-srp
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Single Responsibility Principle - Wikipedia](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- 📖 [Refactoring.Guru — SRP](https://refactoring.guru/design-principles/single-responsibility-principle)
- 📘 *Clean Code* — Robert C. Martin, Chương 8: Borders
- 📘 *Clean Architecture* — Robert C. Martin, Chương 4: Business Pattern Architecture

---

## ⏭️ Bài tiếp theo

→ [3.2.2 OCP — Open/Closed Principle](../3.2.2-ocp/README.md)
