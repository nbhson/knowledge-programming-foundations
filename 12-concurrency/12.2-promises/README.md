# 💫 12.2 Promises (Chuỗi Bất Đồng Bộ)

> **Promise** là object đại diện cho kết quả của một phép tính bất đồng bộ — có thể thành công (fulfilled) hoặc thất bại (rejected).

---

## 🎯 Promise Lifecycle

```
                  ┌─────────────────────────────────────────────────────┐
                  │                    PROMISE STATE                    │
                  │                                                     │
   .pending  ───▶  │    ╔═══════════════════════╗     ┌──▶ .fulfilled  │
                  │    ║    Promise { ... }     ║     │   (resolve)   │
                  │    ╚═══════════════════════╝     │                 │
                  │                                  │                 │
                  │    ┌──▶ .rejected               │                 │
                  │    │   (reject)                  │                 │
                  └─────────────────────────────────────────────────────┘
```

---

## 12.2.1 Promise Chain

```typescript
// Chain — mỗi .then() trả về Promise mới
fetch('/api/users')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(users => {
    console.log('Users:', users);
    return fetch(`/api/users/${users[0].id}/posts`);
  })
  .then(res => res.json())
  .then(posts => console.log('Posts:', posts))
  .catch(err => console.error('Lỗi:', err.message))
  .finally(() => console.log('Hoàn thành'));
```

**Async/await equivalent:**

```typescript
try {
  const userRes = await fetch('/api/users');
  if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`);
  const users = await userRes.json();

  const postRes = await fetch(`/api/users/${users[0].id}/posts`);
  const posts = await postRes.json();
  console.log('Posts:', posts);
} catch (err) {
  console.error('Lỗi:', err);
} finally {
  console.log('Hoàn thành');
}
```

---

## 12.2.2 Promise.all / allSettled / race

```typescript
// Promise.all — tất cả phải thành công, hoặc fail ngay
const [users, posts, comments] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
  fetch('/api/comments').then(r => r.json())
]);

// Promise.allSettled — chờ tất cả, báo cáo kết quả từng cái
const results = await Promise.allSettled([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/nonexistent').then(r => r.json()), // sẽ reject
  fetch('/api/posts').then(r => r.json())
]);

// Filter chỉ những result thành công
const fulfilled = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

// Promise.race — winner takes all (nhanh nhất)
const fastResult = await Promise.race([
  fetch('/api/users', { signal: AbortSignal.timeout(3000) }),
  fetch('/api/backup-users', { signal: AbortSignal.timeout(5000) })
]);

// Promise.any —第一个 resolved (không cần tất cả)
const firstData = await Promise.any([
  fetch('/api/v1/users').then(r => r.json()),
  fetch('/api/v2/users').then(r => r.json())
]);
```

---

## 12.2.3 Custom Promise Implementation

```typescript
// myPromise.ts — Minimal Promise implementation
class MyPromise<T> {
  private state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
  private value?: T;
  private reason?: Error;
  private callbacks: Array<{
    onFulfilled?: (value: T) => void;
    onRejected?: (error: Error) => void;
  }> = [];

  constructor(executor: (resolve: (v: T) => void, reject: (e: Error) => void) => void) {
    executor(
      (value: T) => {
        this.state = 'fulfilled';
        this.value = value;
        this.runCallbacks();
      },
      (error: Error) => {
        this.state = 'rejected';
        this.reason = error;
        this.runCallbacks();
      }
    );
  }

  private runCallbacks(): void {
    this.callbacks.forEach(({ onFulfilled, onRejected }) => {
      if (this.state === 'fulfilled' && onFulfilled) onFulfilled(this.value!);
      if (this.state === 'rejected' && onRejected) onRejected(this.reason!);
    });
    this.callbacks = [];
  }

  then(onFulfilled?: (v: T) => void, onRejected?: (e: Error) => void): MyPromise<any> {
    return new MyPromise((resolve, reject) => {
      if (this.state === 'pending') {
        this.callbacks.push({ onFulfilled, onRejected });
      } else {
        const handler = this.state === 'fulfilled' ? onFulfilled : onRejected;
        try {
          const result = handler?.(this.state === 'fulfilled' ? this.value! : this.reason!);
          if (result instanceof MyPromise) {
            result.then(resolve, reject);
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(e as Error);
        }
      }
    });
  }
}

// Usage
const p = new MyPromise<number>((resolve, reject) => {
  setTimeout(() => resolve(42), 1000);
});
```

---

## 12.2.4 Common Pitfalls

```typescript
// ❌ WRONG — Forget await
const data = fetchData(); // Returns Promise, not data!

// ✅ CORRECT
const data = await fetchData();

// ❌ WRONG — Silent catch swallow errors
.catch(() => {}); // Bỏ qua mọi lỗi

// ✅ CORRECT
.catch(err => {
  console.error('Lỗi fetch:', err);
  throw err; // Hoặc xử lý phù hợp
});

// ❌ WRONG — Promise constructor anti-pattern
const p = new Promise((resolve, reject) => {
  fetchData().then(resolve).catch(reject); // Không cần wrap!
});

// ✅ CORRECT — just use the promise directly
const p = fetchData();
```

---

## 📋 Promise Methods Quick Ref

| Method | Behavior |
|--------|----------|
| `Promise.all()` | All must resolve; fails fast on rejection |
| `Promise.allSettled()` | Waits all, returns status + value/reason |
| `Promise.race()` | Returns first settled (resolve OR reject) |
| `Promise.any()` | Returns first fulfilled; all must reject to fail |
| `Promise.resolve(val)` | Wraps value in resolved promise |
| `Promise.reject(err)` | Creates rejected promise |

---

## 🔗 Liên Quan

- **12.1 Async/Await** — Syntax sugar trên Promises
- **12.3 Event Loop** — Execution model

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| MDN — Promise | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise |
| You Don't Know JS — Async & Performance | https://github.com/getify/You-Dont-Know-JS |

---

## ⏭️ Bài tiếp theo → [12.3 Event Loop](../12.3-event-loop/README.md)
