# 🏭 2.1 Creational Patterns (Mẫu Tạo Đối Tượng)

> Giải quyết vấn đề: **Tạo đối tượng một cách linh hoạt và phù hợp**.
> Thay vì `new` trực tiếp, ta dùng pattern để kiểm soát quá trình tạo đối tượng.

---

## 🎯 Vấn đề chung

Khi dùng `new` trực tiếp, code bị **tight coupling** với class cụ thể:

```typescript
// ❌ Tight coupling — đổi class phải sửa code
const notification = new EmailNotification();
```

Creational patterns giải quyết bằng cách **tách quá trình tạo đối tượng** khỏi nơi sử dụng.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Client ──▶ Factory/Builder/Prototype ──▶ Object            │
│             (kiểm soát việc tạo)                             │
│                                                             │
│  Client không cần biết class cụ thể, chỉ cần interface.     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Các pattern trong nhóm

| # | Pattern | Mục đích | Khi nào dùng |
|---|---------|----------|--------------|
| [2.1.1](2.1.1-singleton/README.md) | **Singleton** | Đảm bảo 1 class chỉ có 1 instance | DB connection, Logger, Config |
| [2.1.2](2.1.2-factory-method/README.md) | **Factory Method** | Tạo object không chỉ rõ class cụ thể | Nhiều loại object cùng interface |
| [2.1.3](2.1.3-abstract-factory/README.md) | **Abstract Factory** | Tạo gia đình object liên quan | Theme, platform, UI kit |
| [2.1.4](2.1.4-builder/README.md) | **Builder** | Xây dựng object phức tạp từng bước | Nhiều optional param, immutable |
| [2.1.5](2.1.5-prototype/README.md) | **Prototype** | Clone object từ prototype có sẵn | Tạo object tốn kém, cần bản sao |

---

## 🧭 Chọn pattern nào?

```
BẠN CẦN TẠO ĐỐI TƯỢNG NHƯ THẾ NÀO?
│
├─ Chỉ cần 1 instance duy nhất toàn cục? → Singleton
│
├─ Tạo object theo loại, không biết class cụ thể?
│   ├─ 1 loại tại 1 thời điểm? → Factory Method
│   └─ Cả gia đình object liên quan? → Abstract Factory
│
├─ Object phức tạp, nhiều optional param? → Builder
│
└─ Tạo object tốn kém, muốn clone bản sao? → Prototype
```

---

## 🆚 So sánh Factory Method vs Abstract Factory

```
┌─────────────────────────────────────────────────────────────┐
│  FACTORY METHOD                    ABSTRACT FACTORY         │
│                                                             │
│  ┌──────────────┐                 ┌──────────────┐          │
│  │  Factory     │                 │  UIFactory   │          │
│  │  createX()   │  → 1 object     │  createButton│  → gia   │
│  └──────────────┘                 │  createInput │    đình  │
│                                   │  createModal │    object│
│  1 method, 1 loại object          └──────────────┘          │
│                                                             │
│  Dùng khi: nhiều loại cùng       Dùng khi: cần bộ object   │
│  interface, chọn 1 lúc           liên quan, phải đồng bộ    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
2.1-creational/
├── README.md                    # File này
├── 2.1.1-singleton/
│   ├── README.md
│   └── examples/index.ts
├── 2.1.2-factory-method/
├── 2.1.3-abstract-factory/
├── 2.1.4-builder/
└── 2.1.5-prototype/
```

---

## 🔗 Liên quan

- **2.2.1 Adapter** — Factory thường trả về Adapter
- **2.2.4 Proxy** — Proxy có thể lazy-init qua Factory
- **3.2.2 OCP** — Creational patterns hỗ trợ mở rộng không sửa code cũ
- **3.2.5 DIP** — Factory giúp phụ thuộc abstraction

---

## ⏭️ Bài tiếp theo

→ [2.2 Structural Patterns](../2.2-structural/README.md)
