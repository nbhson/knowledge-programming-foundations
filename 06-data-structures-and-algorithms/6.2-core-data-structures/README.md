# 📐 6.2 Core Data Structures (Cấu Trúc Dữ Liệu Cốt Lõi)

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
| 6.3 | Essential Algorithms (Thuật Toán Cốt Lõi) | Sorting, Searching, DP, Greedy, Backtracking, Graph algorithms | [6.3-essential-algorithms](../6.3-essential-algorithms/README.md) |

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
```

---

## Tại Sao DSA Lại Quan Trọng?

Nhiều developer cảm thấy DSA "xa rời thực tế" vì日常 code có rất nhiều high-level API. Nhưng DSA thực sự quan trọng vì ba lý do:

1. **Performance decision-making:** Bạn không thể biết nên dùng `Map` hay `Array` cho task X nếu không hiểu trade-off về time/space complexity. Ví dụ: tìm kiếm trong 1 triệu phần tử — linear scan là O(n) = 1,000,000 thao tác, trong khi hash map là O(1) ~vài nano giây. Khác biệt này là **hàng triệu lần**.

2. **Interview & engineering depth:** DSA là ngôn ngữ chung để đánh giá tư duy thuật toán. Nhưng quan trọng hơn — DSA dạy bạn **cách chia nhỏ vấn đề**, **nhận diện pattern**, và **đánh giá trade-off**. Những skill này không biến mất sau khi khỏi công ty.

3. **Framework底层 đều là DSA:** React virtual DOM diff là tree traversal. Database indexing là B-tree. Redis caching là hash map + LRU eviction. GraphQL query planning là graph traversal. Nếu hiểu DSA, bạn hiểu được **tại sao** công cụ bạn dùng hoạt động như vậy.

> 💡 **Misconception phổ biến:** "Tôi làm frontend/web app CRUD, không cần DSA." — Sai. Mọi app đều xử lý data ở đâu đó. Vấn đề chỉ là scale — với 100 users, O(n²) vẫn chạy ok; với 100K users, cùng code đó sẽ crash. DSA giúp bạn **tư duy trước** về giới hạn.

---

## 6.1 Time Complexity (Độ Phức Tạp Thời Gian)

### Big O Notation

Đo lường **hiệu suất** của thuật toán khi input tăng lên.

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

| Notation | Tên | Mô Tả | Ví Dụ | Giải thích sâu |
|----------|-----|-------|-------|----------------|
| **O(1)** | Constant | Không phụ thuộc input | Hash Map lookup | Dù input 10 hay 1 tỷ phần tử, thời gian vẫn như nhau. Đặc trưng: truy cập trực tiếp theo index hoặc hash. |
| **O(log n)** | Logarithmic | Chia đôi liên tục | Binary Search | Mỗi bước giảm kích thước bài toán một nửa. Ví dụ: tìm sách trong thư viện có sắp xếp — mở giữa, quyết định sang trái/phải. |
| **O(n)** | Linear | Duyệt từng phần tử | Linear Search | Time tăng tỷ lệ thuận với input. 2x input = 2x time. Cơ bản nhất, dễ hiểu nhưng chưa tối ưu. |
| **O(n log n)** | Linearithmic | Divide & Conquer | Merge Sort, Quick Sort | Kết hợp chia nhỏ (log n) + ghép lại (n). Đây là giới hạn dưới của sorting dựa trên comparison — không thuật toán comparison-sort nào tốt hơn O(n log n). |
| **O(n²)** | Quadratic | Vòng lặp lồng nhau | Bubble Sort | Double loop → tăng nhanh. Với n=1000 → 1,000,000 ops. Thường là dấu hiệu code kém hiệu quả, trừ khi input cực nhỏ. |
| **O(2ⁿ)** | Exponential | Mở rộng hàm mũ | Recursive Fibonacci | Mỗi bước nhân đôi. n=30 ≈ 1 tỷ thao tác. Chỉ chấp nhận được với n < 20. |
| **O(n!)** | Factorial | Gia thừa | Permutations | Cực kỳ tệ. N-Queens với n=15 đã là hàng triệu tỷ branch. Chỉ dùng backtracking với pruning. |

### Cách Tính Big O

```typescript
// O(1) — Constant
function getFirst(arr: number[]): number {
  return arr[0];
}

