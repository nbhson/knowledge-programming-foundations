/**
 * 6.6 Graph Algorithms — Thuật Toán Đồ Thị
 * Demo: BFS vs DFS, Dijkstra đường ngắn nhất,
 * Topological sort lịch học, Union-Find gom nhóm.
 */

export {};

type Adj = Map<string, string[]>;
type Weighted = Map<string, Array<{ to: string; w: number }>>;

function bfs(adj: Adj, start: string): string[] {
  const visited = new Set<string>([start]);
  const queue: string[] = [start];
  const order: string[] = [];
  while (queue.length > 0) {
    const v = queue.shift()!;
    order.push(v);
    for (const nb of adj.get(v) ?? []) {
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push(nb);
      }
    }
  }
  return order;
}

function dfs(adj: Adj, start: string): string[] {
  const visited = new Set<string>();
  const order: string[] = [];
  function visit(v: string): void {
    visited.add(v);
    order.push(v);
    for (const nb of adj.get(v) ?? []) {
      if (!visited.has(nb)) visit(nb);
    }
  }
  visit(start);
  return order;
}

function dijkstra(graph: Weighted, start: string): Map<string, number> {
  const dist = new Map<string, number>();
  const visited = new Set<string>();
  for (const v of graph.keys()) dist.set(v, Infinity);
  dist.set(start, 0);
  while (true) {
    let u: string | null = null;
    let best = Infinity;
    for (const v of graph.keys()) {
      if (!visited.has(v) && dist.get(v)! < best) {
        best = dist.get(v)!;
        u = v;
      }
    }
    if (u === null) break;
    visited.add(u);
    for (const { to, w } of graph.get(u) ?? []) {
      const nd = dist.get(u)! + w;
      if (nd < dist.get(to)!) dist.set(to, nd);
    }
  }
  return dist;
}

function topoSort(adj: Adj): string[] | null {
  const indeg = new Map<string, number>();
  for (const v of adj.keys()) indeg.set(v, 0);
  for (const [, nbs] of adj) {
    for (const nb of nbs) indeg.set(nb, (indeg.get(nb) ?? 0) + 1);
  }
  const queue: string[] = [...indeg].filter(([, d]) => d === 0).map(([v]) => v);
  const order: string[] = [];
  while (queue.length > 0) {
    const v = queue.shift()!;
    order.push(v);
    for (const nb of adj.get(v) ?? []) {
      indeg.set(nb, indeg.get(nb)! - 1);
      if (indeg.get(nb) === 0) queue.push(nb);
    }
  }
  return order.length === adj.size ? order : null;
}

class UnionFind {
  private parent: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a: number, b: number): void {
    this.parent[this.find(a)] = this.find(b);
  }
  connected(a: number, b: number): boolean {
    return this.find(a) === this.find(b);
  }
}

function main(): void {
  console.log("=== 6.6 Graph Algorithms Demo ===");
  console.log("");

  // Đồ thị vô hướng: A nối B, C; B/C nối D; D nối E
  const adj: Adj = new Map([
    ["A", ["B", "C"]],
    ["B", ["A", "D"]],
    ["C", ["A", "D"]],
    ["D", ["B", "C", "E"]],
    ["E", ["D"]],
  ]);
  console.log("📌 Đồ thị: A—B, A—C, B—D, C—D, D—E");
  console.log(`   BFS("A") = [${bfs(adj, "A")}] (lan theo tầng → đường ngắn nhất unweighted)`);
  console.log(`   DFS("A") = [${dfs(adj, "A")}] (đi sâu trước → hợp phát hiện cycle/topo)`);
  console.log("");

  // Đồ thị có trọng số: bản đồ mini
  const weighted: Weighted = new Map([
    ["A", [{ to: "B", w: 4 }, { to: "C", w: 2 }]],
    ["B", [{ to: "D", w: 5 }]],
    ["C", [{ to: "B", w: 1 }, { to: "D", w: 8 }]],
    ["D", []],
  ]);
  const dist = dijkstra(weighted, "A");
  console.log("🗺️  Dijkstra từ A (A→B:4, A→C:2, C→B:1, B→D:5, C→D:8):");
  for (const [v, d] of dist) console.log(`   dist(A→${v}) = ${d}`);
  console.log("   → A→B tối ưu là A→C→B = 3 (không phải cạnh trực tiếp 4)");
  console.log("");

  // Topological sort: lịch học
  const courses: Adj = new Map([
    ["Intro", ["DataStructures"]],
    ["DataStructures", ["Algorithms"]],
    ["Algorithms", ["SystemDesign"]],
    ["Math", ["Algorithms"]],
    ["SystemDesign", []],
  ]);
  const order = topoSort(courses);
  console.log("🎓 Topological sort lịch học (Intro→DS→Algo→SD, Math→Algo):");
  console.log(`   Thứ tự hợp lệ: [${order}]`);
  const cyclic: Adj = new Map([
    ["A", ["B"]],
    ["B", ["C"]],
    ["C", ["A"]],
  ]);
  console.log(`   Đồ thị có cycle A→B→C→A: topo = ${topoSort(cyclic)} (null = không xếp được)`);
  console.log("");

  // Union-Find: gom nhóm bạn bè
  const uf = new UnionFind(5); // 0..4
  uf.union(0, 1);
  uf.union(1, 2);
  uf.union(3, 4);
  console.log("🤝 Union-Find (nhóm {0,1,2} và {3,4}):");
  console.log(`   0↔2 connected? ${uf.connected(0, 2)} (cùng nhóm)`);
  console.log(`   0↔3 connected? ${uf.connected(0, 3)} (khác nhóm)`);
  console.log(`   3↔4 connected? ${uf.connected(3, 4)} (cùng nhóm)`);
  console.log("");

  console.log("✅ Kết luận: unweighted→BFS, trọng số dương→Dijkstra, cạnh âm→Bellman-Ford, phụ thuộc→topo, gom nhóm→Union-Find.");
}

main();
