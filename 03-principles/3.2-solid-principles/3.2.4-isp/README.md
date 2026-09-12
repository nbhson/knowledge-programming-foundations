# ✂️ 3.2.4 ISP — Interface Segregation Principle

> **Nhiều interface nhỏ, chuyên biệt hơn 1 interface to.**
> Client không nên phụ thuộc method nó không dùng. Đây là nguyên tắc đảm bảo interface design gọn gàng.

---

## 🎯 Vấn đề

Interface to, class phải implement method không cần:

- **Class "câm"** — implement method chỉ để ném exception
- **Khó hiểu** — interface dài, không rõ trách nhiệm
- **Khó mở rộng** — thêm method vào interface vỡ mọi class
- **Tight coupling** — thay đổi 1 method ảnh hưởng tất cả implementation
- **Test khó** — phải mock tất cả methods, kể cả không dùng

```
❌ VI PHẠM ISP                              ✅ TUÂN THỦ ISP
┌─────────────────────┐                    ┌─────────────────────┐
│ Worker              │                    │ Workable            │
│  work()             │   ──ISP──▶        │  ├─ Workable        │
│  eat()              │                    │  └─ Eatable         │
│  sleep()            │                    │ Robot: Workable     │
│  └─ Robot           │                    │ Human: Workable +   │
│     eat() 🤷        │                    │        Eatable      │
└─────────────────────┘                    └─────────────────────┘
```

> 📌 **Quy tắc kiểm tra:** "Class nào phải implement method nó không dùng?" Nếu có → vi phạm ISP.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Robot phải implement eat(), sleep() — không dùng
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}
class Robot implements Worker {
  work() { console.log("Robot working..."); }
  eat() { throw new Error("Robot doesn't eat"); } // 🤷
  sleep() { throw new Error("Robot doesn't sleep"); } // 🤷
}

// ✅ GOOD: interface nhỏ, chuyên biệt
interface Workable { work(): void; }
interface Eatable { eat(): void; }
class Robot implements Workable { work() { /* ... */ } }
class Human implements Workable, Eatable { work() { /* ... */ } eat() { /* ... */ } }
```

---

## 🔍 Phân tích chi tiết

### Dấu hiệu vi phạm ISP

| Dấu hiệu | Giải thích | Cách khắc phục |
|----------|------------|----------------|
| Class throw exception trong method | Method không cần thiết cho class đó | Tách interface |
| Interface > 5 methods | Quá nhiều trách nhiệm gộp chung | Chia nhỏ theo role |
| Client chỉ dùng 1 phần interface | Methods khác không cần | Tạo interface riêng |
| "Void" hoặc throw NotImplementedError | Method không implement được | Không nên có trong interface |

### Ví dụ: Violation - Client interface

```typescript
// ❌ BAD: Printer interface quá rộng
interface Device {
  print(document: string): void;
  scan(document: string): void;
  fax(document: string): void;
  copy(document: string): void;
}

// Printer đơn giản chỉ cần print
class SimplePrinter implements Device {
  print(document: string) { /* ... */ }
  scan() { throw new Error("Not supported"); } // 🤷
  fax() { throw new Error("Not supported"); }  // 🤷
  copy() { throw new Error("Not supported"); } // 🤷
}

// ✅ GOOD: tách thành các interface nhỏ
interface PrintDevice { print(doc: string): void; }
interface ScanDevice { scan(doc: string): void; }
interface FaxDevice { fax(doc: string): void; }
interface CopyDevice { copy(doc: string): void; }

