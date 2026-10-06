/**
 * 6.8 Recursion & Complexity — Đệ Quy & Độ Phức Tạp Nâng Cao
 * Demo: recursion vs iteration (sum + depth), amortized push,
 * space của merge vs quick sort, phân loại P vs NP-complete.
 */

export {};

function sumRecursive(n: number, depth: { max: number; cur: number }): number {
  depth.cur++;
  depth.max = Math.max(depth.max, depth.cur);
  if (n <= 0) {
    depth.cur--;
    return 0;
  }
  const r = n + sumRecursive(n - 1, depth);
  depth.cur--;
  return r;
}

function sumIterative(n: number): number {
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}

function factorialIterative(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// Merge sort đếm allocation phụ (tạm tính số phần tử copy vào mảng merge).
function mergeSortSpace(arr: number[], extra: { cells: number }): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSortSpace(arr.slice(0, mid), extra);
  const right = mergeSortSpace(arr.slice(mid), extra);
  const merged: number[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) merged.push(left[i++]);
    else merged.push(right[j++]);
  }
  while (i < left.length) merged.push(left[i++]);
  while (j < right.length) merged.push(right[j++]);
  extra.cells += merged.length;
  return merged;
}

// Quick sort iterative depth: ước lượng độ sâu đệ quy tối đa (pivot giữa).
function quickDepth(n: number): number {
  if (n <= 1) return 1;
  const mid = Math.floor(n / 2);
  return 1 + Math.max(quickDepth(mid), quickDepth(n - mid - 1));
}

// Amortized push: push n lần vào mảng, đếm tổng số lần copy phần tử
// theo mô hình doubling (capacity 1,2,4,8,...).
function amortizedPush(n: number): { copies: number; perOp: number } {
  let capacity = 1;
  let size = 0;
  let copies = 0;
  for (let i = 0; i < n; i++) {
    if (size === capacity) {
      copies += size; // copy toàn bộ sang buffer 2x
      capacity *= 2;
    }
    size++;
  }
  return { copies, perOp: (n + copies) / n };
}

function main(): void {
  console.log("=== 6.8 Recursion & Complexity Demo ===");
  console.log("");

  // 1. Recursion vs iteration
  const n = 1000;
  const depth = { max: 0, cur: 0 };
  const rRec = sumRecursive(n, depth);
  const rIt = sumIterative(n);
  console.log(`📌 sum(1..${n}): recursive=${rRec} (max depth=${depth.max}, O(n) stack) vs iterative=${rIt} (O(1) space)`);
  console.log(`   factorial(10) iterative = ${factorialIterative(10)} (đệ quy tương đương nhưng tốn 10 frames)`);
  console.log("   → depth ~10⁴+ trong JS/TS có thể stack overflow → dùng lặp/stack tay.");
  console.log("");

  // 2. Amortized analysis
  console.log("📊 Amortized — Array.push với doubling strategy:");
  for (const size of [100, 1000, 10000]) {
    const { copies, perOp } = amortizedPush(size);
    console.log(`   n=${size}: tổng copies=${copies}, chi phí TB/op=${perOp.toFixed(2)} (≈ O(1) amortized)`);
  }
  console.log("");

  // 3. Space: merge O(n) vs quick O(log n)
  const raw = [38, 27, 43, 3, 9, 82, 10, 55, 61, 19, 73, 29, 44, 12, 5, 31];
  const extra = { cells: 0 };
  mergeSortSpace(raw, extra);
  console.log(`💾 Space — sort ${raw.length} phần tử:`);
  console.log(`   merge sort: ~${extra.cells} cells phụ (O(n) extra)`);
  console.log(`   quick sort: max depth ≈ ${quickDepth(raw.length)} frames (O(log n) stack trung bình)`);
  console.log("");

  // 4. Recurrence nhắc nhanh + P vs NP
  console.log("🧮 Recurrence (xem README để chứng minh):");
  console.log("   merge:  T(n)=2T(n/2)+O(n)  → O(n log n)");
  console.log("   binary: T(n)=T(n/2)+O(1)   → O(log n)");
  console.log("   fib:    T(n)=T(n-1)+T(n-2) → O(2ⁿ)");
  console.log("");
  console.log("🧩 P vs NP-complete:");
  console.log("   P (đa thức): sort, binary search, Dijkstra, LCS-DP");
  console.log("   NP-complete (n lớn → heuristic): TSP, N-Queens tối ưu, 0/1 Knapsack decision, graph coloring");
  console.log("");

  console.log("✅ Kết luận: đệ quy cho cấu trúc đệ quy + depth nông; lặp cho depth sâu; amortized giải thích push O(1); NP-complete → đừng tìm thuật toán hoàn hảo.");
}

main();
