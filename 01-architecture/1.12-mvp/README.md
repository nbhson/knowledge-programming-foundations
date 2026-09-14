# 🎭 1.12 MVP (Model-View-Presenter)

> **View** thụ động (passive), **Presenter** điều phối toàn bộ: nhận input từ View, gọi Model, cập nhật View. Tách UI logic triệt để, View dễ test bằng mock.

---

## 🎯 Kiến trúc này là gì?

MVP (Model-View-Presenter) cải tiến MVC: **View không chứa logic**, chỉ hiển thị và chuyển input cho Presenter. Presenter là "bộ não" — quyết định hiển thị gì, gọi Model thế nào.

**Tại sao phải rời MVC?** Trong MVC gốc, View **chủ động đọc Model** để render (observer pattern). Điều này có nghĩa:
- View phải biết structure của Model (`user.name`), khi Model đổi field → View hỏng.
- Để test "click button đổi giá trị hiển thị", bạn phải render **view thật** — không thể unit test logic UI.

MVP giải bằng cách làm **View thụ động**: View không đọc Model, không quan sát Model. Tất cả logic UI nằm ở Presenter. Model đổi → presenter biết → presenter đẩy state mới lên View qua callback/method `updateView()`. View trở thành **một cái màn hình** — không có logic, chỉ nhận dữ liệu và render.

**Ba loại MVP (khác nhau ở chiều dữ liệu — chọn đúng vì nó ảnh hưởng testability):**

| Loại | Mối quan hệ Model-View | Ai update View | Điểm hay | Điểm dở |
|------|------------------------|----------------|----------|----------|
| **Passive View** (Fowler) | View ⟵ Presenter, Model → Viewer không | **Presenter** | Test được 100% (mock cả View) | Boilerplate nhiều, 1 Presenter : 1 View |
| **Supervising Controller** | View có ít binding, Presenter can thiệp nếu cần | Hỗn hợp | Nhanh hơn | View vẫn có logic → khó test triệt để |
| **Transactional Controller** | Hầu như như MVC | — | Ít dùng | — |

**MVP thực chiến gần như luôn là "Passive View"** — vì đó mới là lý do chọn MVP. Nếu bạn không mock được View trong test, MVP bằng MVC.

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

**Điểm "méo" thực tế nhất của MVP:** bạn thường **bắt buộc phải có 1 Presenter per View**. Hai view cùng giao diện (web + mobile) sẽ phải copy code Presenter hoặc extract ra component khác → vi phạm DRY. Đây là lỗi dẫn đến MVVM — nơi ViewModel chia sẻ giữa nhiều Views.

---

## 📐 3 thành phần

| Thành phần | Trách nhiệm | Ví dụ | Giải thích sâu |
|------------|-------------|-------|----------------|
| **Model** | Dữ liệu, business logic | `CounterModel` | Cùng Model của MVC — không đổi gì. |
| **View** | Hiển thị, chuyển input (**thụ động**) | `CounterView` (interface) | Key point: View là **giao diện**, không phải implementation. Interface này chứa những method mà Presenter cần gọi: `renderCount(n)`, `showError(msg)`. |
| **Presenter** | Điều phối, xử lý logic UI, cập nhật View | `CounterPresenter` | Là trái tim của MVP. Nhận input từ View interface, gọi Model, rồi **đẩy** kết quả về View. Presenter phải xử lý **toàn bộ logic hiển thị** (format, show/hide element, error messages) — không được delegate ngược lại View. |

**Interface View — điểm quan trọng nhất của MVP:**

```ts
// View không phải class, là interface (hoặc abstract)
interface CounterView {
  renderCount(n: number): void;
  enableButton(): void;
  disableButton(): void;
  showError(msg: string): void;
  onIncrement(callback: () => void): void;
  onDecrement(callback: () => void): void;
}
```

Presenter chỉ biết **CounterView interface**, không biết HTML/DOM/React component. Do đó:
- Bạn test Presenter với `FakeCounterView` (in-memory).
- Bạn test CounterView thật (DOM) riêng — chỉ check DOM.
- Hai thứ **hoàn toàn độc lập**.

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

**Presenter mẫu:**

```ts
class CounterPresenter {
  constructor(
    private view: CounterView,
    private model: CounterModel,
  ) {
    this.view.onIncrement(() => this.increment());
    this.view.onDecrement(() => this.decrement());
  }

  private increment() {
    try {
      const n = this.model.increment();
      this.view.renderCount(n);
      if (n > 5) this.view.showWarning('over limit');
    } catch (e) {
      this.view.showError(e.message);
    }
  }
}
```

**Test Presenter (không cần DOM):**

