/**
 * 6.4 Sorting & Searching — Sắp Xếp & Tìm Kiếm
 * So sánh bubble / insertion / merge / quick sort bằng bộ đếm
 * comparisons + đối chiếu linear search vs binary search.
 */

export {};

/** Bộ đếm số phép so sánh phần tử. */
interface Counter {
  comparisons: number;
}

function bubbleSortCount(arr: number[], c: Counter): number[] {
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      c.comparisons++;
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return a;
}

function insertionSortCount(arr: number[], c: Counter): number[] {
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0) {
      c.comparisons++;
      if (a[j] <= key) break;
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return a;
}

function mergeCount(left: number[], right: number[], c: Counter): number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    c.comparisons++;
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}

function mergeSortCount(arr: number[], c: Counter): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSortCount(arr.slice(0, mid), c);
  const right = mergeSortCount(arr.slice(mid), c);
  return mergeCount(left, right, c);
}

function quickSortCount(arr: number[], c: Counter): number[] {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left: number[] = [];
  const middle: number[] = [];
  const right: number[] = [];
  for (const x of arr) {
    c.comparisons++;
    if (x < pivot) left.push(x);
    else if (x === pivot) middle.push(x);
    else right.push(x);
  }
  return [...quickSortCount(left, c), ...middle, ...quickSortCount(right, c)];
}

function linearSearchCount(arr: number[], target: number, c: Counter): number {
  for (let i = 0; i < arr.length; i++) {
    c.comparisons++;
    if (arr[i] === target) return i;
  }
  return -1;
}

function binarySearchCount(arr: number[], target: number, c: Counter): number {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    c.comparisons++;
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

function isSorted(arr: number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1] > arr[i]) return false;
  }
  return true;
}

function main(): void {
  console.log("=== 6.4 Sorting & Searching Demo ===");
  console.log("");

  // Dữ liệu ngẫu nhiên cố định để so sánh công bằng
  const raw: number[] = [38, 27, 43, 3, 9, 82, 10, 55, 61, 19, 73, 29, 44, 12, 5];
  console.log(`📌 Input chung (${raw.length} phần tử): [${raw}]`);
  console.log("");

  const sorts: Array<{ name: string; fn: (a: number[], c: Counter) => number[] }> = [
    { name: "Bubble Sort    (O(n²))", fn: bubbleSortCount },
    { name: "Insertion Sort (O(n²))", fn: insertionSortCount },
    { name: "Merge Sort     (O(n log n))", fn: mergeSortCount },
    { name: "Quick Sort     (O(n log n) avg)", fn: quickSortCount },
  ];

  console.log("🧮 Sorting — số comparisons trên cùng input:");
  for (const s of sorts) {
    const c: Counter = { comparisons: 0 };
    const out = s.fn(raw, c);
    console.log(`   ${s.name} → ${c.comparisons} comparisons, sorted=${isSorted(out)}`);
  }
  console.log("");

  // Insertion thắng trên mảng gần sorted
  const nearly: number[] = [1, 2, 3, 4, 5, 6, 7, 9, 8, 10];
  const cB: Counter = { comparisons: 0 };
  const cI: Counter = { comparisons: 0 };
  bubbleSortCount(nearly, cB);
  insertionSortCount(nearly, cI);
  console.log("📎 Mảng gần sorted [1..10, chỉ swap 8↔9]:");
  console.log(`   bubble=${cB.comparisons}, insertion=${cI.comparisons} → insertion ít việc hơn (best O(n))`);
  console.log("");

  // Searching comparison
  const size = 1000;
  const sorted: number[] = [];
  for (let i = 0; i < size; i++) sorted.push(i * 2); // số chẵn 0..1998
  const target = 1378; // tồn tại trong mảng
  const cLin: Counter = { comparisons: 0 };
  const cBin: Counter = { comparisons: 0 };
  const idxL = linearSearchCount(sorted, target, cLin);
  const idxB = binarySearchCount(sorted, target, cBin);
  console.log(`🔎 Searching target=${target} trên mảng sorted n=${size}:`);
  console.log(`   linear → index ${idxL}, ${cLin.comparisons} bước (O(n))`);
  console.log(`   binary → index ${idxB}, ${cBin.comparisons} bước (O(log n), ≈ log₂(${size}) ≈ 10)`);
  console.log("");

  // Tìm phần tử không tồn tại (worst case)
  const missing = 1379; // số lẻ → không có
  const cLin2: Counter = { comparisons: 0 };
  const cBin2: Counter = { comparisons: 0 };
  linearSearchCount(sorted, missing, cLin2);
  binarySearchCount(sorted, missing, cBin2);
  console.log(`🔎 Worst case (target=${missing} không tồn tại):`);
  console.log(`   linear=${cLin2.comparisons} bước (quét hết) vs binary=${cBin2.comparisons} bước`);
  console.log("");

  console.log("✅ Kết luận: sort một lần O(n log n) để search mãi mãi O(log n); mảng nhỏ/gần sorted thì insertion đủ dùng.");
}

main();
