# 🧠 4.6 Concurrent & Parallel Programming (Song Song & Bất Đồng Bộ)

> **Concurrency** = nhiều task xen kẽ trên cùng core. **Parallelism** = nhiều task chạy đồng thời trên nhiều cores.

---

## Concurrent Programming (Bất Đồng Bộ)

JavaScript event loop — các task xen kẽ nhau.

```typescript
// Async/Await — trông giống sequential nhưng thực sự concurrent
async function fetchUserData(userId: string): Promise<UserData> {
  const [user, posts, notifications] = await Promise.all([
    fetch(`/api/users/${userId}`).then(r => r.json()),
    fetch(`/api/users/${userId}/posts`).then(r => r.json()),
    fetch(`/api/notifications/${userId}`).then(r => r.json())
  ]);
  // 3 request chạy đồng thời, chờ tất cả hoàn thành
  return { user, posts, notifications };
}
```

### Promise Basics

```typescript
// Chain async operations
fetch('/api/data')
  .then(response => response.json())
  .then(data => process(data))
  .catch(error => console.error('Failed:', error));

// Async/await (cleaner syntax)
async function loadData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return process(data);
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

---

## Parallel Programming (Song Song Thực Sự)

Web Workers — chạy trên thread riêng.

```typescript
// worker.js
self.onmessage = function(e) {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};

// main.js
const worker = new Worker('worker.js');
worker.postMessage([1, 2, 3, ...]); // large dataset

worker.onmessage = function(e) {
  console.log('Result:', e.data);
};

worker.onerror = function(err) {
  console.error('Worker error:', err);
};
```

### Multiple Workers

```typescript
// Xử lý song song nhiều task
const workers = Array.from({ length: 4 }, () => new Worker('worker.js'));

const results = await Promise.all(
  datasets.map((data, i) => {
    return new Promise(resolve => {
      workers[i].onmessage = e => resolve(e.data);
      workers[i].postMessage(data);
    });
  })
);
```

---

## Concurrency Patterns

### Producer-Consumer

```typescript
class Queue<T> {
  private items: T[] = [];
  private waiting: Array<() => void> = [];

  async enqueue(item: T): Promise<void> {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      await new Promise(resolve => this.waiting.push(resolve));
    }
    this.items.push(item);
  }

  async dequeue(): Promise<T> {
    if (this.items.length > 0) {
      return this.items.shift()!;
    }
    return new Promise(resolve => {
      this.waiting.push(() => resolve(this.items.shift()!));
    });
  }
}
```

### Rate Limiting

```typescript
function rateLimit<T extends (...args: any[]) => any>(
  fn: T,
  maxPerSecond: number
): T {
  let tokens = maxPerSecond;
  let lastTime = Date.now();
  
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const now = Date.now();
    const wait = Math.max(0, (1000 / maxPerSecond) - (now - lastTime));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    
    tokens--;
    lastTime = Date.now();
    return fn(...args);
  }) as T;
}
```

---

## Race Conditions & Fixes

```typescript
// ❌ Race condition
let counter = 0;
async function increment() {
  const current = counter;
  await someAsyncOperation(); // context switch here!
  counter = current + 1; // lost update
}

// ✅ Fix: atomic operation hoặc lock
async function incrementSafe() {
  await lock.acquire();
  try {
    counter++;
  } finally {
    lock.release();
  }
}
```

---

## Khi Nào Dùng Cái Gì?

| Scenario | Concurrency | Parallelism |
|----------|-------------|-------------|
| I/O bound (API calls) | ✅ Promise.all | — |
| CPU bound computation | ❌ Event loop block | ✅ Web Workers |
| Real-time updates | ✅ RxJS streams | — |
| Heavy data processing | ⚠️ Chunk it | ✅ Parallel workers |

---

## 🔗 Liên Quan

- **4.2 Functional** — Immutable data giúp parallel safe
- **5.12 Functional Concepts** — Immutability, pure functions
- **12-concurrency** (folder trong repo) — chi tiết threading

---

## 📚 Tài Liệu Tham Khảo

- 📖 [MDN - Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- 📖 [JavaScript Event Loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
- 📖 [Promise.all vs forkJoin](https://rxjs.dev/api/index/function/forkJoin)

---

## ⏭️ Bài Tiếp Theo

→ [6.1 Time Complexity](../../06-data-structures-and-algorithms/6.1-time-complexity/README.md)