// O(n) — Linear
function findMax(arr: number[]): number {
  let max = arr[0];
  for (const num of arr) {
    if (num > max) max = num;
  }
  return max;
}

// O(n²) — Quadratic
function bubbleSort(arr: number[]): number[] {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

// O(log n) — Logarithmic
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

// O(n log n) — Linearithmic (Merge Sort)
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
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
}
```

> 📌 **Quy tắc bỏ qua constants:** O(2n) = O(n), O(n + 5) = O(n). Chúng ta chỉ quan tâm **growth rate** — input gấp 100 lần thì thời gian tăng bao nhiêu lần.

> 💡 **Misconception:** "Big O đo thời gian tuyệt đối." — Sai. Big O đo **tỷ lệ tăng** (growth rate), không phải millisecond thực tế. Một O(n) với hằng số lớn (vd: copy 1000 lần mỗi phần tử) có thể chậm hơn O(n log n) với hằng số nhỏ (vd: merge sort) khi n còn nhỏ.

---

## 6.2 Core Data Structures

---

### Array (Mảng)

**Mô tả:** Collection elements **liên tục trong bộ nhớ**, truy cập theo index.

```typescript
// Tạo mảng
const numbers: number[] = [1, 2, 3, 4, 5];

// Truy cập — O(1)
numbers[0]; // 1
numbers[2]; // 3

// Thêm cuối — O(1) amortized
numbers.push(6); // [1, 2, 3, 4, 5, 6]

// Thêm đầu — O(n) phải shift
numbers.unshift(0); // [0, 1, 2, 3, 4, 5, 6]

// Xóa — O(n) phải shift
numbers.splice(2, 1); // Xóa tại index 2

// Duyệt
numbers.forEach(n => console.log(n));
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
```

**Phía sau mỗi array (memory layout):**
```
Index:   0    1    2    3    4    5
         ┌────┬────┬────┬────┬────┬────┐
Value:   │ 10 │ 20 │ 30 │ 40 │ 50 │ 60 │
         └────┴────┴────┴────┴────┴────┘
         ↑                                  ↑
      base_address                    base + 5*size
```

**Complexity:**
| Operation | Average | Worst | Giải thích sâu |
|-----------|---------|-------|----------------|
| Access | O(1) | O(1) | Compute `base + index * size` → CPU cache-friendly |
| Search | O(n) | O(n) | Không sắp xếp → phải duyệt từ đầu |
| Insert (end) | O(1) amortized | O(n) | Amortized: khi array đầy, alloc lại 2x capacity, copy toàn bộ → rare |
| Insert (begin) | O(n) | O(n) | Phải shift TẤT CẢ phần tử sang phải 1 vị trí |
| Delete | O(n) | O(n) | Sau khi xóa, phải shift phần tử phía sau sang trái |

**Use cases:** Random access, stack/queue nền, dữ liệu có kích thước cố định, cache-friendly loops.
**Khi nào KHÔNG dùng array?** Khi cần insert/delete thường xuyên ở đầu/middle → dùng Linked List hoặc Hash Map.

---

### Linked List (Danh Sách Liên Kết)

**Mô tả:** Collection elements (nodes), mỗi node chứa **data** và **con trỏ** tới node tiếp.

```
[1|→] → [2|→] → [3|→] → [null]
 head                 tail
```

```typescript
class ListNode<T> {
  constructor(
    public data: T,
    public next: ListNode<T> | null = null
  ) {}
}

class LinkedList<T> {
  private head: ListNode<T> | null = null;
  private size = 0;

  // Thêm đầu — O(1)
  prepend(data: T): void {
    const node = new ListNode(data);
    node.next = this.head;
    this.head = node;
    this.size++;
  }

