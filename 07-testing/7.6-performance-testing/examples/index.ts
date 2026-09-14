/**
 * 7.6 Performance Testing — Đo thời gian 2 thuật toán
 *
 * Minh họa Performance Test cấp đơn vị (micro-benchmark):
 * - console.time / console.timeEnd: thời gian tổng.
 * - performance.now(): thời gian chính xác từng vòng lặp.
 * - So sánh complexity O(n) vs O(1), O(n) vs O(log n).
 */

// ──────────────────── Thuật toán cần đo ────────────────────

// Cộng 1..N bằng vòng lặp — O(n)
function perfSumLoop(n: number): number {
  let sum = 0;
  for (let i = 1; i <= n; i++) sum += i;
  return sum;
}

// Cộng 1..N bằng công thức Gauss — O(1)
function perfSumFormula(n: number): number {
  return (n * (n + 1)) / 2;
}

// Tìm kiếm tuyến tính — O(n)
function perfLinearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// Tìm kiếm nhị phân — O(log n)
function perfBinarySearch(arr: number[], target: number): number {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

// ──────────────────────── Helper đo ────────────────────────
function perfBenchmark(name: string, fn: () => number, runs: number): { name: string; ms: number } {
  // warm-up: chạy 1 lần trước để JIT "làm nóng"
  fn();

  const start = performance.now();
  for (let i = 0; i < runs; i++) fn();
  const elapsed = performance.now() - start;
  const avg = elapsed / runs;

  console.log(`     ${name.padEnd(30)} total=${elapsed.toFixed(2)}ms  avg/run=${avg.toFixed(4)}ms`);
  return { name, ms: avg };
}

function perfRunPair(title: string, a: () => number, b: () => number, runs: number): void {
  console.log(`\n📊 ${title}`);
  const ra = perfBenchmark("O(n) — vòng lặp", a, runs);
  const rb = perfBenchmark("O(1)/O(log n) — công thức", b, runs);
  const diff = ra.ms - rb.ms;
  console.log(
    diff > 0
      ? `     ⚡ Phiên bản tối ưu nhanh hơn ~${(diff / Math.max(ra.ms, 1e-9) * 100).toFixed(1)}% thời gian`
      : `     ℹ️  Hai phiên bản gần tương đương ở mức dữ liệu này`,
  );
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== Performance Test Demo ===");
console.log("So sánh thời gian giữa thuật toán dùng performance.now() / console.time.");

console.time("⏱️  Toàn bộ benchmark");
const dataSize = 2_000_000;

// Test case 1: cộng dồn
perfRunPair(
  `Cộng 1..${dataSize.toLocaleString("en-US")}: O(n) vs O(1)`,
  () => perfSumLoop(dataSize),
  () => perfSumFormula(dataSize),
  20,
);

// Test case 2: tìm kiếm trên mảng có 1 triệu phần tử
const arr: number[] = [];
for (let i = 0; i < 1_000_000; i++) arr.push(i * 2);
const target = arr[arr.length - 3]; // phần tử gần cuối
perfRunPair(
  `Tìm ${target} trong mảng 1,000,000 phần tử (đã sắp xếp)`,
  () => perfLinearSearch(arr, target),
  () => perfBinarySearch(arr, target),
  100,
);

// console.timeEnd in kèm ở đây
console.log("");

console.timeEnd("⏱️  Toàn bộ benchmark");

console.log("\n✅ Performance test: định lượng được thuật toán nào nhanh hơn, trước khi tối ưu hóa");
export {};