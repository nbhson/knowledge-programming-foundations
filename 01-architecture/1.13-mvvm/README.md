# 🔄 1.13 MVVM (Model-View-ViewModel)

> **ViewModel** phơi bày state qua **data binding**, **View** tự động cập nhật khi ViewModel thay đổi (2-way binding). Nền tảng của WPF, SwiftUI, Jetpack Compose, Vue, Angular.

---

## 🎯 Kiến trúc này là gì?

MVVM (Model-View-ViewModel) tách UI bằng **data binding**: View "lắng nghe" ViewModel, ViewModel không cần biết View tồn tại. Khi state thay đổi, View tự render lại.

**Vấn đề MVVM giải quyết — "boilerplate của Presenter":** MVP đẹp về lý thuyết nhưng kinh tê thực tế là **Presenter phình to và 100+ lines interface View**. Mỗi lần thêm một tính năng bạn phải sửa 3 file: View interface, Presenter, View impl. Và **không thể reuse Presenter giữa platforms**. MVVM giải bằng cách: thay Presenter + Interface View bằng **ViewModel + binding**.

**Data binding là cốt lõi MVVM:** View "kẹp" vào các property/method của ViewModel. Khi property đổi → View tự cập nhật. Khi user gõ ô input → value tự đồng bộ vào ViewModel. **Viết code binding** là khai báo mối quan hệ, **không phải viết logic điều khiển**.

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

**3 thành phần của MVVM — quan hệ không phải vai trò:**
- **Model:** same as before — pure business logic (có thể DDD aggregate, hoặc plain class).
- **ViewModel:** state hiển thị + thao tác UI (command) — **KHÔNG PHẢI** model domain, **KHÔNG PHẢI** view controller.
- **View:** chỉ binding + template — **không logic điều khiển**.

---

## 📐 3 thành phần

| Thành phần | Trách nhiệm | Ví dụ | Giải thích sâu |
|------------|-------------|-------|----------------|
| **Model** | Dữ liệu, business logic | `CounterModel` | Không đổi từ MVC/MVP. Có thể là domain entity hoặc raw data từ API. |
| **View** | Hiển thị, binding, gửi command | `CounterView` | Trong MVVM hiện đại, View thường là **declarative template**: JSX, SwiftUI `.onTapGesture`, Flutter `GestureDetector`. View không có code-behind (hoặc code-behind rất ít). |
| **ViewModel** | State hiển thị, logic UI, gọi Model | `CounterViewModel` | Core của MVVM. ViewModel **"cung cấp dữ liệu cho View"** chứ không phải "điều khiển View". Một ViewModel có thể phục vụ nhiều View. |

**Phân biệt ViewModel vs Model — ranh giới hay bị nhầm:**

| | Model | ViewModel |
|---|---|---|
| Nhiệm vụ | Business logic thuần | Format dữ liệu cho UI, trigger actions |
| Hiểu về domain? | Có — nói ngôn ngữ nghiệp vụ | Không cần; nói ngôn ngữ UI |
| Đổi UI có đổi Model? | Không | Có |
| Ví dụ | `Order { status, total }` | `OrderCardVm { displayTotal: '₫199k', isShipped: true }` |

**Phân biệt ViewModel vs Presenter (MVP):**

| | Presenter (MVP) | ViewModel (MVVM) |
|---|---|---|
| Update View | `presenter.updateView(state)` — tay | Binding tự cập nhật |
| Interface View | Cần `IView` | Không cần |
| Code sharing | Presenter ràng buộc chặt View interface | ViewModel reuse giữa web/ios/android |
| Framework support | Ít (must DIY) | Nhiều (RxJS, MobX, React Hooks, SwiftUI `@StateObject`) |

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

**Demo TypeScript + RxJS-style (xem examples/index.ts):**