```ts
class FakeCounterView implements CounterView {
  count = 0; errors: string[] = [];
  renderCount(n: number) { this.count = n; }
  showError(msg: string) { this.errors.push(msg); }
  onIncrement(cb: () => void) { /* store, invoke later */ }
  onDecrement(cb: () => void) { /* store, invoke later */ }
}

const view = new FakeCounterView();
const pres = new CounterPresenter(view, new CounterModel());
// giả lập user click
view.onIncrementCallbacks[0]();
assert(view.count === 1);
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🧪 **View dễ test** | View thụ động, test bằng mock | Đây là **lý do chính** để chọn MVP. Bạn có thể test 100% logic hiển thị (format, show/hide, error path) mà không khởi động browser/Desktop. |
| 🧠 **Logic UI tập trung** | Presenter chứa toàn bộ logic hiển thị | Không phân tán vào View hay controller — đọc 1 chỗ biết hết logic màn hình. |
| 🔄 **Dễ thay View** | View chỉ là interface, đổi UI không đụng logic | Đổi từ console → web → mobile: chỉ thay class implement `CounterView`, Presenter **giữ nguyên**. |
| 🎯 **Tách triệt để** | View không biết Model | Không rò rỉ nghiệp vụ vào template. View là "cục thịt vô tri". |
| 🔧 **Thích hợp desktop/mobile native** | Không phụ thuộc framework reactive | Vì View là interface, bạn chạy được trên Swing, WinForms, iOS UIKit — không cần WPF/SwiftUI binding. |
| 📏 **Chuẩn hóa contract UI** | (Ưu điểm hay bị bỏ) | Interface View là API công khai của màn hình — new dev nhìn interface là biết màn hình có những tương tác gì. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🐘 **Presenter phình to** | Logic nhiều → Presenter dài | Failure mode kinh điển nhất. Khi màn hình phức tạp (form dài, nhiều validation, nhiều state), Presenter có thể 600+ dòng. *Giảm thiểu:* tách thành nhiều Presenter nhỏ + một Composite; hoặc đẩy nghiệp vụ phức sang `Service` layer (Presenter chỉ gọi service). |
| 📝 **Nhiều interface** | Mỗi View 1 interface, boilerplate | `CounterView`, `ProductListView`, `ProfileView`... mỗi interface có 5–20 method. *Giảm thiểu:* group method theo use case (`IViewWithLoading`, `IViewWithErrors`); dùng generics cho payload. |
| 🔗 **View-Presenter 1-1** | Thường 1 View ↔ 1 Presenter, khó tái dùng | Bạn không thể share Presenter giữa web + mobile vì interface View khác nhau. *Giảm thiểu:* MVP → MVVM nếu cần code-share đa-platform. |
| 🎭 **Code ceremony cho app nhỏ** | Boilerplate không tương xứng | Màn hình 1 button 1 label cũng phải viết interface View + implementation + Presenter. *Giảm thiểu:* với màn hình đơn giản ≤ 3 tương tác, dùng MVC/giữ thẳng. |
| 🔍 **Khó debug binding** | (Ít gặp nhưng có) | Nếu View không được render ( Presenter gọi `updateView` nhưng UI đứng yên), debug tìm xem callback nào bị mất. *Giảm thiểu:* log tất cả call vào `updateView` trong development. |
| 🧨 **Không phù hợp reactive UI** | (Limitation) | SwiftUI/Compose/React native có built-in data flow — ép MVP vào là "đấm vào tường". *Giảm thiểu:* chuyển sang MVVM khi framework yêu cầu binding. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Desktop/mobile app cần test UI logic | ✅ Phù hợp | Swing, WinForms, old-school UIKit — framework không cung cấp binding. |
| View phức tạp, nhiều state hiển thị (form dài, validation nhiều) | ✅ Phù hợp | Presenter chứa logic validation/format — testable 100%. |
| Cần tách UI khỏi logic triệt để | ✅ Phù hợp | UI designer và logic developer làm song song qua interface contract. |
| Web app đơn giản, ít state | ⚠️ MVC đủ dùng | Không cần ceremony. |
| Reactive UI (SwiftUI, Compose, React, Vue) | ❌ MVVM phù hợp hơn | Framework đã có binding; ép MVP = tự làm khó mình. |
| Cần share UI logic giữa platform (web + mobile) | ❌ MVVM phù hợp hơn | ViewModel có thể reused; Presenter gắn cứng với View interface. |

**Quy tắc thực tiễn từ Jeffrey Palermo (tác giả Onion Architecture — cũng là MVP advocate):** "Nếu bạn có thể unit test Presentation logic không cần browser thì MVP đúng. Nếu logic quá đơn giản để cần test riêng, hãy chọn MVC."

---

## 🔗 Liên quan

- **1.11 MVC** — Tiền thân: View chủ động hơn, đọc Model trực tiếp
- **1.13 MVVM** — Kế thừa: ViewModel + data binding thay cho Presenter đẩy tay
- **5.1.1 Unit Testing** — MVP là kiến trúc được thiết kế để **bạn có thể viết unit test cho UI**. Hãy test Presenter.

---

## 📁 Cấu trúc thư mục ví dụ

```
1.12-mvp/
├── README.md           # File này
└── examples/
    └── index.ts        # Counter demo (chạy: npx ts-node examples/index.ts)
```

Layout thực tế:

```text
src/features/userProfile/
├── domain/            # Model (UserModel)
├── presentation/
│   ├── interfaces/    # IUserView interface
│   ├── presenter/     # UserProfilePresenter
│   └── views/         # HTML/JSX implementation of IUserView
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.12-mvp
npx ts-node examples/index.ts
```

Hãy thử đọc và chạy **bản test**: tạo `FakeCounterView` thay thế cho `ConsoleCounterView`, chạy Presenter với fake → kết quả giống hệt. Đó là sức mạnh testability.

---

## 📚 Tài liệu tham khảo

- 📖 [MVP - Martin Fowler](https://martinfowler.com/eaaDev/uiArchs.html)
- 📖 [Model-View-Presenter - Wikipedia](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter)
- 📖 [The MVP Pattern in C# - Jeffrey Palermo](https://jeffreypalermo.com/2005/06/the-mvp-pattern/)

---

## ⏭️ Bài tiếp theo

→ [1.13 MVVM](../1.13-mvvm/README.md)
