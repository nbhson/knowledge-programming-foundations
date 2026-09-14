/**
 * 4.6 Concurrent & Parallel — Promise.all vs Sequential Demo
 *
 * Minh họa:
 * - Sequential: await từng task → tổng thời gian = tổng các delay
 * - Concurrent: Promise.all khởi chạy cùng lúc → tổng thời gian ≈ max delay
 *
 * Lưu ý: JavaScript là single-thread (concurrency chứ không phải parallelism
 * thực sự), nên demo này mô phỏng task bất đồng bộ bằng Promise + setTimeout,
 * và minh họa task CPU-bound sẽ block event loop (cần worker/thread thật).
 */

// Mô phỏng một task bất đồng bộ: gọi API/IO, xử lý mất `delayMs`
function simulateTask(id: string, delayMs: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`    ✔ ${id} hoàn thành sau ${delayMs}ms`);
      resolve(`${id}:${delayMs}ms`);
    }, delayMs);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// CPU-bound task: lặp tới khi hết `durationMs` (block event loop, không nhường nhau)
function heavyComputeUntil(durationMs: number): number {
  const end = Date.now() + durationMs;
  let ticks = 0;
  while (Date.now() < end) {
    ticks++;
  }
  return ticks;
}

// ─────────────────────── Cách 1: Sequential (tuần tự) ───────────────────────
async function runSequential(): Promise<void> {
  console.log("  ▶ Bắt đầu task-1 (300ms)…");
  await simulateTask("task-1", 300);
  console.log("  ▶ Bắt đầu task-2 (200ms)…");
  await simulateTask("task-2", 200);
  console.log("  ▶ Bắt đầu task-3 (100ms)…");
  await simulateTask("task-3", 100);
}

// ─────────────────────── Cách 2: Concurrent (Promise.all) ───────────────────
async function runConcurrent(): Promise<void> {
  console.log("  ▶ Khởi chạy CÙNG LÚC cả 3 task (300, 200, 100ms)…");
  await Promise.all([
    simulateTask("task-1", 300),
    simulateTask("task-2", 200),
    simulateTask("task-3", 100),
  ]);
}

// ──────────────────── So sánh với CPU-bound (single-thread) ─────────────────
function runCpuBound(): void {
  console.log("  🧮 3 chunk CPU-bound chạy nối tiếp (mỗi chunk 120ms):");
  const start = Date.now();
  heavyComputeUntil(120);
  heavyComputeUntil(120);
  heavyComputeUntil(120);
  const elapsed = Date.now() - start;
  console.log(`    → mất ${elapsed}ms (gần bằng 120*3 = 360ms)`);
  console.log("    → event loop bị block, task I/O khác phải chờ. Muốn thật 'song song' đa-core cần worker/thread.");
}

// ───────────────────────────────── Demo ─────────────────────────────────────
async function main(): Promise<void> {
  console.log("=== Concurrent & Parallel Demo ===");
  console.log("");

  console.log("🔄 Sequential (tuần tự): mỗi task phải đợi task trước xong");
  const startSeq = Date.now();
  await runSequential();
  const elapsedSeq = Date.now() - startSeq;
  console.log(`  → ≈ ${elapsedSeq}ms (gần bằng 300 + 200 + 100 = 600ms)`);
  console.log("");

  console.log("⚡ Concurrent (Promise.all): các task chạy xen kẽ, đợi task chậm nhất");
  const startCon = Date.now();
  await runConcurrent();
  const elapsedCon = Date.now() - startCon;
  console.log(`  → ≈ ${elapsedCon}ms (gần bằng max(300,200,100) = 300ms)`);
  console.log("");

  const speedup = elapsedSeq / elapsedCon;
  console.log(`📊 Chênh lệch: concurrent nhanh hơn ~${speedup.toFixed(1)}x`);
  console.log("");

  console.log("⚠️ CPU-bound (tính toán tốn CPU) thì khác hẳn:");
  runCpuBound();
  console.log("");

  console.log("✅ Dùng Concurrent (Promise.all/async) khi chờ I/O/network; Parallel thật sự cần worker/thread trên đa-core.");
  await delay(50);
}

void main();
export {};
