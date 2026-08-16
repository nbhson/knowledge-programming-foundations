# 🔄 1.13 MVVM (Model-View-ViewModel)

> **ViewModel** phơi bày state qua **data binding**, **View** tự động cập nhật khi ViewModel thay đổi (2-way binding). Nền tảng của WPF, SwiftUI, Jetpack Compose, Vue, Angular.

---

## 🎯 Kiến trúc này là gì?

MVVM (Model-View-ViewModel) tách UI bằng **data binding**: View "lắng nghe" ViewModel, ViewModel không cần biết View tồn tại. Khi state thay đổi, View tự render lại.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌──────────────┐  data binding  ┌──────────────────┐       │
│   │    VIEW      │ ◀────────────▶ │   VIEWMODEL     │       │
│   │  (hiển thị)  │  (2-way)       │  (state + logic  │       │
│   │              │                │   UI)            │       │
│   └──────┬───────┘                └────────┬─────────┘       │
│          │                                 │                 │
│   user   │  command                        │ gọi Model       │
│   input  │ ───────────────────────────────▶▼                 │
│          │                        ┌──────────────────┐       │
│          │                        │      MODEL       │       │
│          │                        │  Dữ liệu + Logic │       │
│          │                        └──────────────────┘       │
│                                                             │
│  View tự cập nhật khi ViewModel thay đổi (binding)          │
│  ViewModel không biết View tồn tại                          │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Khác MVP:** Presenter đẩy dữ liệu tay (`updateView`), ViewModel dùng **binding** — View tự lắng nghe. ViewModel không cần interface View.

---

## 📐 3 thành phần

| Thành phần | Trách nhiệm | Ví dụ |
|------------|-------------|-------|
| **Model** | Dữ liệu, business logic | `CounterModel` |
| **View** | Hiển thị, binding, gửi command | `CounterView` |
| **ViewModel** | State hiển thị, logic UI, gọi Model | `CounterViewModel` |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Counter**:

```
┌──────────────┐  binding: count  ┌──────────────────┐
│ CounterView  │ ◀──────────────▶ │ CounterViewModel │
│ (render)     │  (tự cập nhật)   │ (state + logic)  │
└──────────────┘                  └────────┬─────────┘
      ▲                                    │ increment()
      │ (binding tự render)                ▼
      └───────────────────────────┌──────────────────┐
                                  │ CounterModel     │
                                  │ (state)          │
                                  └──────────────────┘
```

- **Model:** `CounterModel` (state)
- **View:** `CounterView` (render, binding)
- **ViewModel:** `CounterViewModel` (count state, increment/decrement)

> 💡 ViewModel phơi bày `count` (observable). View binding vào — khi count đổi, View tự render. Không cần gọi `updateView` tay.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| ⚡ **2-way binding** | Giảm boilerplate, View tự cập nhật |
| 🧪 **Test ViewModel dễ** | ViewModel không biết View, test thuần |
| 🔄 **Tách View hoàn toàn** | View chỉ binding, không logic |
| 🧩 **Tái dùng ViewModel** | 1 ViewModel dùng cho nhiều View (mobile/desktop) |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🐛 **Binding khó debug** | Lỗi binding im lặng, khó tìm |
| 📦 **Overhead framework** | Cần reactive framework (Rx, Observable) |
| 🧠 **Learning curve** | Hiểu binding, observable, command |
| 🏗️ **Overkill màn hình đơn giản** | Binding phức tạp hơn cần thiết |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Reactive UI (SwiftUI, Compose, WPF) | ✅ Rất phù hợp |
| App lớn, nhiều màn hình, state phức tạp | ✅ Phù hợp |
| Cần test logic UI độc lập | ✅ Phù hợp |
| Màn hình đơn giản, ít state | ⚠️ MVC/MVP đủ dùng |

---

## 🔗 Liên quan

- **1.11 MVC** — Tiền thân: View chủ động, đọc Model
- **1.12 MVP** — Trung gian: Presenter đẩy dữ liệu tay
- **1.13 MVVM** — Hiện đại: ViewModel + binding tự động

---

## 📁 Cấu trúc thư mục ví dụ

```
1.13-mvvm/
├── README.md           # File này
└── examples/
    └── index.ts        # Counter demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.13-mvvm
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [MVVM - Microsoft](https://learn.microsoft.com/en-us/dotnet/architecture/maui/mvvm)
- 📖 [MVVM - Wikipedia](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)

---

## ⏭️ Bài tiếp theo

→ [1.14 Modular Monolith](../1.14-modular-monolith/README.md)