/**
 * 8.3 Jenkins — Jenkinsfile (Pipeline as Code) + mô phỏng chạy pipeline
 *
 * Minh họa:
 * - Nội dung Jenkinsfile Declarative (Groovy) dạng string.
 * - Các stage: Install → Lint → Test → Build → Deploy.
 * - Mô phỏng agent chạy từng stage và ghi nhận kết quả realtime.
 */

// ──────────────────── Jenkinsfile dạng string ────────────────────
const JenkinsJenkinsfile = `
// Jenkinsfile — Declarative Pipeline
pipeline {
    agent any                                        // Chạy trên bất kỳ agent khả dụng
    environment {
        NODE_ENV   = 'ci'
        APP_NAME   = 'my-app'
    }
    stages {
        stage('Install') {                           // Cài dependency
            steps { sh 'npm ci' }
        }
        stage('Lint & Type Check') {                 // Kiểm tra tĩnh
            steps {
                sh 'npm run lint'
                sh 'npx tsc --noEmit'
            }
        }
        stage('Test') {                              // Chạy test
            steps { sh 'npm test -- --coverage' }
        }
        stage('Build') {                             // Build artifact
            steps { sh 'npm run build' }
        }
        stage('Deploy') {                            // Triển khai (có cổng phê duyệt)
            when { branch 'main' }
            steps {
                input message: 'Deploy production?', ok: 'Deploy'
                sh './deploy.sh'
            }
        }
    }
    post {
        always  { echo 'Dọn dẹp workspace' }
        success { echo '🚀 Pipeline thành công!' }
        failure { echo '💥 Pipeline thất bại!' }
    }
}
`;

// ──────────────────── Mô hình stage ────────────────────
interface JenkinsStage {
  name: string;
  command: string;
  note: string;
}

const JenkinsStages: JenkinsStage[] = [
  { name: "Install", command: "npm ci", note: "cài dependency chính xác theo lockfile" },
  { name: "Lint & Type Check", command: "npm run lint && npx tsc --noEmit", note: "phát hiện lỗi tĩnh sớm" },
  { name: "Test", command: "npm test -- --coverage", note: "chạy unit test + ghi coverage" },
  { name: "Build", command: "npm run build", note: "tạo artifact production" },
  { name: "Deploy", command: "./deploy.sh", note: "có input() — cần người phê duyệt" },
];

// ──────────────────── Mô phỏng chạy pipeline ────────────────────
class JenkinsPipelineRunner {
  private results: { name: string; ok: boolean }[] = [];

  private async run(sh: string): Promise<boolean> {
    // Giả lập thời gian thực thi lệnh sh
    await new Promise((resolve) => setTimeout(resolve, 20));
    return true;
  }

  async execute(): Promise<void> {
    console.log("🏭 AGENT nhận job, bắt đầu pipeline...\n");
    for (const stage of JenkinsStages) {
      const ok = await this.run(stage.command);
      this.results.push({ name: stage.name, ok });
      console.log(`  ${ok ? "✅" : "❌"} stage [${stage.name}]: sh '${stage.command}'`);
      console.log(`     ↳ ${stage.note}`);
    }
  }

  summary(): void {
    const okCount = this.results.filter((r) => r.ok).length;
    console.log(`\n  📊 ${okCount}/${this.results.length} stage PASS`);
    console.log("  post→always: dọn dẹp | post→success: 🚀 | post→failure: 💥");
  }
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== Jenkins Pipeline Demo ===");
console.log("Jenkinsfile (Pipeline as Code) + mô phỏng chạy pipeline.\n");

console.log("📄 JENKINSFILE (string, không thực thi):");
console.log("```groovy" + JenkinsJenkinsfile + "```\n");

const runner = new JenkinsPipelineRunner();
runner.execute().then(() => {
  runner.summary();
  console.log("\n✅ Jenkins: pipeline định nghĩa trong code (version-controlled) với stage + post action");
});

export {};