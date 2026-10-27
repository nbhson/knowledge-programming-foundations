/**
 * 🧩 MVVM — Counter Demo
 *
 * Model: CounterModel (state thuần)
 * ViewModel: CounterViewModel (phơi bày state observable + commands)
 * View: CounterView (bind vào ViewModel, tự render khi state đổi)
 *
 * Khác MVP: View không gọi Presenter. View "bind" vào ViewModel.
 * ViewModel không biết View — chỉ phơi bày state/commands.
 */

// ============================================
// OBSERVABLE — cơ chế data binding đơn giản
// ============================================

type Listener<T> = (value: T) => void;

class Observable<T> {
  private value: T;
  private listeners: Listener<T>[] = [];

  constructor(initial: T) {
    this.value = initial;
  }

  get(): T {
    return this.value;
  }

  set(newValue: T): void {
    if (this.value === newValue) return;
    this.value = newValue;
    for (const listener of this.listeners) {
      listener(this.value);
    }
  }

  // View subscribe → tự render khi state đổi
  subscribe(listener: Listener<T>): void {
    this.listeners.push(listener);
  }
}

// ============================================
// MODEL — state thuần, không biết ViewModel/View
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
// VIEWMODEL — phơi bày state observable + commands
// Không biết View tồn tại
// ============================================

class CounterViewModel {
  // State phơi bày cho View bind
  readonly count = new Observable<number>(0);
  readonly message = new Observable<string>("");

  constructor(private model: CounterModel) {
    this.count.set(model.getCount());
  }

  // Commands — View gọi khi user tương tác
  increment(): void {
    this.model.increment();
    this.count.set(this.model.getCount());
  }

  decrement(): void {
    this.model.decrement();
    this.count.set(this.model.getCount());
  }

  reset(): void {
    this.model.reset();
    this.count.set(this.model.getCount());
    this.message.set("Counter đã reset về 0");
  }
}

// ============================================
// VIEW — bind vào ViewModel, tự render khi state đổi
// ============================================

class CounterView {
  constructor(private viewModel: CounterViewModel) {
    // Data binding: subscribe vào state của ViewModel
    viewModel.count.subscribe((count) => this.renderCount(count));
    viewModel.message.subscribe((msg) => this.renderMessage(msg));
  }

  private renderCount(count: number): void {
    console.log(`🖥️  View: Count = ${count}`);
  }

  private renderMessage(message: string): void {
    if (message) {
      console.log(`💬 View: ${message}`);
    }
  }

  // User click → gọi command trên ViewModel
  onIncrementClick(): void {
    console.log("🖱️  User clicked [+]");
    this.viewModel.increment();
  }

  onDecrementClick(): void {
    console.log("🖱️  User clicked [−]");
    this.viewModel.decrement();
  }

  onResetClick(): void {
    console.log("🖱️  User clicked [Reset]");
    this.viewModel.reset();
  }
}

// ============================================
// MAIN — Composition Root
// ============================================

function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  🧩 MVVM ARCHITECTURE DEMO           ║");
  console.log("║  Model - View - ViewModel            ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("");

  // Khởi tạo: Model + ViewModel + View
  const model = new CounterModel();
  const viewModel = new CounterViewModel(model);
  const view = new CounterView(viewModel);

  // Mô phỏng user tương tác
  view.onIncrementClick();
  view.onIncrementClick();
  view.onDecrementClick();
  view.onResetClick();

  console.log("");
  console.log("📝 KẾT LUẬN:");
  console.log("  ✅ ViewModel không biết View — test dễ (thuần logic)");
  console.log("  ✅ Data binding: View tự render khi state đổi");
  console.log("  ✅ ViewModel phơi bày state/commands — View chỉ bind");
  console.log("  ❌ Binding phức tạp khó debug");
  console.log("  ❌ Overkill cho màn hình đơn giản");
}

main();

// export {} để file này là module — tránh trùng tên class với các example khác
export {};