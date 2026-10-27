# ⚙️ 18.1 Operating Systems (Hệ Điều Hành)

> **OS là "chính phủ" của máy tính:** phân chia CPU, RAM cho hàng trăm process/thread,
> quyết định ai chạy tiếp theo (scheduling) và ngăn hệ thống kẹt cứng (deadlock).

---

## 🎯 Vấn Đề

CPU chỉ có vài core nhưng hàng trăm tiến trình cùng muốn chạy: ai chạy trước, chạy bao lâu?
Chia không khéo thì task quan trọng đói CPU (starvation), hoặc các process giữ tài nguyên của nhau
mãi mãi (deadlock — như 2 người kẹt ở cửa hẹp, ai cũng chờ người kia nhường).

```
Scheduling:  P1 P2 P3 chờ ──► scheduler chọn ──► CPU chạy 1 quantum ──► trả lại hàng đợi
Deadlock:    P1 giữ 🔒A chờ 🔒B  ⇄  P2 giữ 🔒B chờ 🔒A  → kẹt vĩnh viễn
```

---

## 💻 Code Ví Dụ

```typescript
interface Proc { id: string; burst: number; remaining: number }

// Round-Robin: mỗi process chạy 1 quantum rồi nhường lượt — công bằng, chống đói CPU
function roundRobin(procs: Proc[], quantum: number): string[] {
  const queue = procs.map((p) => ({ ...p }));
  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift() as Proc;
    const run = Math.min(quantum, current.remaining);
    current.remaining -= run;
    order.push(`${current.id} chạy ${run}ms`);
    if (current.remaining > 0) queue.push(current); // chưa xong → xếp cuối hàng
  }
  return order;
}

// FCFS: ai đến trước chạy trước — đơn giản nhưng process ngắn phải chờ process dài
function fcfs(procs: Proc[]): string[] {
  return procs.map((p) => `${p.id} chạy ${p.burst}ms (đến trước chạy trước)`);
}

// Phát hiện deadlock đơn giản: đồ thị chờ có chu trình → deadlock
function hasDeadlock(waitFor: Map<string, string[]>): boolean {
  const visited = new Set<string>();
  const stack = new Set<string>();
  function dfs(node: string): boolean {
    if (stack.has(node)) return true; // quay lại nút đang thăm → chu trình
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    for (const next of waitFor.get(node) ?? []) {
      if (dfs(next)) return true;
    }
    stack.delete(node);
    return false;
  }
  for (const node of waitFor.keys()) {
    if (dfs(node)) return true;
  }
  return false;
}
```

> Mô phỏng đầy đủ (FCFS vs Round-Robin vs SJF + phát hiện deadlock + ví dụ starvation)
> trong `examples/index.ts` — chạy bằng `npx tsx examples/index.ts`.

---

## ✅ Lợi Ích

| Khái niệm | Lợi ích thực tế |
|---|---|
| Hiểu scheduling | Lý giải vì sao app lag khi CPU bận, vì sao `setTimeout` không chính xác |
| Round-Robin/time-slicing | Nền tảng của multitasking công bằng |
| Phát hiện deadlock | Tránh bug treo toàn hệ thống khi dùng nhiều lock |
| Process vs thread | Chọn đúng mô hình: thread chia sẻ RAM (nhanh nhưng race), process cô lập (an toàn) |

---

## ⚠️ Lưu Ý

- Mô phỏng trong repo là **logic thuần**, không phải scheduler thật của kernel (CFS, preemption phức tạp hơn nhiều).
- Deadlock cần đủ 4 điều kiện Coffman (mutual exclusion, hold-and-wait, no preemption, circular wait) — phá 1 trong 4 là gỡ được.
- Thread dùng chung bộ nhớ → nhanh nhưng dễ race condition (xem [12-concurrency](../../12-concurrency/README.md)).

---

## 🎯 Khi Nào Dùng

- Thiết kế worker pool, job queue: chọn thuật toán lập lịch (FIFO/priority/round-robin).
- Debug treo app đa luồng: vẽ đồ thị wait-for tìm chu trình.
- Phỏng vấn/kiển trúc hệ thống: giải thích context switch, starvation, lock ordering.

---

## 🔗 Liên Quan

- [12-concurrency](../../12-concurrency/README.md) — race condition, event loop, workers.
- [18.2 Memory & Storage](../18.2-memory-storage/README.md) — tài nguyên thứ hai OS quản lý.
- [13-system-design](../../13-system-design/README.md) — scheduling ở tầm distributed (load balancer).

---

## 📚 Tài Liệu

- 📖 *Operating Systems: Three Easy Pieces* (OSTEP) — Remzi & Andrea Arpaci-Dusseau (miễn phí)
- 📖 *Modern Operating Systems* — Andrew Tanenbaum
- 📖 [OSTEP Online](https://pages.cs.wisc.edu/~remzi/OSTEP/)

---

## ⏭️ Bài Tiếp Theo

→ [18.2 Memory & Storage](../18.2-memory-storage/README.md)
