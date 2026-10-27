# ⚡ Lớp 12: Concurrency & Parallel Programming (Lập Trình Đồng Thời)

> **Concurrency** là khả năng **xử lý nhiều tác vụ cùng lúc** —
> từ multi-threading, async/await đến distributed computing.
> Đây là kiến thức **bắt buộc** để xây dựng hệ thống hiệu năng cao.

---

## 📚 Mục lục

| # | Chủ đề | Giải thích | Link |
|---|--------|-----------|------|
| 12.1 | **Async/Await** | Cú pháp bất đồng bộ hiện đại, tuần tự vs song song, error handling | [→ 12.1](12.1-async-await/README.md) |
| 12.2 | **Promises** | Callback → promise chain, Promise.all/race/any/allSettled | [→ 12.2](12.2-promises/README.md) |
| 12.3 | **Event Loop** | Microtask vs macrotask, phiên xử lý, tránh block main thread | [→ 12.3](12.3-event-loop/README.md) |
| 12.4 | **Web Workers** | Offload tính toán nặng, message-passing, worker pool | [→ 12.4](12.4-web-workers/README.md) |
| 12.5 | **Race Conditions** | Đoán trước lỗi shared state, giải pháp lock/mutex/version | [→ 12.5](12.5-race-conditions/README.md) |
| 12.6 | **Observables** | Luồng dữ liệu push-based, subscribe/unsubscribe, operators | [→ 12.6](12.6-observables/README.md) |
| 12.7 | **Threads vs Processes** | Threads vs processes vs event-loop + worker phân chia | [→ 12.7](12.7-threads-processes/README.md) |
| 12.8 | **Locks & Deadlock** | Mutex/semaphore, 4 điều kiện Coffman, lock ordering | [→ 12.8](12.8-locks-deadlock/README.md) |
| 12.9 | **Thread Pools** | Sizing, queue policies + mô phỏng pool | [→ 12.9](12.9-thread-pools/README.md) |
| 12.10 | **Backpressure** | Pull vs push, bounded queue + producer nhanh/consumer chậm | [→ 12.10](12.10-backpressure/README.md) |

---

## ▶️ Chạy ví dụ (bài 12.7–12.10)

```bash
cd 12-concurrency/12.7-threads-processes && npx ts-node examples/index.ts
cd 12-concurrency/12.8-locks-deadlock && npx ts-node examples/index.ts
cd 12-concurrency/12.9-thread-pools && npx ts-node examples/index.ts
cd 12-concurrency/12.10-backpressure && npx ts-node examples/index.ts
```

---

