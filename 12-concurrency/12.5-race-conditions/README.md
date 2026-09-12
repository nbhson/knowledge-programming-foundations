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

---

## 12.5.1 Mutex (Khóa Tương Hỗ)

**Giải pháp: đảm bảo chỉ 1 tác vụ truy cập critical section tại 1 thời điểm.**

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

---

## 12.5.3 Database-Level Solutions

**Tránh race condition ở layer database:**

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

---

## 12.5.4 Common Race Condition Patterns

| Pattern | Vấn Đề | Giải Pháp |
|---------|--------|-----------|
| Check-then-act | Đọc state → quyết định → hành động | Atomic operations |
| Read-modify-write | Đọc → sửa → ghi | Lock/Mutex |
| Twin check | Hai thread cùng kiểm tra điều kiện | Mutex |
| Lost update | Một write ghi đè write khác | Optimistic locking |

---

## 🔗 Liên Quan

- **12.1 Async/Await** — Nền tảng async
- **12.2 Promises** — Cơ chế promise
- **12.3 Event Loop** — Lý do tại sao race conditions xảy ra trong JS

---

## 📚 Tài Liệu

- 📖 [JavaScript Concurrency Model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)

---

## ⏭️ Bài Tiếp Theo

→ [12.6 Observables](../12.6-observables/README.md)
