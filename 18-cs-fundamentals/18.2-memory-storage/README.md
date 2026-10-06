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
