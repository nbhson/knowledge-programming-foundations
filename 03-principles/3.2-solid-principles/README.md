# 📐 3.2 SOLID Principles

> **5 nguyên tắc thiết kế OOP** giúp code dễ đọc, dễ sửa, dễ mở rộng.
> Đặt tên từ Robert C. Martin (Uncle Bob) — nhóm lại thành từ "SOLID".

---

## 🧩 SOLID là gì?

```
S — Single Responsibility Principle (SRP)     → 1 class, 1 trách nhiệm
O — Open/Closed Principle (OCP)               → Mở rộng được, đóng sửa đổi
L — Liskov Substitution Principle (LSP)       → Class con thay được class cha
I — Interface Segregation Principle (ISP)     → Interface nhỏ, chuyên biệt
D — Dependency Inversion Principle (DIP)      → Phụ thuộc abstraction, không phụ thuộc cụ thể
```

---

## 🔗 Nội dung chi tiết

| # | Nguyên tắc | Ý chính | Link |
|---|-----------|---------|------|
| 3.2.1 | **S**RP | Class chỉ có 1 lý do để thay đổi | [3.2.1-srp](3.2.1-srp/README.md) |
| 3.2.2 | **O**CP | Mở rộng hành vi, không sửa code cũ | [3.2.2-ocp](3.2.2-ocp/README.md) |
| 3.2.3 | **L**SP | Class con thay thế class cha không vỡ | [3.2.3-lsp](3.2.3-lsp/README.md) |
| 3.2.4 | **I**SP | Nhiều interface nhỏ hơn 1 interface to | [3.2.4-isp](3.2.4-isp/README.md) |
| 3.2.5 | **D**IP | Phụ thuộc abstraction, không phụ thuộc cụ thể | [3.2.5-dip](3.2.5-dip/README.md) |

---

## 🎯 Mục tiêu

- **Code dễ đọc** — mỗi class 1 việc, nhìn là hiểu
- **Code dễ sửa** — thay đổi cục bộ, không lan rộng
- **Code dễ test** — phụ thuộc abstraction, mock dễ dàng
- **Code dễ mở rộng** — thêm tính năng mới không đụng code cũ

---

## 🔗 Liên quan

- **3.1.1 DRY** — Tránh trùng lặp, nền tảng cho SRP
- **3.1.4 SoC** — Tách trách nhiệm, liên quan SRP
- **3.1.6 Composition over Inheritance** — Hỗ trợ OCP, LSP
- **2.2 Structural Patterns** — Adapter, Proxy, Facade giúp thực thi SOLID
- **2.3 Behavioral Patterns** — Strategy giúp thực thi OCP, DIP

---

## 📁 Cấu trúc thư mục

```
3.2-solid-principles/
├── README.md           # File này
├── 3.2.1-srp/
├── 3.2.2-ocp/
├── 3.2.3-lsp/
├── 3.2.4-isp/
└── 3.2.5-dip/
```

---

## 📚 Tài liệu tham khảo

- 📖 [SOLID - Wikipedia](https://en.wikipedia.org/wiki/SOLID)
- 📘 *Clean Architecture* — Robert C. Martin

---

## ⏭️ Tiếp theo

→ [3.2.1 SRP — Single Responsibility Principle](3.2.1-srp/README.md)