  // Thêm cuối — O(n)
  append(data: T): void {
    const node = new ListNode(data);
    if (!this.head) {
      this.head = node;
    } else {
      let current = this.head;
      while (current.next) current = current.next;
      current.next = node;
    }
    this.size++;
  }

  // Xóa theo giá trị — O(n)
  remove(data: T): void {
    if (!this.head) return;

    if (this.head.data === data) {
      this.head = this.head.next;
      this.size--;
      return;
    }

    let current = this.head;
    while (current.next) {
      if (current.next.data === data) {
        current.next = current.next.next;
        this.size--;
        return;
      }
      current = current.next;
    }
  }

  // Tìm kiếm — O(n)
  find(data: T): ListNode<T> | null {
    let current = this.head;
    while (current) {
      if (current.data === data) return current;
      current = current.next;
    }
    return null;
  }

  // Duyệt — O(n)
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }
}

// Usage
const list = new LinkedList<number>();
list.append(1);
list.append(2);
list.append(3);
list.prepend(0);
console.log(list.toArray()); // [0, 1, 2, 3]
list.remove(2);
console.log(list.toArray()); // [0, 1, 3]
```

**Thực tế trong JavaScript:** `Array.prototype.shift()` thực chất là O(n) vì nó phải reindex tất cả phần tử. Để get performance O(1) prepend, nên dùng deque hoặc linked list tự implement.

**Complexity:**
| Operation | Average | Worst | So với Array |
|-----------|---------|-------|--------------|
| Access | O(n) | O(n) | Array O(1) ✅ |
| Search | O(n) | O(n) | Tương đương |
| Insert (head) | O(1) | O(1) | Array O(n) ❌ |
| Insert (tail) | O(n) | O(n) | Array O(1) ✅ |
| Delete | O(n) | O(n) | Array O(n) ✅ |

**When to use:** Frequently prepend/append at known ends, implement stack/queue, laggacy systems (C/C++ với pointer), song song với iterator-based traversal.

---

### Stack (Ngăn Xếp)

**Mô tả:** LIFO (Last In, First Out) — phần tử cuối cùng được thêm vào sẽ được lấy ra đầu tiên.

```
      ┌───────┐
      │ Item3 │ ← Top (last in, first out)
      ├───────┤
      │ Item2 │
      ├───────┤
      │ Item1 │
      └───────┘
```

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// Usage
const stack = new Stack<string>();
stack.push("A");
stack.push("B");
stack.push("C");

console.log(stack.pop());   // C (last in, first out)
console.log(stack.peek());  // B
console.log(stack.size());  // 2

// Practical: Undo/Redo
class TextEditor {
  private history: Stack<string> = new Stack();
  private redoStack: Stack<string> = new Stack();
  private currentText = "";

  type(text: string) {
    this.history.push(this.currentText);
    this.currentText += text;
    this.redoStack = new Stack(); // Clear redo on new action
  }

  undo() {
    const prev = this.history.pop();
    if (prev !== undefined) {
      this.redoStack.push(this.currentText);
      this.currentText = prev;
    }
  }

  redo() {
    const next = this.redoStack.pop();
    if (next !== undefined) {
      this.history.push(this.currentText);
      this.currentText = next;
    }
  }
}
```

**Real-world examples:**
- **Call Stack** (ngôn ngữ lập trình): Mỗi function call đẩy frame lên stack, return pop ra. Deep recursion = stack overflow.
- **Browser History:** Back button = pop(), forward = push vào stack khác.
- **Expression Evaluation:** `4 + 5 * 2` — stack lưu operators, ưu tiên `*` trước `+`.
- **Parenthesis Matching:** `()` validation — push `(`, pop khi gặp `)`.

---

### Queue (Hàng Đợi)

**Mô tả:** FIFO (First In, First Out) — phần tử đầu tiên được thêm vào sẽ được lấy ra đầu tiên.

```
  Dequeue ← [Item1] [Item2] [Item3] ← Enqueue
             Front                 Rear
```

