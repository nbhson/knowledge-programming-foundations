# 📐 Lớp 6: Data Structures & Algorithms (Cấu Trúc Dữ Liệu & Thuật Toán)

> **DSA** là **nền tảng toán học** của lập trình — luôn đúng, luôn cần,
> bất kể bạn dùng framework hay ngôn ngữ nào.
>
> **Ví dụ:** Vật liệu xây dựng — gạch, thép, bê tông.

---

## 6.1 Time Complexity (Độ Phức Tạp Thời Gian)

| Notation | Tên | Mô Tả | Ví Dụ |
|----------|-----|-------|-------|
| **O(1)** | Constant | Không phụ thuộc input | Hash Map lookup |
| **O(log n)** | Logarithmic | Chia đôi liên tục | Binary Search |
| **O(n)** | Linear | Duyệt từng phần tử | Linear Search |
| **O(n log n)** | Linearithmic | Merge Sort, Quick Sort | Sorting |
| **O(n²)** | Quadratic | Vòng lặp lồng nhau | Bubble Sort |
| **O(2ⁿ)** | Exponential | Mở rộng hàm mũ | Recursive Fibonacci |
| **O(n!)** | Factorial | Gia thừa | Permutations |

---

## 6.2 Core Data Structures

| Data Structure | Truy Xuất | Thêm/Xóa | Ghi Chú |
|----------------|----------|----------|---------|
| **Array** | O(1) theo index | O(n) thêm đầu, O(1) thêm cuối | Mảng tĩnh/động |
| **Linked List** | O(n) | O(1) thêm đầu | Con trỏ tới node tiếp |
| **Stack** | O(1) top | O(1) push/pop | LIFO — Undo/Redo, Browser History |
| **Queue** | O(1) front | O(1) enqueue, O(n) dequeue | FIFO — Task scheduling, BFS |
| **Hash Map** | O(1) average | O(1) set/delete | Caching, Counting, Grouping |
| **Tree (BST)** | O(log n) average | O(log n) insert/delete | left < root < right |
| **Graph** | — | — | Adjacency List/Matrix, BFS, DFS, Dijkstra |
| **Heap (Priority Queue)** | O(1) peek | O(log n) insert/extract | Min/Max Heap, priority scheduling |

---

## 6.3 Essential Algorithms

### Sorting Algorithms

| Algorithm | Time (avg) | Space | Stable |
|-----------|------------|-------|--------|
| Bubble Sort | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(1) | ❌ |

### Search Algorithms

| Algorithm | Time | Điều Kiện |
|-----------|------|----------|
| **Binary Search** | O(log n) | Array phải sorted |
| **Linear Search** | O(n) | Không cần sorted |

### Algorithm Paradigms

| Thuật Toán | Mô Tả |
|-----------|-------|
| **Dynamic Programming** | Chia nhỏ thành subproblems, memoize kết quả (Fibonacci, Knapsack) |
| **Greedy Algorithm** | Luôn chọn lựa chọn tốt nhất tại mỗi bước (Coin Change) |
| **Backtracking** | Thử và quay lui khi gặp invalid state (N-Queens, Sudoku) |