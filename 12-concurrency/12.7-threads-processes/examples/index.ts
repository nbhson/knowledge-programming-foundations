/**
 * 12.7 Threads vs Processes vs Event Loop — khái niệm + code worker phân chia
 *
 * Minh họa:
 * - Task I/O (nhiều sleep nhỏ): event loop xử lý mượt.
 * - Task CPU nặng trên loop: block mọi thứ.
 * - Chia chunks cho N workers (mô phỏng phân chia song song).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Helpers ───────────────────────────
function heavy(n: number): number {
  let s = 0;
  for (let i = 0; i < n * 1_000_000; i++) s += Math.sqrt(i);
  return Math.round(s);
}

function splitWork<T>(items: T[], workers: number): T[][] {
  const chunks: T[][] = Array.from({ length: workers }, () => []);
  items.forEach((it, i) => chunks[i % workers].push(it));
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────────────────────────── Demo ───────────────────────────────
async function main(): Promise<void> {
  console.log("=== Threads vs Processes vs Event Loop Demo ===\n");

  console.log("Mô hình:");
  console.log("  threads  : share memory, nhanh, race — CPU song song có share");
  console.log("  processes: cách ly, an toàn, IPC đắt — crash 1 job không sập service");
  console.log("  event loop: 1 thread + non-blocking I/O — vua I/O-bound, thua CPU-bound\n");

  console.log("1️⃣ I/O-bound trên event loop (10 task sleep 50ms song song):");
  const t0 = Date.now();
  await Promise.all(Array.from({ length: 10 }, () => sleep(50)));
  console.log(`   xong trong ${Date.now() - t0}ms (~50ms, không phải 500ms) ✅`);

  console.log("\n2️⃣ CPU-bound chặn loop (heavy block main thread):");
  const t1 = Date.now();
  const r = heavy(3);
  console.log(`   heavy(3) = ${r} trong ${Date.now() - t1}ms — loop ĐƠ suốt thời gian này ⛔`);
  console.log("   fix: worker_threads / child_process / tách service");

  console.log("\n3️⃣ Chia việc cho workers (12 items → 3 workers):");
  const items = Array.from({ length: 12 }, (_, i) => i + 1);
  const chunks = splitWork(items, 3);
  chunks.forEach((c, i) => console.log(`   worker ${i + 1}: [${c.join(", ")}]`));
  console.log("   sizing: CPU-bound ≈ cores workers; I/O-bound mới cần nhiều hơn");

  console.log("\n✅ Bài học: I/O → loop; CPU → workers/processes; đừng spawn thread vô tội vạ.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
