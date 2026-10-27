/**
 * 15.2 Git Branching — mô phỏng phân nhánh trong Git
 *
 * Minh họa: tạo branch → chuyển branch (HEAD) → commit trên từng nhánh
 * → xem sơ đồ. Mọi thao tác đều MÔ PHỎNG trong bộ nhớ (KHÔNG chạy git thật),
 * chuỗi lệnh git được in dạng string kèm giải thích tiếng Việt.
 */

type GitBranchingCommit = {
  id: string;
  message: string;
  parentId: string | null;
};

class GitBranchingGraph {
  private commits: GitBranchingCommit[] = [];
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

  private findCommit(id: string): GitBranchingCommit | undefined {
    return this.commits.find((c) => c.id === id);
  }

  private getHead(): string | null {
    return this.branchTip.get(this.currentBranch) ?? null;
  }

  /** git commit -m "..." — commit vào branch đang đứng (HEAD) */
  commit(message: string): string {
    const id = this.nextId();
    const parentId = this.getHead();
    this.commits.push({ id, message, parentId });
    this.branchTip.set(this.currentBranch, id);
    console.log(`git commit -m "${message}"`);
    console.log(`  ✅ ${this.currentBranch}: ${parentId ?? "(root)"} → ${id} — "${message}"`);
    return id;
  }

  /** git branch <name> — tạo branch mới từ commit HEAD hiện tại */
  createBranch(name: string): void {
    console.log(`git branch ${name}`);
    const head = this.getHead();
    this.branchTip.set(name, head);
    console.log(`  ✅ Tạo branch "${name}" tại commit ${head ?? "(chưa có commit)"}`);
  }

  /** git checkout <name> — chuyển HEAD sang branch khác */
  checkout(name: string): void {
    if (!this.branchTip.has(name)) {
      throw new Error(`Branch "${name}" không tồn tại`);
    }
    console.log(`git checkout ${name}`);
    this.currentBranch = name;
    console.log(`  🔀 HEAD chuyển sang branch "${name}" (tip: ${this.getHead() ?? "—"})`);
  }

  /** git branch — liệt kê tất cả branch, đánh dấu * cho branch hiện tại */
  listBranches(): void {
    console.log("");
    console.log("git branch");
    for (const [name, tip] of this.branchTip.entries()) {
      const marker = name === this.currentBranch ? "*" : " ";
      console.log(`  ${marker} ${name.padEnd(16)} → ${tip ?? "(chưa có commit)"}`);
    }
  }

  /** git log --oneline --graph --all — vẽ sơ đồ từng nhánh */
  renderGraph(): void {
    console.log("");
    console.log("git log --oneline --graph --all");
    for (const [name, tip] of this.branchTip.entries()) {
      if (!tip) {
        console.log(`  ${name}: (chưa có commit)`);
        continue;
      }
      const chain: string[] = [];
      let cur: GitBranchingCommit | undefined = this.findCommit(tip);
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
console.log("=== Git Branching Demo ===");
console.log("");

const git = new GitBranchingGraph();

console.log("1️⃣ Commit 3 lần trên main:");
git.commit("feat: khởi tạo project");
git.commit("feat: thêm login form");
git.commit("feat: thêm dashboard");
console.log("");

console.log("2️⃣ Tạo branch tính năng từ main:");
git.createBranch("feature/login");

console.log("");
console.log("3️⃣ Chuyển sang feature/login và commit thêm:");
git.checkout("feature/login");
git.commit("feat: thêm xác thực email");
git.commit("feat: thêm reset mật khẩu");
console.log("");

console.log("4️⃣ Quay về main, tạo branch hotfix từ main:");
git.checkout("main");
git.createBranch("hotfix/payment");
git.checkout("hotfix/payment");
git.commit("fix: sửa lỗi thanh toán timeout");
console.log("");

console.log("5️⃣ Liệt kê branch:");
git.listBranches();

console.log("");
console.log("6️⃣ Sơ đồ các nhánh:");
git.renderGraph();

console.log("");
console.log("✅ Git Branching: tạo nhánh, chuyển HEAD và commit song song mô phỏng thành công");
export {};