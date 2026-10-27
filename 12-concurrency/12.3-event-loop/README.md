# 🔄 12.3 Event Loop (Vòng Lặp Sự Kiện)

> **Event Loop** là cơ chế giúp JavaScript xử lý bất đồng bộ trong single-threaded environment.

---

## 🎯 JavaScript Single-Threaded nhưng Non-Blocking

```
┌─────────────────────────────────────────────────────────────┐
│              JS EVENT LOOP ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Call Stack (thực thi)   ───▶   Web APIs       ───▶  Callback Queue    │
│                                     (setTimeout v.v.)           (Macrotask)    │
│        │                                       │                    │
│        │◀──────────────────────────────────────┤                    │
│        │            Event Loop kiểm tra        │                    │
│        ▼                                       ▼                    │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                  Event Loop                              │    │
│   │   while (true) {                                        │    │
│   │     while (microtask queue có việc) {                   │    │
│   │       flush one microtask                                │    │
│   │     }                                                  │    │
│   │     if (macrotask queue có việc)                         │    │
│   │       run next macrotask                                 │    │
│   │   }                                                    │    │
│   └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Tại sao single-threaded nhưng vẫn xử lý được hàng nghìn request?** Vì **I/O không nằm trên call stack**. Browser chia thành hai nhóm:

1. **Call stack + JS engine** — xử lý code JS đồng bộ, không bao giờ "bận" làm I/O.
2. **Web APIs** (browser) / **libuv + epoll/kqueue** (Node.js) — hệ điều hành và runtime lo việc network, timer, filesystem... Khi xong, chúng gửi callback vào queue.

Khi call stack rỗng, event loop chuyển callback từ queue vào stack để chạy. Quá trình lặp vô tận — đó là "event loop".

> ⚠️ **Hiểu lầm phổ biến:** "JS single-threaded nghĩa là chỉ xử lý được 1 việc tại một thời điểm". Đúng là JS engine chỉ có **một call stack**, nhưng *các hành động* (network, timer, I/O) chạy ở **môi trường khác** (browser engine, libuv, worker threads). Chúng ta non-blocking vì không đợi.

---

## 12.3.1 Call Stack & Task Queue

```typescript
// Ví dụ execution flow
console.log('1'); // synchronously → Call Stack

setTimeout(() => {
  console.log('2'); // Callback đưa vào macrotask queue
}, 0);

Promise.resolve().then(() => {
  console.log('3'); // Microtask queue
});

console.log('4'); // synchronously → Call Stack

// Output: 1, 4, 3, 2
// Lý do: Microtasks (Promise) được xử lý TRƯỚC macrotasks (setTimeout)
```

**Cơ chế:** mỗi lần call stack rỗng, event loop:
1. **Flush toàn bộ microtask queue** (nhiều microtask có thể sinh thêm microtask mới, chúng cũng được xử lý trong lượt đó).
2. **Rút một macrotask** (hoặc một phase trong Node.js) để chạy.
3. Lặp lại.

```
Giai đoạn 1: console.log('1'), timer 0ms được up, Promise up, console.log('4')
→ stack rỗng
Giai đoạn 2: flush microtask → Promise.then(log 3)
→ stack rỗng
Giai đoạn 3: timer callback → log 2
→ Output: 1, 4, 3, 2 ✅
```

---

## 12.3.2 Microtask vs Macrotask

```
┌─────────────────────────────────────────────────────────────┐
│         MICROTASK vs MACROTASK                              │
├──────────────────┬─────────────────┬────────────────────────┤
│ Nguồn gốc        │   Microtask     │     Macrotask          │
├──────────────────┼─────────────────┼────────────────────────┤
│                  │ Promise.then    │ setTimeout             │
│                  │ MutationObserver│ setInterval            │
│                  │ queueMicrotask  │ I/O callbacks          │
│                  │ process.nextTick│ UI rendering           │
├──────────────────┼─────────────────┼────────────────────────┤
│ Priority         │ Cao (flush first)│ Thấp                  │
│ Chạy mỗi cycle   │ Tất cả trước    │ 1 task per cycle       │
│                  │ khi lấy task mới │                        │
└──────────────────┴─────────────────┴────────────────────────┘
```

**Order quan trọng:**

```typescript
console.log('Start');

setTimeout(() => console.log('Timeout'), 0);
Promise.resolve().then(() => console.log('Promise'));
queueMicrotask(() => console.log('Microtask'));

