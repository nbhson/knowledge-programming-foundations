/**
 * 5.2.4 Lean Software Development — Loại bỏ lãng phí (waste) trong pipeline
 *
 * Mô phỏng 1 value stream (chuỗi giá trị): code → review → test → deploy.
 * So sánh pipeline "bẩn" (nhiều waste: chờ đợi, chuyển giao, defect, WIP cao)
 * với pipeline "lean" (WIP thấp, tự động hóa, CI/CD, không defect) → hiệu quả cải thiện.
 *
 * Chạy: npx ts-node examples/index.ts
 */

interface PipelineStepSpec {
  name: string;
  /** đơn vị thời gian hữu ích (giá trị) */
  usefulTime: number;
  /** đơn vị thời gian lãng phí */
  wasteTime: number;
}

class LeanPipeline {
  private steps: PipelineStepSpec[] = [];

  addStep(spec: PipelineStepSpec): void {
    this.steps.push(spec);
  }

  ratio(): number {
    const useful = this.steps.reduce((s, x) => s + x.usefulTime, 0);
    const waste = this.steps.reduce((s, x) => s + x.wasteTime, 0);
    return useful / (useful + waste);
  }

  describe(label: string): void {
    console.log(`\n${label}`);
    const useful = this.steps.reduce((s, x) => s + x.usefulTime, 0);
    const waste = this.steps.reduce((s, x) => s + x.wasteTime, 0);
    for (const step of this.steps) {
      const marker = step.wasteTime > 0 ? " ⚠️ (có waste)" : " ✅";
      console.log(
        `   • ${step.name.padEnd(18)} hữu ích ${String(step.usefulTime).padStart(3)} + waste ${String(step.wasteTime).padStart(3)}${marker}`,
      );
    }
    const ratio = (this.ratio() * 100).toFixed(1);
    console.log(`   📊 Tổng: useful=${useful}, waste=${waste} → hiệu quả giá trị ${ratio}%`);
  }
}

/** Pipeline TRƯỚC khi áp dụng Lean — đầy lãng phí */
function buildBeforePipeline(): LeanPipeline {
  const p = new LeanPipeline();
  p.addStep({ name: "Code", usefulTime: 4, wasteTime: 2 }); // Partially done work, multitasking
  p.addStep({ name: "Chờ review", usefulTime: 0, wasteTime: 3 }); // Delay
  p.addStep({ name: "Handoff QA", usefulTime: 0, wasteTime: 2 }); // Handoffs
  p.addStep({ name: "Test thủ công", usefulTime: 2, wasteTime: 3 }); // Defect phát hiện muộn
  p.addStep({ name: "Chờ deploy", usefulTime: 0, wasteTime: 3 }); // Delay
  p.addStep({ name: "Sửa defect", usefulTime: 2, wasteTime: 4 }); // Defects / Relearning
  return p;
}

/** Pipeline SAU khi áp dụng Lean — loại bỏ waste */
function buildAfterPipeline(): LeanPipeline {
  const p = new LeanPipeline();
  p.addStep({ name: "Code + test tự động", usefulTime: 4, wasteTime: 0 }); // Build quality in
  p.addStep({ name: "CI/CD deploy", usefulTime: 2, wasteTime: 0 }); // Deliver fast
  p.addStep({ name: "Automated review", usefulTime: 1, wasteTime: 0 }); // Build quality in
  return p;
}

// ────────────────────────── Demo chạy ─────────────────────────────────

console.log("=== 5.2.4 Lean Software Development — Eliminate Waste Demo ===");

const before = buildBeforePipeline();
before.describe("❌ TRƯỚC Lean — 7 wastes hoành hành (WIP cao, chờ đợi, defect):");

const after = buildAfterPipeline();
after.describe("✅ SAU Lean — loại bỏ waste, tự động hóa, Build Quality In:");

const beforeRatio = before.ratio();
const afterRatio = after.ratio();
console.log(
  `\n📈 Hiệu quả giá trị tăng: ${(beforeRatio * 100).toFixed(0)}% → ${(afterRatio * 100).toFixed(0)}% (tăng ${(((afterRatio - beforeRatio) / beforeRatio) * 100).toFixed(0)}%)`,
);

console.log("\n🎯 Bài học Lean:");
console.log("   1. Waste = thứ khách hàng KHÔNG trả tiền (chờ, chuyển giao, defect, partial work).");
console.log("   2. Giới hạn WIP & tự động hóa giúp flow liên tục, giao nhanh.");
console.log("   3. Build Quality In: làm chất lượng ngay từ code, đừng sửa ở cuối.");
console.log("✅ Lean giúp toàn chuỗi giá trị tối ưu — không chỉ từng cá nhân.");

export {};