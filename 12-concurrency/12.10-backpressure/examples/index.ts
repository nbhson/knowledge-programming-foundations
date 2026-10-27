/**
 * 12.10 Backpressure — pull vs push, bounded queue + mô phỏng producer nhanh/consumer chậm
 *
 * Minh họa: producer 10 msg/tick, consumer 1 msg/tick, queue 5:
 * - block: producer chờ (không mất, chậm theo consumer).
 * - drop-newest: giữ cũ, bỏ mới.
 * - drop-oldest: giữ mới nhất (live data).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Bounded queue ───────────────────────────
type Overflow = "block" | "drop-newest" | "drop-oldest";

interface SimResult {
  consumed: number;
  blocked: number;
  dropped: number;
}

function simulate(policy: Overflow, ticks: number, producePerTick: number): SimResult {
  const limit = 5;
  let queue = 0;
  let consumed = 0;
  let blocked = 0;
  let dropped = 0;

  for (let t = 0; t < ticks; t++) {
    // producer: 10 msg/tick
    for (let i = 0; i < producePerTick; i++) {
      if (queue < limit) {
        queue++;
      } else if (policy === "block") {
        blocked++; // producer chờ, không đẩy thêm
      } else if (policy === "drop-newest") {
        dropped++;
      } else {
        dropped++; // drop-oldest: chỗ cho mới (queue vẫn đầy nhưng tươi hơn)
      }
    }
    // consumer: 1 msg/tick
    if (queue > 0) {
      queue--;
      consumed++;
    }
  }
  return { consumed, blocked, dropped };
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Backpressure Demo ===\n");
  console.log("producer 10 msg/tick, consumer 1 msg/tick, queue 5, chạy 20 ticks:\n");

  const policies: Overflow[] = ["block", "drop-newest", "drop-oldest"];
  for (const p of policies) {
    const r = simulate(p, 20, 10);
    console.log(`  ${p.padEnd(12)} → consumed=${r.consumed} blocked=${r.blocked} dropped=${r.dropped}`);
  }

  console.log("\nChọn policy theo domain:");
  console.log("  payment/audit → block (không được mất, producer chờ)");
  console.log("  metrics/logs  → drop-newest (mất ít mẫu chấp nhận được)");
  console.log("  live video    → drop-oldest (khung hình mới nhất quan trọng nhất)");
  console.log("\nPull tốt hơn push mù: consumer xin request(n) theo nhịp của mình (Kafka poll, Reactive Streams).");

  console.log("\n✅ Bài học: queue bounded + policy + alert khi drop/block tăng (tín hiệu scale consumer).");
}

main();

export {};
