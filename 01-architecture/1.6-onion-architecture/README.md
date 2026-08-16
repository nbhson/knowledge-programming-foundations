# 🧅 1.6 Onion Architecture

> Tương tự Clean Architecture nhưng nhấn mạnh **Domain Model** ở trung tâm, các lớp **Domain Services**, **Application Services**, **Infrastructure** bao quanh. Dependency Rule: phụ thuộc chỉ hướng vào trong. Domain Model không phụ thuộc vào bất kỳ thứ gì bên ngoài.

---

## 🎯 Kiến trúc này là gì?

Onion Architecture (Jeffrey Palermo) tổ chức code thành **các lớp hình tròn đồng tâm**, Domain Model nằm ở trung tâm nhất. Mỗi lớp bên ngoài phụ thuộc vào lớp bên trong, không bao giờ ngược lại.

```
                ┌─────────────────────────────────────────────┐
                │         INFRASTRUCTURE / UI                 │  ← Ngoài cùng
                │   DB, External APIs, Web, Console           │
                │   ┌─────────────────────────────────────┐   │
                │   │     APPLICATION SERVICES            │   │
                │   │   Use Cases, Orchestration          │   │
                │   │   ┌─────────────────────────────┐   │   │
                │   │   │   DOMAIN SERVICES           │   │   │
                │   │   │   Business rules phức tạp   │   │   │
                │   │   │   ┌─────────────────────┐   │   │   │
                │   │   │   │   DOMAIN MODEL      │   │   │   │
                │   │   │   │  Entities, VOs,     │   │   │   │
                │   │   │   │  Domain Events      │   │   │   │
                │   │   │   └─────────────────────┘   │   │   │
                │   │   └─────────────────────────────┘   │   │
                │   └─────────────────────────────────────┘   │
                └─────────────────────────────────────────────┘
```

> 📌 **Dependency Rule:** Phụ thuộc luôn hướng **vào trong**. Domain Model không import gì từ lớp ngoài.

---

## 📐 Các lớp (từ trong ra)

| Lớp | Chứa gì | Phụ thuộc |
|---|---|---|
| **Domain Model** | Entities, Value Objects, Domain Events | Không phụ thuộc ai |
| **Domain Services** | Business rules phức tạp liên quan nhiều entity | Chỉ phụ thuộc Domain Model |
| **Application Services** | Use cases, orchestration, transaction | Phụ thuộc Domain |
| **Infrastructure / UI** | DB, external API, web, console | Phụ thuộc Application |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Order Management**:

```
┌──────────────┐  placeOrder()   ┌──────────────────┐
│ ConsoleUI    │ ──────────────▶ │ OrderService     │
│ (Infra)      │                 │ (Application)    │
└──────────────┘                 └────────┬─────────┘
                                          │ calculatePrice()
                                          ▼
                               ┌──────────────────┐
                               │ PricingService   │
                               │ (Domain Service) │
                               └────────┬─────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │ Order, Customer  │
                               │ (Domain Model)   │
                               └──────────────────┘
```

- **Domain Model:** `Order`, `Customer`
- **Domain Services:** `PricingService` (tính giá, áp dụng khuyến mãi)
- **Application Services:** `OrderService` (điều phối use case)
- **Infrastructure:** `InMemoryOrderRepo`, `ConsoleUI`

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **Domain cô lập tuyệt đối** | Domain Model không biết DB, framework, UI |
| 🧪 **Test dễ** | Test domain/application với mock infra |
| 🔄 **Dễ mở rộng** | Thêm adapter mới không đụng core |
| 🧩 **Ranh giới rõ ràng** | Mỗi lớp 1 trách nhiệm, phụ thuộc 1 chiều |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📦 **Nhiều tầng gián tiếp** | Nhiều interface, mapping, boilerplate |
| 🧠 **Learning curve dốc** | Khó hiểu lúc đầu, cần kỷ luật |
| 🏗️ **Overkill dự án nhỏ** | CRUD đơn giản không cần |

---

## 🆚 So sánh với Clean & Hexagonal

| Tiêu chí | Onion | Clean | Hexagonal |
|----------|-------|-------|-----------|
| Trung tâm | Domain Model | Entities | Domain Core |
| Nhấn mạnh | Phân lớp hình tròn | Dependency Rule 4 vòng | Ports & Adapters |
| Điểm khác | Domain Services là lớp riêng | Use Cases là lớp riêng | Tập trung 2 chiều in/out |
| Kết hợp | ✅ Dùng chung được | ✅ Dùng chung được | ✅ Dùng chung được |

> 💡 3 kiến trúc này **cùng tư duy**: core độc lập, phụ thuộc hướng vào trong. Khác nhau chủ yếu ở cách đặt tên và vẽ hình.

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Domain phức tạp, nhiều business rules | ✅ Phù hợp |
| Cần test domain độc lập hoàn toàn | ✅ Phù hợp |
| Ứng dụng doanh nghiệp vòng đời dài | ✅ Phù hợp |
| Dự án nhỏ, CRUD đơn giản | ❌ Overkill |

---

## 🔗 Liên quan

- **1.3 Clean Architecture** — Cùng tư duy, Use Cases thay cho Application Services
- **1.5 Hexagonal** — Cùng tư duy, nhấn mạnh Ports & Adapters
- **1.7 DDD** — Domain Model trong Onion thường thiết kế theo DDD

---

## 📁 Cấu trúc thư mục ví dụ

```
1.6-onion-architecture/
├── README.md           # File này
└── examples/
    └── index.ts        # Order Management demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.6-onion-architecture
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [The Onion Architecture - Jeffrey Palermo](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- 📖 [Onion Architecture - Part 2](https://jeffreypalermo.com/2008/08/the-onion-architecture-part-2/)

---

## ⏭️ Bài tiếp theo

→ [1.7 Domain-Driven Design](../1.7-domain-driven-design/README.md)