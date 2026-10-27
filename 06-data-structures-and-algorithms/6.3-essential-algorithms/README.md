# 📐 6.3 Essential Algorithms (Thuật Toán Cốt Lõi)

> **Algorithms** là các bước giải quyết vấn đề. Hiểu algorithm giúp chọn đúng công cụ cho đúng việc.

---

## Sorting Sắp Xếp

### Bubble Sort — O(n²)

```typescript
function bubbleSort(arr: number[]): number[] {
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
    }
  }
  return a;
}
```

✅ Đơn giản, tại chỗ | ❌ Chậm với data lớn

**Tại sao Bubble Sort tồn tại?** Nó không hiệu quả về mặt thực tế (trừ data cực nhỏ < 10 phần tử), nhưng là **công cụ giảng dạy** tuyệt vời — minh họa rõ ràng ý tưởng "swap adjacent elements". Trong thực tế, dùng `Array.sort()` của ngôn ngữ (TimSort/Introsort) luôn tốt hơn.

**Optimization:** Thêm flag `swapped` — nếu một pass không có swap nào, array đã sorted → break early. Phiên bản này chạy O(n) cho data đã sorted.

---

### Selection Sort — O(n²)

```typescript
function selectionSort(arr: number[]): number[] {
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[minIdx]) minIdx = j;
    }
    [a[i], a[minIdx]] = [a[minIdx], a[i]];
  }
  return a;
}
```

✅ Simple, in-place | ❌ Luôn O(n²) — không có early exit
💡 Có **chỉ n swaps** — useful khi write cost cao (flash memory)

---

### Insertion Sort — O(n²)

```typescript
function insertionSort(arr: number[]): number[] {
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return a;
}
```

✅ Excellent for **nearly sorted** data (O(n)), **in-place**, **online** (sort as you receive)
❌ O(n²) worst case
🏆 **Thực tế:** Python's `list.sort()` (TimSort) và Java's `Arrays.sort()` (Dual-Pivot Quicksort) **dùng Insertion Sort** cho các subarray nhỏ (< 47 phần tử) vì overhead thấp.

---

### Merge Sort — O(n log n)

```typescript
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  
  const result: number[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}
```

✅ Stabil, predictable O(n log n) | ❌ Cần O(n) extra space
🏆 **External sort:** Khi data quá lớn để chứa trong RAM (vd: 1TB log files), Merge Sort là lựa chọn duy nhất — chia nhỏ thành chunks sort in-memory, rồi merge. Google MapReduce dùng chính nguyên tắc này.

**Stable sort là gì?** Stable = các phần tử **bằng nhau** giữ nguyên thứ tự tương đối sau sort. Quan trọng khi sort theo nhiều keys (vd: sort by department, rồi within department sort by name).

---

### Quick Sort — O(n log n) average

```typescript
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}
```

✅ Fast in practice (cache-friendly, in-place variant) | ❌ Worst case O(n²) khi pivot luôn là min/max

**In-place Quick Sort** (không tạo array mới):
```typescript
function quickSortInPlace(arr: number[], low = 0, high = arr.length - 1): void {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSortInPlace(arr, low, pi - 1);
    quickSortInPlace(arr, pi + 1, high);
  }
}

function partition(arr: number[], low: number, high: number): number {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}
```

> 💡 **Randomized pivot:** Tránh worst case bằng cách chọn pivot ngẫu nhiên thay vì luôn lấy phần tử cuối. Đảm bảo O(n log n) **expected** time.

---

### Comparison Table

| Algorithm | Time (avg) | Time (worst) | Space | Stable | Best For |
|-----------|------------|--------------|-------|--------|----------|
| Bubble Sort | O(n²) | O(n²) | O(1) | ✅ | Teaching only |
| Selection Sort | O(n²) | O(n²) | O(1) | ❌ | Minimal writes |
| Insertion Sort | O(n²) | O(n²) | O(1) | ✅ | Small/nearly sorted data |
| Merge Sort | O(n log n) | O(n log n) | O(n) | ✅ | External sort, stable requirement |
| Quick Sort | O(n log n) | O(n²) | O(log n) | ❌ | General-purpose, in-memory |
| Heap Sort | O(n log n) | O(n log n) | O(1) | ❌ | Memory-constrained, guaranteed bound |
| TimSort | O(n log n) | O(n log n) | O(n) | ✅ | Real-world (Python, Java) |

