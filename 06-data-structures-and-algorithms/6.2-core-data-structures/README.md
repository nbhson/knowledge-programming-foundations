# 📐 6.2 Core Data Structures (Cấu Trúc Dữ Liệu Cốt Lõi)

> **Data Structures** là cách tổ chức và lưu trữ dữ liệu hiệu quả. Mỗi cấu trúc có trade-off riêng về thời gian và không gian.

---

## Array (Mảng)

```typescript
const numbers: number[] = [1, 2, 3, 4, 5];

// Access: O(1)
console.log(numbers[0]); // 1

// Push/Pop: O(1) amortized
numbers.push(6);
numbers.pop();

// Search: O(n)
numbers.indexOf(3); // 2

// Insert/Delete at position: O(n)
numbers.splice(1, 1); // remove element at index 1
```

| Operation | Complexity |
|-----------|------------|
| Access | O(1) |
| Search | O(n) |
| Insert (end) | O(1) |
| Insert (middle) | O(n) |
| Delete | O(n) |

---

## Linked List (Danh Sách Liên Kết)

```typescript
class Node<T> {
  constructor(
    public value: T,
    public next: Node<T> | null = null
  ) {}
}

class LinkedList<T> {
  private head: Node<T> | null = null;
  private size = 0;

  append(value: T): void {
    const newNode = new Node(value);
    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next) current = current.next;
      current.next = newNode;
    }
    this.size++;
  }

  delete(value: T): boolean {
    if (!this.head) return false;
    if (this.head.value === value) {
      this.head = this.head.next;
      this.size--;
      return true;
    }
    let prev = this.head;
    while (prev.next && prev.next.value !== value) {
      prev = prev.next;
    }
    if (prev.next) {
      prev.next = prev.next.next;
      this.size--;
      return true;
    }
    return false;
  }
}
```

| Operation | Complexity |
|-----------|------------|
| Access | O(n) |
| Search | O(n) |
| Insert (head) | O(1) |
| Insert (end) | O(n) |
| Delete | O(n) |

---

## Stack (Ngăn Xếp) — LIFO

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  isEmpty(): boolean { return this.items.length === 0; }
}

// Application: undo/redo, function call stack
const stack = new Stack<string>();
stack.push('action1');
stack.push('action2');
console.log(stack.pop()); // action2 (LIFO)
```

---

## Queue (Hàng Đợi) — FIFO

```typescript
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void { this.items.push(item); }
  dequeue(): T | undefined { return this.items.shift(); }
  front(): T | undefined { return this.items[0]; }
  isEmpty(): boolean { return this.items.length === 0; }
}

// Application: task scheduling, BFS
const queue = new Queue<string>();
queue.enqueue('task1');
queue.enqueue('task2');
console.log(queue.dequeue()); // task1 (FIFO)
```

---

## Hash Map (Bản Định Danh) — Key-Value

```typescript
class HashMap<K, V> {
  private capacity = 16;
  private buckets: Array<Array<[K, V]>> = Array.from({ length: this.capacity }, () => []);

  private hash(key: K): number {
    return Math.abs(hashCode(String(key))) % this.capacity;
  }

  set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const existing = bucket.find(([k]) => k === key);
    if (existing) {
      existing[1] = value;
    } else {
      bucket.push([key, value]);
    }
  }

  get(key: K): V | undefined {
    const bucket = this.buckets[this.hash(key)];
    return bucket.find(([k]) => k === key)?.[1];
  }

  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];
    const pos = bucket.findIndex(([k]) => k === key);
    if (pos !== -1) {
      bucket.splice(pos, 1);
      return true;
    }
    return false;
  }
}

// Application: caching, lookup, frequency counting
const map = new HashMap<string, number>();
map.set('apple', 5);
map.set('banana', 3);
console.log(map.get('apple')); // 5
```

| Operation | Average | Worst |
|-----------|---------|-------|
| Insert | O(1) | O(n) |
| Search | O(1) | O(n) |
| Delete | O(1) | O(n) |

---

## Tree — Binary Search Tree (BST)

```typescript
class TreeNode<T extends Comparable> {
  constructor(
    public value: T,
    public left: TreeNode<T> | null = null,
    public right: TreeNode<T> | null = null
  ) {}
}

class BST<T extends Comparable> {
  private root: TreeNode<T> | null = null;

  insert(value: T): void {
    const insertRec = (node: TreeNode<T> | null, val: T): TreeNode<T> => {
      if (!node) return new TreeNode(val);
      if (val < node.value) node.left = insertRec(node.left, val);
      else node.right = insertRec(node.right, val);
      return node;
    };
    this.root = insertRec(this.root, value);
  }

