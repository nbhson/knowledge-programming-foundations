# 🕸️ 6.6 Graph Algorithms (Thuật Toán Đồ Thị)

> **Mọi mối quan hệ đều là graph** — bạn bè, đường đi, dependencies, network. Biết duyệt graph là biết đi khắp thế giới dữ liệu.

---

## 🎯 Vấn đề

Array và tree chỉ mô hình được quan hệ **tuyến tính / phân cấp**. Thực tế đầy quan hệ **nhiều-nhiều có chu trình**: mạng xã hội, bản đồ đường đi, npm dependencies, lịch thi (môn A phải học trước môn B). Không có graph algorithms, bạn không thể:

- Tìm đường đi ngắn nhất (Google Maps, game AI).
- Phát hiện deadlock / circular dependency (`npm install` treo vì A → B → A).
- Sắp xếp công việc theo thứ tự phụ thuộc (build system, course schedule).
- Gom nhóm liên thông (bạn chung, cluster mạng) nhanh với Union-Find.

---

## 💻 Code ví dụ

### BFS vs DFS — hai cách duyệt nền tảng

```typescript
type Adj = Map<string, string[]>;

// BFS: Queue, theo tầng — đường đi ngắn nhất trên đồ thị KHÔNG trọng số
function bfs(adj: Adj, start: string): string[] {
  const visited = new Set<string>([start]);
  const queue: string[] = [start];
  const order: string[] = [];
  while (queue.length > 0) {
    const v = queue.shift()!;
    order.push(v);
    for (const nb of adj.get(v) ?? []) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
  }
  return order;
}

// DFS: Stack (đệ quy), đi sâu trước — phát hiện cycle, topo sort
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
```

| Tiêu chí | BFS | DFS |
|----------|-----|-----|
| Cấu trúc | Queue | Stack / đệ quy |
| Tìm được | Shortest path (unweighted) | Mọi path, connectivity |
| Memory | O(V) — queue có thể phình to | O(h) — chiều cao đường đi |
| Dùng cho | Routing gần nhất, gợi ý bạn bè | Cycle detection, topo sort, maze |

### Dijkstra — đường ngắn nhất với trọng số không âm

```typescript
type Weighted = Map<string, Array<{ to: string; w: number }>>;

function dijkstra(graph: Weighted, start: string): Map<string, number> {
  const dist = new Map<string, number>();
  const visited = new Set<string>();
  for (const v of graph.keys()) dist.set(v, Infinity);
  dist.set(start, 0);
  // Production: thay scan O(V) bằng MinHeap → O((V+E) log V)
  while (true) {
    let u: string | null = null;
    let best = Infinity;
    for (const v of graph.keys()) {
      if (!visited.has(v) && dist.get(v)! < best) { best = dist.get(v)!; u = v; }
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
```

**Bellman-Ford (khái niệm):** lặp relax mọi cạnh V−1 lần → O(V·E). Chậm hơn Dijkstra nhưng **chịu được cạnh âm và phát hiện chu trình âm** (lần relax thứ V vẫn giảm được = có negative cycle). Dùng trong định giá arbitrage tiền tệ, network routing (RIP).

| Thuật toán | Time | Chịu cạnh âm? | Phát hiện negative cycle? |
|------------|------|---------------|--------------------------|
| BFS | O(V+E) | — (unweighted) | Không |
| Dijkstra (+heap) | O((V+E) log V) | ❌ | ❌ |
| Bellman-Ford | O(V·E) | ✅ | ✅ |

### Topological Sort — xếp thứ tự có phụ thuộc (DAG)

```typescript
// Kahn's algorithm: lặp lấy node in-degree 0
function topoSort(adj: Adj): string[] | null {
  const indeg = new Map<string, number>();
  for (const v of adj.keys()) indeg.set(v, 0);
  for (const [, nbs] of adj) for (const nb of nbs) indeg.set(nb, (indeg.get(nb) ?? 0) + 1);
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
  return order.length === adj.size ? order : null; // null = có cycle
}
// Dùng cho: build order, course schedule, migration, task DAG.
```

### Union-Find (Disjoint Set) — gom nhóm liên thông gần O(1)

