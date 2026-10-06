/**
 * 15.9 Monorepo — mô phỏng task graph (topo-sort + affected + phát hiện cycle)
 *
 * Minh họa:
 * - Khai báo phụ thuộc giữa tasks/packages
 * - Xếp tầng topo (Kahn): mỗi tầng chạy song song
 * - affected: đổi 1 package → chỉ build/test những gì phụ thuộc nó
 * - Phát hiện dependency cycle thay vì treo
 *
 * Mọi thao tác đều MÔ PHỎNG trong bộ nhớ (KHÔNG chạy git/nx thật).
 * Không deps ngoài — TS thuần.
 */

class MonoTaskGraph {
  private deps = new Map<string, Set<string>>();

  private ensure(task: string): Set<string> {
    let s = this.deps.get(task);
    if (s === undefined) {
      s = new Set();
      this.deps.set(task, s);
    }
    return s;
  }

  /** task phụ thuộc dep (dep phải xong trước). */
  dependsOn(task: string, dep: string): void {
    this.ensure(task).add(dep);
    this.ensure(dep);
  }

  /** Xếp tầng topo (Kahn): mỗi tầng là các task chạy song song được. */
  levels(): string[][] {
    const indegree = new Map<string, number>();
    const dependents = new Map<string, Set<string>>();
    for (const t of this.deps.keys()) {
      indegree.set(t, 0);
      dependents.set(t, new Set());
    }
    for (const [task, ds] of this.deps) {
      for (const d of ds) {
        indegree.set(task, (indegree.get(task) ?? 0) + 1);
        dependents.get(d)?.add(task);
      }
    }
    const result: string[][] = [];
    let ready = [...this.deps.keys()].filter((t) => (indegree.get(t) ?? 0) === 0);
    while (ready.length > 0) {
      ready.sort();
      result.push(ready);
      const next: string[] = [];
      for (const t of ready) {
        for (const dep of dependents.get(t) ?? []) {
          const left = (indegree.get(dep) ?? 1) - 1;
          indegree.set(dep, left);
          if (left === 0) next.push(dep);
        }
      }
      ready = next;
    }
    const done = result.reduce((n, layer) => n + layer.length, 0);
    if (done !== this.deps.size) {
      const stuck = [...this.deps.keys()].filter(
        (t) => !result.some((layer) => layer.includes(t)),
      );
      throw new Error(`Dependency cycle giữa: ${stuck.join(" ↔ ")}`);
    }
    return result;
  }

  /** Đổi 1 package → lan theo chiều ngược: ai (trực/gián tiếp) phụ thuộc nó đều affected. */
  affectedOf(changed: string): Set<string> {
    const reverse = new Map<string, Set<string>>();
    for (const t of this.deps.keys()) reverse.set(t, new Set());
    for (const [task, ds] of this.deps) {
      for (const d of ds) reverse.get(d)?.add(task);
    }
    const out = new Set<string>([changed]);
    const queue: string[] = [changed];
    while (queue.length > 0) {
      const cur = queue.pop() as string;
      for (const dep of reverse.get(cur) ?? []) {
        if (!out.has(dep)) {
          out.add(dep);
          queue.push(dep);
        }
      }
    }
    return out;
  }
}

function buildAcmeGraph(): MonoTaskGraph {
  const g = new MonoTaskGraph();
  // ui cần utils; web + mobile cần ui; e2e cần web
  g.dependsOn("ui", "utils");
  g.dependsOn("web", "ui");
  g.dependsOn("mobile", "ui");
  g.dependsOn("e2e", "web");
  return g;
}

// ───────────────────────────────── Demo ─────────────────────────────────

function main(): void {
  console.log("=== Monorepo Task Graph Demo (mô phỏng nx/turbo) ===");
  console.log("");

  console.log("1️⃣ Task graph acme (ui→utils, web/mobile→ui, e2e→web) xếp tầng chạy song song:");
  const g = buildAcmeGraph();
  const layers = g.levels();
  layers.forEach((layer, i) => {
    console.log(`  tầng ${i + 1}: [${layer.join(", ")}]${layer.length > 1 ? " ← chạy song song" : ""}`);
  });
  console.log("");

  console.log("2️⃣ Affected — đổi 1 package, chỉ build/test những gì liên quan:");
  const cases: Array<[string, string]> = [
    ["mobile", "sửa màn hình mobile"],
    ["ui", "đổi Button dùng chung"],
    ["utils", "đổi hàm format tiền"],
  ];
  for (const [pkg, label] of cases) {
    const affected = [...g.affectedOf(pkg)].sort();
    console.log(`  đổi ${pkg} (${label}) → affected: [${affected.join(", ")}]`);
  }
  console.log("  💡 đổi mobile chỉ build mobile (1/5) — CI affected tiết kiệm đúng chỗ này");
  console.log("");

  console.log("3️⃣ Cycle — phụ thuộc vòng tròn bị bắt ngay thay vì treo CI:");
  const bad = new MonoTaskGraph();
  bad.dependsOn("a", "b");
  bad.dependsOn("b", "a");
  try {
    bad.levels();
    console.log("  (không mong đợi: cycle lọt qua)");
  } catch (e) {
    console.log(`  ❌ ${(e as Error).message}`);
  }
  console.log("");

  console.log("✅ Monorepo + task graph: 1 repo, build song song theo tầng, đổi đâu chạy đó.");
}

main();
export {};