```typescript
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift(); // O(n) — shift all elements
  }

  peek(): T | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// Circular Queue — O(1) dequeue
class CircularQueue<T> {
  private items: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(private capacity: number) {
    this.items = new Array(capacity);
  }

  enqueue(item: T): void {
    if (this.count === this.capacity) throw new Error("Queue is full");
    this.items[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
  }

  dequeue(): T | undefined {
    if (this.count === 0) return undefined;
    const item = this.items[this.head];
    this.items[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }
}

// Usage
const queue = new Queue<string>();
queue.enqueue("Task1");
queue.enqueue("Task2");
queue.enqueue("Task3");

console.log(queue.dequeue()); // Task1 (first in, first out)
console.log(queue.peek());    // Task2
```

**Real-world examples:**
- **Task Scheduling:** OS process scheduler (round-robin) — mỗi process được 1 quantum.
- **BFS (Breadth-First Search):** Graph traversal dùng queue để explore theo từng layer.
- **Message Queue:** Kafka, RabbitMQ — consumer pull từ queue.
- **Print Queue:** Document in → print out theo thứ tự.
- **Network Packet:** Router buffers packets trong TCP window.

---

### Hash Map (Bảng Băm)

**Mô tả:** Collection key-value pairs, truy cập **O(1)** trung bình.

```
Hash Function: key → index

"john" → hash("john") % 8 → index 3
"jane" → hash("jane") % 8 → index 5

┌───────┐
│   0   │
│   1   │
│   2   │
│   3   │ → ["john", {name: "John", age: 25}]
│   4   │
│   5   │ → ["jane", {name: "Jane", age: 30}]
│   6   │
│   7   │
└───────┘
```

```typescript
// JavaScript Map
const map = new Map<string, number>();

map.set("age", 25);
map.set("score", 100);

console.log(map.get("age"));   // 25 — O(1)
console.log(map.has("score")); // true — O(1)
map.delete("score");           // O(1)
console.log(map.size);         // 1

// JavaScript Object (simpler)
const user: Record<string, any> = {
  name: "John",
  age: 25
};

// Custom Hash Map implementation
class HashMap<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private size = 0;

  constructor(private capacity: number = 16) {
    this.buckets = Array.from({ length: capacity }, () => []);
  }

  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % this.capacity;
    }
    return hash;
  }

  set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    const existing = bucket.find(([k]) => k === key);
    if (existing) {
      existing[1] = value;
    } else {
      bucket.push([key, value]);
      this.size++;
    }
  }

  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const found = bucket.find(([k]) => k === key);
    return found?.[1];
  }

  has(key: K): boolean {
    const index = this.hash(key);
    return this.buckets[index].some(([k]) => k === key);
  }

  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const idx = bucket.findIndex(([k]) => k === key);
    if (idx !== -1) {
      bucket.splice(idx, 1);
      this.size--;
      return true;
    }
    return false;
  }

  get size() { return this.size; }
}

// Usage
const map = new HashMap<string, number>();
map.set("apple", 5);
map.set("banana", 3);
console.log(map.get("apple"));  // 5 — O(1)
console.log(map.has("banana")); // true
```

**Collision — vấn đề thực sự của Hash Map:** Khi 2 key khác nhau hash ra cùng index, xảy ra **collision**. Cách giải quyết phổ biến: **chaining** (dùng linked list tại mỗi bucket — như code trên) hoặc **open addressing** (linear probing, tìm slot trống gần nhất).

Trong JavaScript, `Map` native đã tối ưu hóa collision handling + resizing (khi load factor > 0.75, capacity nhân đôi). Object literal `{}` cũng dùng hash map nội bộ nhưng chỉ support string keys.

**Complexity:**
| Operation | Average | Worst (many collisions) | Giải thích sâu |
|-----------|---------|------------------------|----------------|
| Access | O(1) | O(n) | Worst-case: tất cả key hash ra cùng bucket →變成 linked list search |
| Search | O(1) | O(n) | Tương tự |
| Insert | O(1) | O(n) | Khi resize → O(n) nhưng rare (amortized O(1)) |
| Delete | O(1) | O(n) | Cần tìm rồi splice |

