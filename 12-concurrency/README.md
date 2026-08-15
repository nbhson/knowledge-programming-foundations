# ⚡ Lớp 12: Concurrency & Parallel Programming (Lập Trình Đồng Thời)

> **Concurrency** là khả năng **xử lý nhiều tác vụ cùng lúc** —
> từ multi-threading, async/await đến distributed computing.
> Đây là kiến thức **bắt buộc** để xây dựng hệ thống hiệu năng cao.

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

- **Tăng throughput:** Xử lý nhiều request cùng lúc
- **Responsive UI:** Không block giao diện khi xử lý nặng
- **Tận dụng hardware:** Sử dụng hết multi-core CPU
- **I/O efficiency:** Không lãng phí CPU khi chờ I/O

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

| Khía cạnh | Concurrency | Parallelism |
|-----------|-------------|-------------|
| **Định nghĩa** | Quản lý nhiều task | Chạy nhiều task cùng lúc |
| **Hardware** | 1 core đủ | Cần multi-core |
| **Mục tiêu** | Cấu trúc chương trình | Tăng tốc độ |
| **Ví dụ** | Async I/O, coroutines | MapReduce, GPU computing |

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
- Shared memory → giao tiếp nhanh

**Nhược điểm:**
- Race conditions
- Deadlock risks
- Khó debug

### 3.2 Multi-Processing

```
Process 1              Process 2
├── Memory riêng       ├── Memory riêng
├── Threads riêng      ├── Threads riêng
└── Resources riêng    └── Resources riêng
    ↕ IPC (Inter-Process Communication) ↕
```

**Khi nào dùng:**
- CPU-intensive tasks
- Cần isolation (crash 1 process không ảnh hưởng process khác)
- Bypass GIL (Python)

### 3.3 Green Threads / Coroutines

```
OS Thread
├── Coroutine A (lightweight)
├── Coroutine B (lightweight)
├── Coroutine C (lightweight)
└── Scheduler (user-space)
```

**Đặc điểm:**
- Rất nhẹ (KB thay vì MB)
- User-space scheduling
- Ví dụ: Go goroutines, Kotlin coroutines, Python asyncio

---

## 4. Synchronization Primitives

### 4.1 Mutex (Mutual Exclusion)

```
Thread A: lock(mutex) → [critical section] → unlock(mutex)
Thread B: wait....... → lock(mutex) → [critical section] → unlock(mutex)
```

**Dùng khi:** Chỉ cho phép 1 thread truy cập resource tại 1 thời điểm.

### 4.2 Semaphore

```
Semaphore(3):  // Cho phép tối đa 3 threads
  Thread 1: acquire ✅ (count=2)
  Thread 2: acquire ✅ (count=1)
  Thread 3: acquire ✅ (count=0)
  Thread 4: wait... ⏳
  Thread 1: release → Thread 4: acquire ✅
```

**Dùng khi:** Giới hạn số lượng truy cập đồng thời (connection pool, rate limiting).

### 4.3 Read-Write Lock

```
Readers (đồng thời):     Writer (exclusive):
  Reader 1: read ✅        Writer: wait...
  Reader 2: read ✅        All readers done →
  Reader 3: read ✅        Writer: write ✅
```

**Dùng khi:** Nhiều readers, ít writers (caches, config).

### 4.4 Atomic Operations

```
Atomic counter:
  Thread A: counter.incrementAndGet() → 1
  Thread B: counter.incrementAndGet() → 2
  → Không cần lock, hardware-level guarantee
```

**Dùng khi:** Các phép toán đơn giản trên shared variables.

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

| Model | Best For | Ví dụ |
|-------|----------|-------|
| **Multi-threading** | CPU-bound + shared state | Image processing |
| **Async/Await** | I/O-bound, high concurrency | Web servers, API calls |
| **Multi-processing** | CPU-bound + isolation | Data science, ML training |
| **Actor Model** | Distributed, fault-tolerant | Akka, Erlang/OTP |

---

## 6. Concurrency Patterns

### 6.1 Producer-Consumer

```
Producer → [Buffer/Queue] → Consumer
   ↓            ↓              ↓
  Tạo data   Hàng đợi      Xử lý data
```

**Dùng khi:** Tách biệt việc tạo và xử lý data (message queues, job workers).

### 6.2 Thread Pool

```
Task Queue: [T1] [T2] [T3] [T4] [T5] [T6]
                    ↓
Thread Pool:  Worker1  Worker2  Worker3
              [T1]     [T2]     [T3]
              done→[T4] done→[T5] done→[T6]
```

**Lợi ích:** Tái sử dụng threads, tránh overhead tạo/hủy thread.

### 6.3 Future/Promise

```
main() {
  future1 = async fetchUser()     // Bắt đầu ngay
  future2 = async fetchOrders()   // Bắt đầu ngay
  
  user   = await future1          // Chờ kết quả
  orders = await future2          // Có thể đã xong
}
```

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

### 6.5 CSP (Communicating Sequential Processes)

```
Goroutine A ──→ [Channel] ──→ Goroutine B
                   ↕
             Synchronized
```

**Triết lý:** "Don't communicate by sharing memory; share memory by communicating." — Go proverb

---

## 7. Các Vấn Đề Thường Gặp

### 7.1 Race Condition

```
Thread A: read(x=0) → compute(x+1) → write(x=1)
Thread B: read(x=0) → compute(x+1) → write(x=1)
Expected: x=2, Actual: x=1 ❌
```

**Giải pháp:** Mutex, atomic operations, immutable data.

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

**Giải pháp:** Lock ordering, timeout, deadlock detection.

### 7.3 Starvation

```
High-priority threads: luôn được chạy ✅✅✅
Low-priority thread:   chờ mãi... ⏳⏳⏳
```

**Giải pháp:** Fair scheduling, priority aging.

### 7.4 Livelock

```
Thread A: "Nhường bạn đi trước"  →  ←  →  ←
Thread B: "Không, bạn đi trước" ←  →  ←  →
→ Cả hai cứ nhường nhau, không ai tiến! 🔄
```

**Giải pháp:** Random backoff, asymmetric algorithm.

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
- [Java Virtual Threads (Project Loom)](https://openjdk.org/projects/loom/)
- [Rust Async Book](https://rust-lang.github.io/async-book/)

---

> 💡 **Lời khuyên:** Bắt đầu với **async/await** cho I/O-bound,
> **thread pool** cho CPU-bound,
> và **luôn luôn** nghĩ về race conditions trước khi viết concurrent code!