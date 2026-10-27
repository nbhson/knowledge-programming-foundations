/**
 * 10.8 ACID & Isolation — 4 isolation levels + dirty/non-repeatable/phantom, mô phỏng
 *
 * Minh họa:
 * - Cùng 1 interleaving, chạy ở 4 levels → anomaly nào lọt qua.
 * - Ma trận chặn/lọt + demo retry khi SERIALIZABLE failure.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
type Level = "READ_UNCOMMITTED" | "READ_COMMITTED" | "REPEATABLE_READ" | "SERIALIZABLE";

const MATRIX: Record<Level, { dirty: boolean; nonRepeatable: boolean; phantom: boolean }> = {
  // true = CHẶN được anomaly
  READ_UNCOMMITTED: { dirty: false, nonRepeatable: false, phantom: false },
  READ_COMMITTED: { dirty: true, nonRepeatable: false, phantom: false },
  REPEATABLE_READ: { dirty: true, nonRepeatable: true, phantom: false },
  SERIALIZABLE: { dirty: true, nonRepeatable: true, phantom: true },
};

const LEVELS: Level[] = ["READ_UNCOMMITTED", "READ_COMMITTED", "REPEATABLE_READ", "SERIALIZABLE"];

// Mô phỏng: transfer 1000 từ A sang B, T2 đọc giữa chừng
function simulate(level: Level): { dirtySeen: boolean; note: string } {
  // Ở READ_UNCOMMITTED, T2 đọc được giá trị giữa chừng (chưa commit) của T1
  const dirtySeen = level === "READ_UNCOMMITTED";
  const note = dirtySeen
    ? "T2 đọc balance giữa chừng (chưa commit) — nếu T1 rollback → đọc 'ma' 👻"
    : "T2 chỉ thấy data đã commit ✅";
  return { dirtySeen, note };
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== ACID & Isolation Demo ===\n");

  console.log("ACID: A(ll-or-nothing) C(onstraints luôn đúng) I(song song không dẫm nhau) D(commit rồi không mất)");
  console.log("\nMa trận level → anomaly (✅ chặn được):");
  console.log("level              | dirty | non-repeat | phantom");
  for (const l of LEVELS) {
    const m = MATRIX[l];
    const cell = (b: boolean): string => (b ? "  ✅  " : "  ❌  ");
    console.log(`${l.padEnd(18)} |${cell(m.dirty)}|${cell(m.nonRepeatable)}   |${cell(m.phantom)}`);
  }

  console.log("\nCùng interleaving transfer (T1 trừ A, T2 đọc giữa chừng):");
  for (const l of LEVELS) {
    const r = simulate(l);
    console.log(`   ${l.padEnd(18)} → ${r.note}`);
  }

  console.log("\nSerializable + retry (app PHẢI làm):");
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    // giả lập: lần 1 conflict, lần 2 ok
    if (attempts === 1) {
      console.log("   attempt 1: serialization failure → retry (không phải bug, là tính năng)");
    } else {
      console.log(`   attempt ${attempts}: COMMIT ✅`);
      break;
    }
  }

  console.log("\n✅ Bài học: default Read Committed cho đa số; nâng level cho đoạn tiền + retry.");
}

main();

export {};
