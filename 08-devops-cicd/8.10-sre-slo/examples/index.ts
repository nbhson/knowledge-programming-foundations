/**
 * 8.10 SRE & SLO — SLI/SLO/error budget + tính error budget còn lại
 *
 * Minh họa:
 * - Error budget = (1 - SLO) × total events.
 * - Còn budget → release; hết budget → freeze + ưu tiên reliability.
 * - Burn rate nhanh/chậm: alert khẩn cấp vs cảnh báo sớm.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
interface SloWindow {
  name: string;
  goodEvents: number;
  totalEvents: number;
  slo: number; // ví dụ 0.999
}

interface BudgetReport {
  budget: number;
  consumed: number;
  remaining: number;
  okToRelease: boolean;
}

function errorBudget(w: SloWindow): BudgetReport {
  const budget = Math.floor((1 - w.slo) * w.totalEvents);
  const consumed = w.totalEvents - w.goodEvents;
  const remaining = budget - consumed;
  return { budget, consumed, remaining, okToRelease: remaining > 0 };
}

function report(w: SloWindow): void {
  const r = errorBudget(w);
  console.log(`   [${w.name}] SLO ${(w.slo * 100).toFixed(2)}% trên ${w.totalEvents.toLocaleString()} req`);
  console.log(`   budget=${r.budget} đã dùng=${r.consumed} còn lại=${r.remaining}`);
  console.log(`   → ${r.okToRelease ? "✅ còn budget: được release" : "⛔ hết budget: FREEZE feature, chỉ fix reliability"}`);
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== SRE / SLO / Error Budget Demo ===\n");

  console.log("1️⃣ SLO 99.9% (budget 0.1% = 1000 lỗi / 1M req), mới dùng 500:");
  report({ name: "checkout-availability", goodEvents: 999_500, totalEvents: 1_000_000, slo: 0.999 });

  console.log("\n2️⃣ Cùng SLO nhưng đã dùng 1200 lỗi:");
  report({ name: "checkout-availability", goodEvents: 998_800, totalEvents: 1_000_000, slo: 0.999 });

  console.log("\n3️⃣ Burn rate (tốc độ cháy budget):");
  console.log("   nhanh (2% budget/giờ): page on-call ngay — sự cố đang diễn ra");
  console.log("   chậm (0.2% budget/giờ): ticket ưu tiên — sẽ cạn trong 2 tuần nếu không sửa");

  console.log("\n4️⃣ SLO chọn sao cho đúng:");
  console.log("   SLI đo trải nghiệm user (2xx/total ở LB), không đo CPU nội bộ");
  console.log("   100% là phản pattern: 99.9%→99.99% tốn gấp bội, user không cảm nhận được");

  console.log("\n✅ Bài học: error budget biến 'ổn định' thành số học — hết số là dừng ship.");
}

main();

export {};
