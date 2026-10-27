/**
 * 15.8 Trunk-Based Development — mô phỏng trunk vs feature branch sống lâu
 *
 * Minh họa:
 * - Team trunk: commit nhỏ mỗi ngày + feature flag che tính năng dở → merge êm
 * - Team branch dài: 1 branch sống 5 ngày → merge conflict, release nghẽn
 * - Feature flag tối giản: canary % + allowlist + kill switch
 *
 * Mọi thao tác đều MÔ PHỎNG trong bộ nhớ (KHÔNG chạy git thật).
 * Không deps ngoài — TS thuần.
 */

type TbEnv = "dev" | "prod";

// ─────────────────────────── Feature flag tối giản ───────────────────────────

class TrunkFlag {
  private enabledPct = 0;
  private allowlist = new Set<string>();
  private killed = false;

  constructor(
    private readonly name: string,
    private readonly totalCommits = 0,
  ) {}

  setRollout(pct: number): void {
    this.enabledPct = pct;
  }

  allow(userId: string): void {
    this.allowlist.add(userId);
  }

  kill(): void {
    this.killed = true;
  }

  isEnabled(userId: string, env: TbEnv): boolean {
    if (this.killed) return false;
    if (env === "dev") return true;
    if (this.allowlist.has(userId)) return true;
    return this.bucket(userId) < this.enabledPct;
  }

  /** Hash ổn định userId → bucket 0..99 (không dùng random để demo lặp lại được). */
  private bucket(userId: string): number {
    let h = 0;
    for (const ch of userId) h = (h * 31 + ch.charCodeAt(0)) % 100;
    return h;
  }

  describe(): string {
    if (this.killed) return `${this.name}: KILLED ⛔ (tắt khẩn cấp)`;
    return `${this.name}: rollout ${this.enabledPct}% + allowlist [${[...this.allowlist].join(", ") || "rỗng"}]`;
  }
}

// ─────────────────────────── Mô phỏng trunk ───────────────────────────

interface TrunkCheck {
  ok: boolean;
  message: string;
}

/** Quy ước trunk: branch sống quá 1 "ngày" mô phỏng là vi phạm (> 24h). */
class TrunkSim {
  private trunkCommits = 0;
  private opened = new Map<string, number>();
  private trunkGreen = true;

  /** Commit thẳng lên trunk — tính năng dở phải kèm flag che. */
  commitDirect(day: number, label: string, flagGated: boolean, unfinished: boolean): TrunkCheck {
    this.trunkCommits++;
    if (unfinished && !flagGated) {
      this.trunkGreen = false;
      return { ok: false, message: `ngày ${day}: "${label}" dở dang KHÔNG flag → trunk ĐỎ 🔴 (cả team nghẽn)` };
    }
    return { ok: true, message: `ngày ${day}: "${label}" → trunk #${this.trunkCommits} ✅ xanh` };
  }

  openBranch(name: string, day: number): void {
    this.opened.set(name, day);
  }

  /** Merge branch: sống càng lâu, trunk đã đi càng xa → conflict. */
  mergeBranch(name: string, day: number): TrunkCheck {
    const since = this.opened.get(name) ?? day;
    const lived = day - since;
    this.opened.delete(name);
    if (lived <= 1) {
      this.trunkCommits++;
      return { ok: true, message: `"${name}" sống ${lived} ngày → merge êm ✅ (trunk #${this.trunkCommits})` };
    }
    return {
      ok: false,
      message: `"${name}" sống ${lived} ngày → CONFLICT ⚠️ (trunk đã tiến ${lived * 3} commits, resolve tay)`,
    };
  }

  status(): string {
    return `trunk: ${this.trunkCommits} commits, trạng thái ${this.trunkGreen ? "xanh ✅ releasable" : "đỏ 🔴 nghẽn"}`;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function main(): void {
  console.log("=== Trunk-Based vs Feature Branch Dài (mô phỏng 5 ngày) ===");
  console.log("");

  console.log("1️⃣ Team TRUNK — commit nhỏ mỗi ngày, tính năng dở che bằng flag:");
  const trunk = new TrunkSim();
  const checkoutFlag = new TrunkFlag("new-checkout");
  checkoutFlag.allow("beta-anna");
  const trunkLog: TrunkCheck[] = [
    trunk.commitDirect(1, "refactor giỏ hàng", false, false),
    trunk.commitDirect(2, "new-checkout (dở, che bằng flag)", true, true),
    trunk.commitDirect(3, "fix fees tính sai", false, false),
    trunk.commitDirect(4, "new-checkout (xong 80%, vẫn che)", true, true),
    trunk.commitDirect(5, "mở flag new-checkout 10% canary", true, false),
  ];
  for (const c of trunkLog) console.log(`  ${c.ok ? "✅" : "❌"} ${c.message}`);
  checkoutFlag.setRollout(10);
  console.log(`  🚩 ${checkoutFlag.describe()}`);
  console.log(`  👤 beta-anna (allowlist) thấy bản mới: ${checkoutFlag.isEnabled("beta-anna", "prod")}`);
  console.log(`  👤 user-42 (ngoài canary hầu hết): ${checkoutFlag.isEnabled("user-42", "prod") ? "thấy mới" : "thấy cũ ổn định"}`);
  console.log(`  → ${trunk.status()}`);
  console.log("");

  console.log("2️⃣ Team BRANCH DÀI — 1 feature branch sống 5 ngày mới merge:");
  const flow = new TrunkSim();
  flow.openBranch("feature/big-checkout", 1);
  console.log(`  ngày 1-4: code trên branch riêng, trunk của team khác tiến 12 commits...`);
  flow.commitDirect(2, "team khác: đổi phí ship", false, false);
  flow.commitDirect(3, "team khác: đổi giỏ hàng", false, false);
  flow.commitDirect(4, "team khác: đổi checkout cũ", false, false);
  const merge = flow.mergeBranch("feature/big-checkout", 5);
  console.log(`  ${merge.ok ? "✅" : "❌"} ngày 5: ${merge.message}`);
  console.log("");

  console.log("3️⃣ Kill switch — lỗi production, tắt flag trong giây (không revert deploy):");
  checkoutFlag.setRollout(100);
  console.log(`  🚩 trước sự cố: ${checkoutFlag.describe()}`);
  console.log("  🔥 phát hiện lỗi thanh toán → kill!");
  checkoutFlag.kill();
  console.log(`  🚩 sau kill: ${checkoutFlag.describe()}`);
  console.log(`  👤 beta-anna thấy bản mới: ${checkoutFlag.isEnabled("beta-anna", "prod")} (đã che lại)`);
  console.log("");

  console.log("✅ Trunk-Based: branch < 24h + flag che tính năng dở + CI xanh = release bất kỳ lúc nào.");
}

main();
export {};
