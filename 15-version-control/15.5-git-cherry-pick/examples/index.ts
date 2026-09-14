/**
 * 15.5 Git Cherry-Pick — mô phỏng copy một commit cụ thể sang branch khác
 *
 * Cherry-pick KHÔNG merge cả nhánh: chỉ lấy ĐÚNG 1 commit (message + nội dung
 * thay đổi) và tạo thành commit MỚI (id mới) trên branch đích.
 *
 * Mọi thao tác đều MÔ PHỎNG trong bộ nhớ (KHÔNG chạy git thật), chuỗi lệnh
 * git được in dạng string kèm giải thích tiếng Việt.
 */

type GitCherryCommit = {
  id: string;
  message: string;
  filesChanged: { file: string; change: string }[];
  parentId: string | null;
};

class GitCherryGraph {
  private commits: GitCherryCommit[] = [];
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

  private findCommit(id: string): GitCherryCommit | undefined {
    return this.commits.find((c) => c.id === id);
  }

  private getHead(): string | null {
    return this.branchTip.get(this.currentBranch) ?? null;
  }

  /** git commit -m "..." — commit có kèm "nội dung thay đổi" (patch) */
  commit(message: string, patch: { file: string; change: string }[]): string {
    const id = this.nextId();
    const parentId = this.getHead();
    this.commits.push({
      id,
      message,
      filesChanged: patch,
      parentId,
    });
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

  /** git log --oneline <branch> — xem commit của một branch */
  logBranch(branch: string): void {
    console.log(`git log --oneline ${branch}`);
    const tip = this.branchTip.get(branch) ?? null;
    if (!tip) {
      console.log(`  (branch ${branch} chưa có commit)`);
      return;
    }
    let cur: GitCherryCommit | undefined = this.findCommit(tip);
    const rows: string[] = [];
    while (cur) {
      rows.push(`${cur.id} ${cur.message}`);
      cur = cur.parentId ? this.findCommit(cur.parentId) : undefined;
    }
    rows.forEach((r) => console.log(`  ${r}`));
  }

  /** git cherry-pick <commitId> — copy commit sang branch đang đứng */
  cherryPick(commitId: string): string {
    console.log(`git cherry-pick ${commitId}`);
    const source = this.findCommit(commitId);
    if (!source) {
      throw new Error(`Không tìm thấy commit ${commitId}`);
    }
    const head = this.getHead();
    // Tạo commit MỚI — giữ message & patch, nhưng id khác & parent là HEAD hiện tại
    const id = this.nextId();
    this.commits.push({
      id,
      message: source.message,
      filesChanged: source.filesChanged,
      parentId: head,
    });
    this.branchTip.set(this.currentBranch, id);
    console.log(`  🔄 Copy commit ${commitId} → ${id} (id mới, nội dung giống hệt)`);
    console.log(`  ✅ Đính vào ${this.currentBranch}: ${head ?? "(root)"} → ${id}`);
    console.log(`  ✅ Giữ nguyên message & author: "${source.message}"`);
    source.filesChanged.forEach((f) => {
      console.log(`     📄 ${f.file}: ${f.change}`);
    });
    return id;
  }

  /** Sơ đồ mỗi nhánh + ghi chú commit cherry-picked */
  renderGraph(markId?: string): void {
    console.log("");
    console.log("Sơ đồ:");
    for (const [name, tip] of this.branchTip.entries()) {
      if (!tip) {
        console.log(`  ${name}: (chưa có commit)`);
        continue;
      }
      const chain: string[] = [];
      let cur: GitCherryCommit | undefined = this.findCommit(tip);
      while (cur) {
        let label = cur.id;
        if (markId && cur.id === markId) label += " ★ (cherry-picked)";
        chain.push(label);
        cur = cur.parentId ? this.findCommit(cur.parentId) : undefined;
      }
      const suffix = name === this.currentBranch ? " (HEAD)" : "";
      console.log(`  ${name}${suffix}: ${chain.reverse().join(" → ")}`);
    }
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Git Cherry-Pick Demo ===");
console.log("");

console.log("🔹 KỊCH BẢN: cần đưa 1 hotfix từ feature vào main, không merge cả nhánh");
console.log("");
const gc = new GitCherryGraph();
gc.commit("feat: khởi tạo project", [{ file: "app.ts", change: "+10 dòng" }]);
gc.commit("feat: thêm landing page", [{ file: "landing.ts", change: "+30 dòng" }]);
gc.createBranch("feature/billing");
gc.checkout("feature/billing");
gc.commit("feat: ghi invoice", [{ file: "invoice.ts", change: "+40 dòng" }]);
gc.commit("fix: sửa lỗi timeout khi gọi API billing", [
  { file: "http.ts", change: "timeout 5s → 15s" },
  { file: "billing.ts", change: "-1 dòng debug log" },
]);
console.log("");

console.log("▶️ Xem commit của feature/billing:");
gc.logBranch("feature/billing");
console.log("");

gc.checkout("main");
gc.commit("feat: thêm dashboard", [{ file: "dashboard.ts", change: "+25 dòng" }]);
console.log("");

console.log("▶️ Chỉ muốn mang fix timeout vào main (bỏ qua feature invoice):");
console.log("");
const newCommit = gc.cherryPick("c004");
console.log("");

console.log("▶️ Kết quả sau cherry-pick:");
gc.renderGraph(newCommit);

console.log("");
console.log("✅ Git Cherry-Pick: copy commit cụ thể sang branch khác, tạo commit mới mô phỏng thành công");
export {};