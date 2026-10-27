# 🏭 27.2 Container & Registries (Thùng Chứa & Đăng Ký)

> **DI Container = "nhà máy" tự động tạo object với dependency đã đăng ký.**
> Thay vì `new ServiceA(new DB(), new Logger())`, chỉ cần `container.get(ServiceA)`.
> Container tự resolve toàn bộ cây dependency.

---

## 💻 Code Ví Dụ

```typescript
// ===== Tự viết container đơn giản (minh họa nguyên lý) =====
class DIContainer {
  private services = new Map<string, unknown>();
  private singletons = new Map<string, unknown>();

  register<T>(token: string, factory: () => T) {
    this.services.set(token, factory); return this;
  }
  registerSingleton<T>(token: string, factory: () => T) {
    this.services.set(token, factory); return this;
  }
  get<T>(token: string): T {
    const factory = this.services.get(token);
    if (!factory) throw new Error(`Service ${token} chưa đăng ký`);
    return (factory as () => T)(); // mỗi get = instance mới (transient)
  }
  getSingleton<T>(token: string): T {
    if (!this.singletons.has(token)) {
      const factory = this.services.get(token);
      if (!factory) throw new Error(`Service ${token} chưa đăng ký`);
      this.singletons.set(token, (factory as () => T)());
    }
    return this.singletons.get(token) as T;
  }
}

// ===== Đăng ký: module per feature =====
const container = new DIContainer();
container
  .registerSingleton("db", () => new PostgresDB())
  .register("logger", () => new PinoLogger())
  .register("email", () => new SendGridEmail());

const orderService = container.get<OrderService>("OrderService");
// Container tự truyền: OrderService(db, email, logger) — factory thứ tự giống nhau
```

---

## ⚖️ Lifetime Scope

| Lifetime | Tạo mới | Dùng khi |
|---|---|---|
| Transient | mỗi lần `get()` | stateless, nhẹ |
| Singleton | 1 lần, dùng toàn app | DB pool, logger |
| Scoped | 1 lần/request | DB connection per request |
| Request | mới mỗi HTTP request | HTTP context |

---

## ⚠️ Bẫy Thường Gặp

1. **Singleton chứa request-scoped data** — shared state qua request = bug cực kỳ khó debug. Phân biệt: singleton cho stateless, scoped cho stateful.
2. **Circular dependency** — A → B → A → stack overflow. Tái cấu trúc: interface extraction, lazy getter.
3. **Test vs prod cùng container** — test override đăng ký bằng mock → nhưng nhiều test dùng chung 1 container có thể conflict. Mỗi test tạo container riêng.

---

*Leaf thuộc [Lớp 27 — Dependency Injection](../README.md)*