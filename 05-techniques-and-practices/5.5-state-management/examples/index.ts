/**
 * 5.5 State Management — Bản so sánh nhanh các lựa chọn
 *
 * Minh họa tổng quan các leaf con:
 * - Redux: store thuần tối giản (dispatch → reducer → subscribe)
 * - NgRx:   action + reducer + selector mô phỏng
 * - XState: state machine (state/event/transition)
 * - Flux:   dispatcher → store → view một chiều
 * - EventEmitter: on/off/emit
 *
 * (Đây là file tổng quan — chi tiết nằm ở từng leaf 5.5.1 → 5.5.5)
 */

// ──────────────────────────── 1. Redux-style ────────────────────────────────
interface StateOverviewAction {
  type: string;
  payload?: number;
}

type StateOverviewReducer = (state: number, action: StateOverviewAction) => number;

class StateOverviewStore {
  private state: number;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly reducer: StateOverviewReducer, initialState: number) {
    this.state = initialState;
  }

  getState(): number {
    return this.state;
  }

  dispatch(action: StateOverviewAction): void {
    this.state = this.reducer(this.state, action);
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// ──────────────────────────── 2. NgRx-style ─────────────────────────────────
interface NgrxOverviewAction {
  type: string;
  amount: number;
}

class NgrxOverviewSelector {
  isPositive(value: number): boolean {
    return value > 0;
  }
}

// ─────────────────────────── 3. XState-style ────────────────────────────────
type TrafficLightState = "green" | "yellow" | "red";

class TrafficLightMachine {
  private state: TrafficLightState = "green";

  send(event: "TIMER"): TrafficLightState {
    const transitions: Record<TrafficLightState, Partial<Record<"TIMER", TrafficLightState>>> = {
      green: { TIMER: "yellow" },
      yellow: { TIMER: "red" },
      red: { TIMER: "green" },
    };
    const next = transitions[this.state][event];
    this.state = next ?? this.state;
    return this.state;
  }

  getState(): TrafficLightState {
    return this.state;
  }
}

// ──────────────────────────── 5. EventEmitter ───────────────────────────────
class OverviewEventEmitter {
  private readonly listeners = new Map<string, Array<() => void>>();

  on(event: string, listener: () => void): void {
    const list = this.listeners.get(event) ?? [];
    list.push(listener);
    this.listeners.set(event, list);
  }

  emit(event: string): void {
    this.listeners.get(event)?.forEach((l) => l());
  }
}

// ──────────────────────────────── 4. Flux ───────────────────────────────────
interface FluxOverviewAction {
  type: "ADD" | "CLEAR";
  text?: string;
}

class FluxOverviewDispatcher {
  private readonly handlers: Array<(action: FluxOverviewAction) => void> = [];

  register(handler: (action: FluxOverviewAction) => void): void {
    this.handlers.push(handler);
  }

  dispatch(action: FluxOverviewAction): void {
    // Flux luồng một chiều: dispatcher BROADCAST cho mọi store đã đăng ký
    this.handlers.forEach((h) => h(action));
  }
}

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== State Management Overview Demo ===");
console.log("");

console.log("1️⃣ Redux-style — dispatch đổi state qua reducer thuần:");
const counterReducer = (state: number, action: StateOverviewAction): number => {
  if (action.type === "INCREMENT") return state + (action.payload ?? 1);
  if (action.type === "RESET") return 0;
  return state;
};
const reduxStore = new StateOverviewStore(counterReducer, 0);
const unsub = reduxStore.subscribe(() => {
  console.log(`   🔄 State mới: ${reduxStore.getState()}`);
});
reduxStore.dispatch({ type: "INCREMENT" });
reduxStore.dispatch({ type: "INCREMENT", payload: 5 });
unsub(); // ngừng lắng nghe
console.log("");
void NgrxOverviewSelector;

console.log("2️⃣ NgRx-style — selector tính value dẫn xuất (derived state):");
const selector = new NgrxOverviewSelector();
const ngrxValue = 7;
console.log(`   State = ${ngrxValue} → isPositive? ${selector.isPositive(ngrxValue)}`);
console.log("");

console.log("3️⃣ XState-style — traffic light chuyển state theo event TIMER:");
const light = new TrafficLightMachine();
for (let i = 0; i < 5; i++) {
  const next = light.send("TIMER");
  console.log(`   ⚪ ${next === "green" ? "🟢" : next === "yellow" ? "🟡" : "🔴"} green/yellow/red → ${next}`);
}
console.log("");

console.log("4️⃣ Flux-style — dispatcher broadcast action đến store đã đăng ký:");
const fluxDispatcher = new FluxOverviewDispatcher();
const fluxTodos: string[] = [];
fluxDispatcher.register((action) => {
  if (action.type === "ADD" && action.text) fluxTodos.push(action.text);
  if (action.type === "CLEAR") fluxTodos.length = 0;
});
fluxDispatcher.dispatch({ type: "ADD", text: "học Redux" });
fluxDispatcher.dispatch({ type: "ADD", text: "học XState" });
console.log(`   View render: ${fluxTodos.join(", ")}`);
console.log("");

console.log("5️⃣ EventEmitter-style — on/emit: nc đăng ký nhận sự kiện:");
const emitter = new OverviewEventEmitter();
emitter.on("user:login", () => console.log("   📣 [listener] user vừa đăng nhập"));
emitter.emit("user:login");
console.log("");

console.log("✅ Tổng quan 5 cách quản lý state: Redux (store thuần + reducer), NgRx (reactive cho Angular), XState (state machine rõ ràng), Flux (một chiều dispatcher→store→view), EventEmitter (pub/sub lỏng lẻo). Dùng đúng thứ cho từng nhu cầu.");
export {};