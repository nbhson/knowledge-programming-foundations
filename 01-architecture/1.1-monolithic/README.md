# 🏢 1.1 Monolithic Architecture

> Toàn bộ ứng dụng trong **1 codebase, 1 deployment unit**. UI, business logic, data access chạy trong cùng 1 process. Đơn giản nhất, phù hợp khởi đầu.

---

## 🎯 Kiến trúc này là gì?

Monolithic Architecture gói toàn bộ tính năng vào 1 ứng dụng duy nhất. Mọi module (auth, order, payment...) nằm chung codebase, deploy chung 1 lần.

```
┌─────────────────────────────────────────────────────────────┐
│                    MONOLITH APPLICATION                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  UI Layer    │  │  Business    │  │  Data Access │       │
│  │  (Controllers│  │  Logic       │  │  (Repos,     │       │
│  │   Templates) │  │  (Services)  │  │   DAOs)      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              DATABASE (1 DB, 1 schema)              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Deploy: 1 artifact (jar, exe, container)                   │
│  Scale: nhân bản toàn bộ ứng dụng                          │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** 1 codebase → 1 build → 1 deploy. Muốn scale → chạy nhiều instance giống hệt nhau (horizontal scaling).

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **1 codebase** | Tất cả module trong 1 repo |
| **1 deployment unit** | Build 1 artifact, deploy 1 lần |
| **1 process** | UI + logic + data access chạy chung |
| **1 database** | Thường dùng 1 DB, 1 schema |
| **Scale đồng bộ** | Nhân bản toàn bộ, không scale từng phần |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Mini Shop Monolith**:

```
┌─────────────────────────────────────────────────────────────┐
│                    MONOLITH APP (1 process)                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Presentation: ConsoleUI                             │   │
│  │  Business:     ProductService, OrderService          │   │
│  │  Data Access:  ProductRepository, OrderRepository    │   │
│  │  (gọi trực tiếp trong cùng process, không network)   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  In-memory Database (Map) — 1 DB dùng chung          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Presentation:** `ConsoleUI` — hiển thị sản phẩm, tạo đơn
- **Business Logic:** `ProductService`, `OrderService` — gọi trực tiếp nhau
- **Data Access:** `ProductRepository`, `OrderRepository` — dùng chung in-memory DB
- **Database:** in-memory `Map` — 1 DB dùng chung

> 💡 Các layer gọi nhau trực tiếp (in-process), không qua network. Đơn giản nhưng khó tách riêng sau này.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🚀 **Đơn giản** | 1 codebase, 1 build, 1 deploy |
| 🐛 **Debug dễ** | Gọi trực tiếp, không network, dễ trace |
| 💰 **Chi phí thấp** | Không cần hạ tầng phức tạp |
| ⚡ **Performance tốt** | Không có network overhead giữa module |
| 👨‍💻 **Onboarding nhanh** | Cấu trúc đơn giản, dễ hiểu |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📦 **Code phình to** | Lớn dần, khó bảo trì |
| 🔗 **Ràng buộc công nghệ** | Khó đổi ngôn ngữ/framework từng phần |
| 📈 **Scale lãng phí** | Scale toàn bộ dù chỉ 1 module tải cao |
| 💥 **1 lỗi = sập hết** | Lỗi 1 module ảnh hưởng toàn hệ thống |
| 🐢 **Deploy chậm** | Build/test toàn bộ mỗi lần deploy |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Dự án mới, MVP, team nhỏ | ✅ Rất phù hợp |
| Ứng dụng đơn giản, ít module | ✅ Phù hợp |
| Chưa rõ yêu cầu, cần nhanh | ✅ Phù hợp |
| Hệ thống lớn, nhiều team, cần scale độc lập | ❌ Cân nhắc Modular Monolith / Microservices |

---

## 🔗 Liên quan

- **1.14 Modular Monolith** — Cải tiến: thêm ranh giới module
- **1.2 Microservices** — Đối lập: tách thành service độc lập
- **1.4 Layered** — Cách tổ chức code bên trong Monolith

---

## 📁 Cấu trúc thư mục ví dụ

```text
1.1-monolithic/
├── README.md           # File này
└── examples/
    └── index.ts        # Mini Shop demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.1-monolithic
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Monolithic Architecture - microservices.io](https://microservices.io/patterns/monolithic.html)
- 📖 [Monolith First - Martin Fowler](https://martinfowler.com/bliki/MonolithFirst.html)

---

## ⏭️ Bài tiếp theo

→ [1.2 Microservices](../1.2-microservices/README.md)