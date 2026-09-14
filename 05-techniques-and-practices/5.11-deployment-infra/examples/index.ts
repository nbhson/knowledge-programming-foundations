/**
 * 5.11 Deployment & Infrastructure — Overview Demo
 *
 * Minh họa tổng quan chuỗi đưa app lên production:
 *   - Docker      : build image, chạy container
 *   - Kubernetes  : orchestrate container ở scale
 *   - Serverless  : chạy code không quản lý server (cold start, chi phí)
 *   - Feature Flag: bật/tắt tính năng không cần redeploy
 *
 * KHÔNG dùng lib ngoài — mô phỏng bằng TS thuần.
 */

// ─────────────────────────── Deployment Strategies ───────────────────────────

interface DeployStrategyInfo {
  name: string;
  downtime: string;
  risk: string;
  description: string;
}

class DeployStrategyCatalog {
  private readonly strategies: readonly DeployStrategyInfo[] = [
    { name: "Direct", downtime: "Có (khi restart)", risk: "Cao", description: "Deploy thẳng lên server chạy sẵn" },
    { name: "Blue-Green", downtime: "Gần 0", risk: "Thấp", description: "2 môi trường, chuyển traffic cái rụp" },
    { name: "Canary", downtime: "0", risk: "Rất thấp", description: "Cho 10% user trước, tăng dần" },
    { name: "Feature Flag", downtime: "0", risk: "Thấp nhất", description: "Toggle tính năng ngay khi đang chạy" },
  ];

  all(): readonly DeployStrategyInfo[] {
    return this.strategies;
  }

  // Gợi ý chiến lược nguy cơ thấp nhất
  safest(): string {
    return this.strategies[this.strategies.length - 1].name;
  }
}

// ─────────────────────────── Pipelines ───────────────────────────

interface DeployStage {
  name: string;
  tool: string;
  durationMinutes: number;
}

class DeployPipeline {
  constructor(private readonly stages: readonly DeployStage[]) {}

  totalTime(): number {
    return this.stages.reduce((sum, s) => sum + s.durationMinutes, 0);
  }

  run(): void {
    console.log("  Các giai đoạn pipeline:");
    for (const stage of this.stages) {
      console.log(`    🛠️  ${stage.name.padEnd(14)} (${stage.tool}) — ${stage.durationMinutes} phút`);
    }
    console.log(`  ⏱️  Tổng thời gian: ${this.totalTime()} phút`);
  }
}

// ─────────────────────────── Rollout percentage ───────────────────────────

class DeployRollout {
  // Tăng dần % traffic cho phiên bản mới — mô phỏng canary
  static steps(fromPercent: number, toPercent: number, step: number): number[] {
    const steps: number[] = [];
    for (let v = fromPercent; v <= toPercent; v += step) {
      steps.push(v);
    }
    return steps;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== Deployment & Infra Demo ===");
  console.log("");

  console.log("1️⃣ Chiến lược deploy — rủi ro & downtime:");
  const catalog = new DeployStrategyCatalog();
  for (const s of catalog.all()) {
    console.log(`  ${s.name.padEnd(14)} | downtime ${s.downtime.padEnd(8)} | risk ${s.risk.padEnd(10)} | ${s.description}`);
  }
  console.log(`  → An toàn nhất cho production: ${catalog.safest()}`);
  console.log("");

  console.log("2️⃣ Pipeline đưa code lên production:");
  const pipeline = new DeployPipeline([
    { name: "Build", tool: "Docker", durationMinutes: 5 },
    { name: "Test", tool: "CI", durationMinutes: 8 },
    { name: "Push image", tool: "Registry", durationMinutes: 2 },
    { name: "Deploy", tool: "Kubernetes/Serverless", durationMinutes: 3 },
    { name: "Monitor", tool: "Observability", durationMinutes: 10 },
  ]);
  pipeline.run();
  console.log("");

  console.log("3️⃣ Canary rollout — traffic phiên bản mới tăng dần:");
  const roll = DeployRollout.steps(10, 100, 30);
  const featured = roll.map((p) => (p === 100 ? "100% ✓" : `${p}%`)).join(" → ");
  console.log(`  ${featured}`);
  console.log("  (mỗi bậc đều track health trước khi tăng tiếp)");
  console.log("");

  console.log("4️⃣ Feature Flag — kill switch không cần redeploy:");
  console.log("  0%  (tắt)  → 10% (canary) → 50% → 100% (tăng dần) → OFF (rollback tức thì)");
  console.log("");

  console.log("✅ Deployment & Infra: Docker/K8s/Serverless đưa code lên production + feature flag kiểm soát rủi ro");
}

run();
export {};