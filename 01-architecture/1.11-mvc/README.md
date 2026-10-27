# 🎨 1.11 MVC (Model-View-Controller)

> Tách UI thành 3 thành phần: **Model** (dữ liệu + logic), **View** (hiển thị), **Controller** (xử lý input, điều phối). Kiến trúc UI phổ biến nhất, nền tảng của nhiều framework (Spring MVC, Rails, Laravel, Express).

---

## 🎯 Kiến trúc này là gì?

MVC chia ứng dụng UI thành 3 phần với trách nhiệm rõ ràng:

**MVC không phải một "kiến trúc hệ thống" — nó là kiến trúc cho tầng presentation.** Đây là điểm rất nhiều người hiểu sai, dẫn đến so sánh "MVC vs Clean Architecture" (hai thứ ở hai tầng khác nhau, dùng **chung với nhau** được, không đối lập). MVC sinh ra ở Smalltalk những năm 1979 (Trygve Reenskaug), nhằm một mục đích duy nhất: **tách "dữ liệu nghiệp vụ" khỏi "cách nó hiện ra trên màn hình"** để đổi giao diện không phải đụng dữ liệu.

**Ba mối quan hệ (đọc kỹ vì mỗi framework làm khác nhau):**
- **Model → View:** Model **báo** khi state đổi (observer). View **đọc** state từ Model để render.
- **Controller → Model:** Controller nhận input, **biến nó thành thao tác trên Model** (tăng counter, tạo order).
- **Controller → View:** Controller **chọn** View nào được render — trong web MVC, đây là trả về template + data.

**Điểm hay bị hiểu nhầm nhất: trong MVC gốc, Controller KHÔNG gửi dữ liệu thẳng tới View.** View tự subscribe Model. Nhưng các framework web (Spring, Laravel, Express) đã đơn giản hóa: Controller gọi service, rồi **render template với data**. Đó là phiên bản "web MVC", hơi lệch MVC gốc. Biết sự khác biệt để đọc code hai thế giới không bị lẫn.

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

| Thành phần | Trách nhiệm | Ví dụ | Giải thích sâu |
|------------|-------------|-------|----------------|
| **Model** | Dữ liệu, business logic, trạng thái | `CounterModel`, `User`, `Order` | Model = **trạng thái + rule của trạng thái đó**. Model tốt biết `isValid()`, `canCancel()`. Model xấu chỉ chứa field không có rule. Model **không import** framework web. |
| **View** | Hiển thị, render dữ liệu từ Model | HTML template, React component, console output | View **đọc** từ Model, không tính toán nghiệp vụ. View tốt chứa logic hiển thị (`formatDate`, `if (isEmpty)`), không chứa rule (`if (user.role === 'ADMIN' && order.total > 1000)`). |
| **Controller** | Nhận input, gọi Model, chọn View | `CounterController`, `UserController` | Controller = **phiên dịch** giữa thế giới HTTP và thế giới nghiệp vụ. Nhận request, parse input, authz, gọi model/service, chọn view. Controller **mỏng** là chỉ báo MVC được dùng đúng. |

**Trong web backend hiện đại, chữ "M" thường phình thành nhiều thứ:**
- **Entity/Domain model** (nghiệp vụ) — "M" thật của MVC gốc
- **ViewModel/DTO** (dữ liệu chuẩn bị cho view)
- **Database model/ORM entity**
- **Form model** (input validation)

Vấn đề kinh điển: dev đặt hết 4 thứ vào một chữ M → model DB có quan hệ lazy → controller trả thẳng model DB sang view → view hiển thị `passwordHash`. MVC không dạy bạn cách tách các "model" con; đó là việc của pattern khác (DTO 5.8.3, repository 5.8.1, clean architecture 1.3).

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

**Cơ chế observer khiến "Model notify" chạy được — chính là thứ React/Vue tự động làm:**

```ts
class CounterModel {
  private count = 0;
  private listeners: Array<() => void> = [];
  onChange(fn: () => void) { this.listeners.push(fn); }
  private notify() { this.listeners.forEach(fn => fn()); }

  increment() { this.count++; this.notify(); }
  get value() { return this.count; }
}

// View chỉ render khi được thông báo
model.onChange(() => view.render(model.value));
```