**Use cases:** Caching (LRU cache), frequency counting, deduplication, symbol tables, join in database, grouping by key.

> 💡 **Misconception:** "HashMap luôn O(1)." — Không đúng. Average case là O(1), nhưng worst case có thể O(n) khi hash function kém hoặc attack (hash flooding). Trong security-sensitive context, dùng **randomized hashing** (Robin Hood hashing) để tránh collision attack.

---

### Tree (BST — Binary Search Tree)

**Mô tả:** Cấu trúc tree nhị phân — mỗi node có最多 2 con. **Left < Root < Right**.

```
        8
       / \
      3   10
     / \    \
    1   6    14
       / \
      4   7
```

```typescript
class TreeNode {
  constructor(
    public value: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null
  ) {}
}

class BinarySearchTree {
  private root: TreeNode | null = null;

  // Insert — O(log n) average
  insert(value: number): void {
    this.root = this.insertNode(this.root, value);
  }

  private insertNode(node: TreeNode | null, value: number): TreeNode {
    if (!node) return new TreeNode(value);

    if (value < node.value) {
      node.left = this.insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = this.insertNode(node.right, value);
    }

    return node;
  }

  // Search — O(log n) average
  search(value: number): TreeNode | null {
    return this.searchNode(this.root, value);
  }

  private searchNode(node: TreeNode | null, value: number): TreeNode | null {
    if (!node || node.value === value) return node;

    if (value < node.value) {
      return this.searchNode(node.left, value);
    }
    return this.searchNode(node.right, value);
  }

  // In-order Traversal (sorted) — O(n)
  inOrder(node: TreeNode | null = this.root): number[] {
    if (!node) return [];
    return [
      ...this.inOrder(node.left),
      node.value,
      ...this.inOrder(node.right)
    ];
  }

  // Pre-order Traversal — O(n)
  preOrder(node: TreeNode | null = this.root): number[] {
    if (!node) return [];
    return [
      node.value,
      ...this.preOrder(node.left),
      ...this.preOrder(node.right)
    ];
  }

  // Post-order Traversal — O(n)
  postOrder(node: TreeNode | null = this.root): number[] {
    if (!node) return [];
    return [
      ...this.postOrder(node.left),
      ...this.postOrder(node.right),
      node.value
    ];
  }

  // Find min — O(log n)
  findMin(node: TreeNode | null = this.root): number | null {
    if (!node) return null;
    while (node.left) node = node.left;
    return node.value;
  }

  // Find max — O(log n)
  findMax(node: TreeNode | null = this.root): number | null {
    if (!node) return null;
    while (node.right) node = node.right;
    return node.value;
  }
}

// Usage
const bst = new BinarySearchTree();
bst.insert(8);
bst.insert(3);
bst.insert(10);
bst.insert(1);
bst.insert(6);
bst.insert(14);

console.log(bst.inOrder());   // [1, 3, 6, 8, 10, 14] — sorted!
console.log(bst.preOrder());  // [8, 3, 1, 6, 10, 14]
console.log(bst.search(6));   // TreeNode { value: 6 }
console.log(bst.search(99));  // null
```

**Traversal comparison:**

| Traversal | Thứ tự | Ứng dụng |
|-----------|--------|----------|
| In-order (L-R-N) | trái → root → phải | **Sorted output** — tính năng quan trọng nhất của BST |
| Pre-order (N-L-R) | root → trái → phải | **Copy tree**, serialize, expression tree evaluation |
| Post-order (L-R-N) | trái → phải → root | **Delete tree**, evaluate postfix expression |

**Problem: Skewed Tree** — Nếu insert theo thứ tự tăng dần (1,2,3,4,5), cây becomes linked list → O(n) thay vì O(log n). Giải pháp: **Self-balancing tree** như AVL (cân bằng sau mỗi insert) hoặc Red-Black Tree (dùng trong Java `TreeMap`, C++ `std::map`).

**Complexity:**
| Operation | Average | Worst (unbalanced) |
|-----------|---------|-------------------|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

