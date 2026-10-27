# 🧵 12.7 Threads vs Processes vs Event Loop (Mô Hình Thực Thi)

> **Thread** chia sẻ memory trong 1 process (nhanh nhưng race); **process** cách ly hoàn toàn (an toàn nhưng IPC đắt); **event loop** 1 thread + non-blocking I/O (tốt nhất cho I/O-bound, bó tay với CPU-bound).

---

## 🎯 Vấn đề

Chọn sai mô hình: chạy resize 1000 ảnh trên event loop Node → server đơ 30s (CPU-bound chặn loop). Hoặc spawn 10k OS threads cho 10k connections → hết RAM (8MB/thread):

```
event loop + CPU nặng → loop block, mọi request chờ 💥
1 thread/connection   → 10k × 8MB = 80GB RAM 💥
```

---

## 💻 Code ví dụ

Mô phỏng worker phân chia: đo event loop bị block vs chia việc cho workers.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

// CPU-bound giả lập: tính toán nặng chặn thread hiện tại
function heavy(n: number): number {
  let s = 0;
  for (let i = 0; i < n * 1e6; i++) s += Math.sqrt(i);
  return s;
}

// Chia việc: cắt array thành chunks, mỗi "worker" xử lý 1 chunk (mô phỏng phân chia)
function splitWork<T>(items: T[], workers: number): T[][] {
  const chunks: T[][] = Array.from({ length: workers }, () => []);
  items.forEach((it, i) => chunks[i % workers].push(it));
  return chunks;
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Chọn đúng | I/O-bound → event loop; CPU-bound → threads/processes; crash-isolation → processes |
| Hiểu chi phí | Thread ~8MB + race; process +IPC ms; coroutine ~KB + vẫn cần pool để parallel |
| Debug đúng tầng | "Chậm" do block loop khác "chậm" do thiếu core — fix khác nhau hoàn toàn |

---

## ⚠️ Lưu Ý

- Node.js: CPU-bound → worker_threads/child_process, không chạy trên main loop.
- Python: GIL chặn threads CPU-bound → dùng multiprocessing.
- Shared memory luôn cần đồng bộ (xem 12.8); message-passing (queue/channel) an toàn hơn share.
- Số workers CPU-bound ≈ số cores; I/O-bound mới cần nhiều hơn.

---

## 🎯 Khi nào dùng

- Event loop: web server, API gateway, proxy (I/O-bound, nhiều connections).
- Threads: xử lý ảnh/video, tính toán song song có share memory.
- Processes: ML training, encode video, cần crash 1 job không sập service.

---

## 🚀 Đi Sâu Thêm

**So sánh concurrency model theo runtime:**

| Tiêu chí | Node.js (libuv pool) | Browser (Web Workers) | Java Virtual Threads (JEP 444, Java 21+) | Go Goroutines |
|---|---|---|---|---|
| Mô hình | Event loop + thread pool (I/O async) | Main + worker threads (1:1) | 1 JVM thread → N virtual threads (M:N) | 1 OS thread → N goroutines (M:N) |
| CPU-bound | `worker_threads` (riêng pool) | Worker riêng hoàn toàn | Tự nhiên, không đổi code | `GOMAXPROCS` = số core |
| RAM/thread | ~8KB stack (libuv) | ~5MB (browser spec) | ~200B–1KB (virtual) | ~2KB stack |
| Blocking call | Non-blocking bắt buộc | Blocking chặn worker | Platform blocking → park virtual thread (rẻ) | Chặn goroutine khác (scheduler đổi) |
| Khởi tạo | ~µs | ~ms (worker spawn) | ~µs (VirtualThread.start) | ~µs (go func(){}) |

**Context-switching cost — số liệu thực tế:**
- OS thread context switch: ~1–5 µs, tốn cache L1/L2 miss (stack toàn bộ + registers).
- Goroutine context switch: ~0.2–0.5 µs (chỉ chuyển registers + stack pointer, không switch MMU/segment), do Go scheduler (`GOMAXPROCS` ≤ CPU cores).
- Virtual thread context switch: ~0.5–2 µs (park/unpark lightweight, không OS context switch).
- **Thực hành:** 10K goroutines rẻ; 10K OS threads → hàng GB RAM + context switch flood → treo.

---

## 🔗 Liên quan

- **12.3 Event Loop** — microtask/macrotask, vì sao block loop nguy hiểm.
- **12.4 Web Workers** — offload khỏi main thread ở browser.
- **12.9 Thread Pools** — tái sử dụng threads thay vì spawn mỗi lần.

---

## 📚 Tài liệu

- Node Event Loop — https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick
- *Seven Concurrency Models in Seven Weeks* — Paul Butcher

---

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.7-threads-processes
npx tsx examples/index.ts
```

Demo: task I/O trên loop (nhanh) vs task CPU chặn loop (đơ) vs chia chunks cho workers.

---

## ⏭️ Bài tiếp theo

→ [12.8 Locks & Deadlock](../12.8-locks-deadlock/README.md)
