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

**Tại sao cần worker?** JavaScript trong browser chạy trên một **main thread** duy nhất — xử lý rendering, xử lý input, tính toán, network tất cả trong cùng luồng. Nếu bạn dành 200ms cho `JSON.parse` 50MB file hay thuật toán sort 1 triệu số, **frame budget 16.6ms (60fps) bị phá vỡ** → người dùng thấy "đơ". Worker tách tính toán sang thread riêng, main thread chỉ còn lo render và bắt sự kiện.

> 💡 **Lưu ý quan trọng:** Worker **không** giúp I/O — vì `fetch`, `setTimeout`, DOM API đều đã non-blocking ở main thread rồi. Worker chỉ cứu **CPU-bound** work (crypto, image/video processing, simulation).

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

**Cơ chế message-passing:** main thread ↔ worker thread giao tiếp qua `postMessage`. Hai thread **không chia sẻ memory** (trừ SharedArrayBuffer) — mọi dữ liệu được **clone** theo cấu trúc (structured clone algorithm). Điều này đảm bảo an toàn (không cần lock) nhưng chi phí:

- Object nhỏ (JSON) → copy nhanh, vài µs.
- Array 1 triệu số → hàng ms, đáng kể.
- Function/DOM node → **throw InvalidAccessError** (không thể serialize).

**Lifecycle đầy đủ:**

| Hoạt động | Ảnh hưởng |
|-----------|-----------|
| `new Worker(script)` | Tải script, khởi tạo thread, chạy worker start-up |
| `worker.postMessage(data)` | Gửi object (clone); worker nhận qua `onmessage` |
| `worker.terminate()` | Giết thread; pending messages **bị hủy** (không dispatch) |
| Worker tự `self.close()` | Tương tự terminate từ phía worker |
| `worker.onerror` | Bắt lỗi trong worker; nếu không bắt → lỗi bị nuốt |

> ⚠️ **Hiểu lầm phổ biến:** "Worker chạy nhanh hơn". Sai — Worker chạy **cùng tốc độ** (cùng CPU), nhưng **không làm UI đơ**. Nếu muốn giảm thời gian tính toán thực sự thì cần `SharedArrayBuffer` + `Atomics` (xem 12.4.3) hoặc multi-worker pool.

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

**Cơ chế transfer:** thay vì clone toàn bộ 100MB, engine **chuyển quyền sở hữu** buffer từ main thread sang worker thread — main thread giữ một "vỏ" ArrayBuffer rỗng. Chi phí ~micro giây thay vì hàng trăm ms.

**Điều kiện để transfer được:**
- `ArrayBuffer`, `MessagePort`, `ImageBitmap`, hoặc các array buffer-backed type (Uint8Array, Float64Array...).
- Phải liệt kê trong **second argument** của `postMessage(data, [transferables])` — nếu quên thì vẫn clone bình thường.

**Sai lầm thường gặp:** gọi `postMessage(buffer, [buffer])` rồi cố đọc `buffer` ở main thread sau đó → `buffer.byteLength === 0` (đã "chuyển" qua). Đây là hành vi đúng nhưng gây bug khó debug.

> 💡 **Semi-transfer pattern:** nếu worker cần đọc + main thread cần đọc lại (dù hiếm), tạo 2 view vào cùng underlying buffer hoặc gửi về bằng `postMessage` không transfer (clone).

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

**Khi nào dùng SharedArrayBuffer?** Khi nhiều worker (hoặc main ↔ worker) cần **trao đổi dữ liệu liên tục** với chi phí copy thấp, và bạn cần đồng bộ rõ ràng qua atomics. Điển hình:
- **WASM multi-threading** — tính toán song song các tensor trong ML, shader compile.
- **Parallel reduce** — mỗi worker gom vào ô riêng, main đọc `Atomics.load` khi xong.
- **Lock-free queue** — sản xuất & tiêu thụ qua head/tail indices update nguyên tử.

⚠️ **Bảo mật & yêu cầu cross-origin isolation:** Sau vụ Spectre/MITM, `SharedArrayBuffer` bị chặn mặc định trừ khi server gửi:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Nếu không có headers này, browser trả lỗi `SecurityError` khi khởi tạo.

**Cảnh báo đồng bộ:** dùng SA/B mà không `Atomics` → data race không detect được, kết quả sai lầm. Ưu tiên message-passing khi có thể; chỉ dùng SA/B khi thực sự cần throughput cao.

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

**Cải tiến:** pool thực tế nên trả về `Promise` cho caller, và tự quản lý lifecycle (tái sử dụng worker, handle worker crash tự động). Mẫu phổ biến (ví dụ `workerpool`, `threads`):

```typescript
class Pool<T extends Worker, R> {
  private readonly workers: T[];
  private busy = new Set<number>();
  private nextId = 0;

  constructor(n: number, factory: () => T) {
    this.workers = Array.from({ length: n }, () => factory());
  }

  async run(job: () => Promise<R>): Promise<R> {
    const id = this.nextId++;
    while (this.busy.has(id % this.workers.length)) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    this.busy.add(id % this.workers.length);
    try {
      const w = this.workers[id % this.workers.length];
      return await this._postAndAwait(w, job);
    } finally {
      this.busy.delete(id % this.workers.length);
    }
  }

  private _postAndAwait<T, R>(w: T, fn: () => Promise<R>): Promise<R> {
    return new Promise((resolve, reject) => {
      w.onmessage = e => resolve(e.data);
      w.onerror = e => reject(e);
      fn().then(msg => w.postMessage(msg));
    });
  }

  terminate() {
    this.workers.forEach(w => w.terminate());
  }
}
```

**Quy tắc sizing (số worker):**
- **Browser:** tối đa ~6 worker đồng thời để tránh cạnh tranh CPU main thread; con số an toàn thường 2–4.
- **Node.js (`worker_threads`):** `Math.max(2, os.cpus().length - 1)` — giữ 1 core cho main loop.
- **CPU-bound heavy:** cứ 1 worker ≈ 1 core = 100% CPU; nếu chia task nhỏ hơn số worker → overhead context switch tăng.

---

## 📋 When To Use Web Workers

| Use Case | Recommendation | Lập luận |
|----------|---------------|----------|
| Heavy math (crypto hash, image filter, sorting 1M items) | ✅ Web Worker | CPU-bound; nếu để main thread xử lý sẽ đơ UI > 1 frame budget |
| Parse large JSON / CSV (>50MB) | ✅ Web Worker | JSON.parse đơn thuần có thể block main thread hàng chục ms; worker cách ly hoàn toàn |
| Real-time video processing (Canvas pixel manipulation) | ✅ Web Worker + OffscreenCanvas | Main thread chỉ vẽ; worker tính toán frame; lợi ích rõ rệt trên mobile |
| Simple async API call (fetch) | ❌ dùng fetch trực tiếp | Fetch đã non-blocking ở main thread; worker thêm overhead message-passing không cần thiết |
| DOM manipulation | ❌ Không thể | Worker không có access DOM; chỉ main thread được làm UI |
| Tiny utility function (<100ms) | ❌ Overhead > benefit | Khởi tạo worker thread tốn 10-100ms; nếu công việc nhỏ hơn thời gian khởi tạo thì không đáng |

**Thước đo thực tế:** khi bạn nghe "UI giật", mở DevTools → Timeline → nhìn thấy bar màu tím/đỏ dài >50ms, đó là lúc cần xét đến worker.

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

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.4-web-workers
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [12.5 Race Conditions](../12.5-race-conditions/README.md)
