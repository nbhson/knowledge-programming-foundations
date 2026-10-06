# 🔐 12.8 Locks & Deadlock (Mutex, Semaphore, 4 Điều Kiện Coffman)

> **Mutex** cho 1 người vào critical section tại 1 thời điểm; **semaphore** cho N người. **Deadlock** xảy ra khi đủ 4 điều kiện Coffman — phá 1 trong 4 (dễ nhất: **lock ordering**) là hết deadlock.

---

## 🎯 Vấn đề

2 threads lock ngược thứ tự tài nguyên → ôm cái mình có, chờ cái kia mãi mãi:

```
Thread A: lock(X) ……. chờ lock(Y) ⏳
Thread B: lock(Y) ……. chờ lock(X) ⏳  → cả hai ngủ vĩnh viễn 💀
```

---

## 💻 Code ví dụ

Mô phỏng mutex, lock ordering (luôn lock theo id tăng dần) và phát hiện chu trình chờ.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

class Mutex {
  private locked = false;
  private queue: (() => void)[] = [];
  async acquire(): Promise<void> {
    if (!this.locked) { this.locked = true; return; }
    return new Promise((res) => this.queue.push(res));
  }
  release(): void {
    const next = this.queue.shift();
    if (next) next(); else this.locked = false;
  }
}

// Lock ordering: sắp xếp id trước khi lock → không bao giờ circular wait
async function transfer(a: Mutex, b: Mutex, first: string, second: string): Promise<string[]> {
  const order = [first, second].sort(); // luôn A→B, không bao giờ B→A
  return [`lock(${order[0]})`, `lock(${order[1]})`, "transfer", `unlock(${order[1]})`, `unlock(${order[0]})`];
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Đúng trước đã | Mutex/semaphore biến race thành tuần tự ở đoạn critical |
| Hết deadlock bằng thiết kế | Lock ordering phá circular wait — rẻ hơn detection/recovery |
| Semaphore đúng chỗ | Giới hạn N truy cập (pool, rate) thay vì mutex 1-người gây nghẽn |

---

## ⚠️ Lưu Ý

- 4 điều kiện Coffman: mutual exclusion + hold-and-wait + no preemption + circular wait — thiếu 1 là không deadlock.
- Critical section càng nhỏ càng tốt; không gọi I/O/blocking trong lock.
- `tryLock(timeout)` thay vì chờ vô hạn + luôn release trong `finally`.
- Reentrant cùng thread lock 2 lần → tự deadlock: dùng đúng loại lock hoặc thiết kế lại.

---

## 🎯 Khi nào dùng

- Mutex: counter, cache, balance — 1 writer tại 1 thời điểm.
- Semaphore(N): pool N slots, giới hạn parallelism.
- Read-write lock: nhiều readers, ít writers (config, cache).

---

## 🔗 Liên quan

- **12.5 Race Conditions** — race là gốc, lock là một cách chữa.
- **12.9 Thread Pools** — pool + lock phối hợp khi workers share state.
- **10.8 ACID & Isolation** — deadlock DB cùng bản chất, fix bằng thứ tự lock rows.

---

## 📚 Tài liệu

- *Java Concurrency in Practice* — Brian Goetz (ch.10 deadlock)
- *The Art of Multiprocessor Programming* — Herlihy & Shavit

---

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.8-locks-deadlock
npx ts-node examples/index.ts
```

Demo: mutex bảo vệ counter → deadlock ngược thứ tự → fix bằng lock ordering → semaphore 2 slots.

---

## ⏭️ Bài tiếp theo

→ [12.9 Thread Pools](../12.9-thread-pools/README.md)
