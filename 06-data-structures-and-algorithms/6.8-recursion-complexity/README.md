# 🔁 6.8 Recursion & Complexity (Đệ Quy & Độ Phức Tạp Nâng Cao)

> **Đệ quy là tư duy, không phải cú pháp** — hiểu recurrence và space, bạn đoán được performance trước khi chạy.

---

## 🎯 Vấn đề

Sau 6.1–6.7 bạn đã biết Big O cơ bản và nhiều thuật toán. Nhưng 4 câu hỏi nâng cao vẫn lơ lửng:

1. **Đệ quy hay lặp?** Khi nào đệ quy đẹp nhưng gây stack overflow, khi nào bắt buộc đệ quy (duyệt tree/graph)?
2. **Recurrence:** `T(n) = 2T(n/2) + O(n)` nghĩa là gì, vì sao merge sort = O(n log n)?
3. **Amortized analysis:** vì sao `Array.push` là O(1) dù thỉnh thoảng phải copy cả mảng O(n)?
4. **Space complexity & NP-complete:** vì sao quick sort tốn O(log n) memory, và vì sao có những bài (TSP, N-Queens) không có thuật toán nhanh?

---

## 💻 Code ví dụ

### Recursion vs Iteration — cùng bài factorial/sum

```typescript
// Đệ quy: code gần định nghĩa toán học, nhưng O(n) stack
function sumRecursive(n: number): number {
  if (n <= 0) return 0;
  return n + sumRecursive(n - 1); // mỗi call giữ 1 frame tới khi base case
}

// Lặp: O(1) space, an toàn với n lớn
function sumIterative(n: number): number {
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}

// Đệ quy đuôi (tail recursion): lý thuyết compiler tối ưu thành lặp,
// nhưng V8/TypeScript KHÔNG đảm bảo TCO → vẫn có thể overflow. Đừng trông chờ!
```

| Tiêu chí | Recursion | Iteration |
|----------|-----------|-----------|
| Code | Gọn cho tree/graph/divide & conquer | Dài hơn nhưng tường minh |
| Space | O(depth) stack frames | O(1) (thường) |
| Rủi ro | Stack overflow khi depth ~10⁴+ | Ít, chỉ lo time |
| Bắt buộc khi | Duyệt cây/graph, backtracking | Xử lý stream, n cực lớn |

> 💡 Quy tắc: depth nông + cấu trúc đệ quy tự nhiên (tree, quick sort, DFS) → đệ quy. Depth sâu/không giới hạn (chuỗi Fibonacci dài, duyệt linked list 1M node) → lặp hoặc stack tay.

### Recurrence — công thức truy hồi và Master Theorem

```
T(n) = a·T(n/b) + f(n)   (a nhánh con, mỗi nhánh size n/b, tốn f(n) để chia+trộn)

Ví dụ:
- Merge sort:  T(n) = 2T(n/2) + O(n)   → O(n log n)
- Binary search: T(n) = T(n/2) + O(1)  → O(log n)
- Fib naive:   T(n) = T(n-1) + T(n-2)  → O(2ⁿ)
- Quick avg:   T(n) = 2T(n/2) + O(n)   → O(n log n); worst T(n) = T(n-1) + O(n) → O(n²)
```

**Master Theorem (dạng nhớ nhanh)** cho `T(n) = aT(n/b) + O(n^d)`:
- `a < b^d` → chi phí ở tầng gốc chiếm ưu thế → **O(n^d)** (vd: binary search: 1 < 2¹ → O(n⁰·log?) thực tế O(log n) — xem lưu ý).
- `a = b^d` → mọi tầng bằng nhau → **O(n^d · log n)** (merge sort: 2 = 2¹ → O(n log n)).
- `a > b^d` → lá chiếm ưu thế → **O(n^(log_b a))** (vd: `2T(n/2)+O(1)`: 2 > 1 → O(n)).

> ⚠️ Binary search `T(n) = T(n/2) + O(1)` thuộc case đặc biệt (d = 0): kết quả O(log n). Khi d = 0 và a = 1, công thức cho O(log n) chứ không phải O(1).

### Amortized Analysis — trung bình trên chuỗi thao tác

```typescript
// Array.push: thường O(1), nhưng khi đầy → alloc mảng 2x + copy O(n).
// Nếu tính worst-case từng call → O(n) nghe rất tệ. Thực tế:
// n lần push tốn tổng O(n) (1+2+4+...+n ≈ 2n) → amortized O(1)/lần.
class DynamicArray {
  private buf: number[] = [];
  push(x: number): void { this.buf.push(x); } // engine đã làm doubling strategy cho bạn
  get size(): number { return this.buf.length; }
}
```

3 phương pháp (nhớ ý tưởng, không cần thuộc chứng minh): **aggregate** (tổng/n), **accounting** (mỗi op rẻ "trả trước" cho op đắt), **potential** (thế năng của cấu trúc). Kết quả dùng hàng ngày: `push` O(1) amortized, Union-Find O(α(n)), splay/heap O(log n) amortized.

### Space Complexity — memory cũng là Big O

| Trường hợp | Space | Vì sao |
|------------|-------|--------|
| Lặp + vài biến | O(1) | Không tăng theo n |
| Merge sort | O(n) | Mảng phụ khi merge |
| Quick sort | O(log n) avg / O(n) worst | Stack đệ quy sâu = chiều cao cây partition |
| DFS đệ quy | O(h), h = chiều cao/độ sâu | Mỗi frame giữ 1 node trên đường đi |
| DP fib memo | O(n) | Cache n states + stack |
| DP fib tab nén | O(1) | Chỉ 2 biến |
| Adjacency list | O(V+E) | Mỗi đỉnh + mỗi cạnh 1 lần |
| Adjacency matrix | O(V²) | Ma trận đầy đủ |

