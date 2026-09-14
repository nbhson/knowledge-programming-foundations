/**
 * 6.3 Essential Algorithms — Thuật Toán Cốt Lõi
 * Minh họa: Binary Search, Bubble/Quick/Merge Sort,
 * DFS/BFS trên graph, Dynamic Programming (Fibonacci cache,
 * Coin Change) và Two-pointer.
 */

// ─── 1. Searching — Binary Search O(log n) ──────────────────
function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// ─── 2. Sorting ─────────────────────────────────────────────
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

function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => x < pivot);
  const middle = arr.filter((x) => x === pivot);
  const right = arr.filter((x) => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);
  return result;
}

// ─── 3. Graph — DFS & BFS ───────────────────────────────────
class Graph {
  private adjList = new Map<string, string[]>();

  addVertex(vertex: string): void {
    if (!this.adjList.has(vertex)) this.adjList.set(vertex, []);
  }

  addEdge(v1: string, v2: string): void {
    this.adjList.get(v1)?.push(v2);
    this.adjList.get(v2)?.push(v1);
  }

  dfs(start: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (vertex: string): void => {
      visited.add(vertex);
      result.push(vertex);
      for (const neighbor of this.adjList.get(vertex) || []) {
        if (!visited.has(neighbor)) visit(neighbor);
      }
    };

    visit(start);
    return result;
  }

  bfs(start: string): string[] {
    const visited = new Set<string>([start]);
    const queue: string[] = [start];
    const result: string[] = [];

    while (queue.length > 0) {
      const vertex = queue.shift()!;
      result.push(vertex);
      for (const neighbor of this.adjList.get(vertex) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return result;
  }
}

// ─── 4. Dynamic Programming ─────────────────────────────────
const fibCount = { calls: 0 };

function fibNaive(n: number): number {
  fibCount.calls++;
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

function fibCache(n: number, cache: Map<number, number> = new Map()): number {
  if (n <= 1) return n;
  if (cache.has(n)) return cache.get(n)!;
  const value = fibCache(n - 1, cache) + fibCache(n - 2, cache);
  cache.set(n, value);
  return value;
}

// Coin Change — DP Bottom-up: số coin tối thiểu
function coinChange(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let sum = 1; sum <= amount; sum++) {
    for (const coin of coins) {
      if (coin <= sum) {
        dp[sum] = Math.min(dp[sum], dp[sum - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}

// ─── 5. Two-pointer ─────────────────────────────────────────
// Tìm cặp số trong mảng đã sắp xếp có tổng bằng target
function twoSumSorted(arr: number[], target: number): [number, number] | null {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [arr[left], arr[right]];
    if (sum < target) left++;
    else right--;
  }
  return null;
}

// ─── Demo ───────────────────────────────────────────────────
console.log("=== Essential Algorithms Demo ===");
console.log("");

console.log("🔎 Binary Search — O(log n) trên mảng đã sắp xếp");
const sorted = [1, 3, 5, 7, 9, 11, 13, 15];
console.log(`   sorted = [${sorted}]`);
console.log(`   binarySearch(7)  → index ${binarySearch(sorted, 7)}`);
console.log(`   binarySearch(4)  → index ${binarySearch(sorted, 4)} (không có)`);
console.log("");

console.log("🧮 Sorting — so sánh 3 thuật toán");
const raw = [5, 2, 9, 1, 7, 3];
console.log(`   raw = [${raw}]`);
console.log(`   bubbleSort → [${bubbleSort(raw)}]  (O(n²))`);
console.log(`   quickSort  → [${quickSort(raw)}]  (O(n log n) trung bình)`);
console.log(`   mergeSort  → [${mergeSort(raw)}]  (O(n log n), stable)`);
console.log("");

console.log("🕸️  Graph — DFS & BFS");
const graph = new Graph();
["A", "B", "C", "D", "E"].forEach((v) => graph.addVertex(v));
graph.addEdge("A", "B");
graph.addEdge("A", "C");
graph.addEdge("B", "D");
graph.addEdge("C", "D");
graph.addEdge("D", "E");
console.log("   A — B");
console.log("   |   |");
console.log("   C — D — E");
console.log(`   DFS("A") = [${graph.dfs("A")}]  (đi sâu trước)`);
console.log(`   BFS("A") = [${graph.bfs("A")}]  (lan rộng theo tầng)`);
console.log("");

console.log("🧠 Dynamic Programming — Fibonacci cache");
const n = 10;
const cached = fibCache(n);
fibCount.calls = 0;
const naive = fibNaive(n);
console.log(`   fib(${n}) bằng cache = ${cached}`);
console.log(`   fibNaive(${n}) = ${naive}, số lần gọi đệ quy = ${fibCount.calls}`);
fibCount.calls = 0;
fibCache(30);
const cached30 = fibCache(30);
console.log(`   fib(30) = ${cached30}, cache nhỏ gọn (đừng thử naive!)`);
console.log("");

console.log("💰 Coin Change — DP bottom-up (số coin tối thiểu)");
console.log(`   coinChange([1, 2, 5], 11) = ${coinChange([1, 2, 5], 11)} coin (5+5+1)`);
console.log(`   coinChange([2], 3)        = ${coinChange([2], 3)} (bất khả thi)`);
console.log("");

console.log("👐 Two-pointer — tìm cặp tổng bằng target trong mảng đã sort");
const nums = [1, 2, 3, 4, 6, 8, 10];
console.log(`   nums = [${nums}], target = 10`);
const pair = twoSumSorted(nums, 10);
console.log(`   Cặp tìm được: [${pair}]  (1 + 9? không; 2 + 8 = 10 ✅)`);
console.log("");

console.log("✅ Essential Algorithms: đã demo Searching, Sorting, Graph DFS/BFS, DP và Two-pointer");
export {};