**Thực tế ngành:**
- **Python:** `list.sort()` = TimSort (Hybrid of Merge + Insertion)
- **JavaScript:** `Array.prototype.sort()` = engine-dependent (V8 dùng Insertion + quick sort hybrid)
- **Java:** `Arrays.sort()` primitives = Dual-Pivot Quicksort; Objects = TimSort
- **C++:** `std::sort()` = Introsort (Quicksort → Heapsort fallback when depth > 2*log n)

---

## Searching Tìm Kiếm

### Linear Search — O(n)

```typescript
function linearSearch(arr: number[], target: number): boolean {
  for (const item of arr) {
    if (item === target) return true;
  }
  return false;
}
```

Không yêu cầu sorted. Tốt cho data nhỏ hoặc linked list (không random-access).

### Binary Search — O(log n)

```typescript
function binarySearch(arr: number[], target: number): number {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```

⚠️ Yêu cầu array đã sorted | O(log n) — 1 triệu phần tử → tối đa 20 so sánh!

**Variants quan trọng:**
- **Lower bound:** Tìm vị trí chèn đầu tiên ≥ target (dùng cho `insert` trong sorted array).
- **Upper bound:** Tìm vị trí đầu tiên > target.
- **Search in rotated array:** [4,5,6,7,0,1,2] — still O(log n) bằng cách xác định half nào sorted.

> 💡 **Real-world:** Binary search được dùng trong **database indexing** (B-tree search), **binary search on answer** (tìm giá trị tối ưu trong khoảng đơn điệu), và **git bisect** (tìm commit gây bug).

---

## Dynamic Programming (Quy Hoạch Động)

**Ý tưởng:** Chia nhỏ bài toán, lưu kết quả các subproblem để tránh tính lại.

### Khi nào dùng DP?

Hai đặc điểm nhận diện:
1. **Overlapping subproblems:** Cùng subproblem được tính nhiều lần (fib(3) tính 2 lần trong fib(5) naive).
2. **Optimal substructure:** Lời giải tối ưu của bài toán lớn chứa lời giải tối ưu của subproblems.

### Fibonacci — Top-Down (Memoization)

```typescript
function fib(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!;
  memo.set(n, fib(n - 1, memo) + fib(n - 2, memo));
  return memo.get(n)!;
}
// O(n) time, O(n) space
```

### Bottom-Up (Tabulation)

```typescript
function fibBottomUp(n: number): number {
  if (n <= 1) return n;
  const dp = new Array(n + 1).fill(0);
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}
```

**Top-down vs Bottom-up:**

| | Top-Down (Memo) | Bottom-Up (Tabulation) |
|---|---|---|
| Approach | Recursive + cache | Iterative, build from base |
| Stack usage | O(n) recursion stack | O(1) — chỉ cần 2 biến cuối |
| Tính toán | Chỉ tính subproblem cần | Tính TẤT CẢ từ nhỏ → lớn |
| Readability | Gần code recursive tự nhiên | Cần suy nghĩ thứ tự tính |

> 💡 **Space optimization:** Với Fibonacci, chỉ cần 2 biến `prev` và `curr` → O(1) space thay vì O(n) array.

```typescript
function fibOptimized(n: number): number {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}
```

### 0/1 Knapsack Problem

```typescript
function knapsack(weights: number[], values: number[], capacity: number): number {
  const n = weights.length;
  const dp = Array(n + 1).fill(null).map(() => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],                                    // Don't take item
          dp[i - 1][w - weights[i - 1]] + values[i - 1]   // Take item
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][capacity];
}
```

**Bài toán:** Chọn items vào backpack với capacity giới hạn để tối đa value. Mỗi item chỉ chọn 0 hoặc 1 lần (0/1).

**Application thực tế:** Portfolio optimization (chọn stocks), resource allocation, cutting stock problems, DNA sequence alignment (bioinformatics).

> 💡 **Space optimization:** Chỉ cần 1D array `dp[w]` thay vì 2D — iterate w từ capacity xuống 0 để avoid overwriting chưa dùng.

---

## Greedy Algorithm (Tham Lam)

**Chọn tối ưu cục bộ tại mỗi bước, hy vọng đạt tối ưu toàn cục.**

### Coin Change (với coin system chuẩn)

```typescript
function coinChange(coins: number[], amount: number): number {
  coins.sort((a, b) => b - a);
  let count = 0;
  for (const coin of coins) {
    count += Math.floor(amount / coin);
    amount %= coin;
  }
  return amount === 0 ? count : -1;
}
```

⚠️ **Greedy KHÔNG luôn đúng!** Chỉ works khi coin system "canonical" (vd: 1, 5, 10, 25). Với coins [1, 3, 4] và amount 6: greedy chọn 4+1+1=3 coins, nhưng optimal là 3+3=2 coins. Trong trường hợp tổng quát, dùng **DP** thay thế.

