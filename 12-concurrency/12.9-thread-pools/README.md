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
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

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

## 🔗 Liên quan

- **12.7 Threads vs Processes** — pool quản lý threads đã chọn.
- **12.10 Backpressure** — queue đầy thì báo ngược lên producer thay vì nhận bừa.
- **10.10 Connection Pooling** — cùng nguyên lý pool, khác tài nguyên (connections).

---

## 📚 Tài liệu

- Java ExecutorService — https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ExecutorService.html
- Node worker_threads — https://nodejs.org/api/worker_threads.html

---

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.9-thread-pools
npx ts-node examples/index.ts
```

Demo: pool 2 + 5 tasks → queue đầy trigger 3 policies → công thức sizing CPU vs I/O.

---

## ⏭️ Bài tiếp theo

→ [12.10 Backpressure](../12.10-backpressure/README.md)
