/**
 * 5.2.12 RAD (Rapid Application Development) — Prototype, feedback, build nhanh
 *
 * Mô phím 4 pha chính của RAD với VÒNG LẶP prototype + customer feedback:
 *   1. Requirements Planning     — chốt mục tiêu tổng quan
 *   2. User Design (Prototype)   — dựng prototype nhanh, user dùng thử & feedback
 *   3. Rapid Construction        — build chính thức dựa trên prototype ĐÃ DUYỆT
 *   4. Cutover                   — integration, test, chuyển giao
 *
 * Chạy: npx ts-node examples/index.ts
 */

interface PrototypeVersion {
  version: number;
  feedback: string[];
  approved: boolean;
}

class RadProject {
  private iterations: PrototypeVersion[] = [];
  private currentVersion = 0;

  constructor(private readonly name: string) {}

  requirementsPlanning(): void {
    console.log(`\n1️⃣ REQUIREMENTS PLANNING — hội thảo ngắn, chốt phạm vi tổng quan: "${this.name}"`);
    console.log("   • Các module chính: nhập liệu, báo cáo, tìm kiếm.");
    console.log("   • KHÔNG viết tài liệu 200 trang — chỉ ghi mục tiêu & kỳ vọng.");
  }

  buildPrototype(userReaction: string[]): PrototypeVersion {
    this.currentVersion += 1;
    const proto: PrototypeVersion = {
      version: this.currentVersion,
      feedback: userReaction,
      approved: userReaction.length <= 1, // feedback ít → user ưng ý
    };
    this.iterations.push(proto);
    return proto;
  }

  showPrototype(proto: PrototypeVersion): void {
    console.log(`\n2️⃣ USER DESIGN — Prototype v${proto.version} (dựng vài ngày, dùng thử ngay):`);
    console.log("   👤 Người dùng dùng thử & phản hồi:");
    proto.feedback.forEach((f) => console.log(`      💬 "${f}"`));
    if (proto.approved) {
      console.log("   ✅ NGƯỜI DÙNG DUYỆT → chốt làm cơ sở cho Rapid Construction.");
    } else {
      console.log("   🔄 CHƯA DUYỆT → vòng lặp prototype tiếp theo (sửa nhanh, không xây đè lên code).");
    }
  }

  rapidConstruction(): void {
    console.log("\n3️⃣ RAPID CONSTRUCTION — build chính thức DỰA TRÊN prototype đã duyệt:");
    console.log("   • Dùng công cụ sinh code, component dựng sẵn (reuse) → tốc độ cao.");
    console.log("   • Module hoàn thiện nào xong là demo/đưa vào môi trường tích hợp ngay.");
  }

  cutover(): void {
    console.log("\n4️⃣ CUTOVER — integration + test + chuyển giao hệ thống:");
    console.log("   • Tích hợp toàn bộ module đã build, training user, chuyển production.");
    console.log(`   • Tổng cộng ${this.iterations.length} vòng prototype trước khi build chính thức.`);
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

console.log("=== 5.2.12 RAD — Rapid Application Development Demo ===\n");

const project = new RadProject("Hệ thống quản lý kho (MVP)");
project.requirementsPlanning();

const v1 = project.buildPrototype([
  "Giao diện nhập liệu khó nhìn",
  "Chưa có nút tìm kiếm nhanh",
  "Muốn xuất báo cáo Excel",
]);
project.showPrototype(v1);

const v2 = project.buildPrototype([
  "Giao diện đã rõ, thêm nút tìm kiếm OK",
]);
project.showPrototype(v2);

project.rapidConstruction();
project.cutover();

console.log("\n✅ RAD: prototype + phản hồi liên tục → sai sớm, đúng nhanh; phù hợp dự án NGẮN, yêu cầu UI rõ, team nhỏ.");

export {};