### Activity Selection

```typescript
function activitySelection(activities: Array<{ start: number; end: number }>): number {
  // Sort by finish time
  const sorted = [...activities].sort((a, b) => a.end - b.end);
  let count = 0;
  let lastEnd = -Infinity;
  
  for (const act of sorted) {
    if (act.start >= lastEnd) {
      count++;
      lastEnd = act.end;
    }
  }
  return count;
}
```

**Greedy choice property:** Chọn activity **ct earliest finish time** luôn an toàn — vì nó để lại nhiều time nhất cho các activities sau.

**When greedy works:** Khi bài toán có **greedy choice property** (local optimal leads to global optimal) và **optimal substructure**. Khi không chắc, test với counter-example hoặc dùng DP.

---

## Backtracking (Quay Lui)

**Thử từng lựa chọn, quay lui khi không thỏa mãn.**

### N-Queens

```typescript
function solveNQueens(n: number): string[][] {
  const result: string[][] = [];
  const board = Array(n).fill('.');
  
  function isValid(row: number, col: number): boolean {
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;
      if (col - (row - i) >= 0 && board[i][col - (row - i)] === 'Q') return false;
      if (col + (row - i) < n && board[i][col + (row - i)] === 'Q') return false;
    }
    return true;
  }
  
  function backtrack(row: number) {
    if (row === n) {
      result.push([...board]);
      return;
    }
    for (let col = 0; col < n; col++) {
      if (isValid(row, col)) {
        board[row] = board[row].slice(0, col) + 'Q' + board[row].slice(col + 1);
        backtrack(row + 1);
        board[row] = board[row].slice(0, col) + '.' + board[row].slice(col + 1);
      }
    }
  }
  
  backtrack(0);
  return result;
}
```

**Backtracking vs Brute Force:** Backtracking **prune** (cắt nhánh) sớm khi phát hiện invalid state, trong khi brute force explore ALL possibilities. Sự khác biệt: n-Queens 8×8 brute force = 16 tỷ configurations, backtracking = ~2M (giảm 8000x).

**Common backtracking patterns:**
- **Permutations:** "Tất cả cách sắp xếp" — mỗi vị trí thử từng element chưa dùng.
- **Subsets:** "Tất cả combinations" — tại mỗi bước: include hoặc exclude.
- **Sudoku solver:** Điền số, backtrack khi dead end.
- **Maze solving:** Đi theo hướng, quay lui khi ngõ cụt.

---

## Graph Algorithms

### Dijkstra — Shortest Path

```typescript
function dijkstra(graph: Map<string, Array<{ node: string; weight: number }>>, start: string): Map<string, number> {
  const distances = new Map<string, number>();
  const visited = new Set<string>();
  
  for (const node of graph.keys()) distances.set(node, Infinity);
  distances.set(start, 0);
  
  while (true) {
    let current = null;
    let minDist = Infinity;
    for (const node of graph.keys()) {
      if (!visited.has(node) && distances.get(node)! < minDist) {
        minDist = distances.get(node)!;
        current = node;
      }
    }
    if (current === null) break;
    visited.add(current);
    
    for (const { node: neighbor, weight } of graph.get(current) || []) {
      const dist = distances.get(current)! + weight;
      if (dist < distances.get(neighbor)!) {
        distances.set(neighbor, dist);
      }
    }
  }
  return distances;
}
```

**Giới hạn:** Dijkstra **không works với negative weights** — sẽ infinite loop. Dùng **Bellman-Ford** O(V·E) khi có negative weights (phát hiện negative cycle).

**Priority Queue optimization:** Dùng MinHeap thay vì scan linear → O((V+E) log V).

**Real-world:** GPS routing (Google Maps), network routing protocols (OSPF), game AI pathfinding (A* = Dijkstra + heuristic).

### BFS — Shortest Path (Unweighted)

```typescript
function bfsShortestPath(graph: Map<string, string[]>, start: string, end: string): string[] {
  const visited = new Set<string>();
  const queue: string[][] = [[start]];
  visited.add(start);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const vertex = path[path.length - 1];
    if (vertex === end) return path;

    for (const neighbor of graph.get(vertex) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return [];
}
```

---

## Bảng So Sánh Thuật Toán

