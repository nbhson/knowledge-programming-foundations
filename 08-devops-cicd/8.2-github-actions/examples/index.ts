/**
 * 8.2 GitHub Actions — Workflow YAML + giải thích từng section + mô phỏng pipeline
 *
 * Minh họa:
 * - File workflow YAML ở dạng chuỗi (string) — KHÔNG thực thi GitHub.
 * - Giải thích từng section: name → on → env → jobs → steps.
 * - Mô phỏng chạy pipeline: từng bước được in ra theo đúng thứ tự.
 */

// ──────────────────── Workflow YAML dạng string ────────────────────
const GhActionsWorkflowYaml = `
# .github/workflows/ci.yml
name: CI Pipeline                         # Tên hiển thị trên Actions tab
on:                                       # Sự kiện kích hoạt
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
env:                                      # Biến chung toàn workflow
  NODE_ENV: production
jobs:
  build-and-test:
    runs-on: ubuntu-latest                # Runner ảo chạy job
    steps:
      - uses: actions/checkout@v4         # Bước 1: lấy source
      - uses: actions/setup-node@v4       # Bước 2: cài Node
        with:
          node-version: '20'
      - run: npm ci                       # Bước 3: cài dependency
      - run: npm run lint                 # Bước 4: lint
      - run: npm test                     # Bước 5: chạy test
`;

// ──────────────────── Giải thích từng section ────────────────────
interface GhActionsSection {
  keyword: string;
  explanation: string;
}

const GhActionsSections: GhActionsSection[] = [
  { keyword: "name", explanation: "Tên workflow hiển thị trên tab Actions" },
  { keyword: "on", explanation: "Sự kiện trigger: push, pull_request, workflow_dispatch, schedule, release" },
  { keyword: "env", explanation: "Biến môi trường dùng chung cho mọi job/step" },
  { keyword: "jobs", explanation: "Danh sách các job chạy song song, mỗi job trên 1 runner riêng" },
  { keyword: "runs-on", explanation: "Loại máy ảo chạy job (ubuntu-latest, windows-latest, self-hosted...)" },
  { keyword: "steps", explanation: "Các bước tuần tự trong job: uses (action) hoặc run (lệnh shell)" },
  { keyword: "uses", explanation: "Gọi lại 1 action có sẵn từ GitHub Marketplace (actions/checkout@v4)" },
  { keyword: "run", explanation: "Chạy lệnh trong shell: npm ci, npm test..." },
];

// ──────────────────── Mô phỏng pipeline chạy ────────────────────
interface GhActionsStep {
  id: number;
  label: string;
  detail: string;
}

const GhActionsPipeline: GhActionsStep[] = [
  { id: 1, label: "Checkout repository", detail: "actions/checkout@v4 — pull source code về runner" },
  { id: 2, label: "Setup Node.js 20", detail: "actions/setup-node@v4 — cài Node + cache npm" },
  { id: 3, label: "Install dependencies", detail: "npm ci — cài chính xác theo package-lock.json" },
  { id: 4, label: "Lint code", detail: "npm run lint — bắt code smell từ sớm" },
  { id: 5, label: "Run unit tests", detail: "npm test — đảm bảo logic đúng" },
  { id: 6, label: "Build", detail: "npm run build — tạo artifact production" },
];

async function ghRunPipeline(): Promise<void> {
  console.log("\n🏃 MÔ PHỎNG: runner đang chạy workflow CI\n");
  for (const step of GhActionsPipeline) {
    // Giả lập thời gian chạy của 1 bước
    await new Promise((resolve) => setTimeout(resolve, 25));
    console.log(`  ${step.id}. ${step.label.padEnd(22)} ✅  ${step.detail}`);
  }
  console.log("\n  🎉 Pipeline PASS — code an toàn để merge vào main!");
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== GitHub Actions Demo ===");
console.log("Workflow CI dạng YAML + giải thích + pipeline mô phỏng.\n");

console.log("📄 FILE WORKFLOW (string, không thực thi):");
console.log("```yaml" + GhActionsWorkflowYaml + "```\n");

console.log("📚 GIẢI THÍCH TỪNG SECTION:");
for (const s of GhActionsSections) {
  console.log(`  • ${s.keyword.padEnd(10)} → ${s.explanation}`);
}

ghRunPipeline().then(() => {
  console.log("\n✅ GitHub Actions: YAML declarative, tích hợp sẵn trigger + runner");
});

export {};