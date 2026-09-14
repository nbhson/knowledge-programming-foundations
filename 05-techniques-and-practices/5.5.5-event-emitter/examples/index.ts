/**
 * 5.5.5 EventEmitter — Publish/Subscribe mini (on / off / emit / once)
 *
 * Pattern quen thuộc từ Node.js `events`. Emitter phát sự kiện,
 * listener đăng ký nhận — publisher KHÔNG biết subscriber (decoupled).
 */

// ──────────────────────────────── Emitter ───────────────────────────────────
// Bản đồ kiểu payload cho từng sự kiện — giúp on/emit an toàn kiểu
interface EventEmitterEvents {
  "user:login": Record<string, string>;
  "newsletter:subscribe": string;
}

type EmitterListener<T> = (payload: T) => void;

class EventEmitterTs<TEvents> {
  private readonly listeners = new Map<keyof TEvents, EmitterListener<unknown>[]>();

  // Đăng ký listener cho 1 sự kiện
  on<E extends keyof TEvents>(
    event: E,
    listener: EmitterListener<TEvents[E]>
  ): void {
    const current = this.listeners.get(event) ?? [];
    current.push(listener as EmitterListener<unknown>);
    this.listeners.set(event, current);
    console.log(`   📥 listener được đăng ký cho "${event as string}" (tổng: ${current.length})`);
  }

  // Hủy đăng ký 1 listener cụ thể
  off<E extends keyof TEvents>(
    event: E,
    listener: EmitterListener<TEvents[E]>
  ): void {
    const current = this.listeners.get(event) ?? [];
    const next = current.filter((l) => l !== (listener as EmitterListener<unknown>));
    this.listeners.set(event, next);
    console.log(`   📤 listener bị gỡ khỏi "${event as string}" (còn: ${next.length})`);
  }

  // Chỉ lắng nghe MỘT lần rồi tự hủy
  once<E extends keyof TEvents>(
    event: E,
    listener: EmitterListener<TEvents[E]>
  ): void {
    const wrapper: EmitterListener<unknown> = (payload) => {
      this.off(event, listener);
      listener(payload as TEvents[E]);
    };
    this.on(event, wrapper as EmitterListener<TEvents[E]>);
  }

  // Phát sự kiện → gọi mọi listener đã đăng ký, theo thứ tự
  emit<E extends keyof TEvents>(event: E, payload: TEvents[E]): void {
    const current = this.listeners.get(event) ?? [];
    console.log(`   📣 emit("${event as string}") → gọi ${current.length} listener`);
    current.forEach((l) => l(payload));
  }
}

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== EventEmitter Demo ===");
console.log("");

const emitter = new EventEmitterTs<EventEmitterEvents>();

const onUserLogin = (user: Record<string, string>) => {
  console.log(`   👋 [listener] Xin chào ${user["name"]}!`);
};

const onLogAnalytics = (user: Record<string, string>) => {
  console.log(`   📊 [listener] Ghi analytic: user ${user["id"]} đăng nhập`);
};

console.log("1️⃣ Đăng ký 2 listener cho sự kiện 'user:login':");
emitter.on("user:login", onUserLogin);
emitter.on("user:login", onLogAnalytics);
console.log("");

console.log("2️⃣ Phát sự kiện user:login:");
emitter.emit("user:login", { id: "u-1", name: "Son" });
console.log("");

console.log("3️⃣ once — lắng nghe 1 lần duy nhất sự kiện 'newsletter:subscribe':");
emitter.once("newsletter:subscribe", (email) => {
  console.log(`   💌 [once] Gửi email chào mừng tới ${email}`);
});
emitter.emit("newsletter:subscribe", "son@example.com");
emitter.emit("newsletter:subscribe", "again@example.com"); // listener đã tự gỡ
console.log("");

console.log("4️⃣ Hủy listener onUserLogin, phát lại sự kiện:");
emitter.off("user:login", onUserLogin);
emitter.emit("user:login", { id: "u-2", name: "Minh" });
console.log("");

console.log("5️⃣ Gọi off thêm 1 lần nữa khi đã không còn (an toàn — không lỗi):");
emitter.off("user:login", onLogAnalytics);
emitter.off("user:login", onLogAnalytics);
console.log("");

console.log("✅ EventEmitter: publisher emit mà không cần biết ai lắng nghe, subscriber on/off chủ động — giảm coupling, dễ mở rộng thêm listener (nhưng nhớ gỡ khi không dùng để tránh memory leak).");
export {};