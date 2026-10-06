# 🧠 6.5 Dynamic Programming (Quy Hoạch Động)

> **Đừng tính lại thứ đã biết** — lưu kết quả subproblem, đổi memory lấy tốc độ từ O(2ⁿ) xuống O(n).

---

## 🎯 Vấn đề

Nhiều bài toán tối ưu (chia tiền, xếp balo, so sánh chuỗi DNA) có cấu trúc đệ quy **tính đi tính lại** cùng subproblem. Ví dụ `fib(5)` naive gọi `fib(3)` hai lần, `fib(2)` ba lần — số lần gọi tăng theo hàm mũ O(2ⁿ), với n = 50 đã là ~10¹⁵ calls (không bao giờ xong).

Dynamic Programming (DP) giải bằng cách **giải mỗi subproblem đúng một lần rồi tái sử dụng**. Hai cách cài đặt: **memoization** (top-down, đệ quy + cache) và **tabulation** (bottom-up, vòng lặp + bảng).

---

## 💻 Code ví dụ

### Fibonacci — 3 phiên bản từ chậm tới nhanh

```typescript
// ❌ Naive: O(2ⁿ) time, O(n) stack
function fibNaive(n: number): number {
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

// ✅ Memoization (top-down): O(n) time, O(n) space + O(n) stack
function fibMemo(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!;
  memo.set(n, fibMemo(n - 1, memo) + fibMemo(n - 2, memo));
  return memo.get(n)!;
}

// ✅ Tabulation (bottom-up): O(n) time, O(1) space, không recursion
function fibTab(n: number): number {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) [prev, curr] = [curr, prev + curr];
  return curr;
}
```

### Memoization vs Tabulation

| Tiêu chí | Memoization (top-down) | Tabulation (bottom-up) |
|----------|------------------------|------------------------|
| Cách viết | Đệ quy + cache `Map`/array | Vòng lặp, điền bảng từ base case |
| Stack | O(n) recursion — có thể overflow | O(1) stack — an toàn |
| Tính toán | Chỉ tính subproblem **cần tới** | Tính **tất cả** từ nhỏ → lớn |
| Dễ viết | Gần công thức truy hồi tự nhiên | Phải nghĩ thứ tự điền bảng |
| Tối ưu space | Khó (cache giữ mọi state đã thăm) | Dễ (vd: fib chỉ cần 2 biến) |

> 💡 Quy tắc: prototype bằng **memoization** cho nhanh, optimize production bằng **tabulation** + nén chiều không gian.

### 0/1 Knapsack — mỗi item lấy 0 hoặc 1 lần

```typescript
function knapsack(weights: number[], values: number[], capacity: number): number {
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(capacity + 1).fill(0)
  );
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][capacity];
}
// O(n × capacity) time, O(n × capacity) space → nén còn O(capacity) với mảng 1D duyệt w ngược.
```

### LCS — Longest Common Subsequence (khái niệm + code)

Bài toán: độ dài dãy con chung dài nhất của 2 chuỗi (không cần liên tiếp). Dùng trong **diff tool, so sánh DNA, gợi ý sửa chính tả**.

Công thức truy hồi: nếu `a[i-1] === b[j-1]` thì `dp[i][j] = dp[i-1][j-1] + 1`, ngược lại `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.

```typescript
function lcs(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}
// lcs("ABCBDAB", "BDCABA") = 4 ("BCBA")
```

### 📊 Bảng Complexity

| Bài toán | Naive | DP time | DP space | Dạng DP |
|----------|-------|---------|----------|---------|
| Fibonacci(n) | O(2ⁿ) | O(n) | O(1) tab / O(n) memo | 1D |
| 0/1 Knapsack | O(2ⁿ) thử mọi subset | O(n × W) | O(W) sau khi nén | 2D → 1D |
| LCS (m × n) | O(2^(m+n)) | O(m × n) | O(min(m,n)) sau khi nén | 2D |
| Coin Change (min coins) | O(amount^k) | O(amount × k) | O(amount) | 1D |
| Edit Distance | exponential | O(m × n) | O(min(m,n)) | 2D |

---

## ✅ Lợi Ích

- **Biến bài toán không giải được thành giải được:** từ O(2ⁿ) xuống O(n) hoặc O(n×W) — n = 1000 vẫn chạy được.
- **Pattern nhận diện rõ:** thấy **overlapping subproblems** + **optimal substructure** → nghĩ ngay tới DP.
- **Ứng dụng thật:** diff (git), alignment DNA, tối ưu portfolio, phân bổ tài nguyên, autocomplete/edit distance.

---

## ⚠️ Lưu Ý

- **Không phải đệ quy nào cũng DP được:** cần **overlapping subproblems** (fib có, merge sort không — subproblem rời nhau → dùng divide & conquer).
- **Knapsack O(n×W) là pseudo-polynomial:** W là *giá trị* capacity, không phải *kích thước* input — W = 10⁹ thì bảng DP không khả thi.
- **Thứ tự điền bảng tabulation rất dễ sai:** phải đảm bảo state phụ thuộc đã được tính trước (duyệt i tăng dần, w tăng/giảm đúng chiều).
- **Truy vết nghiệm:** bảng `dp` chỉ cho *giá trị tối ưu*; muốn biết *chọn item nào* phải backtrack từ `dp[n][W]` ngược về.

---

## 🎯 Khi nào dùng

| Vấn đề | Dùng gì | Vì sao |
|--------|---------|--------|
| Fib / đếm cách leo cầu thang / climbing stairs | DP 1D tabulation | Truy hồi chỉ phụ thuộc 1–2 state trước |
| Chọn items tối đa value trong capacity (0/1) | Knapsack 2D → nén 1D | Mỗi item 1 lần; duyệt w ngược để không dùng lại |
| So sánh 2 chuỗi (diff, DNA, spell check) | LCS / Edit Distance 2D | So sánh từng cặp ký tự, cần cả 2 chiều |
| Đổi tiền ít tờ nhất / min coins | DP 1D amount | Coin dùng lại nhiều lần (unbounded) |
| Chỉ cần prototype nhanh, state thưa | Memoization top-down | Chỉ tính state cần tới, code gần công thức |
| Production, n lớn, sợ stack overflow | Tabulation + nén space | Vòng lặp, O(1)–O(W) memory |
| Bài toán không có optimal substructure | Đừng dùng DP (thử greedy/backtracking) | DP cho đáp án sai nếu subproblem tối ưu ≠ global tối ưu |

---

## 🔗 Liên quan

- **6.1 Time Complexity** — vì sao O(2ⁿ) không chạy được với n lớn
- **6.4 Sorting & Searching** — binary search on answer dùng tư duy tối ưu tương tự
- **6.8 Recursion & Complexity** — recurrence, memoization vs recursion thuần, NP-complete (bài DP không giải được)

---

## 📚 Tài liệu

| Tài liệu | Tác giả | Level |
|----------|---------|-------|
| *Grokking Algorithms* (ch. Dynamic Programming) | Aditya Bhargava | Beginner |
| *Introduction to Algorithms* (CLRS, ch. 15) | Cormen et al. | Academic |
| LeetCode DP patterns (fib, knapsack, LCS, coin change) | — | Luyện tập |

---

## ▶️ Chạy ví dụ

```bash
cd 06-data-structures-and-algorithms/6.5-dynamic-programming
npx ts-node examples/index.ts
```

Demo: đếm số calls fib naive vs memo vs tab, giải knapsack mẫu, tính LCS của 2 chuỗi.

---

## ⏭️ Bài tiếp theo

→ [6.6 Graph Algorithms](../6.6-graph-algorithms/README.md)
