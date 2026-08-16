# 🎭 1.12 MVP (Model-View-Presenter)

> **View** thụ động (passive), **Presenter** điều phối toàn bộ: nhận input từ View, gọi Model, cập nhật View. Tách UI logic triệt để, View dễ test bằng mock.

---

## 🎯 Kiến trúc này là gì?

MVP (Model-View-Presenter) cải tiến MVC: **View không chứa logic**, chỉ hiển thị và chuyển input cho Presenter. Presenter là "bộ não" — quyết định hiển thị gì, gọi Model thế nào.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌──────────────┐  user event   ┌──────────────────┐       │
│   │    VIEW      │ ────────────▶ │   PRESENTER     │       │
│   │  (thụ động)  │               │  (bộ não, điều   │       │
│   │  render only │               │   phối)          │       │
│   └──────┬───────┘               └────────┬─────────┘       │
│          │                                │                 │
│          │  updateView(state)             │ gọi Model       │
│          │  (Presenter đẩy dữ liệu)       ▼                 │
│          │                        ┌──────────────────┐       │
│          └────────────────────────│      MODEL       │       │
│                                   │  Dữ liệu + Logic │       │
│                                   └──────────────────┘       │
│                                                             │
│  View KHÔNG đọc Model trực tiếp. Presenter đẩy dữ liệu.     │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Khác MVC:** View không biết Model. Presenter cập nhật View qua interface (`updateView`). View dễ test — chỉ cần mock Presenter.

---

## 📐 3 thành phần

| Thành phần | Trách nhiệm | Ví dụ |
|------------|-------------|-------|
| **Model** | Dữ liệu, business logic | `CounterModel` |
| **View** | Hiển thị, chuyển input (thụ động) | `CounterView` (interface) |
| **Presenter** | Điều phối, xử lý logic UI, cập nhật View | `CounterPresenter` |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Counter**:

```
┌──────────────┐  onIncrement()  ┌──────────────────┐
│ CounterView  │ ──────────────▶ │ CounterPresenter │
│ (interface)  │                 │ (điều phối)      │
└──────────────┘                 └────────┬─────────┘
      ▲                                   │ increment()
      │ updateView(count)                 ▼
      │ (Presenter đẩy)          ┌──────────────────┐
      └──────────────────────────│ CounterModel     │
                                 │ (state)          │
                                 └──────────────────┘
```

- **Model:** `CounterModel` (state)
- **View:** `CounterView` (interface: `render(count)`)
- **Presenter:** `CounterPresenter` (onIncrement, onDecrement, updateView)

> 💡 View chỉ khai báo interface. Test Presenter bằng mock View — không cần UI thật.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🧪 **View dễ test** | View thụ động, test bằng mock |
| 🧠 **Logic UI tập trung** | Presenter chứa toàn bộ logic hiển thị |
| 🔄 **Dễ thay View** | View chỉ là interface, đổi UI không đụng logic |
| 🎯 **Tách triệt để** | View không biết Model |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🐘 **Presenter phình to** | Logic nhiều → Presenter dài |
| 📝 **Nhiều interface** | Mỗi View 1 interface, boilerplate |
| 🔗 **View-Presenter 1-1** | Thường 1 View ↔ 1 Presenter, khó tái dùng |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Desktop/mobile app cần test UI logic | ✅ Phù hợp |
| View phức tạp, nhiều state hiển thị | ✅ Phù hợp |
| Cần tách UI khỏi logic triệt để | ✅ Phù hợp |
| Web app đơn giản, ít state | ⚠️ MVC đủ dùng |
| Reactive UI (SwiftUI, Compose) | ❌ MVVM phù hợp hơn |

---

## 🔗 Liên quan

- **1.11 MVC** — Tiền thân: View chủ động hơn, đọc Model trực tiếp
- **1.13 MVVM** — Kế thừa: ViewModel + data binding thay cho Presenter đẩy tay

---

## 📁 Cấu trúc thư mục ví dụ

```
1.12-mvp/
├── README.md           # File này
└── examples/
    └── index.ts        # Counter demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.12-mvp
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [MVP - Martin Fowler](https://martinfowler.com/eaaDev/uiArchs.html)
- 📖 [Model-View-Presenter - Wikipedia](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter)

---

## ⏭️ Bài tiếp theo

→ [1.13 MVVM](../1.13-mvvm/README.md)