# ⏱️ 22.3 Profiling (Đo Hiệu Năng)

> **"Chậm" là cảm nhận, profile là dữ kiện.** 90% lập trình viên đoán sai chỗ chậm.
> Profiling đo ĐÚNG chỗ nào tiêu CPU/memory rồi mới sửa — không đo không sửa
> (premature optimization là gốc rễ mọi tệ hại).

> Liên quan: `5.3-performance-optimization` (kỹ thuật tối ưu), `19-frontend-performance`
> (profiling trình duyệt), `18.2-memory-storage` (bộ nhớ hoạt động thế nào).

---

## 🎯 Vấn Đề

API chậm 2 giây. Đoán nguyên nhân? N+1 query? JSON parse? Serial hóa? Mất 3 ngày
sửa cache — hóa ra là 1 vòng lặp O(n²) ở chỗ không ai ngờ. Profiling cho biết
**flame graph**: hàm nào ăn bao nhiêu % thời gian CPU — hết đoán mò.

```
Quy tắc số 1 của hiệu năng: ĐO TRƯỚC KHI SỬA (measure, don't guess)
Quy tắc số 2: nếu không đo được → không biết mình đã cải thiện hay làm tệ hơn
```

---

## 🧠 Profiling Đo Gì?

```
CPU PROFILE     — thời gian nằm ở đâu? (hot path)
  └─ sampling: mỗi X ms chụp stack → gộp thành flame graph
MEMORY PROFILE  — ai cấp phát nhiều? leak ở đâu?
  └─ heap snapshot trước/sau, so sánh object tăng dần
WALL TIME vs CPU TIME:
  ─ CPU time : máy bận tính toán
  ─ Wall time: tổng thời gian đợi (chờ I/O, chờ lock!)
  → chậm do CPU ≠ chậm do chờ I/O — sửa 2 kiểu này khác nhau hoàn toàn
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Đo đơn giản: performance.now (wall time) =====
const t0 = performance.now();
await slowQuery();
console.log(`query: ${(performance.now() - t0).toFixed(1)}ms`);
// ⚠️ Chỉ đo khi ở isolate — trong prod có noise; dùng để cảm nhận, không phải bằng chứng

// ===== Node.js: CPU profiler built-in =====
// node --prof app.js            → tạo isolate-*.log
// node --prof-process isolate-*.log > profile.txt   [Summary]: top tick hàm nào
// Hoặc dùng --cpu-prof: node --cpu-prof app.js → file .cpuprofile mở trong Chrome DevTools

// ===== Flame graph đọc thế nào? =====
//   ┌────────────────────────────────────────────┐
//   │ main                      (tổng thời gian)  │
//   │ ┌──────────────┬──────────┐                │
//   │ │ handleReq    │ GC 5%    │  ← bề ngang = tỉ lệ thời gian
//   │ │ ┌──────────┐ │          │
//   │ │ │ parseJSON│ │          │  ← càng cao càng sâu call stack
//   │ └─┴──────────┴─┴──────────┘
//   Hàng ngang = thời gian; đỉnh cao nhất = hàm chạy cuối
//   → tìm "tháp phẳng" rộng nhất: đó là chỗ cần tối ưu

// ===== Heap snapshot: bắt memory leak =====
// chrome://inspect → Memory → Heap snapshot
// Đo trước load → chạy load test 10 phút → chụp lần 2
// → "Comparison": object nào tăng liên tục không giảm? → leak

// ===== Metrics tự lưu trong code (mini-profiler) =====
const timers = new Map<string, number>();
export function track<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try { return fn(); }
  finally {
    const ms = performance.now() - start;
    // đẩy sang Prometheus/Datadog, không console.log trong prod
    metrics.histogram(`app.${name}.duration_ms`, ms);
  }
}
```

---

## ⚖️ Kỹ Thuật Quan Sát Hiệu Năng

| Công cụ | Môi trường | Trả lời câu hỏi |
|---|---|---|
| `performance.now()` | chính xác 1 đoạn code | "đoạn này bao lâu?" |
| Chrome DevTools Performance | frontend: render, layout, paint | jank từ đâu |
| Node `--cpu-prof` | backend CPU | hàm nóng nào |
| Flame graph | trực quan tổng thể | gọi sâu, quét rộng |
| `--inspect` + Memory tab | heap snapshot | leak object nào |
| `perf`/`dtrace` (Linux) | native + kernel | cả hệ thống |

---

## ⚠️ Bẫy Thường Gặp

1. **Tối ưu trước khi đo** — guess sai chỗ, phức tạp hóa code, còn tăng bug.
2. **Đo trên máy dev** — máy dev nhanh, prod chậm. Đo ở môi trường giống prod.
3. **Quên warm-up:** JIT (V8, JVM) chạy 2 lần cho kết quả khác nhau — benchmark cần warm-up + nhiều lần.
4. **Wall time ≠ CPU time** — chờ network/IO làm wall time tăng nhưng CPU rảnh. Nhầm lẫn → tối ưu sai chỗ.
5. **Micro-optimization vô nghĩa:** đổi `++i` thành `i++` khi bottleneck thật sự là query DB.
6. **Benchmark sai:** chưa chạy warm-up, bị JIT optimize đoạn không chạy; dùng 1 lần chạy làm kết luận.

---

## 📝 Bài Tập Tự Vấn

1. API p95 800ms: quy trình profiling từ CPU profile đến SQL query nào chậm nhất?
2. Wall time 500ms nhưng CPU time 10ms — đang chờ gì? Tìm ở đâu tiếp?
3. Heap tăng liên tục sau mỗi request, GC không giải phóng — cách xác định leak?

---

*Leaf thuộc [Lớp 22 — Debugging, Logging & Profiling](../README.md)*
