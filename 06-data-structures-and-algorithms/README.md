# 📐 Lớp 6: Data Structures & Algorithms (Cấu Trúc Dữ Liệu & Thuật Toán)

> **DSA** là **nền tảng toán học** của lập trình — luôn đúng, luôn cần,
> bất kể bạn dùng framework hay ngôn ngữ nào.
>
> **Ví dụ:** Vật liệu xây dựng — gạch, thép, bê tông.

---

## Tổng Quan

```
Data Structures & Algorithms
├── 6.1 Time Complexity (Độ Phức Tạp Thời Gian)
├── 6.2 Core Data Structures
│   ├── Array
│   ├── Linked List
│   ├── Stack
│   ├── Queue
│   ├── Hash Map
│   ├── Tree (BST)
│   ├── Graph
│   └── Heap (Priority Queue)
└── 6.3 Essential Algorithms
    ├── Sorting
    ├── Searching
    └── Algorithm Paradigms (DP, Greedy, Backtracking)
```

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

| Notation | Tên | Mô Tả | Ví Dụ |
|----------|-----|-------|-------|
| **O(1)** | Constant | Không phụ thuộc input | Hash Map lookup |
| **O(log n)** | Logarithmic | Chia đôi liên tục | Binary Search |
| **O(n)** | Linear | Duyệt từng phần tử | Linear Search |
| **O(n log n)** | Linearithmic | Merge Sort, Quick Sort | Sorting |
| **O(n²)** | Quadratic | Vòng lặp lồng nhau | Bubble Sort |
| **O(2ⁿ)** | Exponential | Mở rộng hàm mũ | Recursive Fibonacci |
| **O(n!)** | Factorial | Gia thừa | Permutations |

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

**Complexity:**
| Operation | Average | Worst |
|-----------|---------|-------|
| Access | O(1) | O(1) |
| Search | O(n) | O(n) |
| Insert (end) | O(1) | O(n) |
| Insert (begin) | O(n) | O(n) |
| Delete | O(n) | O(n) |

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

**Complexity:**
| Operation | Average | Worst |
|-----------|---------|-------|
| Access | O(n) | O(n) |
| Search | O(n) | O(n) |
| Insert (head) | O(1) | O(1) |
| Insert (tail) | O(n) | O(n) |
| Delete | O(n) | O(n) |

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

**Use cases:** Undo/Redo, Browser History, Expression evaluation, Call stack.

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

**Use cases:** Task scheduling, BFS, Message queues, Print queue.

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

**Complexity:**
| Operation | Average | Worst (many collisions) |
|-----------|---------|------------------------|
| Access | O(1) | O(n) |
| Search | O(1) | O(n) |
| Insert | O(1) | O(n) |
| Delete | O(1) | O(n) |

**Use cases:** Caching, Counting, Grouping, Fast lookup, Symbol tables.

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

**Complexity:**
| Operation | Average | Worst (unbalanced) |
|-----------|---------|-------------------|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

**Use cases:** Database indexing, File system, Expression parsing, Priority queues.

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

---

## 6.3 Essential Algorithms

---

### Sorting Algorithms

#### Bubble Sort — O(n²)

```typescript
function bubbleSort(arr: number[]): number[] {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
```

#### Selection Sort — O(n²)

```typescript
function selectionSort(arr: number[]): number[] {
  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}
```

#### Insertion Sort — O(n²)

```typescript
function insertionSort(arr: number[]): number[] {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}
```

#### Merge Sort — O(n log n)

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
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
}
```

#### Quick Sort — O(n log n) average

```typescript
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}
```

#### Comparison Table

| Algorithm | Time (avg) | Time (worst) | Space | Stable |
|-----------|------------|--------------|-------|--------|
| Bubble Sort | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(1) | ❌ |

---

### Search Algorithms

#### Binary Search — O(log n)

**Điều kiện:** Array phải **sorted**.

```typescript
function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1; // Not found
}

// Recursive version
function binarySearchRecursive(
  arr: number[],
  target: number,
  left = 0,
  right = arr.length - 1
): number {
  if (left > right) return -1;

  const mid = Math.floor((left + right) / 2);

  if (arr[mid] === target) return mid;
  if (arr[mid] < target) return binarySearchRecursive(arr, target, mid + 1, right);
  return binarySearchRecursive(arr, target, left, mid - 1);
}

// Usage
const sorted = [1, 3, 5, 7, 9, 11, 13, 15];
console.log(binarySearch(sorted, 7));  // 3 (index)
console.log(binarySearch(sorted, 4));  // -1 (not found)
```

---

### Algorithm Paradigms

#### Dynamic Programming (DP)

**Mô tả:** Chia nhỏ thành **subproblems**, **memoize** (cache) kết quả để tránh tính lại.

```typescript
// Fibonacci — Naive O(2ⁿ) → DP O(n)
// ❌ Naive — exponential
function fibNaive(n: number): number {
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2); // Calculating same subproblems many times!
}

