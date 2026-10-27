/**
 * 12.9 Thread Pools — sizing, queue policies + mô phỏng pool
 *
 * Minh họa:
 * - Pool 2 workers + queue 2 + 5 tasks → task 5 trigger policy.
 * - 3 policies: abort / caller-runs / discard-oldest.
 * - Sizing: CPU ≈ cores+1, I/O ≈ 2×cores.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
type RejectPolicy = "abort" | "caller-runs" | "discard-oldest";

class MiniPool {
  private running = 0;
  private queue: string[] = [];
  rejected = 0;

  constructor(
    private workers: number,
    private queueLimit: number,
    private policy: RejectPolicy,
  ) {}

  submit(task: string): string {
    if (this.running < this.workers) {
      this.running++;
      return `${task}: chạy ngay (worker còn trống)`;
    }
    if (this.queue.length < this.queueLimit) {
      this.queue.push(task);
      return `${task}: xếp hàng (queue ${this.queue.length}/${this.queueLimit})`;
    }
    // queue đầy → policy
    this.rejected++;
    if (this.policy === "abort") return `${task}: ⛔ abort (fail-fast, caller retry)`;
    if (this.policy === "caller-runs") return `${task}: 🏃 caller tự chạy (backpressure tự nhiên)`;
    const dropped = this.queue.shift();
    this.queue.push(task);
    return `${task}: 🗑️ drop oldest (${dropped}) để nhận mới`;
  }
}

function sizing(kind: "cpu" | "io", cores: number): number {
  return kind === "cpu" ? cores + 1 : cores * 2;
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Thread Pool Demo ===\n");

  console.log("Sizing (điểm khởi đầu, rồi đo thực tế):");
  console.log(`  CPU-bound 8 cores → ${sizing("cpu", 8)} workers (cores+1)`);
  console.log(`  I/O-bound 8 cores → ${sizing("io", 8)} workers (2×cores)\n`);

  const policies: RejectPolicy[] = ["abort", "caller-runs", "discard-oldest"];
  for (const p of policies) {
    console.log(`Pool(2 workers, queue 2, policy=${p}) + 5 tasks:`);
    const pool = new MiniPool(2, 2, p);
    for (let i = 1; i <= 5; i++) console.log(`   ${pool.submit(`task${i}`)}`);
    console.log("");
  }

  console.log("✅ Bài học: queue luôn bounded + policy rõ ràng; task blocking tách pool riêng.");
}

main();

export {};
