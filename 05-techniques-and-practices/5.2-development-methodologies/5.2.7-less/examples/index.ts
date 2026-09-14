/**
 * 5.2.7 LeSS (Large-Scale Scrum) — Mở rộng Scrum tối giản cho nhiều team
 *
 * Mô phỏng: 3 team cùng làm 1 Product Backlog chung, 1 Product Owner, 1 Sprint.
 * Sprint Planning / Review / Retrospective CHUNG cho cả "hệ" nhiều team.
 * Cuối Sprint, công việc cả 3 team gộp thành 1 Product Increment duy nhất.
 *
 * Chạy: npx ts-node examples/index.ts
 */

interface LeSsBacklogItem {
  title: string;
  priority: number;
  status: "todo" | "in-progress" | "done";
}

class LeSsTeam {
  constructor(
    readonly name: string,
    private capacity: number,
  ) {}

  /** Team kéo việc từ backlog DÙNG CHUNG trong Sprint Planning */
  pullFromBacklog(backlog: LeSsBacklogItem[], taken: Set<string>): void {
    const candidates = backlog
      .filter((i) => i.status === "todo" && !taken.has(i.title))
      .sort((a, b) => a.priority - b.priority);

    let budget = this.capacity;
    for (const item of candidates) {
      if (budget <= 0) break;
      item.status = "in-progress";
      taken.add(item.title);
      budget -= 1;
    }

    console.log(`   • ${this.name}: đã kéo ${candidates.length} item từ backlog chung để làm trong Sprint`);
  }

  /** Team báo "xong" — đánh dấu item = done */
  complete(backlog: LeSsBacklogItem[], titles: string[]): void {
    for (const item of backlog) {
      if (titles.includes(item.title) && item.status === "in-progress") {
        item.status = "done";
      }
    }
  }
}

class LeSsProgram {
  private backlog: LeSsBacklogItem[] = [];
  readonly teams: LeSsTeam[] = [];

  constructor(private productName: string) {}

  addBacklogItem(title: string, priority: number): void {
    this.backlog.push({ title, priority, status: "todo" });
  }

  addTeam(team: LeSsTeam): void {
    this.teams.push(team);
  }

  listBacklog(): LeSsBacklogItem[] {
    return this.backlog.slice().sort((a, b) => a.priority - b.priority);
  }

  showBacklog(): void {
    console.log(`📦 PRODUCT BACKLOG DÙNG CHUNG — "${this.productName}" (1 PO, 1 backlog):`);
    this.listBacklog().forEach((i) => console.log(`   [P${i.priority}] ${i.title} — ${i.status}`));
  }

  /** Sprint Planning CHUNG: cả 3 team họp cùng 1 phòng, kéo việc từ backlog chung */
  sprintPlanning(): void {
    console.log("\n🎯 SPRINT PLANNING CHUNG (1 PO + 3 team, cùng 1 Sprint):");
    const taken = new Set<string>();
    for (const team of this.teams) {
      team.pullFromBacklog(this.backlog, taken);
    }
  }

  /** Mô phỏng cuối Sprint: team đánh dấu xong các item đã cam kết */
  finishSprint(matrix: Array<{ team: LeSsTeam; titles: string[] }>): void {
    for (const row of matrix) {
      row.team.complete(this.backlog, row.titles);
    }
  }

  /** Sprint Review CHUNG → 1 Increment duy nhất (không tách theo team) */
  sprintReview(): void {
    const doneItems = this.backlog.filter((i) => i.status === "done");
    console.log("\n🎉 SPRINT REVIEW CHUNG — 1 PRODUCT INCREMENT (gộp từ mọi team):");
    doneItems.forEach((i) => console.log(`   ✅ ${i.title}`));
    console.log(`   📊 Hoàn thành ${doneItems.length} item sau 1 Sprint (2-4 tuần).`);
  }

  /** Retrospective chung cho TOÀN HỆ, không tách theo team */
  retrospective(): void {
    console.log("\n🔍 RETROSPECTIVE CHUNG (toàn 'hệ' LeSS — trọng tâm sản phẩm toàn cục):");
    console.log("   • Tốt: 1 backlog chung tránh trùng/lệch việc giữa các team.");
    console.log("   • Chưa tốt: vẫn còn chỗ giao (handoff) giữa team Auth và Cart.");
    console.log("   • Hành động: thêm họp cross-team 15' sau Daily để phối hợp.");
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

console.log("=== 5.2.7 LeSS — Large-Scale Scrum Demo ===\n");

const program = new LeSsProgram("E-commerce Platform");
program.addBacklogItem("User Login", 1);
program.addBacklogItem("Product Catalog", 2);
program.addBacklogItem("Shopping Cart", 3);
program.addBacklogItem("Checkout", 4);
program.addBacklogItem("Order History", 5);

const teamAuth = new LeSsTeam("Team Auth", 2);
const teamCatalog = new LeSsTeam("Team Catalog", 2);
const teamCart = new LeSsTeam("Team Cart", 2);
program.addTeam(teamAuth);
program.addTeam(teamCatalog);
program.addTeam(teamCart);

program.showBacklog();
program.sprintPlanning();

// Cuối sprint: mỗi team báo xong phần họ đã kéo
program.finishSprint([
  { team: teamAuth, titles: ["User Login", "Order History"] },
  { team: teamCatalog, titles: ["Product Catalog"] },
  { team: teamCart, titles: ["Shopping Cart", "Checkout"] },
]);

program.sprintReview();
program.retrospective();

console.log("\n✅ LeSS = Giữ NGUYÊN Scrum (1 backlog, 1 PO, 1 sprint), chỉ 'scale' bằng cách cùng làm — tối giản, không thêm tầng quản lý cồng kềnh.");

export {};