/**
 * 6.1 Time Complexity — Độ Phức Tạp Thời Gian
 * So sánh Big O thực tế bằng bộ đếm phép toán:
 * O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ).
 */

/** Bộ đếm phép toán dùng chung để đo số bước thực thi. */
interface Counter {
  steps: number;
}

// ─── O(1) — Constant ─────────────────────────────────────────
function getAt(arr: number[], index: number): number {
  return arr[index]; // truy cập trực tiếp, không duyệt
}

// ─── O(log n) — Logarithmic (Binary Search) ─────────────────
function binarySearchWithCount(arr: number[], target: number, counter: Counter): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    counter.steps++;
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// ─── O(n) — Linear (Linear Search) ───────────────────────────
function linearSearchWithCount(arr: number[], target: number, counter: Counter): number {
  for (let i = 0; i < arr.length; i++) {
    counter.steps++;
    if (arr[i] === target) return i;
  }
  return -1;
}

// ─── O(n log n) — Linearithmic (Merge Sort) ─────────────────
function mergeWithCount(left: number[], right: number[], counter: Counter): number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    counter.steps++;
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  while (i < left.length) {
    counter.steps++;
    result.push(left[i++]);
  }
  while (j < right.length) {
    counter.steps++;
    result.push(right[j++]);
  }
  return result;
}

function mergeSortWithCount(arr: number[], counter: Counter): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSortWithCount(arr.slice(0, mid), counter);
  const right = mergeSortWithCount(arr.slice(mid), counter);
  return mergeWithCount(left, right, counter);
}

// ─── O(n²) — Quadratic (Bubble Sort) ─────────────────────────
function bubbleSortWithCount(arr: number[], counter: Counter): number[] {
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      counter.steps++;
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
    }
  }
  return a;
}

// ─── O(2ⁿ) — Exponential (Fibonacci naive) ──────────────────
function fibExponential(n: number, counter: Counter): number {
  counter.steps++;
  if (n <= 1) return n;
  return fibExponential(n - 1, counter) + fibExponential(n - 2, counter);
}

// ─── Demo ────────────────────────────────────────────────────
console.log("=== Time Complexity Demo ===");
console.log("");

// Chuẩn bị dữ liệu: mảng sorted + mảng ngẫu nhiên
const size = 256;
const sorted: number[] = [];
for (let i = 0; i < size; i++) sorted.push(i);

const random: number[] = [];
for (let i = 0; i < size; i++) random.push(Math.floor(Math.random() * 1000));

// O(1) — số bước không đổi bất kể n
console.log("📌 O(1) — Constant: truy cập arr[index]");
const c: Counter = { steps: 0 };
const first = getAt(random, 0);
c.steps = 1;
console.log(`   arr[0] = ${first} → ${c.steps} step (bất kể n = ${size})`);
console.log("");

// O(log n) — Binary Search
console.log("📈 O(log n) — Logarithmic: Binary Search trên n = " + size);
const cLog: Counter = { steps: 0 };
const idx = binarySearchWithCount(sorted, 137, cLog);
console.log(`   Tìm thấy 137 tại index ${idx} → ${cLog.steps} steps (≈ log₂(${size}) ≈ 8)`);
console.log("");

// O(n) — Linear Search
console.log("📊 O(n) — Linear: Linear Search trên n = " + size);
const cLin: Counter = { steps: 0 };
const idx2 = linearSearchWithCount(random, random[random.length - 1], cLin);
console.log(`   Tìm thấy phần tử cuối tại index ${idx2} → ${cLin.steps} steps (≈ n)`);
console.log("");

// O(n log n) — Merge Sort
console.log("🚀 O(n log n) — Linearithmic: Merge Sort trên n = " + size);
const cMl: Counter = { steps: 0 };
mergeSortWithCount([...random], cMl);
console.log(`   Sắp xếp xong → ${cMl.steps} steps (≈ n·log₂(n) ≈ ${size * Math.log2(size)} )`);
console.log("");

// O(n²) — Bubble Sort (dùng mảng nhỏ để in nhanh)
const sizeQuad = 100;
const smallArr: number[] = [];
for (let i = 0; i < sizeQuad; i++) smallArr.push(Math.floor(Math.random() * 1000));
console.log("🐌 O(n²) — Quadratic: Bubble Sort trên n = " + sizeQuad);
const cQuad: Counter = { steps: 0 };
bubbleSortWithCount(smallArr, cQuad);
console.log(`   Sắp xếp xong → ${cQuad.steps} steps (≈ n²/2 = ${(sizeQuad * sizeQuad) / 2})`);
console.log("");

// O(2ⁿ) — Exponential (n nhỏ vì tăng cực nhanh)
const fibN = 12;
console.log("💥 O(2ⁿ) — Exponential: Fibonacci naive với n = " + fibN);
const cExp: Counter = { steps: 0 };
const fibResult = fibExponential(fibN, cExp);
console.log(`   fib(${fibN}) = ${fibResult} → ${cExp.steps} calls (tăng theo hàm mũ!)`);
console.log("");

// Bảng tổng kết
console.log("📋 Bảng so sánh cùng input n = " + size + " (O(2ⁿ) dùng n = " + fibN + " để kịp chạy):");
console.log("┌────────────┬────────────────┐");
console.log("│ Big O      │ Số phép toán   │");
console.log("├────────────┼────────────────┤");
console.log(`│ O(1)        │ ${1}             │`);
console.log(`│ O(log n)    │ ${cLog.steps}             │`);
console.log(`│ O(n)        │ ${cLin.steps}              │`);
console.log(`│ O(n log n)  │ ${cMl.steps}            │`);
console.log(`│ O(n²)       │ ${cQuad.steps} (n=${sizeQuad})    │`);
console.log(`│ O(2ⁿ)       │ ${cExp.steps} (n=${fibN})     │`);
console.log("└────────────┴────────────────┘");
console.log("");

console.log("✅ Time Complexity: cùng input, thuật toán khác nhau cho số bước rất khác nhau — chọn đúng thuật toán là chìa khóa!");
export {};
