/**
 * 🎨 MVC — Counter Demo
 *
 * Model: CounterModel (state, notify observers)
 * View: CounterView (render, nhận user input)
 * Controller: CounterController (xử lý input, cập nhật Model, yêu cầu View render)
 *
 * Luồng: User → View → Controller → Model → View (render lại)
 */

// ============================================
// MODEL — quản lý state, không biết View/Controller
// ============================================

type Observer = () => void;

class CounterModel {
  private count = 0;
  private observers: Observer[] = [];

  getCount(): number {
    return this.count;
  }

  increment(): void {
    this.count++;
    this.notify();
  }

  decrement(): void {
    this.count--;
    this.notify();
  }

  reset(): void {
    this.count = 0;
    this.notify();
  }

  // View đăng ký lắng nghe thay đổi state
  subscribe(observer: Observer): void {
    this.observers.push(observer);
  }

  private notify(): void {
    for (const observer of this.observers) {
      observer();
    }
  }
}

// ============================================
// VIEW — hiển thị state, chuyển user input cho Controller
// ============================================

class CounterView {
  constructor(private controller: CounterController) {}

  // Render state từ Model
  render(model: CounterModel): void {
    console.log(`🖥️  View: Count = ${model.getCount()}`);
  }

  // User click nút + → gửi cho Controller
  onIncrementClick(): void {
    console.log("🖱️  User clicked [+]");
    this.controller.handleIncrement();
  }

  // User click nút − → gửi cho Controller
  onDecrementClick(): void {
    console.log("🖱️  User clicked [−]");
    this.controller.handleDecrement();
  }

  // User click nút Reset → gửi cho Controller
  onResetClick(): void {
    console.log("🖱️  User clicked [Reset]");
    this.controller.handleReset();
  }
}

// ============================================
// CONTROLLER — điều phối: nhận input, cập nhật Model, render View
// ============================================

class CounterController {
  private view!: CounterView;

  constructor(private model: CounterModel) {
    // View render lại mỗi khi Model thay đổi
    this.model.subscribe(() => this.view.render(this.model));
  }

  // Gắn View (gọi sau khi tạo View)
  setView(view: CounterView): void {
    this.view = view;
  }

  handleIncrement(): void {
    this.model.increment();
  }

  handleDecrement(): void {
    this.model.decrement();
  }

  handleReset(): void {
    this.model.reset();
  }
}

// ============================================
// MAIN — Composition Root
// ============================================

function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  🎨 MVC ARCHITECTURE DEMO            ║");
  console.log("║  Model - View - Controller           ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("");

  // Khởi tạo 3 thành phần
  const model = new CounterModel();
  const controller = new CounterController(model);
  const view = new CounterView(controller);

  // Gắn View vào Controller (2 chiều)
  controller.setView(view);

  // View render lần đầu
  view.render(model);
  console.log("");

  // Mô phỏng user tương tác
  view.onIncrementClick();
  view.onIncrementClick();
  view.onDecrementClick();
  view.onResetClick();

  console.log("");
  console.log("📝 KẾT LUẬN:");
  console.log("  ✅ Model độc lập — không biết View/Controller");
  console.log("  ✅ Controller điều phối: input → model → render");
  console.log("  ✅ View thụ động: chỉ render & chuyển input");
  console.log("  ❌ Controller dễ phình to (fat controller)");
  console.log("  ❌ View phụ thuộc Model (render trực tiếp)");
}

main();

// export {} để file này là module — tránh trùng tên class với các example khác
export {};