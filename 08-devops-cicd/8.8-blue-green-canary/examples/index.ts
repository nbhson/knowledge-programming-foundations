/**
 * 8.8 Blue-Green & Canary — so sánh strategies + mô phỏng traffic shifting
 *
 * Minh họa:
 * - Canary: tăng traffic 5→25→50→100%, mỗi bước check error rate.
 * - Error vượt ngưỡng → auto-rollback về 0%.
 * - Blue-green: switch tức thì 100% + rollback đảo LB.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
interface StepResult {
  traffic: number;
  errorRate: number;
  action: string;
}

function simulateErrorRate(traffic: number, badVersion: boolean): number {
  // bản lỗi: error tăng theo traffic; bản tốt: ~1%
  if (!badVersion) return 0.01;
  return 0.01 + (traffic / 100) * 0.2; // 100% traffic → 21% lỗi
}

function canaryRelease(badVersion: boolean, threshold: number): StepResult[] {
  const steps = [5, 25, 50, 100];
  const out: StepResult[] = [];
  for (const t of steps) {
    const e = simulateErrorRate(t, badVersion);
    if (e > threshold) {
      out.push({ traffic: t, errorRate: e, action: `⛔ vượt ngưỡng ${(threshold * 100).toFixed(0)}% → rollback về 0%` });
      return out;
    }
    out.push({ traffic: t, errorRate: e, action: t === 100 ? "✅ promote hoàn tất" : "➡️ pass, tăng tiếp" });
  }
  return out;
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Blue-Green & Canary Demo ===\n");

  console.log("1️⃣ So sánh strategies:");
  console.log("   rolling    : thay từng pod, rollback chậm, tốn +1 pod");
  console.log("   blue-green : 2 môi trường, switch 100% tức thì, tốn ×2 tài nguyên");
  console.log("   canary     : 5%→25%→50%→100%, lỗi chỉ ảnh hưởng nhóm nhỏ");
  console.log("   flag       : toggle code, instant, nhưng sinh flag debt");

  console.log("\n2️⃣ Canary bản TỐT (ngưỡng lỗi 5%):");
  for (const s of canaryRelease(false, 0.05)) {
    console.log(`   traffic ${s.traffic}%: error ${(s.errorRate * 100).toFixed(1)}% ${s.action}`);
  }

  console.log("\n3️⃣ Canary bản LỖI (tự rollback):");
  for (const s of canaryRelease(true, 0.05)) {
    console.log(`   traffic ${s.traffic}%: error ${(s.errorRate * 100).toFixed(1)}% ${s.action}`);
  }

  console.log("\n4️⃣ Blue-green switch:");
  console.log("   trước: 100% blue (v1) | green (v2) warm-up + health check ✅");
  console.log("   switch LB → 100% green (v2) trong < 1s");
  console.log("   lỗi? đảo LB về blue — rollback tức thì, không redeploy");

  console.log("\n✅ Bài học: canary giảm blast radius bằng số liệu từng bước; blue-green đổi tốc độ lấy tài nguyên.");
}

main();

export {};
