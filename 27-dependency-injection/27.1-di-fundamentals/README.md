# 🎯 27.1 DI Fundamentals (Nguyên Tắc)

> **DI = Hollywood Principle: "Don't call us, we'll call you."** Thay vì component
> chủ động tạo dependency, component được "tiêm" dependency từ bên ngoài.
> Nghịch đảo quyền kiểm soát (Inversion of Control) — framework gọi code, không phải
> ngược lại.

---

## 🎯 Vấn Đề

```typescript
// ❌ Không DI — tight coupling, khó test:
class OrderService {
  private db = new PostgresDB();    // hard-coded, không thay thế được
  private email = new SendGrid();   // cần real API key → test gọi thật
  async place(id: string) {
    const o = await this.db.findOne(id);  // test fail nếu DB ngoại tuyến
    this.email.send(o.email, "Order placed");
  }
}

// ✅ DI — loose coupling, dễ test:
class OrderService {
  constructor(
    private db: IDatabase,       // interface, không phụ thuộc impl
    private email: IEmail,      // interface
  ) {}
  async place(id: string) {
    const o = await this.db.findOne(id);
    this.email.send(o.email, "Order placed");
  }
}
// Test: new OrderService(mockDB, mockEmail) — DB ngoại tuyến? không vấn đề!
```

---

## 🧠 3 Cách Tiêm Phụ Thuộc

| Cách | Khi nào |
|---|---|
| Constructor injection (truyền vào constructor) | phổ biến nhất, rõ ràng, immutable |
| Setter injection (setter method) | optional dependency, circular dep tránh |
| Property injection (public field) | dùng khi framework hỗ trợ (JS: property gắn sau) |

---

## 💻 Code Ví Dụ

```typescript
// ===== Constructor injection: phổ biến nhất =====
interface IDatabase { findOne(id: string): Promise<unknown> }
interface IEmail { send(to: string, body: string): Promise<void> }

class OrderService {
  constructor(
    private db: IDatabase,    // tiêm interface — không biết impl
    private email: IEmail,
    private logger: ILogger,  // thêm dependency dễ dàng
  ) {}

  async place(id: string) {
    const o = await this.db.findOne(id);
    this.logger.info(`Order ${id} placed`);
    await this.email.send(o.email, "Order placed");
  }
}

// ===== Factory function: tạo service + dependency =====
function createOrderService(opts: {
  db: IDatabase; email: IEmail; logger: ILogger;
}): OrderService {
  return new OrderService(opts.db, opts.email, opts.logger);
}
```

---

## ⚠️ Bẫy Thường Gặp

1. **Tiêm interface, không tiêm class cụ thể** — nếu tiêm `PostgresDB` thì không khác gì không có DI.
2. **Quá nhiều dependency** — >7 dep constructor = violates SRP. Tái cấu trúc: gom thành group (config object).
3. **Circular dependency** — A cần B, B cần A → constructor injection thất bại. Dùng setter hoặc lazy injection.
4. **DI container làm code obscure** — nếu bạn không nhìn thấy dependency ở đâu được tiêm → khó debug. Ưu tiên constructor rõ ràng.
5. **Tiêm concrete class** — thay vì interface → không thể mock/test. Luôn tiêm abstraction (interface/abstract class).

---

*Leaf thuộc [Lớp 27 — Dependency Injection](../README.md)*