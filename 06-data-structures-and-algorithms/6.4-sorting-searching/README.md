# 🔀 6.4 Sorting & Searching (Sắp Xếp & Tìm Kiếm)

> **Sắp xếp đúng thì tìm kiếm mới nhanh** — sort là O(n log n) một lần, search là O(log n) mãi mãi.

---

## 🎯 Vấn đề

Mọi app đều phải **sắp xếp** (leaderboard, danh sách giá, inbox theo thời gian) và **tìm kiếm** (tìm user, tìm sản phẩm, kiểm tra tồn tại). Chọn sai thuật toán:

- Dùng **bubble sort** cho 100K phần tử → O(n²) ≈ 10 tỷ phép so sánh → treo app.
- Dùng **linear search** trên mảng đã sort 1 triệu phần tử → 1 triệu bước, trong khi **binary search** chỉ cần ~20 bước.
- Dùng **quick sort** khi cần **stable sort** (giữ thứ tự phần tử bằng nhau) → sai kết quả ORDER BY nhiều cột.

Bài này tách chi tiết sorting/searching (đã giới thiệu gọn ở 6.3) thành bảng quyết định đầy đủ: **khi nào dùng cái gì**.

---

## 💻 Code ví dụ

### Bubble Sort — O(n²), chỉ để học

```typescript
function bubbleSort(arr: number[]): number[] {
  const a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // đã sorted → thoát sớm, best case O(n)
  }
  return a;
}
```

### Insertion Sort — O(n²), nhưng vua của mảng nhỏ / gần sorted

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
// Best O(n) khi đã gần sorted. TimSort/Introsort dùng insertion cho n < 47.
```

### Merge Sort — O(n log n), stable, đoán trước được

```typescript
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}
```

### Quick Sort — O(n log n) trung bình, nhanh nhất in-memory

```typescript
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  // Pivot ngẫu nhiên để tránh worst case trên mảng đã sorted
  const pivot = arr[Math.floor(Math.random() * arr.length)];
  const left = arr.filter((x) => x < pivot);
  const middle = arr.filter((x) => x === pivot);
  const right = arr.filter((x) => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}
```

### Linear Search vs Binary Search

```typescript
// O(n) — không cần sorted, dùng cho linked list / data nhỏ
function linearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// O(log n) — BẮT BUỘC mảng đã sorted
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

### 📊 Bảng Complexity

| Thuật toán | Best | Average | Worst | Space | Stable | Ghi chú |
|------------|------|---------|-------|-------|--------|---------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ | Có flag `swapped`; chỉ để dạy |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ | Mảng nhỏ / gần sorted |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ | External sort, cần ổn định |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ | General-purpose nhanh nhất |
| Linear Search | O(1) | O(n) | O(n) | O(1) | — | Không cần sorted |
| Binary Search | O(1) | O(log n) | O(log n) | O(1) | — | Bắt buộc sorted |

> 💡 Lower bound của mọi comparison-based sort là **O(n log n)** (chứng minh bằng cây quyết định: n! hoán vị cần log₂(n!) ≈ n log n comparisons). Muốn nhanh hơn → dùng non-comparison sort (counting/radix, xem 6.3).

---

## ✅ Lợi Ích

- **Chọn đúng tool:** biết khi nào O(n²) vẫn ok (n < 50) và khi nào bắt buộc O(n log n).
- **Hiểu library chuẩn:** `Array.prototype.sort` (V8: TimSort hybrid), Python `list.sort` (TimSort), C++ `std::sort` (Introsort) — đều là hybrid quick + merge + insertion.
- **Tìm kiếm nhanh hơn hàng nghìn lần:** binary search trên 1M phần tử sorted = tối đa 20 so sánh.

---

## ⚠️ Lưu Ý

- **Binary search sai 1 dòng là sai hết:** lỗi `mid` tràn số, vòng lặp vô hạn khi `left < right` vs `left <= right`, quên sort trước khi search.
- **Quick sort worst case O(n²)** khi pivot luôn là min/max (mảng đã sorted + pivot cố định). Fix: pivot ngẫu nhiên hoặc shuffle trước.
- **Stable vs unstable:** cần giữ thứ tự phần tử bằng nhau (sort theo 2 cột) → chỉ dùng stable sort (merge/insertion/TimSort), không dùng quick/heap.
- **Đừng tự viết sort trong production:** dùng `arr.sort()` của ngôn ngữ trừ khi học tập hoặc có constraint đặc biệt (external sort, embedded).

---

## 🎯 Khi nào dùng

| Vấn đề | Thuật toán gợi ý | Vì sao |
|--------|------------------|--------|
| Mảng nhỏ (n < 50) hoặc gần sorted | Insertion Sort | Hằng số nhỏ, O(n) best, in-place |
| Cần stable sort / sort nhiều key | Merge Sort / TimSort | Giữ thứ tự equal elements |
| Sắp xếp in-memory tổng quát | Quick Sort / `Array.sort()` | Nhanh nhất thực tế, cache-friendly |
| Data không vừa RAM (log file TB) | External Merge Sort | Chia chunk sort rồi merge từ disk |
| Tìm kiếm mảng chưa sort / nhỏ | Linear Search | Đơn giản, không tốn công sort trước |
| Tìm kiếm mảng đã sort, lớn | Binary Search | O(log n) — 1M phần tử → 20 bước |
| Tìm vị trí chèn trong sorted array | Lower/Upper bound (binary search biến thể) | `splice` đúng chỗ giữ sorted |
| Tìm trong mảng xoay (rotated) | Modified Binary Search | Xác định nửa nào sorted rồi loại nửa kia |

---

## 🔗 Liên quan

- **6.1 Time Complexity** — Big O, cách tính O(n²) vs O(n log n)
- **6.3 Essential Algorithms** — tổng quan sorting/searching/DP/greedy/backtracking
- **6.5 Dynamic Programming** — binary search on answer là cầu nối sang DP/tối ưu

---

## 📚 Tài liệu

| Tài liệu | Tác giả | Level |
|----------|---------|-------|
| *Grokking Algorithms* (ch. Quicksort, Binary Search) | Aditya Bhargava | Beginner |
| *Introduction to Algorithms* (CLRS, ch. 2, 4, 7) | Cormen et al. | Academic |
| V8 blog: Array.prototype.sort (TimSort) | V8 team | Thực tế engine |

---

## ▶️ Chạy ví dụ

```bash
cd 06-data-structures-and-algorithms/6.4-sorting-searching
npx ts-node examples/index.ts
```

Demo: đếm số phép so sánh của 4 thuật toán sort trên cùng input + so sánh số bước linear vs binary search.

---

## ⏭️ Bài tiếp theo

→ [6.5 Dynamic Programming](../6.5-dynamic-programming/README.md)