```typescript
class UnionFind {
  private parent: number[];
  constructor(n: number) { this.parent = Array.from({ length: n }, (_, i) => i); }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]); // path compression
    return this.parent[x];
  }
  union(a: number, b: number): void { this.parent[this.find(a)] = this.find(b); }
  connected(a: number, b: number): boolean { return this.find(a) === this.find(b); }
}
// α(n) ≈ hằng số (inverse Ackermann). Dùng cho Kruskal MST, đếm islands, friend circles.
```

### 📊 Bảng Complexity

| Thuật toán | Time | Space | Yêu cầu đồ thị |
|------------|------|-------|----------------|
| BFS / DFS | O(V+E) | O(V) | Mọi đồ thị |
| Dijkstra (heap) | O((V+E) log V) | O(V) | Trọng số ≥ 0 |
| Bellman-Ford | O(V·E) | O(V) | Chịu cạnh âm |
| Topo sort (Kahn) | O(V+E) | O(V) | DAG (không cycle) |
| Union-Find | O(α(n)) / op | O(n) | Tập rời nhau |

---

## ✅ Lợi Ích

- **Giải đúng lớp bài toán quan hệ:** shortest path, dependency order, connectivity — array/tree không làm được.
- **Nền tảng system thật:** GPS routing (Dijkstra/A*), OSPF routing, React hooks dependency, spreadsheet recalc, CI build DAG đều là graph.
- **Union-Find là "cheat code":** gom nhóm / kiểm tra liên thông gần O(1), code 15 dòng.

---

## ⚠️ Lưu Ý

- **Dijkstra + cạnh âm = sai.** Chỉ một cạnh âm cũng đủ phá vỡ giả thiết greedy. Nghi ngờ có cạnh âm → Bellman-Ford.
- **DFS đệ quy sâu = stack overflow:** graph hàng chục nghìn node sâu → viết DFS iterative bằng stack tay.
- **Topo sort chỉ tồn tại trên DAG:** nếu có cycle, không có thứ tự nào thỏa mãn — phải báo lỗi thay vì trả về nửa chừng.
- **Adjacency list vs matrix:** đồ thị thưa (real-world) dùng list O(V+E); chỉ dùng matrix khi đồ thị dày và cần check cạnh O(1).

---

## 🎯 Khi nào dùng

| Vấn đề | Thuật toán gợi ý | Vì sao |
|--------|------------------|--------|
| Đường ngắn nhất, cạnh bằng nhau | BFS | Lan theo tầng = số cạnh ít nhất |
| Đường ngắn nhất, trọng số ≥ 0 | Dijkstra + MinHeap | Greedy lấy node gần nhất mỗi bước |
| Có cạnh âm / nghi arbitrage | Bellman-Ford | Relax V−1 lần + phát hiện negative cycle |
| Thứ tự build/học/migration | Topological sort | DAG → linear order thỏa phụ thuộc |
| Phát hiện cycle / dependency vòng | DFS (back edge) hoặc Kahn | DFS tô màu / đếm in-degree |
| Gom nhóm, bạn chung, islands, Kruskal | Union-Find | Gần O(1) mỗi thao tác |
| Duyệt thử mọi đường (maze, puzzle) | DFS | Đi sâu + backtrack tự nhiên |

---

## 🔗 Liên quan

- **6.2 Core Data Structures** — Queue (BFS), Stack (DFS), Heap (Dijkstra), Graph biểu diễn
- **6.4 Sorting & Searching** — BFS là search trên graph; heap sort dùng heap của Dijkstra
- **6.8 Recursion & Complexity** — DFS đệ quy, phân tích O(V+E), NP-complete (TSP, Hamiltonian trên graph)

---

## 📚 Tài liệu

| Tài liệu | Tác giả | Level |
|----------|---------|-------|
| *Grokking Algorithms* (ch. BFS, Dijkstra) | Aditya Bhargava | Beginner |
| *Introduction to Algorithms* (CLRS, ch. 22–25) | Cormen et al. | Academic |
| Visualgo — Graph visualization | NUS | Trực quan |

---

## ▶️ Chạy ví dụ

```bash
cd 06-data-structures-and-algorithms/6.6-graph-algorithms
npx tsx examples/index.ts
```

Demo: BFS vs DFS thứ tự duyệt, Dijkstra đường ngắn nhất, topo sort lịch học, Union-Find gom nhóm.

---

## ⏭️ Bài tiếp theo

→ [6.7 String Algorithms](../6.7-string-algorithms/README.md)
