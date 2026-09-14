/**
 * 6.2 Core Data Structures — Cấu Trúc Dữ Liệu Cốt Lõi
 * Minh họa: Array, Stack, Queue, Linked List, Tree, BST,
 * Graph (DFS/BFS) và HashMap/Set.
 */

// ─── 1. Array (mảng gốc của TS) ─────────────────────────────
function demoArray(): void {
  const numbers: number[] = [3, 1, 4, 1, 5];
  console.log("📌 Array — truy cập theo index, push/pop");
  console.log(`   numbers = [${numbers}]`);
  console.log(`   numbers[2] = ${numbers[2]}  (O(1))`);
  numbers.push(9);
  console.log(`   push(9) → [${numbers}]  (O(1))`);
  numbers.pop();
  console.log(`   pop() → [${numbers}]`);
  console.log(`   indexOf(4) = ${numbers.indexOf(4)}  (O(n))`);
  console.log("");
}

// ─── 2. Stack — LIFO ────────────────────────────────────────
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

function demoStack(): void {
  console.log("📚 Stack — LIFO (Last In, First Out)");
  const undo: Stack<string> = new Stack();
  undo.push("gõ chữ A");
  undo.push("gõ chữ B");
  undo.push("gõ chữ C");
  console.log(`   stack = [A, B, C], peek = "${undo.peek()}"`);
  console.log(`   pop() = "${undo.pop()}" → còn lại [A, B]`);
  console.log(`   pop() = "${undo.pop()}" → còn lại [A]`);
  console.log(`   isEmpty() = ${undo.isEmpty()}`);
  console.log("");
}

// ─── 3. Queue — FIFO ────────────────────────────────────────
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  front(): T | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

function demoQueue(): void {
  console.log("🎯 Queue — FIFO (First In, First Out)");
  const tasks: Queue<string> = new Queue();
  tasks.enqueue("Task 1");
  tasks.enqueue("Task 2");
  tasks.enqueue("Task 3");
  console.log(`   queue = [Task1, Task2, Task3], front = "${tasks.front()}"`);
  console.log(`   dequeue() = "${tasks.dequeue()}" → còn lại [Task2, Task3]`);
  console.log(`   dequeue() = "${tasks.dequeue()}" → còn lại [Task3]`);
  console.log("");
}

// ─── 4. Linked List ─────────────────────────────────────────
class ListNode<T> {
  constructor(
    public value: T,
    public next: ListNode<T> | null = null
  ) {}
}

class LinkedList<T> {
  private head: ListNode<T> | null = null;
  private length = 0;

  append(value: T): void {
    const node = new ListNode(value);
    if (!this.head) {
      this.head = node;
    } else {
      let current = this.head;
      while (current.next) current = current.next;
      current.next = node;
    }
    this.length++;
  }

  prepend(value: T): void {
    const node = new ListNode(value, this.head);
    this.head = node;
    this.length++;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  size(): number {
    return this.length;
  }
}

function demoLinkedList(): void {
  console.log("🔗 Linked List — mỗi node trỏ tới node kế tiếp");
  const list = new LinkedList<number>();
  list.append(2);
  list.append(3);
  list.append(4);
  list.prepend(1);
  console.log(`   append(2), append(3), append(4), prepend(1)`);
  console.log(`   1 → 2 → 3 → 4`);
  console.log(`   toArray() = [${list.toArray()}], size = ${list.size()}`);
  console.log("");
}

// ─── 5. Tree (cây đa nhánh) ─────────────────────────────────
class TreeNode<T> {
  children: TreeNode<T>[] = [];

  constructor(public value: T) {}

  addChild(child: TreeNode<T>): void {
    this.children.push(child);
  }
}

function demoTree(): void {
  console.log("🌳 Tree — cây thư mục, cây phân cấp");
  const root = new TreeNode<string>("root");
  const src = new TreeNode<string>("src");
  const test = new TreeNode<string>("test");
  root.addChild(src);
  root.addChild(test);
  src.addChild(new TreeNode<string>("main.ts"));
  src.addChild(new TreeNode<string>("utils.ts"));
  test.addChild(new TreeNode<string>("main.spec.ts"));
  console.log("   root");
  console.log("   ├── src ── main.ts, utils.ts");
  console.log("   └── test ── main.spec.ts");
  console.log(`   root có ${root.children.length} con:`,
    root.children.map((c) => c.value).join(", "));
  console.log("");
}

// ─── 6. Binary Search Tree — left < root < right ────────────
class BSTNode<T> {
  constructor(
    public value: T,
    public left: BSTNode<T> | null = null,
    public right: BSTNode<T> | null = null
  ) {}
}

class BinarySearchTree<T> {
  private root: BSTNode<T> | null = null;

  insert(value: T): void {
    const insertInto = (node: BSTNode<T> | null, val: T): BSTNode<T> => {
      if (!node) return new BSTNode(val);
      if (val < node.value) node.left = insertInto(node.left, val);
      else node.right = insertInto(node.right, val);
      return node;
    };
    this.root = insertInto(this.root, value);
  }

