# ⚡ 12.5 Race Conditions (Điều Kiện Tranh Cỗ)

> **Race Condition** xảy ra khi nhiều tác vụ truy cập dữ liệu chung đồng thời, kết quả phụ thuộc vào thứ tự thực thi.

---

## 🎯 Vấn Đề

```typescript
let balance = 1000;

async function withdraw(amount: number) {
  // ❌ Race condition!
  const currentBalance = balance; // Đọc balance
  await simulateNetworkDelay();   // Chờ — lúc này task khác chạy
  if (currentBalance >= amount) {
    balance = currentBalance - amount; // Ghi đè
  }
}

// Hai request cùng lúc
withdraw(600); // Request A
withdraw(600); // Request B
// Kết quả: balance = 400 (sai!) thay vì lỗi "insufficient funds"
```

**Tại sao JS single-threaded mà vẫn có race condition?** Điểm then chốt: JS không có "multi-threading" dạng OS, nhưng **async boundary** (`await`, timer, callback) là nơi **control được nhường lại cho event loop**. Các async action có thể hoàn thành và tiếp nối tại nhiều thời điểm xen kẽ. Trong ví dụ trên, bước `await simulateNetworkDelay()` là khoảnh khắc nhường quyền — `withdraw(600)` thứ hai được gọi trong thời gian đó, đọc cùng `balance = 1000` từ lần trước.

Timeline thực tế:

```
Time 0ms: A.start → balance=1000, await delay
Time 0ms: B.start → balance=1000 (đọc lại, vì A chưa ghi), await delay
Time 200ms: A.resume → kiểm tra 1000≥600 ✅, balance = 400
Time 200ms: B.resume → kiểm tra 1000≥600 ✅, balance = 400  (ghi đè!)
→ Cuối cùng balance=400 thay vì reject B. Số tiền bị mất 600×2=1200 mà account chỉ trừ 600.
```

---

## 12.5.1 Mutex (Khóa Tương Hỗ)

**Giải pháp:** đảm bảo chỉ 1 tác vụ truy cập critical section tại 1 thời điểm.

```typescript
class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<() => void> {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          if (this.queue.length > 0) {
            const next = this.queue.shift()!;
            next();
          }
        });
      } else {
        this.queue.push(() => {
          resolve(this.acquire());
        });
      }
    });
  }
}

// Usage — an toàn cho race conditions
const mutex = new Mutex();

async function withdrawSafe(amount: number) {
  const release = await mutex.acquire();
  try {
    const currentBalance = balance;
    if (currentBalance >= amount) {
      balance = currentBalance - amount;
      console.log(`Withdrew ${amount}, remaining: ${balance}`);
    } else {
      console.log('Insufficient funds');
    }
  } finally {
    release();
  }
}
```

**Cơ chế:** Mutex trong JS **cooperative** (mềm dẻo) chứ không phải OS-level. Nó dựa vào `await` để chờ — nếu một async function **không** `await mutex.acquire()` thì lock không áp dụng được. Ưu điểm: đơn giản; nhược điểm: phải tự giác, không có enforcement level runtime.

**Deadlock cảnh báo:** nested lock (acquire trong khi đã hold) sẽ chết nếu `release` không nằm trong `finally`. Pattern đúng là luôn:

```typescript
const release = await mutex.acquire();
try {
  // critical section
} finally {
  release();
}
```

---

## 12.5.2 Promise-based Lock

**Dùng Promise chain để serialize access.**

```typescript
function withLock<T>(lock: Promise<void>, fn: () => Promise<T>): Promise<T> {
  return lock.then(async () => {
    let release: () => void;
    const newLock = new Promise<void>(resolve => { release = resolve; });
    const releaseLock = () => release!();

    try {
      return await fn();
    } finally {
      releaseLock();
    }
  });
}

// Simple approach with serial queue
class SerialQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  async execute(fn: () => Promise<void>) {
    return new Promise<void>((resolve) => {
      this.queue.push(async () => {
        try {
          await fn();
        } finally {
          this.queue.shift()!();
          resolve();
        }
      });
      this.runQueue();
    });
  }

  private async runQueue() {
    if (this.running || this.queue.length === 0) return;
    this.running = true;
    while (this.queue.length > 0) {
      const next = this.queue.shift()!;
      await next();
    }
    this.running = false;
  }
}

const serialQueue = new SerialQueue();

async function withdrawSerial(amount: number) {
  await serialQueue.execute(async () => {
    if (balance >= amount) {
      balance -= amount;
    }
  });
}
```

**So sánh với Mutex class:**

| Tiêu chí | Mutex class | SerialQueue |
|----------|-------------|-------------|
| FIFO bảo toàn | Không (nhiệm vụ push sau có thể acquire trước nếu free) | Có (queue đảm bảo đúng thứ tự) |
| Blocking khi lock free | Nhanh (giải quyết đồng bộ trong resolve) | Nhanh (push rồi run ngay) |
| Deadlock risk | Cao hơn nếu không cẩn thận finally | Thấp hơn (1 queue duy nhất) |
| Scope | Global lock | Per-queue scoped (có thể nhiều queue cho nhiều resource khác nhau) |

