/**
 * 5.2.11 Spiral Model — Vòng xoắn với Risk Analysis làm trọng tâm
 *
 * Mỗi vòng lặp (loop) gồm 4 pha (quadrant):
 *   1. Determine Objectives  — mục tiêu, giải pháp thay thế, ràng buộc
 *   2. Identify & Resolve Risks — phân tích rủi ro, làm prototype giảm rủi ro
 *   3. Development & Testing — xây phiên bản tiếp theo của sản phẩm
 *   4. Plan Next Phase       — lập kế hoạch cho vòng xoắn sau
 * Qua mỗi vòng, độ hoàn thiện sản phẩm tăng, mức độ rủi ro giảm dần.
 *
 * Chạy: npx ts-node examples/index.ts
 */

type RiskLevel = "high" | "medium" | "low";

interface SpiralRisk {
  description: string;
  level: RiskLevel;
}

class SpiralLoop {
  private risks: SpiralRisk[] = [];
  private objective: string;

  constructor(
    private loopNumber: number,
    objective: string,
  ) {
    this.objective = objective;
  }

  addRisk(description: string, level: RiskLevel): void {
    this.risks.push({ description, level });
  }

  determineObjectives(): void {
    console.log(`\n─── ① QUADRANT 1: DETERMINE OBJECTIVES (vòng ${this.loopNumber}) ───`);
    console.log(`   🎯 Mục tiêu: ${this.objective}`);
    console.log(`   Giải pháp thay thế: full-build / prototype / mua component`);
  }

  analyzeRisks(): void {
    console.log("\n─── ② QUADRANT 2: IDENTIFY & RESOLVE RISKS ───");
    for (const risk of this.risks) {
      const icon = risk.level === "high" ? "🔴" : risk.level === "medium" ? "🟡" : "🟢";
      console.log(`   ${icon} Rủi ro: ${risk.description} (${risk.level})`);
      if (risk.level === "high") {
        console.log(`      → Giảm rủi ro bằng PROTOTYPE/MÔ PHỎNG thay vì viết toàn bộ`);
      }
    }
  }

  developAndTest(): void {
    console.log("\n─── ③ QUADRANT 3: DEVELOPMENT & TESTING ───");
    console.log(`   🔨 Dựng phiên bản ${this.loopNumber === 1 ? "đầu tiên (thô)" : "hoàn thiện hơn"} + test, đánh giá theo mục tiêu đã chốt.`);
  }

  planNextPhase(): void {
    console.log("\n─── ④ QUADRANT 4: PLAN NEXT PHASE ───");
    console.log(`   📋 Vòng ${this.loopNumber + 1}: mục tiêu chi tiết hơn, đưa rủi ro còn tồn đọng vào để xử lý.`);
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

console.log("=== 5.2.11 Spiral Model — Risk-Driven Iteration Demo ===\n");

const loop1 = new SpiralLoop(1, "Xác thực tính khả thi của hệ thống giám sát IoT");
loop1.addRisk("Công nghệ cảm biến chưa có nguồn cung ổn định", "high");
loop1.addRisk("Đội chưa rõ nghiệp vụ vận hành", "medium");
loop1.determineObjectives();
loop1.analyzeRisks();
loop1.developAndTest();
loop1.planNextPhase();

const loop2 = new SpiralLoop(2, "Prototype giám sát 10 thiết bị thật");
loop2.addRisk("Độ trễ dữ liệu cảm biến cao khi tăng số thiết bị", "high");
loop2.addRisk("Bảo mật MQTT chưa chắc", "medium");
loop2.determineObjectives();
loop2.analyzeRisks();
loop2.developAndTest();
loop2.planNextPhase();

const loop3 = new SpiralLoop(3, "Bản đầy đủ: 100 thiết bị + cảnh báo tự động + dashboard");
loop3.addRisk("Hiệu năng dashboard khi có báo động đồng loạt", "low");
loop3.determineObjectives();
loop3.analyzeRisks();
loop3.developAndTest();

console.log("\n🌀 Mô hình xoắn ốc: mỗi vòng tăng độ hoàn thiện, RỦI RO NGUY HIỂM được xử lý CÀNG SỚM càng tốt — kết hợp kỷ luật của Waterfall và vòng lặp của Agile.");
console.log("✅ Spiral phù hợp dự án LỚN, RỦI RO CAO, công nghệ mới — nơi 'thất bại sớm' còn rẻ hơn 'thất bại muộn'.");

export {};