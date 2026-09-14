/**
 * 5.5.2 NgRx — Mô phỏng Store/Reducer/Selector/Effect (không dùng rxjs)
 *
 * NgRx = Redux pattern cho Angular, dựa trên Observable. Ở đây mô phỏng bằng
 * TS thuần để thấy ý tưởng các khái niệm:
 * - Action: một sự kiện mô tả việc ĐÃ xảy ra
 * - Reducer: state + action → state mới (bất biến)
 * - Selector: hàm chọn/derive slice của state (như store.pipe(select(...)))
 * - Effect: phản ứng với action, chạy side-effect rồi dispatch action mới
 */

// ──────────────────────────────── Action ────────────────────────────────────
interface NgrxAction {
  type: string;
  payload?: unknown;
}

const NgrxActions = {
  loadBooks: (): NgrxAction => ({ type: "[Books] Load Books" }),
  loadBooksSuccess: (books: string[]): NgrxAction => ({ type: "[Books] Load Success", payload: books }),
  loadBooksFailure: (error: string): NgrxAction => ({ type: "[Books] Load Failure", payload: error }),
  addBook: (title: string): NgrxAction => ({ type: "[Books] Add Book", payload: title }),
};

// ──────────────────────────────── State ─────────────────────────────────────
interface NgrxBooksState {
  books: string[];
  loading: boolean;
  error: string | null;
}

const ngrxInitialState: NgrxBooksState = {
  books: [],
  loading: false,
  error: null,
};

// ─────────────────────────────── Reducer ────────────────────────────────────
class NgrxReducer {
  reduce(state = ngrxInitialState, action: NgrxAction): NgrxBooksState {
    switch (action.type) {
      case "[Books] Load Books":
        return { ...state, loading: true, error: null };
      case "[Books] Load Success":
        return { ...state, loading: false, books: action.payload as string[] };
      case "[Books] Load Failure":
        return { ...state, loading: false, error: action.payload as string };
      case "[Books] Add Book":
        return { ...state, books: [...state.books, action.payload as string] };
      default:
        return state;
    }
  }
}

// ────────────────────────────── Selector ────────────────────────────────────
class NgrxSelector {
  selectAvailableBooks(state: NgrxBooksState): string[] {
    return state.loading ? [] : state.books; // "derive" — không sửa state
  }

  selectBooksCount(state: NgrxBooksState): number {
    return state.books.length;
  }
}

// ──────────────────────────────── Effect ────────────────────────────────────
// Effect lắng nghe action → chạy side-effect (mô phỏng gọi API) → dispatch action mới
class NgrxEffect {
  constructor(private readonly dispatch: (action: NgrxAction) => void) {}

  onLoadBooks(action: NgrxAction): void {
    if (action.type !== "[Books] Load Books") return;
    console.log(`   ⚡ Effect bắt Load Books → gọi API...`);
    // Giả lập fetch dữ liệu thành công
    const fetched: string[] = ["Angular in Action", "NgRx Fundamentals"];
    this.dispatch(NgrxActions.loadBooksSuccess(fetched));
  }

  onAddBook(action: NgrxAction): void {
    if (action.type !== "[Books] Add Book") return;
    console.log(`   ⚡ Effect đã thấy Add Book: "${action.payload as string}"`);
  }
}

// ──────────────────────────────── Store ─────────────────────────────────────
class NgrxStore {
  private state: NgrxBooksState;
  private readonly listeners = new Set<() => void>();
  readonly effect: NgrxEffect;

  constructor(private readonly reducer: NgrxReducer, initialState: NgrxBooksState) {
    this.state = initialState;
    this.effect = new NgrxEffect((action) => this.dispatch(action));
  }

  getState(): NgrxBooksState {
    return this.state;
  }

  dispatch(action: NgrxAction): void {
    this.state = this.reducer.reduce(this.state, action);
    this.listeners.forEach((l) => l());
    this.effect.onLoadBooks(action); // effect phản ứng với action
    this.effect.onAddBook(action);
  }

  select<T>(selector: (state: NgrxBooksState) => T): T {
    return selector(this.state);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== NgRx Demo ===");
console.log("");

const store = new NgrxStore(new NgrxReducer(), ngrxInitialState);
const selector = new NgrxSelector();

const unsubscribe = store.subscribe(() => {
  console.log(`   🔄 State: ${JSON.stringify(store.getState())}`);
});

console.log("1️⃣ Component dispatch loadBooks — effect chạy, tự dispatch Load Success:");
store.dispatch(NgrxActions.loadBooks());
console.log("");
console.log("   Selector selectAvailableBooks:", store.select(selector.selectAvailableBooks));
console.log("   Selector selectBooksCount      :", store.select(selector.selectBooksCount));
console.log("");

console.log("2️⃣ Component dispatch addBook — reducer cập nhật bất biến, effect log:");
store.dispatch(NgrxActions.addBook("Clean Code for Angular"));
console.log("");
console.log("   Books sau add:", store.select(selector.selectAvailableBooks));
console.log("");

unsubscribe();
store.dispatch(NgrxActions.loadBooksFailure("Network error"));
console.log("   (đã unsubscribe — nhưng state vẫn còn error:", store.getState().error, ")");
console.log("");

console.log("✅ NgRx: Action mô tả sự việc, Reducer pure tạo state mới, Selector “derive” giá trị cho view, Effect xử lý side-effect (API) rồi dispatch thêm. Luồng là một chiều và bất biến.");
export {};