  search(value: T): boolean {
    let current = this.root;
    while (current) {
      if (value === current.value) return true;
      current = value < current.value ? current.left : current.right;
    }
    return false;
  }

  // In-order traversal: sorted output
  traverseInOrder(node: TreeNode<T> | null, result: T[] = []): T[] {
    if (node) {
      this.traverseInOrder(node.left, result);
      result.push(node.value);
      this.traverseInOrder(node.right, result);
    }
    return result;
  }
}
```

| Operation | Average | Worst (skewed) |
|-----------|---------|----------------|
| Insert | O(log n) | O(n) |
| Search | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

---

## Heap (Priority Queue)

```typescript
class MinHeap<T> {
  private heap: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compare: (a: T, b: T) => number = (a, b) => a - b) {
    this.compare = compare;
  }

  private parent(i: number) { return Math.floor((i - 1) / 2); }
  private leftChild(i: number) { return 2 * i + 1; }
  private rightChild(i: number) { return 2 * i + 2; }

  private siftUp(i: number): void {
    while (i > 0 && this.compare(this.heap[i], this.heap[this.parent(i)]) < 0) {
      [this.heap[i], this.heap[this.parent(i)]] = [this.heap[this.parent(i)], this.heap[i]];
      i = this.parent(i);
    }
  }

  private siftDown(i: number): void {
    while (true) {
      let smallest = i;
      const left = this.leftChild(i);
      const right = this.rightChild(i);
      if (left < this.heap.length && this.compare(this.heap[left], this.heap[smallest]) < 0)
        smallest = left;
      if (right < this.heap.length && this.compare(this.heap[right], this.heap[smallest]) < 0)
        smallest = right;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }

  push(value: T): void {
    this.heap.push(value);
    this.siftUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return min;
  }

  peek(): T | undefined { return this.heap[0]; }
}

// Application: Dijkstra, Huffman coding, task scheduling
const heap = new MinHeap<number>();
heap.push(5);
heap.push(2);
heap.push(8);
console.log(heap.pop()); // 2
```

| Operation | Complexity |
|-----------|------------|
| Insert | O(log n) |
| Extract min/max | O(log n) |
| Peek | O(1) |

---

## Graph (Đồ Thị)

```typescript
class Graph {
  private adjList = new Map<string, Array<{ vertex: string; weight: number }>>();

  addVertex(vertex: string): void {
    this.adjList.set(vertex, []);
  }

  addEdge(v1: string, v2: string, weight = 1): void {
    this.adjList.get(v1)?.push({ vertex: v2, weight });
    this.adjList.get(v2)?.push({ vertex: v1, weight }); // undirected
  }

  // BFS — shortest path (unweighted)
  bfs(start: string): string[] {
    const visited = new Set<string>();
    const queue: string[] = [start];
    visited.add(start);
    const result: string[] = [];

    while (queue.length > 0) {
      const vertex = queue.shift()!;
      result.push(vertex);
      for (const { vertex: neighbor } of this.adjList.get(vertex) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return result;
  }

  // DFS
  dfs(start: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (vertex: string) => {
      visited.add(vertex);
      result.push(vertex);
      for (const { vertex: neighbor } of this.adjList.get(vertex) || []) {
        if (!visited.has(neighbor)) visit(neighbor);
      }
    };

    visit(start);
    return result;
  }
}
```

| Algorithm | Time | Use Case |
|-----------|------|----------|
| BFS | O(V+E) | Shortest path (unweighted) |
| DFS | O(V+E) | Topological sort, cycle detection |
| Dijkstra | O((V+E) log V) | Shortest path (weighted) |

---

## Bảng Tổng Hợp

| Data Structure | Access | Search | Insert | Delete | Use Case |
|---------------|--------|--------|--------|--------|----------|
| Array | O(1) | O(n) | O(n) | O(n) | Random access |
| Linked List | O(n) | O(n) | O(1) | O(1) | Frequent insert/delete |
| Stack | O(n) | O(n) | O(1) | O(1) | Undo, recursion |
| Queue | O(n) | O(n) | O(1) | O(1) | Task scheduling |
| Hash Map | O(1) | O(1) | O(1) | O(1) | Lookup, caching |
| BST | O(log n) | O(log n) | O(log n) | O(log n) | Sorted data |
| Heap | O(log n) | O(n) | O(log n) | O(log n) | Priority queue |
| Graph | O(V+E) | O(V+E) | O(1) | O(1) | Networks, maps |

---

## 🔗 Liên Quan

- **6.1 Time Complexity** — Big O notation used throughout
- **6.3 Essential Algorithms** — Algorithms that use these structures

---

## ⏭️ Bài Tiếp Theo

→ [6.3 Essential Algorithms](../6.3-essential-algorithms/README.md)
