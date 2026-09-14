/**
 * 15.3 Git Merging — mô phỏng hai kiểu merge chính của Git
 *
 * 1. Fast-Forward merge: branch đích nằm trong lịch sử → chỉ dịch con trỏ.
 * 2. Three-Way merge: hai branch phân nhánh → tạo merge commit có 2 parents,
 *    kèm mô phỏng conflict resolution.
 *
 * Mọi thao tác đều MÔ PHỎNG trong bộ nhớ (KHÔNG chạy git thật), chuỗi lệnh
 * git được in dạng string kèm giải thích tiếng Việt.
 */

type GitMergeCommit = {
  id: string;
  message: string;
  parentIds: string[];
};

class GitMergeGraph {
  private commits: GitMergeCommit[] = [];
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

  private findCommit(id: string): GitMergeCommit | undefined {
    return this.commits.find((c) => c.id === id);
  }

  private getHead(): string | null {
    return this.branchTip.get(this.currentBranch) ?? null;
  }

  /** git commit -m "..." */
  commit(message: string): string {
    const id = this.nextId();
    const parentId = this.getHead();
    this.commits.push({ id, message, parentIds: parentId ? [parentId] : [] });
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

  /** Tìm merge base: commit chung sâu nhất giữa hai nhánh */
  private findMergeBase(a: GitMergeCommit, b: GitMergeCommit): GitMergeCommit {
    const aAncestors = new Set<string>();
    const stackA = [a];
    while (stackA.length > 0) {
      const cur = stackA.pop();
      if (!cur || aAncestors.has(cur.id)) continue;
      aAncestors.add(cur.id);
      for (const p of cur.parentIds) {
        const pc = this.findCommit(p);
        if (pc) stackA.push(pc);
      }
    }
    const stackB = [b];
    while (stackB.length > 0) {
      const cur = stackB.pop();
      if (!cur) continue;
      if (aAncestors.has(cur.id)) return cur;
      for (const p of cur.parentIds) {
        const pc = this.findCommit(p);
        if (pc) stackB.push(pc);
      }
    }
    throw new Error("Không tìm thấy merge base");
  }

  /** git merge <branch> (đứng ở branch đích) */
  merge(featureBranch: string, opts?: { simulateConflict?: boolean }): string {
    console.log(`git merge ${featureBranch}`);
    const featureTip = this.branchTip.get(featureBranch) ?? null;
    const currentTip = this.getHead();
    if (!featureTip) {
      throw new Error(`Branch "${featureBranch}" chưa có commit`);
    }
    void currentTip;
    const feature = this.findCommit(featureTip);
    const current = this.findCommit(currentTip as string);
    if (!feature || !current) {
      throw new Error("Không tìm thấy commit của branch");
    }

    // Trường hợp 1: hai nhánh cùng trỏ 1 commit
    if (featureTip === currentTip) {
      console.log("  ℹ️  Hai branch trỏ cùng 1 commit — không có gì để merge");
      return currentTip;
    }

    // Trường hợp 2: Fast-Forward — branch đích là ancestor của feature
    const base = this.findMergeBase(feature, current);
    if (base.id === currentTip) {
      console.log("  ✅ FAST-FORWARD: main là ancestor của feature — chỉ dịch con trỏ");
      console.log(`  ✅ main: ${currentTip} → ${featureTip} (KHÔNG tạo merge commit)`);
      this.branchTip.set(this.currentBranch, featureTip);
      return featureTip;
    }

    // Trường hợp 3: Three-Way merge
    console.log(`  🔀 THREE-WAY: base chung = ${base.id}, hai nhánh đều tiến — tạo merge commit`);
    if (opts?.simulateConflict) {
      console.log("  ⚠️  CONFLICT (content): cả hai nhánh cùng sửa file config.ts");
      console.log("     <<<<<<< HEAD");
      console.log("     export const PORT = 3000;   // từ main");
      console.log("     =======");
      console.log("     export const PORT = 4000;   // từ feature");
      console.log("     >>>>>>> feature/env-config");
      console.log("  ❌ Merge tạm dừng — developer phải resolve thủ công:");
      console.log("     git add config.ts");
      console.log("     git commit -m \"Merge branch 'feature/env-config'\"");
      console.log("     ✅ Đã resolve: giữ PORT = 4000");
    }
    const id = this.nextId();
    this.commits.push({
      id,
      message: `Merge branch '${featureBranch}' into ${this.currentBranch}`,
      parentIds: [currentTip as string, featureTip],
    });
    this.branchTip.set(this.currentBranch, id);
    console.log(`  ✅ Tạo merge commit ${id} với 2 parents (${currentTip}, ${featureTip})`);
    return id;
  }

  /** Sơ đồ từng nhánh — merge commit hiển thị 2 parents */
  renderGraph(): void {
    console.log("");
    console.log("Sơ đồ:");
    for (const [name, tip] of this.branchTip.entries()) {
      if (!tip) {
        console.log(`  ${name}: (chưa có commit)`);
        continue;
      }
      const chain: string[] = [];
      let cur: GitMergeCommit | undefined = this.findCommit(tip);
      while (cur) {
        const extra = cur.parentIds.length > 1 ? `(${cur.parentIds.join("+")})` : "";
        chain.push(cur.id + extra);
        cur = cur.parentIds[0] ? this.findCommit(cur.parentIds[0]) : undefined;
      }
      const suffix = name === this.currentBranch ? " (HEAD)" : "";
      console.log(`  ${name}${suffix}: ${chain.reverse().join(" → ")}`);
    }
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Git Merging Demo ===");
console.log("");

console.log("🔹 KỊCH BẢN 1: Fast-Forward Merge");
const gg = new GitMergeGraph();
gg.commit("feat: khởi tạo project");
gg.commit("feat: thêm landing page");
gg.createBranch("feature/login");
gg.checkout("feature/login");
gg.commit("feat: đăng ký tài khoản");
gg.commit("feat: đăng nhập bằng email");
console.log("");
console.log("  Merge khi main CHƯA tiến thêm (feature nằm trên main):");
gg.checkout("main");
gg.merge("feature/login");
gg.renderGraph();
console.log("");

console.log("🔹 KỊCH BẢN 2: Three-Way Merge (hai nhánh đều tiến)");
const gg2 = new GitMergeGraph();
gg2.commit("feat: khởi tạo project");
gg2.commit("feat: thêm landing page");
gg2.createBranch("feature/payment");
gg2.checkout("feature/payment");
gg2.commit("feat: xử lý thanh toán");
gg2.commit("feat: tích hợp cổng thanh toán");
gg2.checkout("main");
gg2.commit("feat: thêm trang dashboard");
console.log("");
console.log("  Merge khi cả main và feature đều có commit mới:");
gg2.merge("feature/payment");
gg2.renderGraph();
console.log("");

console.log("🔹 KỊCH BẢN 3: Merge kèm Conflict");
const gg3 = new GitMergeGraph();
gg3.commit("chore: cấu hình dự án");
gg3.createBranch("feature/env-config");
gg3.checkout("feature/env-config");
gg3.commit("chore: cấu hình PORT cho môi trường");
gg3.checkout("main");
gg3.commit("chore: thêm biến PORT mặc định");
console.log("");
gg3.merge("feature/env-config", { simulateConflict: true });
gg3.renderGraph();

console.log("");
console.log("✅ Git Merging: fast-forward, three-way và conflict mô phỏng thành công");
export {};