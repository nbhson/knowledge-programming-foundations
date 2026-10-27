# 💉 Lớp 27: Dependency Injection (Tiêm Phụ Thuộc)

> **Dependency Injection (DI) = không tạo dependency bên trong, nhận vào từ bên ngoài.**
> Lợi: test được, code linh hoạt, swap implementation không sửa consumer.
> Đặc biệt phổ biến trong Angular, Spring, NestJS, và các framework enterprise.

> Liên quan: `14-clean-code` (Single Responsibility — mỗi class chỉ cần 1 lý do tồn tại),
> `27.3-testing-with-di` (tại sao DI là nền tảng test), `21.4-configuration-management`
> (tiêm config).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 27.1 | DI Fundamentals | Nguyên tắc, IoC container | [27.1-di-fundamentals](27.1-di-fundamentals/README.md) |
| 27.2 | Container & Registries | DI container, scoped lifetime | [27.2-container-registries](27.2-container-registries/README.md) |
| 27.3 | Testing with DI | Mock, test isolation, integration test | [27.3-testing-with-di](27.3-testing-with-di/README.md) |

---

## 📖 Tổng Quan

```
❌ KHÔNG DI:                          ✅ CÓ DI:
class OrderService {                  class OrderService {
  db = new PostgresDB();               constructor(private db: IDatabase) {}
  email = new SendGrid();               constructor(private email: IEmail) {}
}                                     }
Tạo mọi thứ bên trong → khó mock      Nhận từ ngoài → dễ swap

→ test phải connect real DB           → test với mock DB
→ thay DB phải sửa OrderService       → thay DB không đụng OrderService
```

---

## 🔗 Liên Kết Chéo

- **Framework cụ thể:** NestJS (DI tự động), Angular, Spring Boot
- **Testing:** `27.3-testing-with-di`, `07-testing`

---

## 📖 Tài Nguyên Tham Khảo

- *Dependency Injection Principles, Practices, and Patterns* — Seemann & Wolff
- Angular DI docs, NestJS fundamentals