/**
 * 5.2.8 Crystal — Phương pháp Agile "nhẹ nhất", tùy biến theo team & risk
 *
 * Mô phím phân loại dự án theo 2 biến: QUY MÔ team (size) và ĐỘ NGHIÊM TRỌNG
 * (criticality — lỗi gây thiệt hại gì). Crystal chọn "mức độ quy trình (color)"
 * phù hợp: càng lớn & càng critical → cần thêm chính sách/quy trình.
 * 4 thuộc tính cốt lõi: giao thường xuyên, cải tiến phản chiếu, giao tiếp thẩm thấu,
 * an toàn tâm lý.
 *
 * Chạy: npx ts-node examples/index.ts
 */

type Criticality = "Comfort" | "Discretionary" | "Essential" | "Life";

const CRITICALITY_LEVELS: Record<Criticality, number> = {
  Comfort: 1,
  Discretionary: 2,
  Essential: 3,
  Life: 4,
};

interface CrystalPolicy {
  color: string;
  teamSize: string;
  requiredCeremonies: string[];
}

class CrystalProject {
  readonly color: string;
  readonly requiredCeremonies: string[];
  readonly suggestedTeamSize: string;

  constructor(
    readonly name: string,
    readonly teamCount: number,
    readonly criticality: Criticality,
  ) {
    // Quy tắc tô màu (tinh giản): size + criticality → mức quy trình
    const policies: CrystalPolicy[] = [
      { color: "Clear", teamSize: "1-8 người", requiredCeremonies: ["Reflection Workshop", "Daily Sync"] },
      { color: "Yellow", teamSize: "10-20 người", requiredCeremonies: ["Reflection Workshop", "Daily Sync", "Review Meetings"] },
      { color: "Orange", teamSize: "20-50 người", requiredCeremonies: ["Reflection Workshop", "Daily Sync", "7 Project Meetings", "Test Plan"] },
      { color: "Red", teamSize: "50-100 người", requiredCeremonies: ["Reflection Workshop", "Daily Sync", "QA group", "Full process packaging"] },
    ];

    const index = Math.min(this.teamCount >= 50 ? 3 : this.teamCount >= 20 ? 2 : this.teamCount >= 10 ? 1 : 0, 3);
    const base = policies[index];

    // Criticality tăng thêm 1 bậc lên màu nặng hơn nếu hệ thống nghiêm trọng
    const bumpedIndex = Math.min(3, index + (CRITICALITY_LEVELS[this.criticality] >= 3 ? 1 : 0));
    const final = policies[bumpedIndex];

    this.color = final.color;
    this.requiredCeremonies = final.requiredCeremonies;
    this.suggestedTeamSize = final.teamSize;
  }

  describe(): void {
    console.log(`\n💎 ${this.name}`);
    console.log(`   • Số người tham gia: ${this.teamCount}`);
    console.log(`   • Criticality: ${this.criticality} (${CRITICALITY_LEVELS[this.criticality]}/4)`);
    console.log(`   → Crystal ${this.color} được chọn (${this.suggestedTeamSize}).`);
    console.log(`   • Quy trình yêu cầu: ${this.requiredCeremonies.join(" | ")}`);
  }

  /** 4 thuộc tính cốt lõi của Crystal */
  coreProperties(): void {
    console.log("\n🔑 4 thuộc tính cốt lõi mọi Crystal project:");
    console.log("   1. Frequent Delivery  — giao hàng thường xuyên, phản hồi sớm.");
    console.log("   2. Reflective Improvement — nhìn lại & cải tiến định kỳ (reflection workshop).");
    console.log("   3. Osmotic Communication — ngồi gần nhau, nghe trộm, giao tiếp tự nhiên.");
    console.log("   4. Personal Safety — mọi người an toàn tâm lý để nói thẳng, không sợ bị trù.");
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

console.log("=== 5.2.8 Crystal — Family of Agile Methods Demo ===\n");

const examples: Array<[string, number, Criticality]> = [
  ["Crystal Clear — app nội bộ nhỏ", 6, "Comfort"],
  ["Crystal Yellow — e-commerce vừa", 15, "Discretionary"],
  ["Crystal Orange — hệ thống ngân hàng (thiệt hại tài chính)", 30, "Essential"],
  ["Crystal Red — phần mềm điều khiển y tế (rủi ro tính mạng)", 60, "Life"],
];

for (const [name, size, crit] of examples) {
  new CrystalProject(name, size, crit).describe();
}

const demo = new CrystalProject("Demo", 6, "Comfort");
demo.coreProperties();

console.log("\n✅ Crystal KHÔNG áp đặt 1 quy trình — chọn 'màu' phù hợp team & độ nghiêm trọng hệ thống, tập trung con người hơn quy trình.");

export {};