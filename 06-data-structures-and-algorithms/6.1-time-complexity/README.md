# 📐 6.1 Time Complexity (Độ Phức Tạp Thời Gian)

> **Big O Notation** đo lường hiệu suất thuật toán khi input tăng lên. Giúp so sánh và chọn thuật toán phù hợp.

---

## Tư duy cốt lõi

**Tại sao complexity analysis quan trọng?**
- Dự đoán được **scalability**: thuật toán O(n²) với n=1000 chạy ~1 tỷ ops = 10 giây; O(n log n) = ~10 nghìn ops = 10ms. **999x khác biệt!**
- Tránh được **performance regression** khi thêm tính năng
- Giao tiếp chuẩn với team: "đây là O(n) solution" = tất cả hiểu

**Big O đo WHAT, không phải HOW:**
- Không phải thời gian thực (giây) — phụ thuộc hardware
- Không phải số dòng code — phụ thuộc style
- Mà là **tốc độ tăng trưởng** khi input tiến tới vô cùng

---

## Biểu Đồ Tăng Dần

```
Performance (n operations)
│
│  O(1)         ← Constant (nhất quán)
│  O(log n)     ← Logarithmic (logarithm)
│  O(n)         ← Linear (tuyến tính)
│  O(n log n)   ← Linearithmic
│  O(n²)        ← Quadratic (bình phương)
│  O(2ⁿ)        ← Exponential (mũ)
│  O(n!)        ← Factorial (gia thừa)
│
└──────────────────────────→ Input Size (n)
```

---

## Big O Chi Tiết

### O(1) — Constant

**Không phụ thuộc vào input size.**

```typescript
// O(1) — truy cập phần tử mảng
function getFirst(arr: number[]): number {
  return arr[0];
}

// O(1) — push/pop stack
const stack: number[] = [];
stack.push(1);  // O(1)
stack.pop();    // O(1)

// O(1) — hash map lookup
const map = new Map();
map.set('key', 'value');
map.get('key'); // O(1) average
```

**Lưu ý:** HashMap worst case O(n) khi hash collision — dùng khi confident với hash function.

---

### O(log n) — Logarithmic

**Giảm nửa input mỗi bước.** Đây là "sweet spot" cho search.

```typescript
// Binary Search — O(log n)
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
```

**Ví dụ thực tế:**
- BST lookup: O(log n) average, O(n) worst (unbalanced)
- Heap operations: O(log n)
- Balanced tree (Red-Black, AVL): O(log n) guaranteed

---

### O(n) — Linear

**Duyệt từng phần tử một lần.**

```typescript
// Linear search — O(n)
function findMax(arr: number[]): number {
  let max = arr[0];
  for (const num of arr) {
    if (num > max) max = num;
  }
  return max;
}

// O(n) — tìm kiếm đơn giản
function contains(arr: number[], target: number): boolean {
  for (const item of arr) {
    if (item === target) return true;
  }
  return false;
}
```

**Pattern nhận diện O(n):**
- Duyệt mảng một lần
- Một vòng lặp for/while không lồng
- String traversal

---

### O(n log n) — Linearithmic

**Merge Sort, Quick Sort — sorting efficient nhất.**

```typescript
// Merge Sort — O(n log n)
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}
```

**Tại sao O(n log n) là giới hạn lower bound cho comparison-based sort?**
- Có n! permutations, mỗi comparison split 2 branches
- Cần log₂(n!) ≈ n log n comparisons để distinguish all permutations

---

### O(n²) — Quadratic

**Vòng lặp lồng nhau — Bubble Sort, Selection Sort.**

```typescript
// Bubble Sort — O(n²)
function bubbleSort(arr: number[]): number[] {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

// O(n²) — check all pairs
function hasDuplicate(nums: number[]): boolean {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}
```

**Rule of thumb:** Nếu code có 2 vòng lặp lồng nhau (không phụ thuộc) → thường O(n²).

---

### O(2ⁿ) — Exponential

**Recursive Fibonacci naive — cực kỳ chậm.**

```typescript
// O(2ⁿ) — Fibonacci naive
function fib(n: number): number {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

// ✅ Better: O(n) với memoization
function fibMemo(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!;
  memo.set(n, fibMemo(n - 1, memo) + fibMemo(n - 2, memo));
  return memo.get(n)!;
}

// ✅ Even better: O(n) iterative
function fibIterative(n: number): number {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}
```

---

## Bảng So Sánh

| Big O | Tên | 10 phần tử | 100 phần tử | 1000 phần tử |
|-------|-----|------------|-------------|--------------|
| O(1) | Constant | 1 | 1 | 1 |
| O(log n) | Logarithmic | 3 | 7 | 10 |
| O(n) | Linear | 10 | 100 | 1000 |
| O(n log n) | Linearithmic | 33 | 664 | 9966 |
| O(n²) | Quadratic | 100 | 10,000 | 1,000,000 |
| O(2ⁿ) | Exponential | 1024 | 10³⁰ | 10³⁰¹ |

---

## Nguyên Tắc Chọn Thuật Toán

| Input Size | Phù Hợp |
|------------|---------|
| n < 1000 | O(n²) cũng chấp nhận được |
| n < 100,000 | Cần O(n log n) hoặc tốt hơn |
| n > 100,000 | Chỉ O(n) hoặc O(log n) |

**Thực tế industry:**
- n ≤ 10⁴: O(n²) acceptable
- n ≤ 10⁵: O(n log n) required
- n > 10⁶: O(n) hoặc sublinear required

---

## Các Quy Tắc Tính Big O

1. **Bỏ hằng số:** O(2n) = O(n)
2. **Bỏ thuật toán nhỏ hơn:** O(n² + n) = O(n²)
3. **Tích các biến:** 2 loops lồng = O(n × m)
4. **Case analysis:** best/average/worst case

**Ví dụ áp dụng:**

```typescript
// ❌ O(n² + n + 100) — verbose
function process(arr: number[]): void {
  for (let i = 0; i < arr.length; i++) {       // O(n)
    for (let j = 0; j < arr.length; j++) {      // O(n)
      console.log(arr[i], arr[j]);
    }
    console.log(arr[i]);                        // O(n) — outside inner loop
  }
  console.log("done");                          // O(1)
}

// ✅ O(n²) — simplified
// Dominated by nested loops, everything else negligible
```

---

## 🔗 Liên Quan

- **6.2 Core Data Structures** — Complexity của các cấu trúc
- **6.3 Essential Algorithms** — Thuật toán sắp xếp, tìm kiếm
- **5.3 Performance Optimization** — ứng dụng thực tế của complexity analysis

---

## ▶️ Chạy ví dụ

```bash
cd 06-data-structures-and-algorithms/6.1-time-complexity
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [6.2 Core Data Structures](../6.2-core-data-structures/README.md)
