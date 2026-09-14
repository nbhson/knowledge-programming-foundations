/**
 * 15.4 Git Rebase — mô phỏng "replay" lại các commit lên một base mới
 *
 * Rebase KHÔNG giữ nguyên commit cũ mà TẠO LẠI commit mới (có id mới)
 * trên đỉnh của base — kết quả là lịch sử tuyến tính (linear history).
 *
 * Mọi thao tác đều MÔ PHỎNG trong bộ nhớ (KHÔNG chạy git thật), chuỗi lệnh
 * git được in dạng string kèm giải thích tiếng Việt.
 */

type GitRebaseCommit = {
  id: string;
  message: string;
  parentId: string | null;
};

class GitRebaseGraph {
  private commits: GitRebaseCommit[] = [];
  private branchTip = new Map<string, string | null>();
  private currentBranch: string;
  private counter = 0;

  constructor() {
    this.currentBranch = "main";
    this.branchTip.set("main", null);
  }

  private nextId(): string {
    this.counter++;
    return "c" + this.counter.toString(16).padStart(3, "0");
  }

  private findCommit(id: string): GitRebaseCommit | undefined {
    return this.commits.find((c) => c.id === id);
  }

  private getHead(): string | null {
    return this.branchTip.get(this.currentBranch) ?? null;
  }

  /** git commit -m "..." */
  commit(message: string): string {
    const id = this.nextId();
    const parentId = this.getHead();
    this.commits.push({ id, message, parentId });
    this.branchTip.set(this.currentBranch, id);
    console.log(`git commit -m "${message}"`);
    console.log(`  ✅ ${this.currentBranch}: +${id} — "${message}"`);
    return id;
  }

  /** git branch <name> */
  createBranch(name: string): void {
    const head = this.getHead();
    this.branchTip.set(name, head);
    console.log(`git branch ${name}  (tại ${head ?? "root"})`);
  }

  /** git checkout <name> */
  checkout(name: string): void {
    this.currentBranch = name;
    console.log(`git checkout ${name}`);
  }

  /** Tập hợp tất cả ancestor id của một commit */
  private ancestors(id: string): Set<string> {
    const set = new Set<string>();
    const stack = [id];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (!cur || set.has(cur)) continue;
      set.add(cur);
      const c = this.findCommit(cur);
      if (c && c.parentId) stack.push(c.parentId);
    }
    return set;
  }

  /** git rebase <onto> — đứng ở branch cần linearize (feature) */
  rebase(ontoBranch: string): void {
    console.log(`git rebase ${ontoBranch}`);
    const branchChild = this.branchTip.get(this.currentBranch) ?? null;
    const baseParent = this.branchTip.get(ontoBranch) ?? null;
    if (!branchChild || !baseParent) {
      throw new Error("Cả hai branch phải có commit trước khi rebase");
    }

    // Các commit RIÊNG của nhánh hiện tại (không thuộc ontoBranch)
    const ontoAncestors = this.ancestors(baseParent);
    const ownCommits: GitRebaseCommit[] = [];
    let cur: GitRebaseCommit | undefined = this.findCommit(branchChild);
    while (cur && !ontoAncestors.has(cur.id)) {
      ownCommits.push(cur);
      cur = cur.parentId ? this.findCommit(cur.parentId) : undefined;
    }
    ownCommits.reverse(); // theo thứ tự từ cũ → mới

    console.log(`  🎯 Các commit sẽ được replay lên ${ontoBranch}:`);
    ownCommits.forEach((c) => console.log(`     • ${c.message}`));
    console.log(`  Base mới: ${baseParent} (${ontoBranch} tip)`);

    // Replay: tạo LẠI commit với id mới, message giữ nguyên
    let parentId: string | null = baseParent;
    for (const old of ownCommits) {
      const newId = this.nextId();
      this.commits.push({ id: newId, message: old.message, parentId });
      console.log(`  🔄 Replay: ${old.id} → ${newId} ("${old.message}")`);
      parentId = newId;
    }

    this.branchTip.set(this.currentBranch, parentId);
    console.log(`  ✅ ${this.currentBranch} giờ trỏ vào ${parentId}`);
    console.log("  ⚠️  Lưu ý: id commit đã đổi — đừng rebase branch đã push lên remote!");
  }

  /** Sơ đồ từng nhánh */
  renderGraph(): void {
    console.log("");
    console.log("Sơ đồ:");
    for (const [name, tip] of this.branchTip.entries()) {
      if (!tip) {
        console.log(`  ${name}: (chưa có commit)`);
        continue;
      }
      const chain: string[] = [];
      let cur: GitRebaseCommit | undefined = this.findCommit(tip);
      while (cur) {
        chain.push(cur.id);
        cur = cur.parentId ? this.findCommit(cur.parentId) : undefined;
      }
      const suffix = name === this.currentBranch ? " (HEAD)" : "";
      console.log(`  ${name}${suffix}: ${chain.reverse().join(" → ")}`);
    }
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Git Rebase Demo ===");
console.log("");

console.log("🔹 KỊCH BẢN: main tiến thêm trong khi feature vẫn phát triển");
console.log("");
const gr = new GitRebaseGraph();
gr.commit("feat: khởi tạo project");
gr.commit("feat: thêm landing page");
gr.createBranch("feature/login");
gr.checkout("feature/login");
gr.commit("feat: đăng ký tài khoản");
gr.commit("feat: đăng nhập");
console.log("");
gr.checkout("main");
gr.commit("feat: thêm dashboard");
console.log("");

console.log("▶️ TRƯỚC khi rebase — lịch sử bị phân nhánh:");
gr.renderGraph();

console.log("");
console.log("▶️ Thực hiện rebase feature lên main:");
gr.checkout("feature/login");
gr.rebase("main");
console.log("");

console.log("▶️ SAU khi rebase — lịch sử tuyến tính:");
gr.renderGraph();

console.log("");
console.log("▶️ Interactive rebase (thao tác nâng cao):");
console.log("git rebase -i HEAD~2");
console.log("  pick  c004  feat: đăng ký tài khoản");
console.log("  squash c005 feat: đăng nhập");
console.log("  → 2 commit gộp thành 1: \"feat: xác thực người dùng\"");
console.log("  ✅ Interactive rebase giúp gộp (squash), sửa message (reword), xóa commit (drop)");

console.log("");
console.log("✅ Git Rebase: replay commit lên base mới, tạo lịch sử tuyến tính mô phỏng thành công");
export {};