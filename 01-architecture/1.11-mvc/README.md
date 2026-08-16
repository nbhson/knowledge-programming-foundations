# 🎨 1.11 MVC (Model-View-Controller)

> Tách UI thành 3 thành phần: **Model** (dữ liệu + logic), **View** (hiển thị), **Controller** (xử lý input, điều phối). Kiến trúc UI phổ biến nhất, nền tảng của nhiều framework (Spring MVC, Rails, Laravel, Express).

---

## 🎯 Kiến trúc này là gì?

MVC chia ứng dụng UI thành 3 phần với trách nhiệm rõ ràng:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌──────────────┐   cập nhật    ┌──────────────┐           │
│   │  CONTROLLER  │ ────────────▶ │    MODEL     │           │
│   │  Xử lý input │               │  Dữ liệu +   │           │
│   │  Điều phối   │               │  Business    │           │
│   └──────┬───────┘               │  Logic       │           │
│          │                       └──────┬───────┘           │
│   user   │                              │ notify            │
│   input  │                              ▼                   │
│          │                       ┌──────────────┐           │
│          └──────────────────────▶│    VIEW      │           │
│                                  │  Hiển thị    │           │
│                                  │  (render)    │           │
│                                  └──────────────┘           │
│                                                             │
│  View đọc dữ liệu từ Model để render                        │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Luồng:** User input → Controller → cập nhật Model → Model notify → View render lại.

---

## 📐 3 thành phần

| Thành phần | Trách nhiệm | Ví dụ |
|------------|-------------|-------|
| **Model** | Dữ liệu, business logic, trạng thái | `CounterModel`, `User`, `Order` |
| **View** | Hiển thị, render dữ liệu từ Model | HTML template, React component |
| **Controller** | Nhận input, gọi Model, chọn View | `CounterController`, `UserController` |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Counter**:

```
┌──────────────┐  click "+"    ┌──────────────────┐
│ CounterView  │ ────────────▶ │ CounterController│
│ (render)     │               │ (xử lý input)    │
└──────────────┘               └────────┬─────────┘
      ▲                                 │ increment()
      │ render()                        ▼
      │                        ┌──────────────────┐
      └────────────────────────│ CounterModel     │
          đọc state            │ (state + notify) │
                               └──────────────────┘
```

- **Model:** `CounterModel` (state, notify)
- **View:** `CounterView` (render)
- **Controller:** `CounterController` (handleIncrement, handleDecrement)

> 💡 View đọc state từ Model để render. Controller không render trực tiếp.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🚀 **Phổ biến, dễ hiểu** | Hầu hết dev biết, nhiều framework hỗ trợ |
| 🧩 **Tách trách nhiệm rõ** | Model/View/Controller mỗi phần 1 việc |
| 🔄 **Dễ thay View** | Đổi UI không đụng Model/Controller |
| 👨‍💻 **Onboarding nhanh** | Cấu trúc quen thuộc |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🐘 **Fat Controller** | Controller dễ phình to khi logic nhiều |
| 🔗 **View phụ thuộc Model** | View biết cấu trúc Model, khó test độc lập |
| 🌀 **Model phình to** | Business logic + state + notify dồn vào Model |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Web app truyền thống (server-rendered) | ✅ Phù hợp |
| REST API (Controller → Service → Model) | ✅ Phù hợp |
| UI phức tạp, cần test View độc lập | ⚠️ Cân nhắc MVP/MVVM |
| Desktop/mobile reactive UI | ❌ MVVM phù hợp hơn |

---

## 🔗 Liên quan

- **1.12 MVP** — Cải tiến: View thụ động, Presenter điều phối
- **1.13 MVVM** — Cải tiến: ViewModel + data binding
- **1.4 Layered** — MVC thường nằm trong Presentation layer

---

## 📁 Cấu trúc thư mục ví dụ

```
1.11-mvc/
├── README.md           # File này
└── examples/
    └── index.ts        # Counter demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.11-mvc
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [MVC - Martin Fowler](https://martinfowler.com/eaaDev/uiArchs.html)
- 📖 [MVC - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Glossary/MVC)

---

## ⏭️ Bài tiếp theo

→ [1.12 MVP](../1.12-mvp/README.md)