```ts
// ViewModel — thuần túy, không biết UI
class CounterViewModel {
  count = new BehaviorSubject<number>(0);  // Observable state

  increment() {
    if (this.count.value < 100)
      this.count.next(this.count.value + 1);
  }
  decrement() {
    if (this.count.value > 0)
      this.count.next(this.count.value - 1);
  }
}

// View — binding auto-reactive
const vm = new CounterViewModel();
vm.count.subscribe(n => document.getElementById('display')!.textContent = String(n));

// Test — không cần DOM!
assertEqual(vm.count.value, 0);
vm.increment();
assertEqual(vm.count.value, 1);
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| ⚡ **2-way binding** | Giảm boilerplate, View tự cập nhật | Không còn viết `updateView()` thủ công. Thêm một state property = View tự phản ứng. Developer focus vào **state machine**, không phải **DOM manipulation**. |
| 🧪 **Test ViewModel dễ** | ViewModel không biết View, test thuần | `vm.increment()` + kiểm tra `vm.count.value` — không mock, không DOM. 100% logic UI testable. |
| 🔄 **Tách View hoàn toàn** | View chỉ binding, không logic | Designer có thể thay đổi template (React/Vue/SwiftUI) mà không ảnh hưởng ViewModel. |
| 🧩 **Tái dùng ViewModel** | 1 ViewModel dùng cho nhiều View (mobile/desktop/web) | Cùng `OrderCardVm` → một cho web (React JSX), một cho iOS (SwiftUI). Code logic share 100%. |
| 🛠️ **Framework support mạnh** | React Hooks / Vue composition / Swift `@Observable` | Cộng đồng ecosystem phát triển pattern sẵn (useState, computed, effect) → bạn không cần tự chế observable. |
| 👥 **Song song hóa design/logic** | (Ưu điểm bị bỏ sót) | Frontend dev làm UI, backend dev làm ViewModel + API integration ngay cùng lúc. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🐛 **Binding khó debug** | Lỗi binding im lặng, khó tìm | `count` không render dù ViewModel đổi → do binding path sai, key miss, hay lazy init? Không error ngay, chỉ "im lẶn". *Giảm thiểu:* devtools (React DevTools, Svelte Inspector, SwiftUI preview), log binding failures. |
| 📦 **Overhead framework** | Cần reactive framework (Rx, Observable) | Thêm layer abstraction = thêm chi phí runtime + memory. Simple counter với RxJS = overkill. *Giảm thiểu:* dùng primitive reactive (React useState, Vue ref) thay vì RxJS full power. |
| 🧠 **Learning curve** | Hiểu binding, observable, command | Khó với dev mới. `computed`, `effect`, `subscribe` — mỗi từ là một khái niệm mới. *Giảm thiểu:* bắt đầu bằng pattern đơn giản (plain `value` + setter), upgrade khi cần. |
| 🏗️ **Overkill màn hình đơn giản** | Binding phức tạp hơn cần thiết | Màn hình "đọc duy nhất" hoặc admin form đơn giản không cần binding hai chiều. *Giảm thiểu:* chọn kiến trúc theo độ phức tạp state — state ít → MVC/giữ flat. |
| 🧵 **ViewModel state management** | Khi app lớn, nhiều ViewModel → state quản lý ra sao? | Global state, parent-child ViewModel, shared slice — cần pattern bổ trợ (Redux/Flux 5.5). |
| 🔀 **Binding performance** | (Giới hạn bị bỏ qua) | Mỗi state change re-render toàn bộ subtree — không tối ưu cho danh sách dài. *Gi giảm thiểu:* key-based list, virtualization, memoization. |
| 👻 **Logic rơi vãi giữa ViewModel + framework** | (Thực tế) | "computed property" trong ViewModel hay "derived state" trong view layer? Ranh giới blurry. *Giảm thiểu:* quy tắc team rõ ràng (logic nghiệp vụ ở Model, format logic ở ViewModel, framework logic không bao giờ). |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Reactive UI (SwiftUI, Compose, WPF, Vue, Angular, React Hooks) | ✅ Rất phù hợp | Binding là built-in feature của những framework này. MVVM là **cách tổ chức code** tương thích. |
| App lớn, nhiều màn hình, state phức tạp | ✅ Phù hợp | ViewModel được chia nhỏ per screen → manage được. |
| Cần test logic UI độc lập | ✅ Phù hợp | ViewModel unit test được, không cần framework. |
| Code-share giữa nhiều platform (web + mobile) | ✅ Rất phù hợp | Cùng ViewModel (TypeScript), View khác nhau (JSX, SwiftUI, Compose). |
| Màn hình đơn giản, ít state | ⚠️ MVC/MVP đủ dùng | Đừng dùng MVVM cho "chào buổi sáng" app. |
| Team chưa có reactive framework | ⚠️ Học trước | Ép MVVM vào vanilla JS không binding = tự làm đau. |
| Performance-critical real-time UI (game, visualization) | ❌ Binding overhead có thể không chấp nhận | Dùng imperative rendering hoặc WebGPU/WASM. |

**Quy tắc chọn MVP vs MVVM:**
- **Nếu framework đã có binding** (React/Vue/SwiftUI/Compose) → MVVM.
- **Nếu framework không binding** và bạn cần test UI logic → MVP.
- **Nếu bạn muốn share UI logic giữa platforms** → MVVM.
- **Nếu bạn muốn đơn giản nhất có thể** → MVP (ít abstraction hơn).

---

## 🔗 Liên quan

- **1.11 MVC** — Tiền thân: View chủ động, đọc Model
- **1.12 MVP** — Trung gian: Presenter đẩy dữ liệu tay
- **5.5 State Management (Redux/NgRx/Flux)** — MVVM mở rộng khi app phức tạp lên, cần central store
- **5.12.1 Immutability** — ViewModel nên bất biến state (tạo object mới thay vì mutate)

---

## 📁 Cấu trúc thư mục ví dụ

```
1.13-mvvm/
├── README.md           # File này
└── examples/
    └── index.ts        # Counter demo (chạy: npx ts-node examples/index.ts)
```

Layout với React Hooks (hiện đại nhất):

```text
src/features/orders/
├── model/             # Order (domain)
├── use-order.ts       # ViewModel-like hook (state + behavior)
└── views/
    ├── OrderCard.tsx   # View (binding vào hook)
    └── OrderList.tsx
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.13-mvvm
npx ts-node examples/index.ts
```

Lưu ý: ViewModel `CounterViewModel` không có dependency nào với View. Đưa nó sang framework khác (React/Vue/SwiftUI) là replace `subscribe` thành `bind` — logic giữ nguyên.

---

## 📚 Tài liệu tham khảo

- 📖 [MVVM - Microsoft](https://learn.microsoft.com/en-us/dotnet/architecture/maui/mvvm)
- 📖 [MVVM - Wikipedia](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)
- 📖 [MVVM Pattern - Martin Fowler](https://martinfowler.com/bliki/MvvM.html)

---

## ⏭️ Bài tiếp theo

→ [1.14 Modular Monolith](../1.14-modular-monolith/README.md)