class SimplePrinter implements PrintDevice {
  print(doc: string) { /* ... */ }
}
class MultiFunctionPrinter 
  implements PrintDevice, ScanDevice, FaxDevice, CopyDevice {
  print(doc: string) { /* ... */ }
  scan(doc: string) { /* ... */ }
  fax(doc: string) { /* ... */ }
  copy(doc: string) { /* ... */ }
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích | Ví dụ |
|---------|------------|-------|
| ✂️ **Gọn** | Class chỉ implement cái nó dùng | Robot chỉ implement Workable |
| 🔧 **Dễ mở rộng** | Thêm interface mới không vỡ class cũ | Thêm Eatable không động Robot |
| 📖 **Rõ ràng** | Interface nhỏ, nhìn hiểu ngay | Workable vs Worker |
| 🧪 **Dễ test** | Mock interface nhỏ dễ hơn | Test Workable riêng |
| 🔒 **Không ràng buộc** | Không bị phụ thuộc method không dùng | Robot không cần biết eat() |

---

## 🧠 ISP vs SRP

| Nguyên tắc | Phạm vi | Mục tiêu |
|-----------|---------|---------|
| **SRP** | Class | 1 class 1 trách nhiệm |
| **ISP** | Interface | 1 interface 1 contract |
| **Kết hợp** | Cả hai | Design system rõ ràng |

```typescript
// SRP + ISP kết hợp
interface Logger { log(msg: string): void; }
interface ErrorLogger { error(msg: string): void; }
interface AccessLogger { access(path: string): void; }

class ConsoleLogger implements Logger, ErrorLogger, AccessLogger {
  log(msg: string) { console.log(msg); }
  error(msg: string) { console.error(msg); }
  access(path: string) { console.log(`Access: ${path}`); }
}

class FileLogger implements Logger, ErrorLogger {
  log(msg: string) { /* write to log file */ }
  error(msg: string) { /* write to error file */ }
  // không implement AccessLogger
}
```

---

## ⚠️ Khi nào KHÔNG nên tách interface?

| Tình huống | Khuyến nghị | Lý do |
|------------|-------------|-------|
| Interface < 3 methods | ❌ Không tách | Đã đủ nhỏ |
| Tất cả client cần tất cả methods | ❌ Không tách | Over-engineering |
| Interface cho internal use | ⚠️ Cân nhắc | Simplicity quan trọng |
| Rapid prototyping | ❌ Bỏ qua ISP | Tốc độ quan trọng |

> 💡 **Quy tắc ngón tay cái:** "Nếu interface có method mà class implementation ném exception → cần tách."

---

## 🔗 Mối quan hệ với các nguyên tắc khác

| Nguyên tắc | Mối quan hệ |
|-----------|-------------|
| **3.2.1 SRP** | ISP là SRP áp dụng cho interface |
| **3.2.3 LSP** | Interface nhỏ giúp enforce hợp đồng đúng |
| **2.2.1 Adapter** | Pattern chuyển interface cho client |
| **2.2.4 Proxy** | Pattern kiểm soát truy cập interface |

---

## 🏭 Real-world Example

```typescript
// E-commerce: Customer Interface

// ❌ VI PHẠM ISP
interface Customer {
  browseProducts(): Product[];
  addToCart(product: Product): void;
  checkout(payment: Payment): Order;
  writeReview(product: Product, review: string): void;
  rateProduct(product: Product, rating: number): void;
  contactSupport(message: string): void;
}

// Guest customer chỉ cần browse và add to cart
class GuestCustomer implements Customer {
  browseProducts(): Product[] { return []; }
  addToCart(product: Product) { /* ... */ }
  checkout() { throw new Error("Guest cannot checkout"); }
  writeReview() { throw new Error("Guest cannot review"); }
  rateProduct() { throw new Error("Guest cannot rate"); }
  contactSupport() { throw new Error("Guest cannot contact"); }
}

// ✅ TUÂN THỦ ISP
interface Browseable { browseProducts(): Product[]; }
interface Cartable { addToCart(product: Product): void; }
interface Checkoutable { checkout(payment: Payment): Order; }
interface Reviewable { writeReview(product: Product, review: string): void; }
interface Rateable { rateProduct(product: Product, rating: number): void; }
interface Supportable { contactSupport(message: string): void; }

class GuestCustomer 
  implements Browseable, Cartable {
  browseProducts(): Product[] { return []; }
  addToCart(product: Product) { /* ... */ }
  // Không implement checkout, review, rate, support
}

class RegisteredCustomer
  implements Browseable, Cartable, Checkoutable, Reviewable, Rateable, Supportable {
  // Implement all
}
```

---

## 📁 Cấu trúc thư mục

```
3.2.4-isp/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.2-solid-principles/3.2.4-isp
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Interface Segregation Principle - Wikipedia](https://en.wikipedia.org/wiki/Interface_segregation_principle)
- 📖 [Refactoring.Guru — ISP](https://refactoring.guru/design-principles/interface-segregation-principle)
- 📘 *Clean Code* — Robert C. Martin
- 📖 [SOLID Principles - Medium](https://medium.com/@pataraperiyasamy/solid-principles-made-easy-with-typescript-4f7b6b3e4d3f)

---

## ⏭️ Bài tiếp theo

→ [3.2.5 DIP — Dependency Inversion Principle](../3.2.5-dip/README.md)
