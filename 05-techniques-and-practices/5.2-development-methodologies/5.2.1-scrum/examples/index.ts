/**
 * Scrum Simulation — Mô phỏng vòng đời 1 Sprint
 *
 * Chạy: npx ts-node examples/index.ts
 *
 * Mô phỏng:
 * 1. Product Backlog (PO ưu tiên)
 * 2. Sprint Planning (chọn item theo capacity)
 * 3. Daily Standup (10 ngày)
 * 4. Sprint Review (demo increment)
 * 5. Retrospective (cải tiến)
 */

// ─── Artifacts ────────────────────────────────────────────────────

interface BacklogItem {
  id: string;
  title: string;
  priority: number; // 1 = cao nhất
  storyPoints: number;
  status: "todo" | "in-progress" | "done";
}

class ProductBacklog {
  private items: BacklogItem[] = [];

  add(item: Omit<BacklogItem, "status">): void {
    this.items.push({ ...item, status: "todo" });
  }

  /** PO ưu tiên: sắp xếp theo priority */
  prioritize(): void {
    this.items.sort((a, b) => a.priority - b.priority);
  }

  getTop(n: number): BacklogItem[] {
    return this.items.filter((i) => i.status === "todo").slice(0, n);
  }

  getItems(): BacklogItem[] {
    return this.items;
  }
}

// ─── Sprint ───────────────────────────────────────────────────────

class Sprint {
  backlog: BacklogItem[] = [];
  goal: string;

  constructor(goal: string) {
    this.goal = goal;
  }

  /** Sprint Planning: chọn item theo capacity (story points) */
  plan(productBacklog: ProductBacklog, capacity: number): void {
    const candidates = productBacklog.getTop(10);
    let used = 0;

    for (const item of candidates) {
      if (used + item.storyPoints <= capacity) {
        this.backlog.push(item);
        used += item.storyPoints;
      }
    }

    console.log(`🎯 Sprint Goal: ${this.goal}`);
    console.log(`📋 Sprint Backlog (${used}/${capacity} points):`);
    this.backlog.forEach((i) => console.log(`   - [${i.id}] ${i.title} (${i.storyPoints}pts)`));
  }

  /** Daily Standup: mỗi dev báo cáo 3 câu */
  dailyStandup(day: number): void {
    console.log(`\n☀️  Daily Standup — Day ${day}`);
    for (const item of this.backlog) {
      if (item.status === "todo") {
        console.log(`   👨‍💻 Dev: "Hôm qua: chưa làm gì. Hôm nay: bắt đầu ${item.title}. Blocker: không."`);
        item.status = "in-progress";
        break;
      } else if (item.status === "in-progress") {
        console.log(`   👨‍💻 Dev: "Hôm qua: làm ${item.title}. Hôm nay: hoàn thành. Blocker: không."`);
        item.status = "done";
        break;
      }
    }
  }

  /** Sprint Review: demo increment cho stakeholder */
  review(): void {
    const done = this.backlog.filter((i) => i.status === "done");
    console.log(`\n🎉 Sprint Review — Increment hoàn thành:`);
    done.forEach((i) => console.log(`   ✅ ${i.title}`));
    console.log(`   📊 Velocity: ${done.reduce((s, i) => s + i.storyPoints, 0)} points`);
  }

  /** Retrospective: nhìn lại quy trình */
  retrospective(): void {
    console.log(`\n🔍 Retrospective:`);
    console.log(`   👍 Tốt: Sprint Goal đạt được, team phối hợp tốt`);
    console.log(`   👎 Chưa tốt: Ước lượng story points hơi lạc quan`);
    console.log(`   🧪 Thử mới: Chia nhỏ item > 8 points thành item nhỏ hơn`);
  }
}

// ─── Chạy mô phỏng ────────────────────────────────────────────────

const backlog = new ProductBacklog();
backlog.add({ id: "US-1", title: "User Login", priority: 1, storyPoints: 5 });
backlog.add({ id: "US-2", title: "Shopping Cart", priority: 2, storyPoints: 8 });
backlog.add({ id: "US-3", title: "Checkout", priority: 3, storyPoints: 13 });
backlog.add({ id: "US-4", title: "Search Products", priority: 4, storyPoints: 8 });
backlog.add({ id: "US-5", title: "Product Reviews", priority: 5, storyPoints: 5 });

backlog.prioritize();

console.log("📦 Product Backlog (đã ưu tiên bởi PO):");
backlog.getItems().forEach((i) => console.log(`   [P${i.priority}] ${i.title} (${i.storyPoints}pts)`));

const sprint = new Sprint("Hoàn thành luồng mua hàng cơ bản");
sprint.plan(backlog, 26); // Team capacity: 26 points

// Mô phỏng 10 ngày làm việc
for (let day = 1; day <= 10; day++) {
  sprint.dailyStandup(day);
}

sprint.review();
sprint.retrospective();

console.log("\n📦 Product Backlog còn lại cho Sprint sau:");
backlog
  .getItems()
  .filter((i) => i.status === "todo")
  .forEach((i) => console.log(`   [P${i.priority}] ${i.title} (${i.storyPoints}pts)`));