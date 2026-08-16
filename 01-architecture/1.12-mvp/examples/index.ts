/**
 * 🎭 MVP — Counter Demo
 *
 * Model: CounterModel (state thuần, không biết View/Presenter)
 * View: CounterView (thụ động — chỉ hiển thị & chuyển event cho Presenter)
 * Presenter: CounterPresenter (chứa toàn bộ logic, cập nhật View qua interface)
 *
 * Khác MVC: View không đọc Model trực tiếp. Presenter điều phối mọi thứ.
 * View dễ test: mock View, test Presenter thuần logic.
 */

// ============================================
// MODEL — state thuần, không biết ai dùng
// ============================================

class CounterModel {
  private count = 0;

  getCount(): number {
    return this.count;
  }

  increment(): void {
    this.count++;
  }

  decrement(): void {
    this.count--;
  }

  reset(): void {
    this.count = 0;
  }
}

// ============================================
// VIEW INTERFACE — Presenter chỉ biết interface này
// ============================================

interface CounterViewContract {
  showCount(count: number): void;
  showMessage(message: string): void;
}

// ============================================
// VIEW — thụ động: hiển thị & chuyển event cho Presenter
// ============================================

class CounterView implements CounterViewContract {
  constructor(private presenter: CounterPresenter) {}

  // Presenter gọi để render
  showCount(count: number): void {
    console.log(`🖥️  View: Count = ${count}`);
  }

  // Presenter gọi để hiện thông báo
  showMessage(message: string): void {
    console.log(`💬 View: ${message}`);
  }

  // User click → chuyển thẳng cho Presenter (View không xử lý logic)
  onIncrementClick(): void {
    console.log("🖱️  User clicked [+]");
    this.presenter.onIncrement();
  }

  onDecrementClick(): void {
    console.log("🖱️  User clicked [−]");
    this.presenter.onDecrement();
  }

  onResetClick(): void {
    console.log("🖱️  User clicked [Reset]");
    this.presenter.onReset();
  }
}

// ============================================
// PRESENTER — chứa toàn bộ logic, điều phối Model ↔ View
// ============================================

class CounterPresenter {
  private model: CounterModel;
  private view!: CounterViewContract;

  constructor(model: CounterModel) {
    this.model = model;
  }

  // Gắn View (gọi sau khi tạo View)
  setView(view: CounterViewContract): void {
    this.view = view;
  }

  // Gọi khi View khởi động
  onViewLoaded(): void {
    this.view.showCount(this.model.getCount());
  }

  onIncrement(): void {
    this.model.increment();
    this.view.showCount(this.model.getCount());
  }

  onDecrement(): void {
    this.model.decrement();
    this.view.showCount(this.model.getCount());
  }

  onReset(): void {
    this.model.reset();
    this.view.showCount(this.model.getCount());
    this.view.showMessage("Counter đã reset về 0");
  }
}

// ============================================
// MAIN — Composition Root
// ============================================

function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  🎭 MVP ARCHITECTURE DEMO            ║");
  console.log("║  Model - View - Presenter            ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("");

  // Khởi tạo: Model + View + Presenter
  const model = new CounterModel();
  const presenter = new CounterPresenter(model);
  const view = new CounterView(presenter);

  // Gắn View vào Presenter (2 chiều)
  presenter.setView(view);

  // View khởi động → Presenter render lần đầu
  view.onIncrementClick();
  view.onIncrementClick();
  view.onDecrementClick();
  view.onResetClick();

  console.log("");
  console.log("📝 KẾT LUẬN:");
  console.log("  ✅ View thụ động — không đọc Model trực tiếp");
  console.log("  ✅ Presenter chứa toàn bộ logic — test dễ (mock View)");
  console.log("  ✅ View implement interface — dễ swap UI khác");
  console.log("  ❌ Presenter dễ phình to khi UI phức tạp");
  console.log("  ❌ Nhiều interface/boilerplate hơn MVC");
}

main();

// export {} để file này là module — tránh trùng tên class với các example khác
export {};