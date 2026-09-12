# 🔄 12.3 Event Loop (Vòng Lặp Sự Kiện)

> **Event Loop** là cơ chế giúp JavaScript xử lý bất đồng bộ trong single-threaded environment.

---

## 🎯 JavaScript Single-Threaded nhưng Non-Blocking

```
┌─────────────────────────────────────────────────────────────┐
│              JS EVENT LOOP ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Call Stack        ───▶    Web APIs       ───▶  Callback  │
│   (执行的)              (setTimeout等)          Queue       │
│        │                                       │           │
│        │◀──────────────────────────────────────┤           │
│        │            Event Loop kiểm tra        │           │
│        ▼                                       ▼           │
│   ┌─────────────────────────────────────────────────┐    │
│   │                  Event Loop                      │    │
│   │   while (queue has tasks) {                     │    │
│   │     if (microtask queue) flushMicrotasks()      │    │
│   │     task = macrotask queue.shift()              │    │
│   │     callStack.push(task)                        │    │
│   │   }                                             │    │
│   └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 12.3.1 Call Stack & Task Queue

```typescript
// Ví dụ execution flow
console.log('1'); //同步 → Call Stack

setTimeout(() => {
  console.log('2'); // Callback放到 macrotask queue
}, 0);

Promise.resolve().then(() => {
  console.log('3'); // Microtask queue
});

console.log('4'); //同步 → Call Stack

// Output: 1, 4, 3, 2
// Lý do: Microtasks (Promise) được xử lý TRƯỚC macrotasks (setTimeout)
```

---

## 12.3.2 Microtask vs Macrotask

```
┌─────────────────────────────────────────────────────────────┐
│         MICROTASK vs MACROTASK                              │
├──────────────────┬─────────────────┬────────────────────────┤
│                  │   Microtask     │     Macrotask          │
├──────────────────┼─────────────────┼────────────────────────┤
│ Nguồn gốc        │ Promise.then    │ setTimeout             │
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

// Node.js: Start, Microtask, Promise, Timeout
// Browser: Start, Microtask, Promise, Timeout
```

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
│   ┌──────────────┐                                               │
│   │ 3. Poll      │  I/O callbacks waiting here                   │
│   └──────┬───────┘         ▲      │                            │
│          ▼                 │      │ (new timers)                │
│   ┌──────────────┐         └──────┘                            │
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

---

## 12.3.4 Blocking the Event Loop

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

## ⏭️ Bài tiếp theo → [12.4 Web Workers](../12.4-web-workers/README.md)