## 📑 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Concurrency vs Parallelism](#2-concurrency-vs-parallelism)
3. [Threading Models](#3-threading-models)
4. [Synchronization Primitives](#4-synchronization-primitives)
5. [Async/Await & Event Loop](#5-asyncawait--event-loop)
6. [Concurrency Patterns](#6-concurrency-patterns)
7. [Các Vấn Đề Thường Gặp](#7-các-vấn-đề-thường-gặp)
8. [Tài Liệu Tham Khảo](#8-tài-liệu-tham-khảo)

---

## 1. Tổng Quan

**Concurrency** (đồng thời) là khả năng quản lý nhiều tác vụ trong cùng khoảng thời gian. **Parallelism** (song song) là thực sự chạy nhiều tác vụ đồng thời trên nhiều CPU cores.

### Tại sao cần Concurrency?

- **Tăng throughput:** Xử lý nhiều request cùng lúc mà không xếp hàng chờ IO.
- **Responsive UI:** Không block giao diện khi xử lý nặng.
- **Tận dụng hardware:** Sử dụng hết multi-core CPU thay vì để 3/4 nhân nghỉ.
- **I/O efficiency:** Không lãng phí CPU khi chờ I/O (network, disk).

> 💡 **Con số thực tế:** Single-threaded Node.js server có thể handle ~50k–100k simultaneous open connections với chi phí memory ~ vài MB. Mỗi thread OS truyền thống tiêu tốn ~8 MB stack. Đây là lý do JS runtime chọn event loop + non-blocking I/O thay vì 1 thread/connection.

---

## 2. Concurrency vs Parallelism

```
Concurrency (Đồng thời):
  Task A: ██░░██░░██
  Task B: ░░██░░██░░
  → Xen kẽ trên 1 CPU core

Parallelism (Song song):
  Core 1 - Task A: ██████████
  Core 2 - Task B: ██████████
  → Chạy đồng thời trên nhiều cores
```

**Định nghĩa chuẩn (Rob Pike, Go creators):**
> *Concurrency is about dealing with lots of things at once. Parallelism is about doing lots of things at once.*

| Khía cạnh | Concurrency | Parallelism | Giải thích sâu |
|-----------|-------------|-------------|----------------|
| **Định nghĩa** | Quản lý nhiều task | Chạy nhiều task cùng lúc | Concurrency là **structure**; parallelism là **execution**. |
| **Hardware** | 1 core đủ | Cần multi-core | Event loop là concurrency model chạy được trên 1 core. |
| **Mục tiêu** | Cấu trúc chương trình | Tăng tốc độ | Bạn có thể viết code concurrent mà không chạy song song (overhead context-switch có thể làm chậm). |
| **Ví dụ** | Async I/O, coroutines | MapReduce, GPU computing | Web server là concurrency; matrix multiply là parallelism. |

> ⚠️ **Hiểu lầm phổ biến:** "concurrent = nhanh hơn". Không nhất thiết. Concurrency tốt cho **I/O-bound**; nếu work là **CPU-bound** pure, việc thêm concurrency chỉ tăng overhead schedule → chậm hơn. Dùng đúng mô hình mới tăng throughput.

---

## 3. Threading Models

### 3.1 Multi-Threading

```
Process
├── Thread 1 (Main)
│   ├── Stack riêng
│   └── Program Counter riêng
├── Thread 2
│   ├── Stack riêng
│   └── Program Counter riêng
└── Shared Memory (Heap)
    ├── Global variables
    └── Shared objects
```

**Ưu điểm:**
- True parallelism trên multi-core
- Shared memory → giao tiếp nhanh (vài ns read/write)

**Nhược điểm:**
- Race conditions nếu không đồng bộ
- Deadlock risks khi nested locks
- Khó debug (timing-sensitive bugs)
- Memory overhead ~8 MB/thread (OS default stack)

**Best practice:** giữ critical section nhỏ, dùng lock-free structures khi có thể, tránh nested lock (deadlock recipe).

### 3.2 Multi-Processing

```
Process 1              Process 2
├── Memory riêng       ├── Memory riêng
├── Threads riêng      ├── Threads riêng
└── Resources riêng    └── Resources riêng
    ↕ IPC (Inter-Process Communication) ↕
```

**Khi nào dùng:**
- CPU-intensive tasks (video encode, ML training)
- Cần isolation (crash 1 process không ảnh hưởng process khác)
- Bypass GIL (Python)

**IPC costs:** shared memory ~µs–ms, pipe/socket ~µs, RPC ~ms. Chọn IPC phù hợp workload.

### 3.3 Green Threads / Coroutines

```
OS Thread
├── Coroutine A (lightweight)
├── Coroutine B (lightweight)
├── Coroutine C (lightweight)
└── Scheduler (user-space)
```

**Đặc điểm:**
- Rất nhẹ (KB thay vì MB) — tạo hàng triệu coroutine dễ dàng
- User-space scheduling → ít context-switch overhead
- Ví dụ: Go goroutines, Kotlin coroutines, Python asyncio, Rust async/await

**Giới hạn:** vẫn cần OS thread pool để thật sự chạy song song trên multi-core (trong Go gọi M:N scheduling). Single-threaded coroutine vẫn single-core về execution.

---

## 4. Synchronization Primitives

### 4.1 Mutex (Mutual Exclusion)

```
Thread A: lock(mutex) → [critical section] → unlock(mutex)
Thread B: wait....... → lock(mutex) → [critical section] → unlock(mutex)
```

**Dùng khi:** Chỉ cho phép 1 thread truy cập resource tại 1 thời điểm.
**Chi phí:** lock/unlock ~10–100 ns (contended), ~1 ns (uncontended).

**Pitfall:** nested locks → deadlock nếu acquire order không consistent. Quy tắc: luôn acquire locks theo thứ tự cố định (ví dụ alphabetically by resource ID).

### 4.2 Semaphore

```
Semaphore(3):  // Cho phép tối đa 3 threads
  Thread 1: acquire ✅ (count=2)
  Thread 2: acquire ✅ (count=1)
  Thread 3: acquire ✅ (count=0)
  Thread 4: wait... ⏳
  Thread 1: release → Thread 4: acquire ✅
```

**Dùng khi:** Giới hạn số lượng truy cập đồng thời (connection pool, rate limiting, bounded parallelism).

### 4.3 Read-Write Lock

```
Readers (đồng thời):     Writer (exclusive):
  Reader 1: read ✅        Writer: wait...
  Reader 2: read ✅        All readers done →
  Reader 3: read ✅        Writer: write ✅
```

**Dùng khi:** Nhiều readers, ít writers (caches, config). Giảm contention so với mutex khi read-heavy.

### 4.4 Atomic Operations

```
Atomic counter:
  Thread A: counter.incrementAndGet() → 1
  Thread B: counter.incrementAndGet() → 2
  → Không cần lock, hardware-level guarantee
```

**Dùng khi:** Các phép toán đơn giản trên shared variables (counter, flag, bitset). Fastest primitive — CPU instruction ở cấp độ `LOCK XADD`, `CMPXCHG`.

---

## 5. Async/Await & Event Loop

### 5.1 Event Loop Model

```
         ┌──────────────────┐
    ┌───→│   Event Queue    │
    │    └────────┬─────────┘
    │             ↓
    │    ┌──────────────────┐
    │    │   Event Loop     │──→ Callback/Promise
    │    └────────┬─────────┘
    │             ↓
    │    ┌──────────────────┐
    │    │   I/O (Non-block)│
    │    └────────┬─────────┘
    │             ↓
    └─────── I/O Complete
```

### 5.2 Async/Await Pattern

```
Synchronous:                  Asynchronous:
  fetch data    ████ 2s        fetch data    ██──
  process       ██   1s        process       ──██
  fetch more    ████ 2s        fetch more    ██──
  Total:        5s             Total:        ~3s (overlapping I/O)
```

**Nguyên tắc:**
- `async` đánh dấu hàm có thể "tạm dừng"
- `await` tạm dừng và nhường quyền cho event loop
- Hiệu quả cho **I/O-bound** tasks, KHÔNG phải CPU-bound

### 5.3 So Sánh Models

| Model | Best For | Ví dụ | Giải thích sâu |
|-------|----------|-------|----------------|
| **Multi-threading** | CPU-bound + shared state | Image processing | Parallel true, nhưng shared-memory race condition rủi ro cao |
| **Async/Await** | I/O-bound, high concurrency | Web servers, API calls | Low overhead (no thread per connection), single-core friendly |
| **Multi-processing** | CPU-bound + isolation | Data science, ML training | No shared memory = no race, but IPC costly |
| **Actor Model** | Distributed, fault-tolerant | Akka, Erlang/OTP | Each actor has own state + mailboxes, message passing only |

---

## 6. Concurrency Patterns

### 6.1 Producer-Consumer

```
Producer → [Buffer/Queue] → Consumer
   ↓            ↓              ↓
  Tạo data   Hàng đợi      Xử lý data
```

**Dùng khi:** Tách biệt việc tạo và xử lý data (message queues, job workers).
**Variants:** bounded buffer (backpressure), unbounded (memory risk), multiple producers/consumers.

### 6.2 Thread Pool

```
Task Queue: [T1] [T2] [T3] [T4] [T5] [T6]
                    ↓
Thread Pool:  Worker1  Worker2  Worker3
              [T1]     [T2]     [T3]
              done→[T4] done→[T5] done→[T6]
```

**Lợi ích:** Tái sử dụng threads, tránh overhead tạo/hủy thread (~µs).
**Size tuning:** I/O-bound ≈ `2 × CPU_count`; CPU-bound ≈ `CPU_count + 1`.

### 6.3 Future/Promise

```
main() {
  future1 = async fetchUser()     // Bắt đầu ngay
  future2 = async fetchOrders()   // Bắt đầu ngay

  user   = await future1          // Chờ kết quả
  orders = await future2          // Có thể đã xong
}
```

**Key insight:** khởi phát trước, await sau — đây là cách viết parallelism rõ ràng nhất trong async/await.

### 6.4 Actor Model

```
Actor A                    Actor B
├── Mailbox               ├── Mailbox
├── State (private)       ├── State (private)
├── Behavior              ├── Behavior
└── Send message ──────→  └── Receive & process
    (async, non-blocking)
```

**Đặc điểm:**
- Không shared state → Không cần locks
- Giao tiếp qua messages
- Fault-tolerant (supervisor hierarchy)

**Trade-off:** message serialization/latency; debug harder (message ordering, delivery semantics).

### 6.5 CSP (Communicating Sequential Processes)

```
Goroutine A ──→ [Channel] ──→ Goroutine B
                   ↕
              Synchronized
```

**Triết lý:** "Don't communicate by sharing memory; share memory by communicating." — Go proverb

**So sánh Actor vs CSP:**
| Actor | CSP |
|-------|-----|
| Push-based (actor push message vào mailbox) | Pull/sync (channel blocking send/receive) |
|-Mailbox không giới hạn (memory risk) | Buffer có thể bounded (backpressure tự nhiên) |
| Akka, Erlang | Go channels, Java Channel API |

---

## 7. Các Vấn Đề Thường Gặp

### 7.1 Race Condition

```
Thread A: read(x=0) → compute(x+1) → write(x=1)
Thread B: read(x=0) → compute(x+1) → write(x=1)
Expected: x=2, Actual: x=1 ❌
```

**Giải pháp:** Mutex, atomic operations, immutable data.
**JS đặc biệt:** `await` boundary là race window — nhiều async function cùng chạy giữa 2 await → race. Xem [12.5 Race Conditions](12.5-race-conditions/README.md).

### 7.2 Deadlock

```
Thread A: lock(Resource1) → wait(Resource2) ⏳
Thread B: lock(Resource2) → wait(Resource1) ⏳
→ Cả hai chờ nhau mãi mãi! 💀
```

**4 điều kiện Deadlock (Coffman):**
1. Mutual Exclusion
2. Hold and Wait
3. No Preemption
4. Circular Wait

**Giải pháp:**
- **Lock ordering:** luôn acquire theo thứ tự cố định (ví dụ theo ID).
- **Timeout:** `tryLock(timeout)` → fallback nếu không lấy được.
- **Deadlock detection:** periodic graph scan (heavy).
- **Avoid nested locks:** thiết kế lại để không cần.

### 7.3 Starvation

```
High-priority threads: luôn được chạy ✅✅✅
Low-priority thread:   chờ mãi... ⏳⏳⏳
```

**Giải pháp:** Fair scheduling, priority aging (nâng prio thread chờ lâu).

### 7.4 Livelock

```
Thread A: "Nhường bạn đi trước"  →  ←  →  ←
Thread B: "Không, bạn đi trước" ←  →  ←  →
→ Cả hai cứ nhường nhau, không ai tiến! 🔄
```

**Giải pháp:** Random backoff, asymmetric algorithm (một bên luôn nhường trước).

---

## 8. Tài Liệu Tham Khảo

### 📚 Sách

| Sách | Tác giả | Ghi chú |
|------|---------|---------|
| *Java Concurrency in Practice* | Brian Goetz | Bible về Java concurrency |
| *Concurrency in Go* | Katherine Cox-Buday | Go-specific patterns |
| *Seven Concurrency Models in Seven Weeks* | Paul Butcher | Đa paradigm |
| *The Art of Multiprocessor Programming* | Herlihy & Shavit | Lý thuyết sâu |

### 🔗 Tài liệu trực tuyến

- [Go Concurrency Patterns](https://go.dev/blog/pipelines)
- [Python asyncio](https://docs.python.org/3/library/asyncio.html)
- [Java Virtual Threads (Project Loom)](https://openjdk.org/projects/loom/) — Virtual Threads đã chính thức trong Java 21 LTS (9/2023, JEP 444), production-ready, không còn là dự án thử nghiệm
- [Rust Async Book](https://rust-lang.github.io/async-book/)

---

> 💡 **Lời khuyên:** Bắt đầu với **async/await** cho I/O-bound,
> **thread pool** cho CPU-bound,
> và **luôn luôn** nghĩ về race conditions trước khi viết concurrent code!
>
> Thứ tự học đề xuất: (1) Event loop fundamentals → (2) Promises/async-await → (3) Race conditions → (4) Synchronization → (5) Advanced patterns.
