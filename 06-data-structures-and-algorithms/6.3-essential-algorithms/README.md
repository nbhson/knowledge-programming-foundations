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
✅ Stabil, predictiable | ❌ Cần O(n) extra space

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
✅ Fast in practice | ❌ Worst case O(n²)

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
⚠️ Yêu cầu array đã sorted

---

## Dynamic Programming (Quy Hoạch Động)

**Ý tưởng:** Chia nhỏ bài toán, lưu kết quả các subproblem để tránh tính lại.

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

### 0/1 Knapsack Problem

```typescript
function knapsack(weights: number[], values: number[], capacity: number): number {
  const n = weights.length;
  const dp = Array(n + 1).fill(null).map(() => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - weights[i - 1]] + values[i - 1]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][capacity];
}
```

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

---

## Bảng So Sánh Thuật Toán

| Algorithm | Time (Avg) | Space | Best For |
|-----------|------------|-------|----------|
| Bubble Sort | O(n²) | O(1) | Learning |
| Merge Sort | O(n log n) | O(n) | Stable sort |
| Quick Sort | O(n log n) | O(log n) | General purpose |
| Binary Search | O(log n) | O(1) | Sorted arrays |
| Dijkstra | O((V+E) log V) | O(V) | Shortest path |
| DFS | O(V+E) | O(V) | Traversal |

---

## Khi Nào Dùng Gì?

| Scenario | Khuyến Nghị |
|----------|-------------|
| Sắp xếp array nhỏ (< 1000) | Quick Sort |
| Cần stable sort | Merge Sort |
| Tìm kiếm trong sorted array | Binary Search |
| Shortest path có trọng số | Dijkstra |
| Bài toán tối ưu có overlapping subproblems | Dynamic Programming |
| Tìm tất cả lời giải | Backtracking |

---

## 🔗 Liên Quan

- **6.1 Time Complexity** — Big O analysis
- **6.2 Core Data Structures** — dùng structures để implement algorithms

---

## ⏭️ Kết Thúc Lớp 6

🎉 **Bạn đã hoàn thành Lớp 6: Data Structures & Algorithms!**

→ [Quay lại 06-data-structures-and-algorithms/README.md](../README.md)