**Use cases:** Database indexing (B-tree/B+tree), file system directory tree, expression parsing, priority queues (heap variant).

> 💡 **Industry note:** PostgreSQL, MySQL đều dùng **B+ Tree** (phiên bản mở rộng của BST) làm index. B+ tree giữ data ở leaf nodes, các leaf được nối thành linked list → range query cực nhanh. Đây là lý do `WHERE col BETWEEN x AND y` với index chạy O(log n + k) chứ không phải O(n).

---

### Graph (Đồ Thị)

**Mô tả:** Collection **nodes (vertices)** và **edges** — mô tả mối quan hệ giữa các entities.

```
Undirected Graph:           Directed Graph:
  A --- B                     A → B
  |   / |                     |   ↓
  |  /  |                     ↓   C
  C --- D                     C → D
```

```typescript
// Adjacency List representation
class Graph {
  private adjacencyList: Map<string, string[]> = new Map();

  addVertex(vertex: string): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  addEdge(v1: string, v2: string): void {
    this.adjacencyList.get(v1)?.push(v2);
    this.adjacencyList.get(v2)?.push(v1); // Undirected
  }

  // BFS — O(V + E)
  bfs(start: string): string[] {
    const visited = new Set<string>();
    const queue = [start];
    const result: string[] = [];

    visited.add(start);

    while (queue.length > 0) {
      const vertex = queue.shift()!;
      result.push(vertex);

      for (const neighbor of this.adjacencyList.get(vertex) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  // DFS — O(V + E)
  dfs(start: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const dfsRecursive = (vertex: string) => {
      visited.add(vertex);
      result.push(vertex);

      for (const neighbor of this.adjacencyList.get(vertex) || []) {
        if (!visited.has(neighbor)) {
          dfsRecursive(neighbor);
        }
      }
    };

    dfsRecursive(start);
    return result;
  }

  // Find shortest path (BFS)
  shortestPath(start: string, end: string): string[] {
    const visited = new Set<string>();
    const queue: string[][] = [[start]];
    visited.add(start);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const vertex = path[path.length - 1];

      if (vertex === end) return path;

      for (const neighbor of this.adjacencyList.get(vertex) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return []; // No path found
  }
}

// Usage
const graph = new Graph();
graph.addVertex("A");
graph.addVertex("B");
graph.addVertex("C");
graph.addVertex("D");
graph.addEdge("A", "B");
graph.addEdge("A", "C");
graph.addEdge("B", "D");
graph.addEdge("C", "D");

console.log(graph.bfs("A"));   // ["A", "B", "C", "D"]
console.log(graph.dfs("A"));   // ["A", "B", "D", "C"]
console.log(graph.shortestPath("A", "D")); // ["A", "B", "D"] or ["A", "C", "D"]
```

**Adjacency List vs Adjacency Matrix:**

| Biểu diễn | Memory | Add edge | Check edge | Best for |
|-----------|--------|----------|------------|----------|
| Adjacency List | O(V+E) | O(1) | O(degree) | Sparse graphs (most real-world) |
| Adjacency Matrix | O(V²) | O(1) | O(1) | Dense graphs, small V |

**Real-world examples:**
- **Social networks:** Users = vertices, friendships = edges.
- **Google Maps:** Intersections = vertices, roads = edges, weights = distance/time.
- **Web crawlers:** Pages = vertices, hyperlinks = edges.
- **Dependency graphs:** npm packages, Makefile rules, build systems.
- **CPU register allocation:** Variables = vertices, conflicts = edges → graph coloring problem.

**BFS vs DFS — When to use which:**

| Thuộc tính | BFS | DFS |
|------------|-----|-----|
| Structure | Queue | Stack (hoặc recursion) |
| Finds | Shortest path (unweighted) | Any path, connectivity |
| Memory | O(V) — queue can be large | O(h) — height of tree |
| Best for | Shortest path, level-order | Topological sort, cycle detection, maze solving |

---

### Heap (Priority Queue)

**Mô tả:** Tree nhị phân satisfies heap property — **Min Heap**: parent ≤ children, **Max Heap**: parent ≥ children.