// Node.js & Browser: Start, Microtask, Promise, Timeout
```

**⚡ Lưu ý quan trọng — starvation:** Vì microtasks được flush **toàn bộ** trước khi macrotask tiếp theo chạy, một vòng lặp microtask liên tục sẽ "bóp nghẹt" rendering và timer:

```typescript
// Code nguy hiểm — block cả browser
queueMicrotask(() => queueMicrotask(arguments.callee));
// Render đóng băng, timer không chạy, UI đơ.
```

Trong Node.js, `process.nextTick` còn ưu tiên hơn cả microtask queue — nếu lạm dụng cùng hiệu ứng.

> 💡 **Thực hành:** không bao giờ `queueMicrotask` lại trong microtask callback nếu không có điều kiện dừng rõ ràng.

---

## 12.3.3 Deep Dive: Phases của Event Loop (Node.js)

```
┌──────────────────────────────────────────────────────────────────┐
│                    NODE.JS EVENT LOOP PHASES                     │
│                                                                  │
│   ┌──────────────┐                                               │
│   │  1. Timers   │  setTimeout, setInterval callbacks            │
│   └──────┬───────┘                                               │
│          ▼                                                       │
│   ┌──────────────┐                                               │
│   │ 2. I/O       │  Pending callbacks, network errors            │
│   └──────┬───────┘                                               │
│          ▼                                                       │
│   ┌──────────────┐         ▲      │                            │
│   │ 3. Poll      │  I/O callbacks waiting here   │            │
│   └──────┬───────┘         │      │                            │
│          ▼                 └──────┘                            │
│   ┌──────────────┐  (new timers)                               │
│   │ 4. Check     │  setImmediate callbacks                       │
│   └──────┬───────┘                                               │
│          ▼                                                       │
│   ┌──────────────┐                                               │
│   │ 5. Close     │  socket.on('close')                           │
│   └──────────────┘                                               │
│                                                                  │
│   [Mỗi loop] → Microtask queue được flush sau MỖI phase         │
└──────────────────────────────────────────────────────────────────┘
```

**Chi tiết từng phase:**

| Phase | Nhiệm vụ | Ví dụ callback |
|-------|----------|----------------|
| **Timers** | Chạy callback của `setTimeout`/`setInterval` đã qua threshold | `setTimeout(fn, 0)` |
| **I/O callbacks** | Chấp nhận pending async ops (network connect fail, UDP), gọi callback cuối cùng | `net.Socket` connect callback |
| **Poll** | Chờ & chạy I/O callbacks; nếu không có timer đang chờ, poll **block** đến khi có callback hoặc timer mới | TCP data arrive |
| **Check** | Chạy `setImmediate` — callback ngay sau poll | `setImmediate(fn)` |
| **Close** | Xử lý sự kiện đóng như `socket.on('close')` | TCP FIN nhận |

**Node.js đặc biệt:** microtask queue được **flush sau mỗi phase** (không chỉ sau mỗi macrotask). Đây là khác biệt lớn so với browser.

```typescript
setTimeout(() => console.log('timer'), 0);
setImmediate(() => console.log('immediate'));

// Kết quả KHÔNG xác định — phụ thuộc module/timing,
// nhưng thường là: timer, immediate (phase 1 trước phase 4).
// Trong I/O callback: setImmediate thường trước setTimeout (poll check).
```

**Process.nextTick** — Node.js có cơ chế riêng, chạy **ngay sau mỗi phase, trước khi event loop chuyển phase**:

```typescript
setTimeout(() => console.log('A'), 0);
Promise.resolve().then(() => console.log('B'));
process.nextTick(() => console.log('C'));

console.log('Start');
// Output: Start, C, B, A
// NextTick (C) thắng cả Promise (B) và Timer (A)
```

> ⚠️ **Cảnh báo thực tế:** nhiều người dùng `nextTick` nhầm lẫn là giải pháp "nhanh hơn Promise" — sai. Nó là một primitive khác, ưu tiên cao nhất và dễ gây starvation nếu dùng lung tung. Thường dùng trong core API (ví dụ `fs.readFile` callback context).

---

## 12.3.4 Blocking the Event Loop

Event loop giống như một nhạc trưởng — nếu call stack bận hát, mọi thứ phải chờ. **CPU-bound work lớn** (parse JSON 500MB, tính toán hình học) sẽ block: HTTP server không response, WebSocket không ping, UI đóng băng.

```typescript
// ❌ BAD — Blocking main thread
function heavyComputation() {
  let sum = 0;
  for (let i = 0; i < 1e12; i++) sum += i; // Block ALL event loop!
  return sum;
}

// ✅ GOOD — Offload to worker hoặc chunked processing
function chunkedWork(items: number[], chunkSize = 1000): void {
  let index = 0;
  function processChunk() {
    const chunk = items.slice(index, index + chunkSize);
    chunk.forEach(n => console.log(n));
    index += chunkSize;
    if (index < items.length) {
      setTimeout(processChunk, 0); // Yield to event loop
    }
  }
  processChunk();
}
```

**Tại sao chunked giúp được?** Mỗi `setTimeout(..., 0)` không đảm bảo chạy đúng "0ms sau" — nó đẩy callback vào cuối timer queue, để event loop xử lý các microtask và macrotask khác trước. Call stack "hơi thở" giữa các chunk → UI/render/timer vẫn chạy.

**Các hướng giải quyết khác cho heavy work:**

| Kỹ thuật | Khi dùng | Độ phức tạp | Ví dụ |
|----------|----------|-------------|-------|
| Chunked processing (yield qua setTimeout/microtask) | CPU work vừa, không cần parallel | Thấp | Image processing nhỏ |
| `worker_threads` (Node.js) / `Web Worker` (browser) | Tính toán nặng cần multi-core | Trung bình | Video encode, crypto |
| Third-party native addon (Node.js) | Hiệu năng tối đa | Cao | FFmpeg bindings |
| HTTP streaming + pagination | Data lớn, chia nhỏ request | Trung bình | Export CSV 10M rows |

**Công cụ phát hiện block:**
- **Browser DevTools:** "Long Tasks" panel (>50ms task).
- **Node.js:** `process.monitorEventLoopDelay({ resolution: 1 }).enable();` để xem latency distribution của event loop.
- **Healthcheck:** endpoint `/health` đo thời gian phản hồi; tăng đột ngột = có tác vụ block.

> 💡 **Con số tham chiếu:** Frame budget ở 60fps là **16.6ms**. Đoạn sync code >50ms sẽ nhìn thấy frame drop rõ rệt (UI đơ ~3 frame).

---

## 🔗 Liên Quan

- **12.1 Async/Await** — Uses event loop internally
- **12.4 Web Workers** — Offload from main thread

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| Node.js Event Loop | https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/ |
| JS Conf — Event Loop | https://github.com/danbecker/event-loop-tour |

---

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.3-event-loop
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [12.4 Web Workers](../12.4-web-workers/README.md)
