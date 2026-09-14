/**
 * 5.2.10 DSDM (Dynamic Systems Development Method) — Cố định time & cost, biến thiên scope
 *
 * DSDM: TIMEBOX cố định, ngân sách cố định; SCOPE linh hoạt theo ưu tiên MoSCoW:
 *   Must have / Should have / Could have / Won't have (lần này).
 * Khi hết timebox, chỉ có "Must have" chắc chắn xong; các hạng khác cắt dần.
 *
 * Chạy: npx ts-node examples/index.ts
 */

type Priority = "Must have" | "Should have" | "Could have" | "Won't have";

interface DsdmFeature {
  name: string;
  priority: Priority;
  effort: number; // đơn vị giả định "điểm công sức"
}

class DsdmTimebox {
  constructor(
    readonly label: string,
    private maxEffort: number,
    private features: DsdmFeature[] = [],
  ) {}

  add(feature: DsdmFeature): void {
    this.features.push(feature);
  }

  /** Sắp theo MoSCoW, ưu tiên cao thì làm trước */
  private byPriority(): DsdmFeature[] {
    const order: Priority[] = ["Must have", "Should have", "Could have", "Won't have"];
    return this.features.slice().sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
  }

  commit(): string[] {
    const committed: string[] = [];
    const manifesto: string[] = [];
    let used = 0;

    for (const f of this.byPriority()) {
      if (f.priority === "Won't have") {
        manifesto.push(`      ✖ ${f.name} — ${f.priority} (loại khỏi đợt này)`);
        continue;
      }
      if (used + f.effort <= this.maxEffort) {
        committed.push(f.name);
        used += f.effort;
      } else {
        manifesto.push(`      ⚠️ ${f.name} — ${f.priority} (bị cắt vì hết timebox/ngân sách)`);
      }
    }
    return committed;
  }

  describe(committed: string[]): void {
    console.log(`\n⏱️  TIMEBOX: ${this.label} — năng lực ${this.maxEffort} effort`);
    console.log("   MoSCoW ưu tiên:");
    for (const f of this.byPriority()) {
      const status = committed.includes(f.name) ? "✅" : "❌";
      console.log(`      ${status} ${f.name} [${f.priority}] (${f.effort})`);
    }
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

console.log("=== 5.2.10 DSDM — Timebox + MoSCoW Prioritization Demo ===\n");

const tb = new DsdmTimebox("Release 1 — 2 tuần, ngân sách cố định", 10);
tb.add({ name: "Login", priority: "Must have", effort: 4 });
tb.add({ name: "Trang chủ sản phẩm", priority: "Must have", effort: 3 });
tb.add({ name: "Giỏ hàng cơ bản", priority: "Should have", effort: 3 });
tb.add({ name: "Thanh toán online", priority: "Should have", effort: 5 });
tb.add({ name: "Chat hỗ trợ", priority: "Could have", effort: 2 });
tb.add({ name: "App iOS riêng", priority: "Won't have", effort: 20 });

const committed = tb.commit();
tb.describe(committed);

console.log("\n🎯 Nguyên tắc DSDM:");
console.log("   • THỜI GIAN & CHI PHÍ cố định → ngược lại Agile 'giữ scope, nới schedule'.");
console.log("   • SCOPE linh hoạt: cắt 'Could have' trước, giữ 'Must have' luôn đúng hẹn.");
console.log("   • Prototyping + sự tham gia USER liên tục để chốt 'Must have' đúng giá trị.");

console.log("\n✅ Kết: đúng hạn, đúng ngân sách; 'Must have' luôn được bảo vệ, phần còn lại thương lượng được.");

export {};