  search(value: T): boolean {
    let current = this.root;
    while (current) {
      if (value === current.value) return true;
      current = value < current.value ? current.left : current.right;
    }
    return false;
  }

  inOrder(): T[] {
    const result: T[] = [];
    const visit = (node: BSTNode<T> | null): void => {
      if (!node) return;
      visit(node.left);
      result.push(node.value);
      visit(node.right);
    };
    visit(this.root);
    return result;
  }
}

function demoBST(): void {
  console.log("🆗 Binary Search Tree — left < root < right");
  const bst = new BinarySearchTree<number>();
  [8, 3, 10, 1, 6, 14, 4].forEach((n) => bst.insert(n));
  console.log("   Insert: 8, 3, 10, 1, 6, 14, 4");
  console.log("        8");
  console.log("       / \\");
  console.log("      3   10");
  console.log("     / \\    \\");
  console.log("    1   6    14");
  console.log("       /");
  console.log("      4");
  console.log(`   inOrder() (đã sắp xếp) = [${bst.inOrder()}]`);
  console.log(`   search(6) = ${bst.search(6)}, search(99) = ${bst.search(99)}`);
  console.log("");
}

// ─── 7. Graph (đồ thị vô hướng, adjacency list) ─────────────
class Graph {
  private adjList = new Map<string, string[]>();

  addVertex(vertex: string): void {
    if (!this.adjList.has(vertex)) this.adjList.set(vertex, []);
  }

  addEdge(v1: string, v2: string): void {
    this.adjList.get(v1)?.push(v2);
    this.adjList.get(v2)?.push(v1);
  }

  bfs(start: string): string[] {
    const visited = new Set<string>([start]);
    const queue: string[] = [start];
    const result: string[] = [];

    while (queue.length > 0) {
      const vertex = queue.shift()!;
      result.push(vertex);
      for (const neighbor of this.adjList.get(vertex) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return result;
  }

  dfs(start: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (vertex: string): void => {
      visited.add(vertex);
      result.push(vertex);
      for (const neighbor of this.adjList.get(vertex) || []) {
        if (!visited.has(neighbor)) visit(neighbor);
      }
    };

    visit(start);
    return result;
  }
}

function demoGraph(): void {
  console.log("🕸️  Graph — thành phố & đường nối");
  const graph = new Graph();
  ["A", "B", "C", "D", "E"].forEach((v) => graph.addVertex(v));
  graph.addEdge("A", "B");
  graph.addEdge("A", "C");
  graph.addEdge("B", "D");
  graph.addEdge("C", "D");
  graph.addEdge("D", "E");
  console.log("   A — B");
  console.log("   |   |");
  console.log("   C — D — E");
  console.log(`   BFS("A") = [${graph.bfs("A")}]`);
  console.log(`   DFS("A") = [${graph.dfs("A")}]`);
  console.log("");
}

// ─── 8. HashMap (bảng băm) & Set ────────────────────────────
class SimpleHashMap<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private count = 0;

  constructor(private capacity = 16) {
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
    const bucket = this.buckets[this.hash(key)];
    const existing = bucket.find(([k]) => k === key);
    if (existing) {
      existing[1] = value;
    } else {
      bucket.push([key, value]);
      this.count++;
    }
  }

  get(key: K): V | undefined {
    const bucket = this.buckets[this.hash(key)];
    const found = bucket.find(([k]) => k === key);
    return found?.[1];
  }

  has(key: K): boolean {
    return this.buckets[this.hash(key)].some(([k]) => k === key);
  }

  size(): number {
    return this.count;
  }
}

function demoHashMapAndSet(): void {
  console.log("🗂️  HashMap — truy cập key-value O(1)");
  const ages: SimpleHashMap<string, number> = new SimpleHashMap();
  ages.set("Alice", 25);
  ages.set("Bob", 30);
  ages.set("Carol", 22);
  console.log(`   set(Alice, 25), set(Bob, 30), set(Carol, 22)`);
  console.log(`   get("Bob") = ${ages.get("Bob")}  (O(1))`);
  console.log(`   has("Alice") = ${ages.has("Alice")}, has("Dave") = ${ages.has("Dave")}`);
  console.log(`   size = ${ages.size()}`);

  console.log("🔎 Set — phần tử duy nhất");
  const seen = new Set<string>();
  const words = ["apple", "banana", "apple", "cherry", "banana"];
  words.forEach((w) => seen.add(w));
  console.log(`   words = [${words.join(", ")}]`);
  console.log(`   Set = [${[...seen].join(", ")}] (loại trùng)`);
  console.log("");
}

// ─── Demo tổng hợp ──────────────────────────────────────────
console.log("=== Core Data Structures Demo ===");
console.log("");
demoArray();
demoStack();
demoQueue();
demoLinkedList();
demoTree();
demoBST();
demoGraph();
demoHashMapAndSet();
console.log("✅ Hoàn tất: đã demo Array, Stack, Queue, Linked List, Tree, BST, Graph, HashMap và Set");
export {};
