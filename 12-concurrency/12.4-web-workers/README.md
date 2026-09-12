# 👷 12.4 Web Workers (Offloading Heavy Computation)

> **Web Worker** chạy JavaScript trong background thread — không block main thread/UI.

---

## 🎯 Vấn Đề Của Main Thread

```
┌─────────────────────────────────────────────────────────────┐
│              MAIN THREAD BLOCKED                            │
│                                                             │
│   UI Thread: [Render][Event][Render][Event][ heavy loop... │
│                        ⚠️  Đơ UI, không responsive!         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              WITH WEB WORKER                                │
│                                                             │
│   Main:    [Render][Event][Render][Event][Render][Event...] │
│   Worker:                    [heavy computation...]         │
│                           ✅ UI vẫn mượt!                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 12.4.1 Worker Cơ Bản

```typescript
// worker.ts — Code chạy trong worker thread
self.onmessage = function(e: MessageEvent) {
  const { type, payload } = e.data;

  if (type === 'COMPUTE_PRIMES') {
    const limit = payload.limit;
    const primes: number[] = [];

    // Heavy computation — không block UI
    outer: for (let n = 2; n <= limit; n++) {
      for (let p of primes) {
        if (n % p === 0) continue outer;
        if (p * p > n) break;
      }
      primes.push(n);
    }

    self.postMessage({ type: 'PRIMES_RESULT', count: primes.length });
  }
};
```

```typescript
// main.ts
const worker = new Worker(new URL('./worker.ts', import.meta.url), {
  type: 'module'
});

worker.postMessage({ type: 'COMPUTE_PRIMES', limit: 10000000 });

worker.onmessage = (e) => {
  console.log(`✅ Tìm được ${e.data.count} số nguyên tố`);
};

worker.onerror = (err) => {
  console.error('❌ Worker error:', err);
};

worker.terminate(); // Hủy worker khi không cần
```

---

## 12.4.2 Transferable Objects (Zero-Copy)

```typescript
// Chuyển ArrayBuffer mà KHÔNG copy — cực nhanh
const buffer = new ArrayBuffer(1024 * 1024 * 100); // 100MB
worker.postMessage(buffer, [buffer]); // Transfer ownership

// Trong worker
self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  const buf = e.data; // Đây là buffer chính, không phải copy
  // ... xử lý
};
```

---

## 12.4.3 SharedArrayBuffer (Shared Memory)

```typescript
// shared-state.ts
const SHARED_SIZE = 1024 * 1024;
const sharedBuffer = new SharedArrayBuffer(SHARED_SIZE);
const sharedUint32 = new Uint32Array(sharedBuffer);

// Atomic operations cho concurrent access
function atomicAdd(offset: number, value: number): void {
  Atomics.add(sharedUint32, offset, value);
}

function atomicWait(offset: number, expected: number): void {
  Atomics.wait(sharedUint32, offset, expected);
}

function atomicNotify(offset: number, count: number): void {
  Atomics.notify(sharedUint32, offset, count);
}
```

⚠️ **Cảnh báo:** `SharedArrayBuffer` cần Cross-Origin Isolation headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## 12.4.4 Worker Pool Pattern

```typescript
// worker-pool.ts — Giới hạn số worker đồng thời
class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<() => void> = [];
  private active = 0;

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.workers.push(
        new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
      );
    }
  }

  post(task: () => void): void {
    this.queue.push(task);
    this.drain();
  }

  private drain(): void {
    while (this.active < this.workers.length && this.queue.length > 0) {
      this.active++;
      const task = this.queue.shift()!;
      task();
    }
  }
}
```

---

## 📋 When To Use Web Workers

| Use Case | Recommendation |
|----------|---------------|
| Heavy math (crypto, image) | ✅ Web Worker |
| Parse large JSON | ✅ Web Worker |
| Real-time video processing | ✅ Web Worker |
| Simple async API call | ❌ dùng fetch |
| DOM manipulation | ❌ Không thể (main thread) |
| Tiny utility function | ❌ Overhead > benefit |

---

## 🔗 Liên Quan

- **12.3 Event Loop** — Main thread model
- **12.5 Race Conditions** — Shared memory concerns

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| MDN — Web Workers | https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API |
| Transferable objects | https://developer.mozilla.org/en-US/docs/Web/API/transferable_objects |

---

## ⏭️ Bài tiếp theo → [12.5 Race Conditions](../12.5-race-conditions/README.md)
