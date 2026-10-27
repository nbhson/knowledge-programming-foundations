# 📐 Lớp 6: Data Structures & Algorithms (Cấu Trúc Dữ Liệu & Thuật Toán)

> **DSA** là **nền tảng toán học** của lập trình — luôn đúng, luôn cần,
> bất kể bạn dùng framework hay ngôn ngữ nào.
>
> **Ví dụ:** Vật liệu xây dựng — gạch, thép, bê tông.

---

## 📚 Mục lục

| # | Chủ đề | Giải thích | Link |
|---|--------|-----------|------|
| 6.1 | Time Complexity (Độ Phức Tạp Thời Gian) | Big O Notation — đo hiệu suất thuật toán khi input tăng | [6.1-time-complexity](6.1-time-complexity/README.md) |
| 6.2 | Core Data Structures (Cấu Trúc Dữ Liệu Cốt Lõi) | Array, Stack, Queue, Linked List, Tree, BST, Graph, HashMap | [6.2-core-data-structures](6.2-core-data-structures/README.md) |
| 6.3 | Essential Algorithms (Thuật Toán Cốt Lõi) | Sorting, Searching, DP, Greedy, Backtracking, Graph algorithms | [6.3-essential-algorithms](6.3-essential-algorithms/README.md) |
| 6.4 | Sorting & Searching (Sắp Xếp & Tìm Kiếm) | Bubble/Insertion/Merge/Quick + Linear/Binary search, khi nào dùng cái gì | [6.4-sorting-searching](6.4-sorting-searching/README.md) |
| 6.5 | Dynamic Programming (Quy Hoạch Động) | Memoization vs tabulation, fib, 0/1 knapsack, LCS | [6.5-dynamic-programming](6.5-dynamic-programming/README.md) |
| 6.6 | Graph Algorithms (Thuật Toán Đồ Thị) | BFS/DFS, Dijkstra, Bellman-Ford, topological sort, Union-Find | [6.6-graph-algorithms](6.6-graph-algorithms/README.md) |
| 6.7 | String Algorithms (Thuật Toán Chuỗi) | Naive vs KMP, Rabin-Karp, sliding-window, two-pointer | [6.7-string-algorithms](6.7-string-algorithms/README.md) |
| 6.8 | Recursion & Complexity (Đệ Quy & Độ Phức Tạp Nâng Cao) | Recursion vs iteration, recurrence, amortized, space, NP-complete | [6.8-recursion-complexity](6.8-recursion-complexity/README.md) |

---

## Tổng Quan

```
Data Structures & Algorithms
├── 6.1 Time Complexity (Độ Phức Tạp Thời Gian)
│   └── Big O, Omega, Theta — cách đo và tính độ phức tạp
├── 6.2 Core Data Structures
│   ├── Array          — contiguous memory, O(1) access
│   ├── Linked List    — dynamic nodes, O(1) insert at head
│   ├── Stack          — LIFO, undo/history/call stack
│   ├── Queue          — FIFO, task scheduling/BFS
│   ├── Hash Map       — O(1) lookup, caching/symbol table
│   ├── Tree (BST)     — sorted traversal, O(log n) search
│   ├── Graph          — networks, social maps, routing
│   └── Heap           — priority queue, Dijkstra, Huffman
└── 6.3 Essential Algorithms
    ├── Sorting        — bubble, merge, quick, heap sort
    ├── Searching      — linear, binary search
    └── Algorithm Paradigms
        ├── Dynamic Programming — overlapping subproblems
        ├── Greedy              — local optimal → global
        └── Backtracking        — exhaustive search with pruning
├── 6.4 Sorting & Searching (chi tiết)
│   ├── Bubble/Insertion — O(n²), mảng nhỏ/gần sorted
│   ├── Merge/Quick     — O(n log n), stable vs in-place
│   └── Linear/Binary   — O(n) vs O(log n), khi nào sort trước
├── 6.5 Dynamic Programming (chi tiết)
│   ├── Memoization vs Tabulation — top-down vs bottom-up
│   ├── Fibonacci / 0/1 Knapsack  — 1D vs 2D DP
│   └── LCS                       — so sánh chuỗi, diff/DNA
├── 6.6 Graph Algorithms (chi tiết)
│   ├── BFS/DFS          — O(V+E), shortest unweighted vs cycle/topo
│   ├── Dijkstra/Bellman-Ford — trọng số dương vs cạnh âm
│   └── Topological sort + Union-Find — DAG order, gom nhóm O(α(n))
├── 6.7 String Algorithms
│   ├── Naive vs KMP / Rabin-Karp — O(n·m) vs O(n+m)
│   └── Sliding-window / Two-pointer — chuỗi con tối ưu, palindrome
└── 6.8 Recursion & Complexity (nâng cao)
    ├── Recursion vs Iteration — O(depth) stack vs O(1)
    ├── Recurrence + Amortized — Master theorem, push O(1)
    └── Space + NP-complete    — memory Big O, P vs NP, heuristic
```