**Thực tế:** `SerialQueue` phổ biến hơn trong JS cho cùng một resource (ví dụ: serialize `saveToStorage` calls). Nếu nhiều resource khác nhau, dùng nhiều `Mutex` instance hoặc hierarchical lock ordering.

---

## 12.5.3 Database-Level Solutions

**Tránh race condition ở layer database** — nơi có ACID guarantee mạnh nhất. Trong app server, database là source of truth cuối cùng.

```typescript
// ❌ Bad — đọc rồi ghi (check-then-act)
async function transferBad(from: string, to: string, amount: number) {
  const fromUser = await db.users.findById(from);
  const toUser = await db.users.findById(to);

  if (fromUser.balance < amount) throw new Error('Insufficient');

  fromUser.balance -= amount;
  toUser.balance += amount;

  await db.users.update(fromUser);
  await db.users.update(toUser);
}

// ✅ Good — atomic database operation
async function transferGood(from: string, to: string, amount: number) {
  const result = await db.query(`
    UPDATE users
    SET balance = balance - $1
    WHERE id = $2 AND balance >= $1
    RETURNING id, balance
  `, [amount, from]);

  if (result.rows.length === 0) {
    throw new Error('Insufficient funds or user not found');
  }

  await db.query(
    'UPDATE users SET balance = balance + $1 WHERE id = $2',
    [amount, to]
  );
}
```

**Cơ chế:** `WHERE balance >= $1` là **atomic condition** — database tự kiểm tra & cập nhật trong 1 thao tác. Nếu 2 request cùng chạm lúc balance=1000, chỉ 1 trong 2 updateRows() = 1 thành công; cái còn lại nhận `rows.length === 0` → reject an toàn.

**Mở rộng — Optimistic Locking (Version):** khi không thể dùng atomic SQL (đa bảng, logic phức tạp):

```typescript
// Cập nhật với version check
async function transferOptimistic(from: User, amount: number): Promise<void> {
  const result = await db.query(
    `UPDATE accounts SET balance = balance - $1, version = version + 1
     WHERE id = $2 AND version = $3 AND balance >= $1
     RETURNING version`,
    [amount, from.id, from.version]
  );
  if (result.rows.length === 0) throw new Error('Conflict — try again');
  from.version = result.rows[0].version;
}
```

Ưu điểm: không cần lock; phát hiện xung đột sớm → retry. Nhược điểm: conflict rate cao khi đồng thời lớn = phải có retry với jitter.

**Idempotency keys** — phòng chống double-submit (người dùng bấm 2 lần):

```typescript
const idempotencyKey = crypto.randomUUID();
await db.query(
  `INSERT INTO idempotency_keys (key, status) VALUES ($1, 'pending')
   ON CONFLICT (key) DO NOTHING`,
  [idempotencyKey]
);
// nếu ảnh hưởng 0 rows → request trùng lặp → reject
```

---

## 12.5.4 Common Race Condition Patterns

| Pattern | Vấn Đề | Giải Pháp | Giải thích sâu |
|---------|--------|-----------|----------------|
| **Check-then-act** | Đọc state → quyết định → hành động | Atomic operations | Đọc và viết không cùng nguyên tử → window cho race. DB condition + UPDATE (atomic) hoặc CAS là cách sửa. |
| **Read-modify-write** | Đọc → sửa → ghi | Lock/Mutex | Ba bước này không nguyên tử; nhiều tác vụ đọc cùng snapshot → ghi đè nhau. |
| **Twin check** | Hai thread/call kiểm tra cùng điều kiện | Mutex | Như ví dụ `balance >= amount`; cả hai đều thấy balance đủ → cùng withdraw → underflow. |
| **Lost update** | Một write ghi đè write khác | Optimistic locking | Cùng row bị 2 writer sửa; writer sau không biết có ai sửa trước → ghi đè mất thay đổi. |
| **Stale read** | Cache cũ đọc sau khi DB update | Cache invalidation | Read cache trả giá trị cũ; user thấy data lỗi thời trong window vài ms – vài giây. |
| **Double submit** | Client gửi cùng request 2 lần | Idempotency key | Button bấm 2x, retry network tự động; server xử lý 2 lần → tạo đơn trùng, trừ tiền 2 lần. |

> ⚠️ **Hiểu lầm phổ biến:** "JS single-threaded nên không có race condition". **Sai.** `await`, timer, và I/O callback tạo **virtual interleaving** — nhiều tác vụ chia sẻ state mà không có lock sẽ gặp race tại các boundary này.

---

## 🔗 Liên Quan

- **12.1 Async/Await** — Nền tảng async
- **12.2 Promises** — Cơ chế promise
- **12.3 Event Loop** — Lý do tại sao race conditions xảy ra trong JS

---

## 📚 Tài Liệu

- 📖 [JavaScript Concurrency Model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)

---

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.5-race-conditions
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [12.6 Observables](../12.6-observables/README.md)
