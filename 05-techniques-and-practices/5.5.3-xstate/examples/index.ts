/**
 * 5.5.3 XState — State machine tự viết (state / event / transition / guard)
 *
 * Minh họa ý tưởng XState bằng TS thuần:
 * - Machine khai báo các state + transition giữa chúng
 * - Mỗi event có thể có guard (điều kiện) và target
 * - Gửi event không hợp lệ bị từ chối (giữ nguyên state)
 *
 * Ví dụ: máy đèn giao thông + máy form submit (có guard dữ liệu hợp lệ).
 */

// ──────────────────────────────── Machine ───────────────────────────────────
type StateValue = string;

interface XStateTransition {
  target: StateValue;
  guard?: (context: Record<string, unknown>) => boolean;
}

interface XStateConfig {
  initial: StateValue;
  states: Record<string, { on?: Record<string, XStateTransition> }>;
}

class XStateMachine {
  private current: StateValue;
  private readonly history: StateValue[] = [];
  private readonly events: Record<string, number> = {};

  constructor(
    private readonly config: XStateConfig,
    readonly context: Record<string, unknown> = {}
  ) {
    this.current = config.initial;
  }

  send(event: string): StateValue {
    const node = this.config.states[this.current];
    const transition = node.on?.[event];

    if (!transition) {
      console.log(`   ❌ Sự kiện "${event}" không hợp lệ ở state "${this.current}" — giữ nguyên`);
      return this.current;
    }

    if (transition.guard && !transition.guard(this.context)) {
      console.log(`   🛑 Event "${event}" bị GUARD chặn ở state "${this.current}"`);
      return this.current;
    }

    const previous = this.current;
    this.current = transition.target;
    this.history.push(previous);
    this.events[event] = (this.events[event] ?? 0) + 1;
    console.log(`   🔁 ${previous} --(${event})--> ${this.current}`);
    return this.current;
  }

  getState(): StateValue {
    return this.current;
  }

  getHistory(): StateValue[] {
    return this.history;
  }
}

// ──────────────────── Máy đèn giao thông (không guard) ──────────────────────
const trafficLightConfig: XStateConfig = {
  initial: "green",
  states: {
    green: { on: { TIMER: { target: "yellow" } } },
    yellow: { on: { TIMER: { target: "red" } } },
    red: { on: { TIMER: { target: "green" } } },
  },
};

// ──────────────── Máy form (có guard: không cho submit khi rỗng) ───────────
const formMachineConfig: XStateConfig = {
  initial: "idle",
  states: {
    idle: { on: { START: { target: "editing" } } },
    editing: {
      on: {
        SUBMIT: {
          target: "submitting",
          guard: (ctx) => (ctx["text"] as string).trim().length > 0,
        },
        CANCEL: { target: "cancelled" },
      },
    },
    submitting: { on: { SUCCESS: { target: "success" }, FAILURE: { target: "editing" } } },
    success: { on: { RESET: { target: "idle" } } },
    cancelled: {},
  },
};

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== XState (State Machine) Demo ===");
console.log("");

console.log("1️⃣ Traffic light — event TIMER xoay vòng green→yellow→red:");
const light = new XStateMachine(trafficLightConfig);
for (let i = 0; i < 3; i++) light.send("TIMER");
console.log(`   🚦 State hiện tại: ${light.getState()}`);
console.log(`   🚦 Lịch sử: ${light.getHistory().join(" → ")}`);
console.log("");

console.log("2️⃣ Form machine — SUBMIT bị guard chặn khi text rỗng:");
const form = new XStateMachine(formMachineConfig, { text: "" });
form.send("START");
form.send("SUBMIT"); // guard chặn → giữ state "editing"
console.log(`   📋 State sau SUBMIT rỗng: ${form.getState()}`);
console.log("");

console.log("3️⃣ Điền text hợp lệ rồi SUBMIT → submitting → success:");
form.context["text"] = "Nộp bài kiểm tra";
form.send("SUBMIT");
form.send("SUCCESS");
console.log(`   📋 State cuối: ${form.getState()}`);
console.log("");

console.log("4️⃣ Gửi event KHÔNG hợp lệ (RESET ở state success là hợp lệ, nhưng RED ở form):");
form.send("RESET"); // success → idle
form.send("TIMER"); // sự kiện vô nghĩa cho form → bị từ chối
console.log(`   📋 State sau sự kiện lạ: ${form.getState()}`);
console.log("");

console.log("✅ XState: mọi state đều tường minh, transition được khai báo rõ, guard chặn các chuyển động không hợp lệ — không còn if/else rải rác để khó hiểu.");
export {};