---

## Tại Sao DSA Lại Quan Trọng?

Nhiều developer cảm thấy DSA "xa rời thực tế" vì daily code có rất nhiều high-level API. Nhưng DSA thực sự quan trọng vì ba lý do:

1. **Performance decision-making:** Bạn không thể biết nên dùng `Map` hay `Array` cho task X nếu không hiểu trade-off về time/space complexity. Ví dụ: tìm kiếm trong 1 triệu phần tử — linear scan là O(n) = 1,000,000 thao tác, trong khi hash map là O(1) ~vài nano giây. Khác biệt này là **hàng triệu lần**.

2. **Interview & engineering depth:** DSA là ngôn ngữ chung để đánh giá tư duy thuật toán. Nhưng quan trọng hơn — DSA dạy bạn **cách chia nhỏ vấn đề**, **nhận diện pattern**, và **đánh giá trade-off**. Những skill này không biến mất sau khi khỏi công ty.

3. **Framework bên dưới đều là DSA:** React virtual DOM diff là tree traversal. Database indexing là B-tree. Redis caching là hash map + LRU eviction. GraphQL query planning là graph traversal. Nếu hiểu DSA, bạn hiểu được **tại sao** công cụ bạn dùng hoạt động như vậy.

> 💡 **Misconception phổ biến:** "Tôi làm frontend/web app CRUD, không cần DSA." — Sai. Mọi app đều xử lý data ở đâu đó. Vấn đề chỉ là scale — với 100 users, O(n²) vẫn chạy ok; với 100K users, cùng code đó sẽ crash. DSA giúp bạn **tư duy trước** về giới hạn.

---

## Lộ Trình Học

