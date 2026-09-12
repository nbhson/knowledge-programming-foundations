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

> 💡 **Ghi nhớ:** Đọc tắt từng chữ cái thành "S-O-L-I-D" để dễ nhớ.

---

## 🔗 Nội dung chi tiết

| # | Nguyên tắc | Ký hiệu | Ý chính | Link |
|---|-----------|---------|---------|------|
| 3.2.1 | **S**RP | S | Class chỉ có 1 lý do để thay đổi | [3.2.1-srp](3.2.1-srp/README.md) |
| 3.2.2 | **O**CP | O | Mở rộng hành vi, không sửa code cũ | [3.2.2-ocp](3.2.2-ocp/README.md) |
| 3.2.3 | **L**SP | L | Class con thay thế class cha không vỡ | [3.2.3-lsp](3.2.3-lsp/README.md) |
| 3.2.4 | **I**SP | I | Nhiều interface nhỏ hơn 1 interface to | [3.2.4-isp](3.2.4-isp/README.md) |
| 3.2.5 | **D**IP | D | Phụ thuộc abstraction, không phụ thuộc cụ thể | [3.2.5-dip](3.2.5-dip/README.md) |

---

## 🎯 Tại sao SOLID quan trọng?

```
Code không có SOLID                  Code có SOLID
┌─────────────────────┐             ┌─────────────────────┐
│  spaghetti code     │             │  mỗi class 1 việc   │
│  khó đọc            │   ←──────▶  │  dễ hiểu             │
│  khó sửa            │             │  sửa không ảnh      │
│  khó test           │             │  test dễ dàng        │
│  bug lan truyền     │             │  mở rộng an toàn     │
└─────────────────────┘             └─────────────────────┘
```

---

## ✅ Lợi ích tổng quát

| Lợi ích | Giải thích |
|---------|------------|
| 📖 **Dễ đọc** — mỗi class 1 việc, nhìn là hiểu |
| 🔧 **Dễ sửa** — thay đổi cục bộ, không lan rộng |
| 🧪 **Dễ test** — phụ thuộc abstraction, mock dễ dàng |
| 🚀 **Dễ mở rộng** — thêm tính năng mới không đụng code cũ |
| ♻️ **Tái sử dụng** — component nhỏ, tái dùng cao |

---

## 📚 Mối quan hệ giữa các nguyên tắc

```
    ┌─────────────┐
    │    SRP      │  ← Nền tảng: tách trách nhiệm
    └──────┬──────┘
           │ giúp thực hiện
    ┌──────▼──────┐     ┌─────────────┐
    │     OCP     │────▶│     DIP     │
    │  Mở rộng    │  ↔  │  Abstraction│
    │  không sửa  │     │  dễ mở rộng │
    └─────────────┘     └─────────────┘
           │                    │
    ┌──────▼──────┐     ┌──────▼──────┐
    │     LSP     │     │     ISP     │
    │  Thay thế   │     │  Interface  │
    │  an toàn    │     │  chuyên biệt│
    └─────────────┘     └─────────────┘
```

> **SRP** là nền tảng. Các nguyên tắc còn lại xây dựng trên đó.

---

## 🔗 Liên quan

- **3.1.1 DRY** — Tránh trùng lặp, nền tảng cho SRP
- **3.1.4 SoC** — Tách trách nhiệm, liên quan SRP
- **3.1.6 Composition over Inheritance** — Hỗ trợ OCP, LSP
- **2.2 Structural Patterns** — Adapter, Proxy, Facade giúp thực thi SOLID
- **2.3 Behavioral Patterns** — Strategy giúp thực thi OCP, DIP
- **5.8 Data Handling** — Repository Pattern thực thi DIP

---

## 📁 Cấu trúc thư mục

```
3.2-solid-principles/
├── README.md           # File này
├── 3.2.1-srp/
│   ├── README.md
│   ├── violations.md
│   └── examples/index.ts
├── 3.2.2-ocp/
│   ├── README.md
│   └── examples/index.ts
├── 3.2.3-lsp/
│   ├── README.md
│   └── examples/index.ts
├── 3.2.4-isp/
│   ├── README.md
│   └── examples/index.ts
└── 3.2.5-dip/
    ├── README.md
    └── examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [SOLID - Wikipedia](https://en.wikipedia.org/wiki/SOLID)
- 📘 *Clean Architecture* — Robert C. Martin
- 📘 *Clean Code* — Robert C. Martin
- 📖 [Refactoring.Guru — SOLID](https://refactoring.guru/design-principles/solid)

---

## ⏭️ Tiếp theo

→ [3.2.1 SRP — Single Responsibility Principle](3.2.1-srp/README.md)
