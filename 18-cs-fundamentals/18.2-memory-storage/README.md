# 🧠 18.2 Memory & Storage (Bộ Nhớ & Lưu Trữ)

> **Mọi biến bạn tạo đều sống ở đâu đó:** stack cho dữ liệu ngắn hạn có thứ tự,
> heap cho dữ liệu dài hạn linh hoạt, cache cho dữ liệu dùng lại — đặt sai chỗ là chậm, rò rỉ, crash.

---

## 🎯 Vấn Đề

Vì sao đệ quy sâu gây `stack overflow`? Vì sao duyệt mảng 2 chiều theo cột chậm hơn theo hàng
dù cùng số phép tính? Vì sao app "ăn RAM" mãi không nhả (memory leak)? Tất cả đều do tháp bộ nhớ
phân tầng: thanh ghi → cache (nhanh, nhỏ) → RAM → disk (chậm, lớn), cộng cách OS ánh xạ
bộ nhớ ảo (virtual memory) thành trang (pages).

```
Tốc độ ↑  thanh ghi → L1/L2 cache → RAM → SSD/HDD   Dung lượng ↓ ngược lại
Stack: push/pop có thứ tự, tự giải phóng | Heap: cấp phát linh hoạt, phải tự quản lý
```

---

## 💻 Code Ví Dụ

```typescript
// Stack vs Heap (minh họa khái niệm): stack frame tự hủy khi return,
// object trên heap sống đến khi không còn tham chiếu (GC thu hồi)
function stackDemo(): number {
  const a = 1; // "stack": nguyên thủy, scope hàm
  const b = 2;
  return a + b; // frame bị hủy, a/b biến mất
}

// Cache locality: duyệt theo hàng (row-major) tận dụng cache line nạp sẵn
function sumRowMajor(matrix: number[][], n: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) sum += matrix[i][j]; // ô kế tiếp đã nằm trong cache
  }
  return sum;
}

// Virtual memory (mô phỏng): địa chỉ ảo → số trang + offset, tra bảng trang ra frame vật lý
function translateAddress(virtualAddr: number, pageSize: number, pageTable: Map<number, number>): number | null {
  const page = Math.floor(virtualAddr / pageSize);
  const offset = virtualAddr % pageSize;
  const frame = pageTable.get(page);
  if (frame === undefined) return null; // page fault: trang chưa nạp
  return frame * pageSize + offset;
}
```

> Demo đầy đủ (stack/heap, đo locality, dịch địa chỉ ảo, mô phỏng leak) trong `examples/index.ts` —
> chạy bằng `npx ts-node examples/index.ts`.

---

## ✅ Lợi Ích

| Hiểu biết | Lợi ích |
|---|---|
| Stack/heap | Tránh stack overflow, hiểu vì sao closure giữ RAM |
| Cache locality | Viết vòng lặp nhanh hơn gấp nhiều lần không cần thuật toán mới |
| Virtual memory/paging | Hiểu page fault, vì sao app đầu tiên mở chậm |
| Heap profiling | Phát hiện leak (listener không gỡ, cache không giới hạn) |

---

## ⚠️ Lưu Ý

- JS/TS có GC nên bạn không `malloc/free` — nhưng leak vẫn xảy ra (global, closure, Map không xóa, DOM detached).
- Đừng micro-opt locality khi chưa đo: profiler (DevTools Memory/Performance) trước, tối ưu sau.
- Đệ quy sâu trong JS dễ tràn stack vì engine giới hạn (~10k frames) — hãy chuyển vòng lặp hoặc chunk.

---

## 🎯 Khi Nào Dùng

- App web ngốn RAM: chụp heap snapshot tìm object phình to.
- Xử lý mảng/ma trận lớn: duyệt đúng thứ tự bộ nhớ, dùng TypedArray khi cần.
- Giải thích hiện tượng: vì sao `structuredClone` tốn RAM, vì sao worker tốn bộ nhớ riêng.

---

## 🚀 Đi Sâu Thêm

**NUMA (Non-Uniform Memory Access) — RAM không đều nhau:**
- Server multi-socket (2+ CPU): mỗi CPU có RAM gần nhất ("local memory") nhanh hơn RAM của CPU khác ("remote memory") ~20–30%.
- K8s pod chạy trên node 2-socket: nếu không set ` topology.kubernetes.io/zone` / ` topology.node.kubernetes.io/memory` → pod có thể bị split qua 2 NUMA node → latency tăng không dự đoán được.
- Tối ưu: dùng `systemReserved` / `kubelet` topology hints, hoặc `KubeletMemoryManager` trong Kubernetes 1.28+ để pin pod vào NUMA node.

**Memory hierarchy latency — con số thực tế:**

| Cấp độ | Dung lượng | Latency | Ghi chú |
|---|---|---|---|
| L1 cache | ~32–64 KB/core | ~1 ns | Split I+D, 4-cycle hit |
| L2 cache | ~256 KB–1 MB/core | ~3–4 ns | Inclusive hoặc exclusive |
| L3 cache | ~8–32 MB/socket | ~10–20 ns | Shared giữa cores |
| **RAM** | 8–256 GB | **~100 ns** | NUMA penalty +20–30 ns nếu remote |
| **NVMe SSD** | TB-level | **~100 µs** | Random read |
| **HDD** | TB-level | **~10 ms** | Seek + rotation |
| **S3/remote storage** | ∞ | **~100–500 ms** | Network + API overhead |

→ Cache miss trên RAM là chậm gấp ~100 lần cache hit; NVMe chậm hơn RAM gấp 1000 lần. Bài học: duyệt mảng đúng thứ tự (cache-line locality) quan trọng hơn thuật toán phức tạp hơn.

**`mmap` vs `read` syscall:**
- `read(fd, buf, n)`: kernel đọc vào kernel buffer → copy sang user buffer = 2 copies.
- `mmap(fd, offset, length)`: ánh xạ file vào virtual address space, page fault triggers read on-demand → không copy thừa, lazy load theo page.
- Dùng `mmap` khi: đọc file lớn ngẫu nhiên (database indexes), random access pattern, share memory giữa processes. Dùng `read` khi: sequential scan nhỏ, stream processing (streaming không cần random access).
- Risk: mmap unmapped page khi file thay đổi (truncate → SIGBUS) — cần handle signal.

---

## 🔗 Liên Quan

- [18.1 Operating Systems](../18.1-operating-systems/README.md) — OS quản lý trang nhớ, phân trang.
- [06-data-structures-and-algorithms](../../06-data-structures-and-algorithms/README.md) — Big-O + cấu trúc dữ liệu cache-friendly.
- [19.2 Core Web Vitals](../../19-frontend-performance/19.2-core-web-vitals/README.md) — RAM/CPU ảnh hưởng INP.

---

## 📚 Tài Liệu

- 📖 *Computer Systems: A Programmer's Perspective* (CS:APP), chương 6 & 9
- 📖 [MDN: Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)
- 📖 [V8 Memory / Chrome DevTools Memory](https://developer.chrome.com/docs/devtools/memory-problems/)

---

## ⏭️ Bài Tiếp Theo

→ [18.3 Encoding Data](../18.3-encoding-data/README.md)
