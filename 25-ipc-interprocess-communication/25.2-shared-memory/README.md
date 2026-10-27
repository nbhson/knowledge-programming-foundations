# ⚡ 25.2 Shared Memory (Bộ Nhớ Chung)

> **Cách IPC nhanh nhất: 2 process đọc/ghi CÙNG vùng RAM** — không copy, không
> serialize. Nhưng quyền tốc độ phải trả giá: bạn tự lo đồng bộ (mutex/semaphore),
> sai là data race kinh điển.

> Liên quan: `12.8-locks-deadlock` (đồng bộ), `12.5-race-conditions`,
> `20.2-bit-manipulation` (atomic operations).

---

## 🎯 Vấn Đề

Pipe/socket phải COPY dữ liệu qua kernel — chậm với dữ liệu lớn (video frame,
ma trận ML). Shared memory: cả 2 process map cùng vùng RAM → tốc độ = tốc độ RAM.
Đổi giá = phải tự đồng bộ: 2 process ghi cùng lúc = data race.

```
PIPE:    A → copy vào kernel → copy ra B     (2 lần copy)
SHM:     A ──┐
             ├──> CÙNG vùng RAM (0 copy)  + BẮT BUỘC đồng bộ hóa
         B ──┘
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Node.js SharedArrayBuffer + Atomics (worker_threads chia sẻ bộ nhớ) =====
import { Worker, MessageChannel } from "node:worker_threads";

const sharedBuffer = new SharedArrayBuffer(8);          // vùng nhớ chung
const counter = new Int32Array(sharedBuffer);

const worker = new Worker(`
  const { workerData, parentPort } = require("node:worker_threads");
  const arr = new Int32Array(workerData);
  for (let i = 0; i < 100_000; i++) {
    Atomics.add(arr, 0, 1);   // ATOMIC — an toàn khi 2 thread cùng tăng
  }
`, { workerData: sharedBuffer });

await worker;
console.log("Counter:", counter[0]); // 100000 — chính xác nhờ Atomics
// ❌ counter[0]++ trong worker là NON-ATOMIC: 2 thread đọc-ghi chồng nhau → mất update

// ===== Race condition minh họa (KHÔNG dùng Atomics) =====
// Thread A: đọc 100 → +1 → ghi 101
// Thread B: đọc 100 (A chưa ghi) → +1 → ghi 101  ← MẤT 1 lần tăng!
// Giải pháp: Atomics.add, hoặc mutex (worker_threads + Atomics.wait/notify)

// ===== Message passing (an toàn hơn, chậm hơn) =====
// postMessage(): copy dữ liệu qua channel — KHÔNG chia sẻ bộ nhớ
// worker.postMessage(bigArray)   → copy ~ (chậm với object lớn)
// zero-copy: transfer ArrayBuffer (ownership chuyển, không copy)
```

---

## ⚖️ Shared Memory vs Message Passing

| | Shared memory | Message passing |
|---|---|---|
| Tốc độ | nhanh nhất (zero-copy) | chậm hơn (copy/serialize) |
| Đồng bộ | TỰ lo (mutex/atomics) | OS/kệnh tự lo |
| Số process | nhiều | theo kênh |
| Dễ dùng | khó — race condition | dễ |
| Dùng khi | video/game/HPC | 99% ứng dụng thường |

> Nguyên tắc thực chiến: **"Do not communicate by sharing memory;
> share memory by communicating"** (Go proverb) — mặc định message passing,
> chỉ dùng shared memory khi profile chứng minh copy là bottleneck.

---

## ⚠️ Bẫy Thường Gặp

1. **Đọc/ghi chia sẻ không atomic** — race condition, mất update. Dùng `Atomics.*`.
2. **2 process kẹt chờ nhau** — shared memory + lock sai → deadlock (xem 12.8).
3. **Cache coherency ảo tưởng** — CPU cache mỗi core; nếu không dùng memory barrier, giá trị đọc là cũ. Dùng Atomics, không tự chế.
4. **Resize vùng nhớ chung** — không được; thiết kế trước kích thước hoặc dùng ring buffer.
5. **Copy object lớn qua postMessage rồi trách shared memory chậm** — không đúng: postMessage là copy, shared memory mới là zero-copy.

---

## 📝 Bài Tập Tự Vấn

1. Counter tăng 1 triệu lần từ 4 thread: viết 2 phiên bản (có/không Atomics) — so kết quả.
2. Tại sao `Atomics.wait` không hoạt động trên main thread của trình duyệt?
3. Video processing 4K, 2 process: thiết kế pipeline shared memory + semaphore.

---

*Leaf thuộc [Lớp 25 — IPC](../README.md)*