| Algorithm | Time (Avg) | Space | Best For | Stability |
|-----------|------------|-------|----------|-----------|
| Bubble Sort | O(n²) | O(1) | Learning | ✅ |
| Insertion Sort | O(n²) | O(1) | Small/nearly-sorted | ✅ |
| Merge Sort | O(n log n) | O(n) | Stable sort, external | ✅ |
| Quick Sort | O(n log n) | O(log n) | General purpose, in-memory | ❌ |
| Heap Sort | O(n log n) | O(1) | Memory-constrained, guaranteed | ❌ |
| Binary Search | O(log n) | O(1) | Sorted arrays | N/A |
| Dijkstra | O((V+E) log V) | O(V) | Weighted shortest path | N/A |
| BFS | O(V+E) | O(V) | Unweighted shortest path | N/A |
| DFS | O(V+E) | O(V) | Traversal, cycle detection | N/A |

---

## Khi Nào Dùng Gì?

| Vấn Đề | Thuật Toán Gợi Ý | Thời Gian | Lập luận |
|--------|-------------------|-----------|----------|
| Tìm kiếm trong sorted array | Binary Search | O(log n) | Loại bỏ một nửa mỗi bước — không thể tốt hơn với comparison-based |
| Sắp xếp array ngẫu nhiên | Quick Sort / TimSort | O(n log n) | Fast in practice, in-place, cache-friendly |
| Cần stable sort (giữ thứ tự equal elements) | Merge Sort / TimSort | O(n log n) | Stability quan trọng khi multi-key sort (database ORDER BY) |
| Data quá lớn, không vừa RAM | Merge Sort (external) | O(n log n) | Chia chunk sort in-memory, merge từ disk |
| Tìm đường ngắn nhất (weighted) | Dijkstra + MinHeap | O((V+E) log V) | Greedy chọn node gần nhất mỗi bước |
| Tìm đường ngắn nhất (unweighted) | BFS | O(V + E) | Level-order traversal guarantees shortest |
| Phát hiện cycle / topo sort | DFS | O(V + E) | Back edge = cycle; post-order = reverse topological |
| Bài toán tối ưu có overlapping subproblems | Dynamic Programming | Depends | Memoize hoặc tabulate — đổi time bằng space |
| Chọn items tối ưu (greedy property holds) | Greedy | O(n log n) | Đơn giản hơn DP, chạy nhanh hơn, nhưng chỉ đúng khi prove được |
| Tìm TẤT CẢ solutions | Backtracking | Exponential | Pruning giảm branching factor — cần smart constraints |
| Tìm top-K elements | Heap / Priority Queue | O(n log k) | Duy trì heap size K, O(log k) per insert |
| Đếm/tổng hợp theo group | Hash Map | O(n) | O(1) lookup per element — best choice cho grouping |
| Sắp xếp số nguyên nhỏ range | Counting Sort | O(n + k) | Phi comparison-based, bypass O(n log n) lower bound |

---

## Misconceptions Thường Gặp

| Hiểu lầm | Sự thật |
|----------|----------|
| "O(n log n) luôn nhanh hơn O(n²)" | Với n nhỏ (< 50), O(n²) với hằng số nhỏ có thể nhanh hơn O(n log n) với hằng số lớn. asymptotic chỉ đúng khi n → ∞ |
| "Quick Sort luôn nhanh nhất" | Quick Sort fast trong practice nhưng worst case O(n²). TimSort (Python/Java) thường nhanh hơn trên real-world data (nearly sorted, duplicates) |
| "DP là memoization" | Memoization (top-down) chỉ là 1 cách implement DP. Bottom-up tabulation thường dùng ít memory hơn và tránh recursion stack overflow |
| "Greedy luôn đúng" | Greedy chỉ đúng khi bài toán có **greedy choice property** và **optimal substructure**. Nhiều bài tưởng chừng greedy nhưng thực tế cần DP (vd: Knapsack 0/1) |
| "Binary search chỉ dùng cho sorted array" | Binary search có thể áp dụng cho **binary search on answer** — tìm giá trị tối ưu trong khoảng đơn điệu, kể cả khi không có array sorted rõ ràng |

---

## 🔗 Liên Quan

- **6.1 Time Complexity** — Big O analysis
- **6.2 Core Data Structures** — dùng structures để implement algorithms

---

## ▶️ Chạy ví dụ

```bash
cd 06-data-structures-and-algorithms/6.3-essential-algorithms
npx ts-node examples/index.ts
```

---

## ⏭️ Kết Thúc Lớp 6

🎉 **Bạn đã hoàn thành Lớp 6: Data Structures & Algorithms!**

→ [Quay lại 06-data-structures-and-algorithms/README.md](../README.md)
