/**
 * 5.11.4 Feature Flags — Toggle Matrix + Canary + Gradual Rollout Demo
 *
 * Mô phỏng feature flag service bằng TS thuần:
 *   - Toggle matrix : trạng thái flag theo từng môi trường
 *   - Canary rollout: bật cho % user (dựa trên hash userId, deterministic)
 *   - Targeted release: nhóm internal dùng sớm hơn
 *   - Kill switch   : tắt gấp không cần redeploy
 *
 * KHÔNG dùng lib ngoài, tránh Math.random để demo deterministic.
 */

// ─────────────────────────── Cấu hình flag ───────────────────────────

type FlagEnv = "dev" | "staging" | "prod";

interface FlagConfig {
  name: string;
  // % user được bật flag (0–100) ở mỗi môi trường
  rollout: Record<FlagEnv, number>;
  // user id được ưu tiên bật — mô phỏng targeted release
  allowlist: string[];
}

interface FlagMatrixRow {
  flag: string;
  dev: string;
  staging: string;
  prod: string;
}

// ─────────────────────────── Feature Flag Service ───────────────────────────

class FeatureFlagService {
  constructor(private readonly flags: readonly FlagConfig[]) {}

  // Deterministic hash từ userId → 0..99, ổn định giữa các lần gọi
  private bucketOf(userId: string): number {
    let hash = 0;
    for (const ch of userId) {
      hash = (hash * 31 + ch.charCodeAt(0)) % 100;
    }
    return hash;
  }

  isEnabled(flagName: string, userId: string, env: FlagEnv): boolean {
    const flag = this.flags.find((f) => f.name === flagName);
    if (!flag) return false;

    // Kill switch: rollout = 0 → ai cũng tắt
    const pct = flag.rollout[env];
    if (pct >= 100) return true;
    if (pct <= 0) return flag.allowlist.includes(userId);

    // Canary: trong nhóm % được chọn (hoặc trong allowlist)
    return this.bucketOf(userId) < pct || flag.allowlist.includes(userId);
  }

  enable(flagName: string, env: FlagEnv, newPct: number): void {
    const flag = this.flags.find((f) => f.name === flagName);
    if (flag) flag.rollout[env] = newPct;
  }

  // Bảng trạng thái theo % rollout
  matrix(): FlagMatrixRow[] {
    return this.flags.map((f) => ({
      flag: f.name,
      dev: `${f.rollout.dev}%`,
      staging: `${f.rollout.staging}%`,
      prod: `${f.rollout.prod}%`,
    }));
  }
}

// ─────────────────────────── Rollout helper ───────────────────────────

class CanaryRollout {
  // Đếm số user bật khi tăng dần % — mô phỏng gradual rollout
  static enabledUsers(service: FeatureFlagService, flag: string, userIds: string[], env: FlagEnv): number {
    return userIds.filter((u) => service.isEnabled(flag, u, env)).length;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

const USER_POOL = Array.from({ length: 10 }, (_, i) => `user-${i + 1}`);

function run(): void {
  console.log("=== FeatureFlagService Demo ===");
  console.log("");

  const service = new FeatureFlagService([
    { name: "new-checkout", rollout: { dev: 100, staging: 50, prod: 0 }, allowlist: [] },
    { name: "dark-mode", rollout: { dev: 100, staging: 100, prod: 5 }, allowlist: ["user-1"] },
    { name: "beta-api", rollout: { dev: 100, staging: 10, prod: 0 }, allowlist: ["user-3", "user-7"] },
  ]);

  console.log("1️⃣ Toggle matrix theo môi trường:");
  const matrix = service.matrix();
  for (const row of matrix) {
    console.log(`  ${row.flag.padEnd(12)} | dev ${row.dev.padEnd(5)} | staging ${row.staging.padEnd(5)} | prod ${row.prod.padEnd(5)}`);
  }
  console.log("");

  console.log("2️⃣ Targeted release — 'beta-api' chỉ cho user-3, user-7 ở dev:");
  for (const u of ["user-3", "user-7", "user-4"]) {
    console.log(`  beta-api isEnabled(${u}, dev) = ${service.isEnabled("beta-api", u, "dev")}`);
  }
  console.log("");

  console.log("3️⃣ Canary 5% → 50% → 100% trên 'dark-mode' (prod):");
  const progress = [5, 50, 100];
  for (const pct of progress) {
    service.enable("dark-mode", "prod", pct);
    const count = CanaryRollout.enabledUsers(service, "dark-mode", USER_POOL, "prod");
    console.log(`  rollout=${pct}% → ${count}/${USER_POOL.length} users bật: [${USER_POOL.filter((u) => service.isEnabled("dark-mode", u, "prod")).join(", ")}]`);
  }
  console.log("");

  console.log("4️⃣ Kill switch — tắt 'new-checkout' ngay tại prod không cần redeploy:");
  service.enable("new-checkout", "prod", 0);
  console.log(`  new-checkout isEnabled(user-1, prod) = ${service.isEnabled("new-checkout", "user-1", "prod")}`);
  service.enable("new-checkout", "prod", 100);
  console.log(`  Sau khi bật lại 100% → isEnabled = ${service.isEnabled("new-checkout", "user-1", "prod")}`);
  console.log("");

  console.log("✅ Feature flags: toggle matrix + canary % + targeted list + kill switch — đổi hành vi không redeploy");
}

run();
export {};