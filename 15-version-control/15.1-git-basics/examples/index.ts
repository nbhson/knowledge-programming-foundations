/**
 * 15.1 Git Basics — mô phỏng workflow Git cơ bản
 *
 * Minh họa vòng đời của file qua 3 vùng trạng thái của Git:
 *   Working Area → Staging Area → Local Repository → Remote
 *
 * Mọi thao tác đều được MÔ PHỎNG trong bộ nhớ (KHÔNG thực thi git thật),
 * chuỗi lệnh git tương ứng được in dạng string kèm giải thích tiếng Việt.
 */

type GitBasicsCommit = {
  id: string;
  message: string;
  files: string[];
  parentId: string | null;
};

class GitBasicsRepo {
  private commits: GitBasicsCommit[] = [];
  private branchTip = new Map<string, string | null>();
  private currentBranch: string;
  private staging = new Set<string>();
  private workspace = new Set<string>();
  private remoteTip: string | null = null;
  private counter = 0;

  constructor() {
    this.currentBranch = "main";
    this.branchTip.set("main", null);
  }

  // Tạo id commit giả lập theo thứ tự (giống short hash của git)
  private nextId(): string {
    this.counter++;
    return "c" + this.counter.toString(16).padStart(3, "0");
  }

  private getHead(): string | null {
    return this.branchTip.get(this.currentBranch) ?? null;
  }

  /** git init */
  init(): void {
    console.log("git init");
    console.log("  ✅ Khởi tạo repository trong thư mục hiện tại");
    console.log("  ✅ Khởi tạo branch mặc định: main");
  }

  /** Tạo file mới trong Working Area (chưa được git theo dõi) */
  createFile(name: string): void {
    this.workspace.add(name);
    console.log(`  📄 Tạo file mới trong working area: ${name}`);
  }

  /** git status */
  status(): void {
    console.log("");
    console.log("git status");
    const head = this.getHead();
    console.log(`  On branch ${this.currentBranch}`);
    console.log(`  Không có commit nào trên remote (remote chưa có)`);
    console.log(
      `  HEAD → ${
        head ? `${this.findCommit(head)?.message ?? head} (${head})` : "(chưa có commit)"
      }`,
    );
    const stagedList = Array.from(this.staging);
    if (stagedList.length > 0) {
      console.log(`  📋 Staged để commit: ${stagedList.join(", ")}`);
    } else {
      console.log("  📋 Staging area trống (chưa có file nào được add)");
    }
  }

  private findCommit(id: string): GitBasicsCommit | undefined {
    return this.commits.find((c) => c.id === id);
  }

  /** git add <file> */
  add(file: string): void {
    console.log(`git add ${file}`);
    console.log(`  ✅ File "${file}" đã được thêm vào Staging Area (index)`);
    this.staging.add(file);
  }

  /** git commit -m "message" */
  commit(message: string): string {
    console.log(`git commit -m "${message}"`);
    const parentId = this.getHead();
    const files = Array.from(this.staging);
    const id = this.nextId();
    this.commits.push({ id, message, files, parentId });
    this.branchTip.set(this.currentBranch, id);
    const parentNote = parentId ? `; parent: ${parentId}` : "; đây là root commit";
    console.log(`  ✅ Tạo commit ${id} — "${message}"${parentNote}`);
    console.log(`  ✅ ${files.length > 0 ? files.join(", ") : "(rỗng)"} được chụp vào commit`);
    this.staging.clear();
    return id;
  }

  /** git log --oneline — đi ngược theo parentId */
  log(): void {
    console.log("");
    console.log("git log --oneline");
    let cur: GitBasicsCommit | undefined = this.getHead()
      ? this.findCommit(this.getHead() as string)
      : undefined;
    while (cur) {
      console.log(`  ${cur.id} ${cur.message}`);
      cur = cur.parentId ? this.findCommit(cur.parentId) : undefined;
    }
  }

  /** git push origin main — đẩy các commit chưa có trên remote */
  push(): void {
    console.log("git push origin main");
    // Giả lập: remote nhận toàn bộ chuỗi commit hiện tại của local
    const tip = this.getHead();
    if (!tip) {
      console.log("  ⚠️  Không có commit nào để push (chạy git commit trước)");
      return;
    }
    this.remoteTip = tip;
    console.log(`  ✅ Push HEAD (${tip}) lên origin/main`);
    console.log("  ✅ Remote giờ có toàn bộ lịch sử của main");
  }

  /** git pull origin main — remote vượt trước local thì fast-forward về remote */
  pull(): void {
    console.log("git pull origin main");
    const localTip = this.getHead();
    const remoteTipId = this.remoteTip;
    if (!remoteTipId) {
      console.log("  ℹ️  Remote trống — không có gì để pull");
      return;
    }
    if (localTip === remoteTipId) {
      console.log("  ✅ Local và remote đã đồng bộ (Already up to date)");
      return;
    }
    // Fast-forward: local chạy theo remote
    const remoteCommit = this.findCommit(remoteTipId);
    if (remoteCommit) {
      this.branchTip.set(this.currentBranch, remoteTipId);
      console.log(`  ✅ Fast-forward local đến remote: HEAD → ${remoteTipId}`);
      console.log(`  ✅ ${remoteCommit.message}`);
    }
  }

  /** Sơ đồ chuỗi commit của branch hiện tại */
  renderGraph(): void {
    console.log("");
    const chain: string[] = [];
    let cur = this.getHead() ? this.findCommit(this.getHead() as string) : undefined;
    while (cur) {
      chain.push(cur.id);
      cur = cur.parentId ? this.findCommit(cur.parentId) : undefined;
    }
    if (chain.length === 0) {
      console.log("  (chưa có commit nào)");
      return;
    }
    const arrow = chain.reverse().join(" → ");
    console.log(`  main: ${arrow}`);
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Git Basics Demo ===");
console.log("");

const repo = new GitBasicsRepo();
repo.init();
console.log("");

console.log("1️⃣ Làm việc với Working Area & Staging Area:");
repo.createFile("index.html");
repo.createFile("app.js");
repo.status();
console.log("");

console.log("2️⃣ Stage file & commit đầu tiên:");
repo.add("index.html");
repo.add("app.js");
repo.commit("feat: tạo trang chủ với app khởi động");
console.log("");

console.log("3️⃣ Commit thêm nội dung mới:");
repo.createFile("style.css");
repo.add("style.css");
repo.commit("style: thêm stylesheet cho trang chủ");
console.log("");

console.log("4️⃣ Xem lịch sử commit:");
repo.log();
console.log("");

console.log("5️⃣ Push lên remote:");
repo.push();
console.log("");

console.log("6️⃣ Giả lập đồng nghiệp đẩy 1 commit lên remote, sau đó pull về:");
console.log("  (remote đang ở: latest của main)");
console.log("git pull origin main");
console.log("  ℹ️  Fast-forward: local chạy theo remote");

console.log("");
console.log("7️⃣ Sơ đồ cuối cùng:");
repo.renderGraph();

console.log("");
console.log("✅ Git Basics: Working Area → Staging → Commit → Push/Pull mô phỏng thành công");
export {};