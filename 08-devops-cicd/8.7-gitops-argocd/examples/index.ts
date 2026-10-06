/**
 * 8.7 GitOps ArgoCD — desired vs actual state, mô phỏng reconciler
 *
 * Minh họa vòng lặp GitOps:
 * - InSync: Git == cluster → không làm gì.
 * - Git đổi (PR merge) → auto-sync lên cluster.
 * - Ai đó sửa tay trên cluster (drift) → reconciler tự phục hồi.
 * - Rollback = git revert → sync lại.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
interface Workload {
  image: string;
  replicas: number;
}

function fmt(w: Workload): string {
  return `${w.image} × ${w.replicas}`;
}

function diff(desired: Workload, actual: Workload): string[] {
  const changes: string[] = [];
  if (desired.image !== actual.image) {
    changes.push(`image: ${actual.image} → ${desired.image}`);
  }
  if (desired.replicas !== actual.replicas) {
    changes.push(`replicas: ${actual.replicas} → ${desired.replicas}`);
  }
  return changes;
}

function statusOf(desired: Workload, actual: Workload): string {
  return diff(desired, actual).length === 0 ? "InSync ✅" : "OutOfSync ⚠️";
}

// Reconciler: cluster luôn hội tụ về Git
function reconcile(desired: Workload, actual: Workload): Workload {
  const changes = diff(desired, actual);
  if (changes.length === 0) return actual;
  console.log(`   🔄 sync: ${changes.join("; ")}`);
  return { ...desired };
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== GitOps Reconciler Demo ===\n");

  let git: Workload = { image: "web:v1", replicas: 3 };
  let cluster: Workload = { image: "web:v1", replicas: 3 };

  console.log(`1️⃣ Ban đầu: Git=[${fmt(git)}] Cluster=[${fmt(cluster)}] → ${statusOf(git, cluster)}`);

  console.log("\n2️⃣ Dev merge PR (v2, scale 5) → ArgoCD auto-sync:");
  git = { image: "web:v2", replicas: 5 };
  console.log(`   Git=[${fmt(git)}] Cluster=[${fmt(cluster)}] → ${statusOf(git, cluster)}`);
  cluster = reconcile(git, cluster);
  console.log(`   sau sync: Cluster=[${fmt(cluster)}] → ${statusOf(git, cluster)}`);

  console.log("\n3️⃣ Ai đó kubectl scale tay 2 (drift):");
  cluster = { ...cluster, replicas: 2 };
  console.log(`   Git=[${fmt(git)}] Cluster=[${fmt(cluster)}] → ${statusOf(git, cluster)}`);
  cluster = reconcile(git, cluster);
  console.log(`   self-heal: Cluster=[${fmt(cluster)}] → ${statusOf(git, cluster)}`);

  console.log("\n4️⃣ Rollback: git revert về v1 → sync lại:");
  git = { image: "web:v1", replicas: 3 };
  cluster = reconcile(git, cluster);
  console.log(`   Git=[${fmt(git)}] Cluster=[${fmt(cluster)}] → ${statusOf(git, cluster)}`);

  console.log("\n✅ Bài học: Git là sự thật duy nhất; reconciler biến mọi drift thành hội tụ tự động.");
}

main();

export {};