Ở phiên bản MVC web (server-rendered), mô hình observer không có — thay bằng **request/response tuần tự**: user click → HTTP request → controller render lại HTML toàn bộ → browser hiển thị. Đấy là "MVC vòng lặp mở" so với MVC gốc (state giữ trong memory).

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🚀 **Phổ biến, dễ hiểu** | Hầu hết dev biết, nhiều framework hỗ trợ | Framework mặc định đóng gói sẵn → bạn không cần quyết định về kiến trúc để viết "hello world". Chi phí tư duy thấp nhất cho một UI CRUD. |
| 🧩 **Tách trách nhiệm rõ** | Model/View/Controller mỗi phần 1 việc | Mỗi phần **có thể đổi độc lập**: designer sửa template (View) không đụng logic (Model). |
| 🔄 **Dễ thay View** | Đổi UI không đụng Model/Controller | Từ HTML sang JSON API: Model giữ nguyên, chỉ đổi View (serializers). Đây là điều MVC gốc hứa hẹn và web framework giữ được. |
| 👨‍💻 **Onboarding nhanh** | Cấu trúc quen thuộc | Routing table đọc được = biết hết các điểm vào của app. |
| 🔀 **Tương thích với mọi backend stack** | (Ưu điểm quan trọng) | MVC **không cản** bạn dùng Clean/Onion/DDD phía sau Controller. Controller mỏng gọi use case → MVC ở ngoài, DDD ở trong — combo chuẩn công nghiệp hiện đại. |
| 💨 **Đơn giản cho web server-rendered** | (Phù hợp use case) | Với form-heavy internal app, một request → một render là toàn bộ đời sống app → MVC là **vừa đủ**, mọi pattern phức tạp hơn đều over-engineering. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🐘 **Fat Controller** | Controller dễ phình to khi logic nhiều | Failure mode kinh điển. Vì Controller là nơi **dễ nhất** để bỏ logic (nó "đứng giữa"), mỗi dev hay thêm `if`. Sau 1 năm: 400 dòng/controller, không test được (phải mock request + DB). *Giảm thiểu:* đẩy logic xuống Service/UseCase; controller ≤ 5 dòng: parse → delegate → render. |
| 🔗 **View phụ thuộc Model** | View biết cấu trúc Model, khó test độc lập | Template truy cập `user.profile.address.city` → Model đổi field → View hỏng. *Giảm thiểu:* dùng **ViewModel/DTO riêng** cho mỗi view, map ở Presenter/Controller. |
| 🌀 **Model phình to** | Business logic + state + notify dồn vào Model | MVC không nói "business logic đặt đâu", nên Model (hoặc Service nằm cạnh) trở thành God class. *Giảm thiểu:* tách Service/Use Case layer → model "pure" hơn. |
| 🧪 **Controller khó test** | (Hạn chế thực tế) | Controller có request/response lifecycle → integration test là hợp lý hơn unit test. Nếu logic đã ở model/service → controller test nhẹ (test routing + status code). |
| 🌊 **Không phù hợp với client-side reactive UI** | (Giới hạn cấu trúc) | MVC giả định vòng điều khiển nằm ở server. SPA/React/Vue/SwiftUI có state bất đối xứng, nhiều view cùng quan sát một state → MVC "classic" buộc bạn tự chế observer + unidirectional data flow. |
| 🎭 **Không có quy tắc về dependency direction** | (Giới hạn cấu trúc) | MVC không cấm `Model` import `View`, không bắt dependency đảo. Nên không thể bảo vệ core nếu không kết hợp clean architecture. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Web app truyền thống (server-rendered: Rails, Laravel, Django, Spring MVC) | ✅ Phù hợp | MVC sinh ra cho đúng mô hình request → render → response này. |
| REST API backend (Controller → Service → Model) | ✅ Phù hợp | Controller = router; Service = business logic; MVC ở ngoài, layered ở trong. |
| CRUD app doanh nghiệp, form-heavy, không cần test kỹ | ✅ Phù hợp | Không cần thêm tầng khi logic hiển thị đơn giản. |
| UI phức tạp, cần test View độc lập | ⚠️ Cân nhắc MVP/MVVM | View thụ động hoặc binding sẽ giúp test được mà không cần màn hình thật. |
| Desktop/mobile reactive UI (WPF, SwiftUI, Flutter, React) | ❌ MVVM phù hợp hơn | Cần data binding / observer / unidirectional flow mà MVC không định nghĩa. |
| State đồng bộ giữa nhiều component trong SPA | ❌ Không đủ | Cần state management pattern (5.5: Redux/NgRx/Flux). |
| Cần bảo vệ domain logic khỏi công nghệ UI | ❌ Không đủ | MVC không định nghĩa dependency direction → kết hợp Clean/Onion/DDD. |

---

## 🔗 Liên quan

- **1.12 MVP** — Cải tiến: View thụ động, Presenter điều phối
- **1.13 MVVM** — Cải tiến: ViewModel + data binding
- **1.4 Layered** — MVC thường nằm trong Presentation layer
- **1.3 Clean** — Controller = Interface Adapter (②)

**Dòng tiến hóa của họ "MVC family" — hiểu 1 hình nhớ cả ba bài:**

| Pattern | View | Người điều phối | Mục đích |
|---------|------|------------------|----------|
| **MVC** | Thông minh (đọc Model) | Controller (biết View) | Tách dữ liệu khỏi hiển thị |
| **MVP** | Thụ động (chỉ hiển thị) | Presenter (đọc Model → đẩy sang View) | Test không cần UI |
| **MVVM** | Thụ động + binding | ViewModel (state + command) | Reactive UI, tự cập nhật |
| **Flux/Redux** | Thụ động | Store + unidirectional flow | SPA state phức tạp |

---

## 📁 Cấu trúc thư mục ví dụ

```
1.11-mvc/
├── README.md           # File này
└── examples/
    └── index.ts        # Counter demo (chạy: npx tsx examples/index.ts)
```

Layout điển hình web MVC (Express/Laravel-style):

```text
src/
├── controllers/     # UserController, OrderController (mỏng)
├── models/          # User, Order (data + rule)
├── services/        # ← nên có! (chứ MVC gốc không có)
├── views/           # templates (EJS, Blade, Twig)
├── routes/          # mapping URL → controller
└── middleware/      # auth, logging
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.11-mvc
npx tsx examples/index.ts
```

Quan sát demo: `CounterModel` phát thông báo → View mới render. Thử tưởng tượng thêm một View thứ hai (log ra file) subscribe cùng Model — cả hai cập nhật mà Controller không đổi gì. Đó chính là sức mạnh của observer + separation.

---

## 📚 Tài liệu tham khảo

- 📖 [MVC - Martin Fowler](https://martinfowler.com/eaaDev/uiArchs.html)
- 📖 [MVC - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Glossary/MVC)
- 📖 [The MVC model for Smalltalk (Trygve Reenskaug)](http://heim.ifi.uio.no/~trygver/1979/mvc-2/1979-12-MVC.pdf)

---

## ⏭️ Bài tiếp theo

→ [1.12 MVP](../1.12-mvp/README.md)
