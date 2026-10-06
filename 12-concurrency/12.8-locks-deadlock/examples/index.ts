/**
 * 12.8 Locks & Deadlock — mutex/semaphore, 4 điều kiện Coffman, lock ordering
 *
 * Minh họa:
 * - Mutex bảo vệ counter khỏi race.
 * - Deadlock khi lock ngược thứ tự (mô phỏng phát hiện chu trình).
 * - Fix: lock ordering (luôn theo id tăng dần) + semaphore N slots.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Mutex ───────────────────────────
class Mutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise((res) => this.queue.push(res));
  }

  release(): void {
    const next = this.queue.shift();
    if (next) next();
    else this.locked = false;
  }
}

// Semaphore: tối đa N người cùng lúc
class Semaphore {
  private used = 0;
  private queue: (() => void)[] = [];
  constructor(private slots: number) {}

  async acquire(): Promise<void> {
    if (this.used < this.slots) {
      this.used++;
      return;
    }
    return new Promise((res) => this.queue.push(res));
  }

  release(): void {
    const next = this.queue.shift();
    if (next) next();
    else this.used--;
  }
}

// Lock ordering: luôn lock theo thứ tự id → không circular wait
function lockPlan(a: string, b: string): string[] {
  const [first, second] = [a, b].sort();
  return [`lock(${first})`, `lock(${second})`, "transfer", `unlock(${second})`, `unlock(${first})`];
}

// Phát hiện deadlock đơn giản: hai task chờ chéo nhau (A chờ tài nguyên B giữ và ngược lại)
function hasCycle(waits: Record<string, string>, held: Record<string, string>): boolean {
  const tasks = Object.keys(waits);
  for (const a of tasks) {
    for (const b of tasks) {
      if (a !== b && held[b] === waits[a] && held[a] === waits[b]) return true;
    }
  }
  return false;
}

// ─────────────────────────────── Demo ───────────────────────────────
async function main(): Promise<void> {
  console.log("=== Locks & Deadlock Demo ===\n");

  console.log("1️⃣ Mutex bảo vệ counter (2 tasks +1000 lần, không lock sẽ mất update):");
  const mutex = new Mutex();
  let counter = 0;
  const inc = async (): Promise<void> => {
    for (let i = 0; i < 1000; i++) {
      await mutex.acquire();
      try {
        counter++; // critical section tí hon
      } finally {
        mutex.release(); // luôn release trong finally
      }
    }
  };
  await Promise.all([inc(), inc()]);
  console.log(`   counter = ${counter} (kỳ vọng 2000) ${counter === 2000 ? "✅" : "❌"}`);

  console.log("\n2️⃣ Deadlock: A giữ X chờ Y, B giữ Y chờ X:");
  console.log("   Coffman: mutual exclusion + hold-and-wait + no preemption + circular wait");
  const waits = { A: "Y", B: "X" };
  const held = { A: "X", B: "Y" };
  console.log(`   waits=${JSON.stringify(waits)} held=${JSON.stringify(held)} → ${hasCycle(waits, held) ? "💀 DEADLOCK" : "ok"}`);

  console.log("\n3️⃣ Fix bằng lock ordering (luôn X trước Y):");
  console.log(`   A: ${lockPlan("X", "Y").join(" → ")}`);
  console.log(`   B: ${lockPlan("Y", "X").join(" → ")} (đã sắp lại, cùng thứ tự ✅)`);

  console.log("\n4️⃣ Semaphore(2): tối đa 2 người cùng vào:");
  const sem = new Semaphore(2);
  const use = async (n: number): Promise<void> => {
    await sem.acquire();
    console.log(`   task ${n}: vào (≤2 cùng lúc)`);
    await new Promise((r) => setTimeout(r, 30));
    sem.release();
  };
  await Promise.all([1, 2, 3, 4].map(use));

  console.log("\n✅ Bài học: critical section nhỏ + finally release + lock ordering phá circular wait.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