// ✅ Memoization (Top-Down DP) — O(n)
function fibMemo(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!;

  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}

// ✅ Tabulation (Bottom-Up DP) — O(n)
function fibTab(n: number): number {
  if (n <= 1) return n;

  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}

console.log(fibMemo(50));  // 12586269025 — instant!
console.log(fibTab(50));   // 12586269025

// Classic: 0/1 Knapsack Problem
function knapsack(
  weights: number[],
  values: number[],
  capacity: number
): number {
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],                                    // Don't take item
          dp[i - 1][w - weights[i - 1]] + values[i - 1]   // Take item
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  return dp[n][capacity];
}

const weights = [2, 3, 4, 5];
const values = [3, 4, 5, 6];
console.log(knapsack(weights, values, 8)); // 10
```

---

#### Greedy Algorithm

**Mô tả:** Luôn chọn **lựa chọn tốt nhất tại mỗi bước** (local optimal → hopefully global optimal).

```typescript
// Coin Change (Greedy works for standard denominations)
function coinChange(coins: number[], amount: number): number[] {
  const result: number[] = [];
  let remaining = amount;

  for (const coin of coins) {
    while (remaining >= coin) {
      result.push(coin);
      remaining -= coin;
    }
  }

  return remaining === 0 ? result : []; // No solution
}

console.log(coinChange([25, 10, 5, 1], 41)); // [25, 10, 5, 1]

// Activity Selection Problem
interface Activity {
  start: number;
  end: number;
  name: string;
}

function activitySelection(activities: Activity[]): Activity[] {
  // Sort by end time
  const sorted = [...activities].sort((a, b) => a.end - b.end);
  const selected: Activity[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start >= selected[selected.length - 1].end) {
      selected.push(sorted[i]);
    }
  }

  return selected;
}

const activities = [
  { start: 1, end: 4, name: "A" },
  { start: 3, end: 5, name: "B" },
  { start: 0, end: 6, name: "C" },
  { start: 5, end: 7, name: "D" },
  { start: 3, end: 9, name: "E" },
  { start: 5, end: 9, name: "F" },
  { start: 6, end: 10, name: "G" },
  { start: 8, end: 11, name: "H" },
];

console.log(activitySelection(activities));
// [{start:1,end:4,name:"A"}, {start:5,end:7,name:"D"}, {start:8,end:11,name:"H"}]
```

---

#### Backtracking

**Mô tả:** **Thử và quay lui** khi gặp invalid state — explores all possibilities.

```typescript
// N-Queens Problem
function solveNQueens(n: number): string[][] {
  const solutions: string[][] = [];

  function backtrack(board: string[][], row: number): void {
    if (row === n) {
      solutions.push(board.map(r => r.join("")));
      return;
    }

    for (let col = 0; col < n; col++) {
      if (isValid(board, row, col)) {
        board[row][col] = "Q";      // Place queen
        backtrack(board, row + 1);   // Try next row
        board[row][col] = ".";      // Backtrack (remove queen)
      }
    }
  }

  function isValid(board: string[][], row: number, col: number): boolean {
    // Check column
    for (let i = 0; i < row; i++) {
      if (board[i][col] === "Q") return false;
    }

    // Check diagonal left
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === "Q") return false;
    }

    // Check diagonal right
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === "Q") return false;
    }

    return true;
  }

  const board = Array.from({ length: n }, () => Array(n).fill("."));
  backtrack(board, 0);
  return solutions;
}

const solutions = solveNQueens(4);
console.log(`Found ${solutions.length} solutions for 4-Queens`);
solutions.forEach(s => {
  console.log(s.join("\n"));
  console.log("---");
});
// Output:
// .Q..
// ...Q
// Q...
// ..Q.
// ---
// ..Q.
// Q...
// ...Q
// .Q..
```

---

## Bảng Tổng Hợp: Chọn Thuật Toán Nào?

| Vấn Đề | Thuật Toán Gợi Ý | Time |
|---------|-------------------|------|
| Tìm kiếm trong sorted array | Binary Search | O(log n) |
| Sắp xếp nhanh | Quick Sort | O(n log n) |
| Sắp xếp ổn định | Merge Sort | O(n log n) |
| Tìm đường ngắn nhất trên graph | Dijkstra / BFS | O(V + E) |
| Tìm trong tree | DFS / BFS | O(V) |
| Tối ưu hóa subproblems | Dynamic Programming | Varies |
| Chọn items tối ưu | Greedy | O(n log n) |
| Tìm tất cả solutions | Backtracking | Exponential |
| Tìm top-K elements | Heap / Priority Queue | O(n log k) |
| Đếm/tổng hợp | Hash Map | O(n) |