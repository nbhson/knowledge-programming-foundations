/**
 * 8.1 Git Flow — Vẽ sơ đồ workflow + mô phỏng lệnh git (chỉ chuỗi, KHÔNG thực thi)
 *
 * Minh họa:
 * - Sơ đồ các nhánh main / develop / feature / release / hotfix.
 * - Script các lệnh `git flow ...` dạng string cho từng vòng đời.
 * - KHÔNG chạy lệnh git thật — chỉ in ra để học.
 */

// ──────────────────── Mô tả các nhánh ────────────────────
interface GitflowBranchInfo {
  name: string;
  type: "Permanent" | "Temporary";
  purpose: string;
  mergesInto: string;
}

const GitflowBranches: GitflowBranchInfo[] = [
  { name: "main", type: "Permanent", purpose: "Code production-ready, gắn version tag", mergesInto: "—" },
  { name: "develop", type: "Permanent", purpose: "Tích hợp tất cả feature", mergesInto: "—" },
  { name: "feature/*", type: "Temporary", purpose: "Phát triển tính năng mới", mergesInto: "develop" },
  { name: "release/*", type: "Temporary", purpose: "Chuẩn bị release sẵn sàng", mergesInto: "main + develop" },
  { name: "hotfix/*", type: "Temporary", purpose: "Sửa lỗi khẩn cấp trên production", mergesInto: "main + develop" },
];

// ──────────────────── Script lệnh git (string, không thực thi) ────────────────────
interface GitflowCommand {
  phase: string;
  command: string;
  note: string;
}

const GitflowScript: GitflowCommand[] = [
  {
    phase: "Feature",
    command: "git flow feature start payment-gateway",
    note: "Tạo nhánh feature/payment-gateway từ develop",
  },
  { phase: "Feature", command: "git add . && git commit -m \"feat: tích hợp cổng thanh toán\"", note: "Commit trong nhánh feature" },
  {
    phase: "Feature",
    command: "git flow feature finish payment-gateway",
    note: "Merge feature → develop rồi xóa nhánh feature",
  },
  {
    phase: "Release",
    command: "git flow release start 1.1.0",
    note: "Tạo nhánh release/1.1.0 từ develop để freeze & polish",
  },
  { phase: "Release", command: "git flow release finish '1.1.0'", note: "Merge → main (tag v1.1.0) + merge ngược → develop" },
  {
    phase: "Hotfix",
    command: "git flow hotfix start login-bug",
    note: "Tạo nhánh hotfix/login-bug TỪ main (không phải develop)",
  },
  { phase: "Hotfix", command: "git flow hotfix finish '1.0.1'", note: "Merge → main (tag v1.0.1) + merge → develop" },
];

function printGitflowScript(): void {
  console.log("\n📜 SCRIPT — các lệnh git flow (chỉ minh họa bằng chuỗi, không thực thi):\n");
  for (const step of GitflowScript) {
    console.log(`  [${step.phase}]`);
    console.log(`    $ ${step.command}`);
    console.log(`    ↳ ${step.note}`);
  }
}

// ──────────────────── Sơ đồ workflow ────────────────────
function printDiagram(): void {
  console.log("🌿 SƠ ĐỒ WORKFLOW GIT FLOW:\n");
  console.log("                 ┌───────────┐");
  console.log("                 │   main    │  ← tags: v1.0.0, v1.1.0, v1.0.1");
  console.log("                 └─────┬─────┘");
  console.log("                       │ merge release/* và hotfix/*");
  console.log("                 ┌─────▼─────┐");
  console.log("                 │  develop  │  ← tích hợp feature");
  console.log("                 └─────┬─────┘");
  console.log("        ┌──────────────┼───────────────┐");
  console.log("   feature/pay     feature/auth    feature/search");
  console.log("        └──────────────┼───────────────┘");
  console.log("                       │ merge feature → develop");
  console.log("                 ┌─────▼─────┐   🔥 bug trên production!");
  console.log("                 │release/1.1│   ┌───────────┐");
  console.log("                 │  (freeze) │   │hotfix/1.0.1│");
  console.log("                 └─────┬─────┘   └─────┬─────┘");
  console.log("                       │                │ (từ main, không phải develop)");
  console.log("                       ▼                ▼");
  console.log("                   main (v1.1.0)    main (v1.0.1)");
  console.log("");
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== Git Flow Demo ===");
console.log("In ra mô hình nhánh + chuỗi lệnh git minh họa.\n");

printDiagram();

console.log("📚 CÁC NHÁNH:");
for (const b of GitflowBranches) {
  const badge = b.type === "Permanent" ? "🔒 vĩnh viễn" : "🔨 tạm thời";
  console.log(`  • ${b.name.padEnd(12)} [${badge}] → ${b.purpose}`);
  if (b.mergesInto !== "—") console.log(`      merge vào: ${b.mergesInto}`);
}

printGitflowScript();

console.log("\n✅ Git Flow: main/develop cố định + feature, release, hotfix có vòng đời rõ ràng");
export {};