```
Min Heap:              Max Heap:
      1                     8
     / \                   / \
    3   5                 6   7
   / \                   / \
  7   8                 3   5
```

```typescript
class MinHeap {
  private heap: number[] = [];

  get size() { return this.heap.length; }

  // Insert — O(log n)
  insert(value: number): void {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  // Extract min — O(log n)
  extractMin(): number | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.sinkDown(0);
    return min;
  }

  // Peek min — O(1)
  peek(): number | undefined {
    return this.heap[0];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this.heap[parentIdx] <= this.heap[index]) break;
      [this.heap[parentIdx], this.heap[index]] = [this.heap[index], this.heap[parentIdx]];
      index = parentIdx;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.heap[left] < this.heap[smallest]) {
        smallest = left;
      }
      if (right < length && this.heap[right] < this.heap[smallest]) {
        smallest = right;
      }

      if (smallest === index) break;
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }
}

// Usage — Priority Queue
class PriorityQueue {
  private heap = new MinHeap();

  enqueue(value: number): void {
    this.heap.insert(value);
  }

  dequeue(): number | undefined {
    return this.heap.extractMin();
  }

  peek(): number | undefined {
    return this.heap.peek();
  }
}

const pq = new PriorityQueue();
pq.enqueue(5);
pq.enqueue(1);
pq.enqueue(3);
pq.enqueue(8);

console.log(pq.dequeue()); // 1 (lowest first)
console.log(pq.dequeue()); // 3
console.log(pq.dequeue()); // 5
```

**Memory layout (array-based heap):**
```
Index:  0   1   2   3   4
       ┌───┬───┬───┬───┬───┐
Value:  │ 1 │ 3 │ 5 │ 7 │ 8 │
       └───┴───┴───┴───┴───┘
Parent(i) = floor((i-1)/2)
Left(i)   = 2i + 1
Right(i)  = 2i + 2
```

**Use cases:** Dijkstra shortest path, Huffman coding (compression), task scheduler (priority tasks), top-K elements (keep heap of size K), merge K sorted arrays.

**Complexity:**
| Operation | Complexity | Ghi chú |
|-----------|------------|---------|
| Insert | O(log n) | Bubble up from leaf |
| Extract min/max | O(log n) | Replace root with last, sink down |
| Peek | O(1) | Root luôn là min/max |
| Build heap | O(n) | Linear build — bottom-up heapify |

> 💡 **Famous fact:** `Arrays.sort()` trong Java/TypeScript dùng **TimSort** (hybrid of merge sort + insertion sort) với O(n log n) guaranteed. Nhưng ** heapsort ** (O(n log n) worst case, O(1) space) thường bị skip vì không cache-friendly — đây là trade-off giữa theoretical guarantee và practical performance.

---

## Bảng Tổng Hợp Chọn Data Structure

| Vấn Đề | Data Structure Gợi Ý | Time | Why |
|--------|----------------------|------|-----|
| Random access theo index | Array | O(1) | Contiguous memory, cache-friendly |
| Insert/delete frequent ở middle | Linked List | O(1)* | Không cần shift, chỉ đổi pointer |
| Undo/Redo, expression eval | Stack | O(1) | LIFO matches "last action first undone" |
| Task scheduling, BFS | Queue | O(1) | FIFO matches "first submitted, first served" |
| Fast lookup by key | Hash Map | O(1) avg | Direct addressing via hash |
| Sorted range queries | BST / B-Tree | O(log n) | In-order traversal = sorted |
| Top-K / streaming stats | Heap | O(log n) | Maintain only top elements |
| Network / relationships | Graph | O(V+E) | Models connections naturally |

---

## 🔗 Liên quan

- **6.1 Time Complexity** — Big O notation used throughout
- **6.3 Essential Algorithms** — Algorithms that use these structures

---

## ▶️ Chạy ví dụ

```bash
cd 06-data-structures-and-algorithms/6.2-core-data-structures
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [6.3 Essential Algorithms](../6.3-essential-algorithms/README.md)