> 💡 Trade-off kinh điển: **đổi space lấy time** (memoization, hash map, bảng DP) hoặc **đổi time lấy space** (tính lại thay vì lưu).

### NP-Complete (khái niệm)

- **P:** giải được trong thời gian đa thức — sorting, searching, shortest path. ✅
- **NP:** *kiểm chứng* nghiệm trong thời gian đa thức (tìm thì khó, check thì dễ) — Sudoku, N-Queens decision.
- **NP-complete:** bài khó nhất trong NP; nếu giải 1 bài trong poly-time thì P = NP (chưa ai làm được) — **TSP (người bán hàng), SAT, Hamiltonian path, 0/1 Knapsack decision, Graph coloring**.
- **NP-hard:** khó ít nhất bằng NP-complete, có thể không thuộc NP (Halting problem).

**Thực tế:** gặp yêu cầu "tối ưu tuyệt đối" trên bài NP-complete với n lớn → đừng tìm thuật toán hoàn hảo. Dùng **approximation** (TSP nearest-neighbor), **heuristic** (genetic, simulated annealing), **constraint solver** với pruning (backtracking ở 6.3), hoặc giới hạn n nhỏ.

### 📊 Bảng Complexity tổng hợp

| Kỹ thuật phân tích | Đo gì | Ví dụ kết quả |
|--------------------|-------|---------------|
| Worst-case | Đảm bảo không bao giờ tệ hơn | Quick sort O(n²) |
| Average-case | Kỳ vọng trên input ngẫu nhiên | Quick sort O(n log n) |
| Amortized | Trung bình trên chuỗi ops | `push` O(1) |
| Space | Memory phụ thêm | Merge O(n), quick O(log n) |
| Recurrence/Master | Đệ quy chia để trị | Merge O(n log n) |
| NP phân loại | Độ khó lý thuyết | TSP: NP-complete → dùng heuristic |

---

## ✅ Lợi Ích

- **Đoán performance trước khi code:** viết recurrence 1 dòng là biết O(n log n) hay O(2ⁿ).
- **Hết sợ "amortized":** hiểu vì sao `push`, hash map, Union-Find nhanh dù worst-case đáng sợ.
- **Biết khi nào dừng tối ưu:** nhận ra bài NP-complete → chuyển sang heuristic/approximation thay vì mài thuật toán hoàn hảo không tồn tại.

---

## ⚠️ Lưu Ý

- **Đệ quy đẹp ≠ đệ quy đúng:** thiếu base case → infinite recursion; base case sai → kết quả sai lặng lẽ. Luôn test n = 0, 1 trước.
- **Master Theorem không cover mọi thứ:** fib `T(n-1)+T(n-2)` hay quick worst `T(n-1)+O(n)` phải展开 bằng cây đệ quy / substitution, không áp công thức máy móc.
- **Amortized ≠ average:** amortized đảm bảo cho *mọi* chuỗi worst-case input (tổng/n), average-case chỉ đúng trên phân phối ngẫu nhiên.
- **"NP" = Nondeterministic Polynomial, không phải "Non-Polynomial":** nhầm lẫn phổ biến. NP-complete vẫn có thể giải nhanh với n nhỏ bằng backtracking + pruning.

---

## 🎯 Khi nào dùng

| Vấn đề | Chọn gì | Vì sao |
|--------|---------|--------|
| Duyệt tree/graph, backtracking, divide & conquer | Đệ quy | Cấu trúc tự nhiên đã là đệ quy |
| Depth lớn / không giới hạn, stream dài | Lặp / stack tay | Tránh overflow, O(1) space |
| Phân tích sort/search đệ quy | Recurrence + Master | 1 công thức → ra Big O |
| Đánh giá `push`/hash/Union-Find | Amortized | Worst-case đơn lẻ gây hiểu lầm |
| Memory constrained (embedded, mobile) | Ưu tiên O(1)–O(log n) space | Merge O(n) có thể không vừa |
| Bài toán tối ưu tổ hợp, n lớn, nghi NP-complete | Heuristic/approximation/greedy | Không có poly-time exact |
| n nhỏ (≤ 20) trên bài NP-complete | Backtracking + pruning | 2²⁰ ≈ 1M — vẫn chạy được |

---

## 🔗 Liên quan

- **6.1 Time Complexity** — Big O, best/average/worst case
- **6.5 Dynamic Programming** — memoization là đệ quy + cache; NP-complete là giới hạn của DP
- **6.6 Graph Algorithms** — DFS đệ quy, TSP/Hamiltonian là NP-complete trên graph

---

## 📚 Tài liệu

| Tài liệu | Tác giả | Level |
|----------|---------|-------|
| *Grokking Algorithms* (ch. Recursion, Divide & Conquer) | Aditya Bhargava | Beginner |
| *Introduction to Algorithms* (CLRS, ch. 4 Recurrences, ch. 34 NP-Completeness) | Cormen et al. | Academic |
| MIT 6.006 Recitation: Amortized analysis | MIT OCW | Trực quan |

---

## ▶️ Chạy ví dụ

```bash
cd 06-data-structures-and-algorithms/6.8-recursion-complexity
npx ts-node examples/index.ts
```

Demo: so sánh depth/stack của đệ quy vs lặp, minh họa amortized push, đo space của merge vs quick, liệt kê bài P vs NP-complete.

---

## ⏭️ Bài tiếp theo

→ [Quay lại 06-data-structures-and-algorithms/README.md](../README.md)

🎉 **Bạn đã hoàn thành Lớp 6: Data Structures & Algorithms!**
