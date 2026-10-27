/**
 * Kanban Simulation — Mô phỏng Kanban board với WIP limit
 *
 * Chạy: npx ts-node examples/index.ts
 *
 * Mô phỏng:
 * 1. Board với cột: Backlog → In Progress → Review → Done
 * 2. WIP limit: chặn kéo item mới khi cột đã đầy
 * 3. Metrics: cycle time, throughput
 */

interface WorkItem {
  id: string;
  title: string;
  startedDay?: number;
  doneDay?: number;
}

type ColumnName = "backlog" | "in-progress" | "review" | "done";

class KanbanBoard {
  private columns: Record<ColumnName, WorkItem[]> = {
    backlog: [],
    "in-progress": [],
    review: [],
    done: [],
  };

  private wipLimits: Record<ColumnName, number> = {
    backlog: Infinity,
    "in-progress": 3,
    review: 2,
    done: Infinity,
  };

  addToBacklog(item: WorkItem): void {
    this.columns.backlog.push(item);
    console.log(`➕ ${item.id}: "${item.title}" vào Backlog`);
  }

  /** Pull: kéo item từ cột trước sang cột sau nếu WIP cho phép */
  private pull(from: ColumnName, to: ColumnName, day: number): void {
    const item = this.columns[from][0];
    if (!item) return;

    if (this.columns[to].length >= this.wipLimits[to]) {
      console.log(`   🚫 WIP limit ${to} (${this.wipLimits[to]}) đạt — chờ...`);
      return;
    }

    this.columns[from].shift();
    this.columns[to].push(item);

    if (to === "in-progress") {
      item.startedDay = day;
    }
    if (to === "done") {
      item.doneDay = day;
    }

    console.log(`   ▶️  ${item.id} ${from} → ${to} (day ${day})`);
  }

  /** Mỗi ngày: kéo item qua các cột */
  tick(day: number): void {
    console.log(`\n📅 Day ${day}:`);
    this.pull("backlog", "in-progress", day);
    // Kéo tuần tự review → done, rồi in-progress → review
    if (this.columns["in-progress"].length < this.wipLimits["in-progress"]) {
      this.pull("review", "done", day);
    }
    this.pull("in-progress", "review", day);
  }

  /** Metrics */
  report(): void {
    const done = this.columns.done;
    const totalCycle = done.reduce(
      (sum, i) => sum + ((i.doneDay ?? 0) - (i.startedDay ?? 0)),
      0
    );
    const avgCycle = done.length ? totalCycle / done.length : 0;

    console.log(`\n📊 Report:`);
    console.log(`   Throughput: ${done.length} items`);
    console.log(`   Avg Cycle Time: ${avgCycle.toFixed(1)} days`);
    done.forEach((i) =>
      console.log(`      ${i.id}: ${i.title} — ${(i.doneDay ?? 0) - (i.startedDay ?? 0)} days`)
    );
  }
}

// ─── Chạy mô phỏng ────────────────────────────────────────────────

const board = new KanbanBoard();

board.addToBacklog({ id: "K-1", title: "Fix login bug" });
board.addToBacklog({ id: "K-2", title: "Add export CSV" });
board.addToBacklog({ id: "K-3", title: "Improve search speed" });
board.addToBacklog({ id: "K-4", title: "Update docs" });
board.addToBacklog({ id: "K-5", title: "Refactor payment module" });

// Mô phỏng 8 ngày làm việc
for (let day = 1; day <= 8; day++) {
  board.tick(day);
}

board.report();