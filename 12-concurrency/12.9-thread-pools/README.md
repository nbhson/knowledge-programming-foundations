# 🏊 12.9 Thread Pools (Hồ Luồng & Hàng Đợi)

> Tạo/hủy thread tốn kém (~µs–ms + 8MB stack). **Thread pool** giữ sẵn N workers tái sử dụng + queue chứa task chờ — kèm sizing đúng (CPU-bound ≈ cores+1, I/O-bound ≈ 2×cores) và chính sách queue khi đầy.

---

## 🎯 Vấn đề

Mỗi request spawn 1 thread: 10k requests = 10k threads = hết RAM + CPU chỉ lo context-switch:

```
spawn/thread: 10k × 8MB = 80GB + tạo/hủy liên tục 💥
pool 8 workers + queue: 8 threads cố định, task xếp hàng chờ ✅
```

Nhưng pool sai: quá ít → queue dài, latency cao; queue vô hạn → OOM thay vì fail-fast.

---

## 💻 Code ví dụ

Mô phỏng pool: workers cố định, queue bounded, 3 chính sách khi đầy (abort/caller-runs/discard-oldest).

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

type RejectPolicy = "abort" | "caller-runs" | "discard-oldest";

class ThreadPool {
  constructor(
    private workers: number,
    private queueLimit: number,
    private policy: RejectPolicy,
  ) {}

  sizingTip(kind: "cpu" | "io", cores: number): number {
    return kind === "cpu" ? cores + 1 : cores * 2; // công thức khởi đầu
  }
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Không trả phí tạo/hủy | Workers sống sẵn — task tới là chạy (~ns dispatch) |
| Tải có biên | Queue bounded + policy rõ ràng: hệ thống suy giảm có kiểm soát thay vì sập |
| Đo + tune được | Active/queued/rejected metrics cho biết thiếu workers hay task quá nặng |

---

## ⚠️ Lưu Ý

- Queue vô hạn là bom OOM: luôn bounded + policy (abort cho API, caller-runs để tự backpressure, discard-oldest cho telemetry).
- Task blocking chiếm worker: pool I/O mà task sleep 10s → workers cạn dù CPU rảnh — tách pool blocking riêng.
- Shutdown mềm: `shutdown()` ngừng nhận + chờ queue xong; `shutdownNow()` cho deploy gấp.
- Sizing là khởi đầu: đo active/queue thực tế rồi tune, không thờ công thức.

---

## 🎯 Khi nào dùng

- Server xử lý song song (web workers, DB pool, job workers), batch jobs.
- Không dùng khi: task cực hiếm (spawn thẳng rẻ hơn giữ pool) hoặc single-thread event loop đã đủ (I/O thuần Node).

---

## 🚀 Đi Sâu Thêm

**Công thức sizing pool — điểm khởi đầu, đo để tune:**

```
CPU-bound:  N = cores + 1                # worker cho 1 task nặng, tránh context-switch thừa
I/O-bound:  N = cores × 2  (hoặc × 3–4)  # CPU rảnh trong khi chờ I/O → bù thêm
Mixed:      N = cores × (1 + W/C)         # W = thời gian chờ I/O, C = thời gian CPU

Ví dụ: 4 cores, task chờ HTTP 80ms, CPU 20ms → W/C = 4 → N = 4 × 5 = 20 workers
```

- Đo metrics thực tế: `active count`, `queue size`, `reject count` — tăng workers khi queue > threshold liên tục, không phải khi request đến.

**Work-stealing queue — pool Go/JS Worker threads dùng:**
- Mỗi worker có queue riêng; queue trống → steal task từ worker khác.
- Tránh 1 worker nghẽn (single bottleneck) khi tasks không đồng đều; cải thiện throughput 10–30% so với shared queue.

**Rejection policy — đầy queue thì sao:**

| Policy | Hành vi | Dùng khi |
|---|---|---|
| `Abort` | Ném exception cho caller | API endpoint — caller phải xử lý lỗi rõ ràng |
| `CallerRuns` | Caller chạy task luôn (trong thread gọi) | Backpressure tự nhiên, caller đỡ tốc độ |
| `DiscardOldest` | Bỏ task cũ nhất | Telemetry/analytics — mới nhất quan trọng hơn |
| `Discard` | Bỏ task mới nhất | Cache refresh — miss lần này, lần sau retry |

**Dead thread pool anti-pattern — unbounded queue OOM:**
```
while (true) {
  queue.push(task); // không giới hạn
  // Nếu producer nhanh hơn consumer mãi → queue grow → OOM → cả pool chết
}
```
→ Luôn bounded + policy. Nếu cần retry: dùng message broker (Kafka/RabbitMQ) thay vì in-memory queue vô hạn — process restart không mất task nhờ persistence.

---

## 🔗 Liên quan

- **12.7 Threads vs Processes** — pool quản lý threads đã chọn.
- **12.10 Backpressure** — queue đầy thì báo ngược lên producer thay vì nhận bừa.
- **10.10 Connection Pooling** — cùng nguyên lý pool, khác tài nguyên (connections).

---

## 📚 Tài liệu

- Java ExecutorService (Java 21 LTS) — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html
- Node worker_threads — https://nodejs.org/api/worker_threads.html

---

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.9-thread-pools
npx tsx examples/index.ts
```

Demo: pool 2 + 5 tasks → queue đầy trigger 3 policies → công thức sizing CPU vs I/O.

---

## ⏭️ Bài tiếp theo

→ [12.10 Backpressure](../12.10-backpressure/README.md)
