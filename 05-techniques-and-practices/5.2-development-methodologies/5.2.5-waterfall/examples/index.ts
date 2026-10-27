/**
 * 5.2.5 Waterfall — Mô hình thác nước tuần tự với gate check
 *
 * Mô phỏng 5 phase tuần tự: Requirements → Design → Implementation → Testing → Deployment.
 * Mỗi phase có GATE CHECK: chỉ đi tiếp khi output phase trước "đạt chuẩn".
 * Nếu khách hàng đổi yêu cầu giữa chừng → chi phí rework lớn, phải quay lại phase đầu.
 *
 * Chạy: npx ts-node examples/index.ts
 */

type WaterfallPhaseName = "Requirements" | "Design" | "Implementation" | "Testing" | "Deployment";

interface WaterfallInput {
  document: string;
  approval: string;
}

class WaterfallPhase {
  constructor(
    readonly name: WaterfallPhaseName,
    private readonly gate: (input: WaterfallInput) => boolean,
  ) {}

  execute(received: WaterfallInput): string {
    console.log(`\n═▶ Phase: ${this.name} ─────────────`);
    console.log(`   Nhận tài liệu: "${received.document}" (approval: ${received.approval})`);
    const pass = this.gate(received);
    if (!pass) {
      console.log(`   ❌ GATE CHECK FAIL — ${this.name} chưa đạt chuẩn, phải làm lại`);
      throw new Error(`${this.name} gate không đạt: ${received.document} chưa hoàn thiện`);
    }
    const deliverable = `${this.name.toLowerCase()}-spec`;
    console.log(`   ✅ GATE CHECK PASS → bàn giao "${deliverable}" cho phase kế tiếp`);
    return deliverable;
  }
}

class WaterfallProject {
  private phases: WaterfallPhase[] = [];
  private requiredQuality = 0.8;

  addPhase(phase: WaterfallPhase): void {
    this.phases.push(phase);
  }

  run(): void {
    console.log("=== 5.2.5 Waterfall — Sequential Model Demo ===\n");

    // Phase 1: Requirements — cần tài liệu yêu cầu CHÍNH THỨC (đã duyệt)
    console.log("📋 Khách hàng bàn giao danh sách yêu cầu ban đầu.");
    let current: WaterfallInput = {
      document: "BRD v1.0 (yêu cầu: login, báo cáo)",
      approval: "client-approved",
    };

    try {
      for (const phase of this.phases) {
        const deliverable = phase.execute({
          document: current.document,
          approval: current.approval === "client-approved" ? "client-approved" : "draft",
        });
        current = { document: deliverable, approval: "client-approved" };
      }
      this.summary(true);
    } catch (err) {
      console.log(`\n💥 ${err instanceof Error ? err.message : String(err)}`);
      this.summary(false);
    }
  }

  /** Mô phỏng thay đổi yêu cầu ngay sau khi Implementation đã xong */
  simulateLateRequirementChange(beforeDeployment: boolean): void {
    void beforeDeployment;
    console.log(
      "\n🌀 KHÁCH HÀNG đổi yêu cầu NGAY TRƯỚC Deployment: thêm tính năng export PDF.",
    );
    console.log("   Waterfall phải quay lại Requirements → Design → Implementation → Testing → Deployment.");
    console.log("   Chi phí rework: toàn bộ chuỗi phase (không thể 'chèn' 1 tính năng giữa chừng).");
  }

  private qualityScore(): number {
    return this.requiredQuality;
  }

  private summary(ok: boolean): void {
    if (ok) {
      console.log("\n🏁 Project hoàn thành: hệ thống bàn giao vận hành & bảo trì.");
      console.log(`   📊 Chất lượng tổng thể: ${(this.qualityScore() * 100).toFixed(0)}% (đạt chuẩn đã định ở giai đoạn Requirements).`);
      console.log("   ✅ Kế hoạch, tài liệu, chi phí rõ ràng từ đầu — dễ quản lý.");
    } else {
      console.log("   ⚠️ Không đạt phase → dự án 'trả về' bucket và làm lại (đặc trưng Waterfall).");
    }
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

const project = new WaterfallProject();
project.addPhase(
  new WaterfallPhase("Requirements", (input) => input.approval === "client-approved" && input.document.length > 0),
);
project.addPhase(
  new WaterfallPhase("Design", (input) => input.document.includes("design") || input.document.includes("Requirements")),
);
project.addPhase(
  new WaterfallPhase("Implementation", () => true),
);
project.addPhase(
  new WaterfallPhase("Testing", () => true),
);
project.addPhase(
  new WaterfallPhase("Deployment", () => true),
);

project.run();
project.simulateLateRequirementChange(true);

console.log("\n✅ Waterfall phù hợp dự án SCOPE CỐ ĐỊNH, yêu cầu ổn định, quy chuẩn rõ (y tế, hàng không, tài chính).");

export {};