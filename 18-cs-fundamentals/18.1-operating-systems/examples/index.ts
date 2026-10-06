/**
 * 18.1 Operating Systems — mô phỏng FCFS vs Round-Robin vs SJF scheduling
 * + phát hiện deadlock bằng chu trình đồ thị wait-for. Logic thuần, không phải kernel thật.
 */

export {};

interface Proc {
  id: string;
  burst: number;
}

/** FCFS: ai đến trước chạy trước — đơn giản nhưng process ngắn kẹt sau process dài */
function fcfs(procs: Proc[]): string[] {
  return procs.map((p) => `${p.id} chạy ${p.burst}ms`);
}

/** Round-Robin: mỗi process chạy 1 quantum rồi xếp cuối hàng — công bằng, chống đói CPU */
function roundRobin(procs: Proc[], quantum: number): string[] {
  const queue = procs.map((p) => ({ ...p, remaining: p.burst }));
  const order: string[] = [];
  while (queue.length > 0) {
    const cur = queue.shift() as { id: string; burst: number; remaining: number };
    const run = Math.min(quantum, cur.remaining);
    cur.remaining -= run;
    order.push(`${cur.id} chạy ${run}ms (còn ${cur.remaining}ms)`);
    if (cur.remaining > 0) queue.push(cur);
  }
  return order;
}

/** SJF (non-preemptive): job ngắn nhất trước — thời gian chờ trung bình tối ưu */
function sjf(procs: Proc[]): string[] {
  return [...procs]
    .sort((a, b) => a.burst - b.burst)
    .map((p) => `${p.id} chạy ${p.burst}ms`);
}

/** Thời gian chờ trung bình nếu chạy theo thứ tự đã cho (arrival = 0) */
function avgWaitingTime(order: Proc[]): number {
  let elapsed = 0;
  let total = 0;
  for (const p of order) {
    total += elapsed;
    elapsed += p.burst;
  }
  return order.length === 0 ? 0 : total / order.length;
}

/** Phát hiện deadlock: đồ thị wait-for có chu trình → deadlock (DFS) */
function hasDeadlock(waitFor: Map<string, string[]>): boolean {
  const visited = new Set<string>();
  const stack = new Set<string>();
  function dfs(node: string): boolean {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    for (const next of waitFor.get(node) ?? []) {
      if (dfs(next)) return true;
    }
    stack.delete(node);
    return false;
  }
  for (const node of waitFor.keys()) {
    if (dfs(node)) return true;
  }
  return false;
}

function main(): void {
  console.log("=== 18.1 Operating Systems Demo ===");
  console.log("");

  const procs: Proc[] = [
    { id: "P1", burst: 10 },
    { id: "P2", burst: 2 },
    { id: "P3", burst: 4 },
  ];
  console.log("Processes: P1=10ms, P2=2ms, P3=4ms (đều đến lúc t=0)");
  console.log("");

  console.log("1. FCFS (đến trước chạy trước):");
  fcfs(procs).forEach((l) => console.log(`   ${l}`));
  console.log(`   Thời gian chờ TB: ${avgWaitingTime(procs).toFixed(1)}ms (P2, P3 kẹt sau P1 dài)`);
  console.log("");

  console.log("2. Round-Robin (quantum=3ms):");
  roundRobin(procs, 3).forEach((l) => console.log(`   ${l}`));
  console.log("");

  console.log("3. SJF (ngắn nhất trước):");
  const sjfOrder = [...procs].sort((a, b) => a.burst - b.burst);
  sjf(procs).forEach((l) => console.log(`   ${l}`));
  console.log(`   Thời gian chờ TB: ${avgWaitingTime(sjfOrder).toFixed(1)}ms (tối ưu khi arrival=0)`);
  console.log("");

  console.log("4. Deadlock detection:");
  const deadlocked = new Map<string, string[]>([
    ["P1", ["P2"]],
    ["P2", ["P1"]],
  ]);
  const healthy = new Map<string, string[]>([
    ["P1", ["P2"]],
    ["P2", []],
  ]);
  console.log(`   P1 ⇄ P2 (giữ chéo lock) → deadlock? ${hasDeadlock(deadlocked) ? "⛔ CÓ" : "✅ không"}`);
  console.log(`   P1 → P2, P2 xong → deadlock? ${hasDeadlock(healthy) ? "⛔ CÓ" : "✅ không"}`);
  console.log("");
  console.log("✅ Scheduler mô phỏng + phát hiện deadlock hoạt động");
}

main();