```
┌─────────────────────────────────────────────────────────────────┐
│                        6.1 → 6.2 → 6.3                         │
│                                                                 │
│  6.1 Time Complexity                                          │
│  ├─ Big O, Omega, Theta notation                              │
│  ├─ How to calculate complexity from code                     │
│  └─ Common patterns: O(1), O(log n), O(n), O(n²), O(2ⁿ)     │
│                                                                 │
│  6.2 Core Data Structures                                     │
│  ├─ Array — random access, cache-friendly                     │
│  ├─ Linked List — dynamic size, O(1) prepend                  │
│  ├─ Stack — LIFO, call stack, undo                            │
│  ├─ Queue — FIFO, BFS, task scheduling                        │
│  ├─ Hash Map — O(1) lookup, caching                           │
│  ├─ BST — sorted data, O(log n) search                        │
│  ├─ Graph — networks, relationships                           │
│  └─ Heap — priority queue, Dijkstra                           │
│                                                                 │
│  6.3 Essential Algorithms                                     │
│  ├─ Sorting — when to use bubble vs merge vs quick            │
│  ├─ Searching — linear vs binary                              │
│  ├─ Dynamic Programming — memoization, tabulation             │
│  ├─ Greedy — when local optimal = global optimal              │
│  ├─ Backtracking — exhaustive search with pruning             │
│  └─ Graph algorithms — BFS, DFS, Dijkstra                     │
│                                                                 │
│  Prerequisite: 6.1 before 6.2 and 6.3                         │
│  Recommended order: 6.1 → 6.2 → 6.3                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Nguyên Tắc Chọn Data Structure

**Không có cấu trúc dữ liệu "tốt nhất"** — chỉ có cấu trúc phù hợp nhất với access pattern của bạn.

| Access Pattern | Data Structure recommendation | Why |
|----------------|-------------------------------|-----|
| Random access by index | Array | O(1) access, cache-friendly |
| Frequent insert/delete ở đầu | Linked List | O(1) prepend, không shift |
| Undo/Redo, expression eval | Stack | LIFO matches "last action first undone" |
| Task scheduling, BFS | Queue | FIFO matches "first submitted, first served" |
| Fast lookup by key | Hash Map | O(1) average, direct addressing |
| Range queries, sorted traversal | BST / B-Tree | In-order = sorted, O(log n) search |
| Top-K elements, streaming | Heap | O(log n) insert/extract, O(1) peek |
| Networks, relationships | Graph | Models connections naturally |

> 📌 **Golden rule:** Chọn data structure dựa trên **operation frequency**, không phải operation count. Nếu bạn read 1000 lần nhưng write 1 lần → chọn structure tối ưu read (Array, Hash Map). Nếu write thường xuyên → chọn structure tối ưu write (Linked List, Hash Map với resize).

---

## Algorithm Paradigms Overview

| Paradigm | Core Idea | Best For | When NOT to use |
|----------|-----------|----------|-----------------|
| **Divide & Conquer** | Chia nhỏ → solve independently → merge | Sorting (merge/quick), FFT | Khi subproblems overlap → dùng DP |
| **Dynamic Programming** | Solve subproblems once, reuse results | Optimization với overlapping subproblems | Khi không có optimal substructure |
| **Greedy** | Local optimal choice at each step | Activity selection, Huffman coding, Dijkstra | Khi greedy property không hold (knapsack 0/1) |
| **Backtracking** | Try all possibilities, prune invalid branches | Constraint satisfaction (N-Queens, sudoku) | Khi search space quá lớn không prune được |
| **Brute Force** | Try everything | Small inputs, verification | Khi n > 20 và solution space exponential |

---

## Comparison: Testing Pyramid trong Context DSA

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲          ← Test full algorithm end-to-end
                 ╱── Tests ──╲
                ╱───────────────╲
               ╱  Integration     ╲    ← Test algorithm + data structure together
              ╱      Tests         ╲
             ╱────────────────────────╲
            ╱     Unit Tests           ╲  ← Test individual functions
           ╱──────────────────────────────╲
```

| Test Level | DSA Example | Tool |
|------------|-------------|------|
| Unit | Test `binarySearch([1,2,3], 2)` returns `1` | Vitest/Jest |
| Integration | Test sort function with real large array | Benchmark suite |
| E2E | Test full application using sorting algorithm | Browser/CLI test |

---

## 🔗 Liên quan

- **07-testing** — Testing is essential to verify your DSA implementations
- **01-architecture** — Clean Architecture principles apply to DSA code organization

---

## ▶️ Chạy ví dụ

Mỗi submodule có examples riêng:

```bash
# 6.1 Time Complexity
cd 06-data-structures-and-algorithms/6.1-time-complexity
npx tsx examples/index.ts

# 6.2 Core Data Structures
cd 06-data-structures-and-algorithms/6.2-core-data-structures
npx tsx examples/index.ts

# 6.3 Essential Algorithms
cd 06-data-structures-and-algorithms/6.3-essential-algorithms
npx tsx examples/index.ts

# 6.4 Sorting & Searching
cd 06-data-structures-and-algorithms/6.4-sorting-searching
npx tsx examples/index.ts

# 6.5 Dynamic Programming
cd 06-data-structures-and-algorithms/6.5-dynamic-programming
npx tsx examples/index.ts

# 6.6 Graph Algorithms
cd 06-data-structures-and-algorithms/6.6-graph-algorithms
npx tsx examples/index.ts

# 6.7 String Algorithms
cd 06-data-structures-and-algorithms/6.7-string-algorithms
npx tsx examples/index.ts

# 6.8 Recursion & Complexity
cd 06-data-structures-and-algorithms/6.8-recursion-complexity
npx tsx examples/index.ts
```

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Tác giả | Level |
|----------|---------|-------|
| *Introduction to Algorithms* (CLRS) | Cormen et al. | Academic reference |
| *Grokking Algorithms* | Aditya Bhargava | Beginner-friendly |
| *The Art of Computer Programming* | Donald Knuth | Advanced reference |
| LeetCode / HackerRank | — | Practice problems |

---

## ⏭️ Bài tiếp theo

→ [6.1 Time Complexity](6.1-time-complexity/README.md)
