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

**Ba trạng thái không thể đảo ngược.** Ngay khi Promise được `resolve(value)` hoặc `reject(error)`, nó "settled" vĩnh viễn — sau đó thêm bao nhiêu resolve/reject nữa cũng bị bỏ qua. Đây là đặc tính bảo vệ: **không ai có thay đổi kết quả** của một tính toán đã hoàn tất, dù là code async, error handler hay side-effect.

Ngoài ra, một số implementation còn có state `unresolved` (giữa constructor gọi và lần `.then` đầu tiên — hiếm khi bạn thấy rõ).

**Key takeaway:** Promise thực hiện **ngay khi tạo** (eager). Không giống Observable (lazy) phải subscribe mới chạy, `new Promise(executor)` là câu lệnh chạy executor ngay lập tức — hành động bắt đầu *tức thì*, kết quả nhận sau.

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

**Cơ chế chain hoạt động ra sao?** Mỗi `.then(onFulfilled, onRejected)` **luôn trả về một Promise mới**, độc lập với Promise cha:

- `return value` → Promise mới được `resolve(value)` (nếu value là plain object) hoặc "unwraps" nếu value là Promise khác (chạy tiếp chain theo inner promise).
- `throw error` hoặc promise bị reject → Promise mới bị reject, nhảy thẳng đến `.catch()` gần nhất.
- **Quan trọng:** lỗi được propagate dọc chain — chỉ cần 1 bước throw, các bước sau không chạy, chuyển xuống `.catch`.

```typescript
// Async/await equivalent:
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

**So sánh Promise chain vs async/await:**

| Tiêu chí | Promise chain | async/await |
|----------|---------------|-------------|
| Đọc từ trái sang phải | Tự nhiên | Tuỳ biến |
| Xử lý lỗi theo đoạn | `.catch()` trên từng phần | `try/catch` gói đoạn nào |
| Debug stack trace | Ngắn (thường mất frames trong engine) | Dài hơn, rõ vị trí |
| Parallelism | `const p1 = f(); const p2 = g();` (viết trước, await sau) | `const [r1,r2] = await Promise.all([f(),g()])` (cần biết trước) |
| Nesting rủi ro | Có thể gây callback hell nếu viết phức | Tránh được nhờ flat structure |

Thực tế production thường dùng **async/await cho logic tuần tự** và **Promise chain cho các bước map/transform đơn giản** (đôi khi gộp cả hai).

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

// Promise.any — first resolved (không cần tất cả)
const firstData = await Promise.any([
  fetch('/api/v1/users').then(r => r.json()),
  fetch('/api/v2/users').then(r => r.json())
]);
```

**Phân biệt kỹ:**

| Method | Reject nếu | Thành công khi | Use case |
|--------|-----------|----------------|----------|
| `all()` | Một trong N reject | Tất cả resolve | Dashboard tổng hợp; thiếu 1 là hỏng |
| `allSettled()` | Không bao giờ | Tất cả settle (dù reject) | Batch job báo cáo toàn bộ kết quả |
| `race()` | Một trong N settle → reject | Cái đó resolve | Timeout pattern, lấy kết quả replica gần nhất |
| `any()` | Tất cả reject | Một cái resolve | "Bất kỳ node nào sẵn có" |
| `withResolvers()` (ES2024) | Gọi `reject()` bên ngoài | Gọi `resolve()` | Khi cần expose promise cho người khác control |

> 💡 **Hiểu lầm về `allSettled`:** method này không "thắng cuộc" khi hết có fail — nó chỉ **dừng việc reject sớm**. Vẫn phải kiểm tra `status` từng mục để biết cái nào ổn.

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

**Điều bản thực hiện đầy đủ nên có (bổ sung để đúng spec):**

- **Microtask deferral:** kết quả handler không được gọi đồng bộ — phải schedule qua `queueMicrotask`/`setTimeout(fn,0)`. Nếu gọi đồng bộ, `then` sẽ throw khi inner promise đang resolve → phá vòng lặp `thenable`.
- **Thenable detection:** handler trả về object có `then()` → unwrap it (kể cả Promise native).
- **Error absorption:** nếu `onFulfilled` throw, Promise mới phải reject.
- **Đổi state không được phép sau khi settled:** guard `if (this.state !== 'pending') return`.

Bản trên đủ cho demo. Với production, hãy dùng thư viện như `lie`, `when`, hoặc rely vào native `Promise`.

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

**Pitfall kinh điển khác — "floating promise":**

```typescript
async function doStuff() {
  someAsyncOp(); // không await — hàm trả về, async op chạy không ai chờ
  return 'done'; // caller nhận ngay 'done' mà không biết có lỗi hoặc kết quả
}
```

> 💡 **Cách phát hiện:** dùng `eslint-plugin-promise` (bắt `no-floating-promises`) và kiểm tra xem `await` có nằm trong `try` hay không — không `await` = floating.

**Pitfall — "forEach với await" (trình tự bị phá vỡ):**

```typescript
const ids = [1, 2, 3];

// ❌ WRONG — forEach callback async bị bỏ qua
ids.forEach(async id => {
  await save(id); // chạy không theo thứ tự, không được await tổng
});

// ✅ CORRECT — dùng for...of
for (const id of ids) {
  await save(id); // tuần tự, đúng thứ tự
}

// ✅ HOẶC dùng Promise.all nếu song song được
await Promise.all(ids.map(id => save(id)));
```

**Pitfall — `await` trong loop tuần tự chậm:** 1000 item, mỗi item cần 10ms → 10s. Nếu không phụ thuộc → dùng `Promise.all` là 10ms. Nếu có giới hạn → bounded concurrency (xem 12.1.2).

---

## 📋 Promise Methods Quick Ref

| Method | Behavior | Giải thích sâu |
|--------|----------|----------------|
| `Promise.all(iterable)` | Tất cả phải resolve; fails fast on rejection | Kết quả là mảng đúng thứ tự **dù** promise hoàn thành không theo thứ tự. Một reject → toàn bộ reject luôn; các promise vẫn chạy nền. |
| `Promise.allSettled(iterable)` | Chờ tất cả, trả `{status, value/reason}` | Chỉ dùng khi "cần báo cáo kết quả của mọi job, kể cả fail". Thường đi kèm `.filter(x => x.status === 'fulfilled')`. |
| `Promise.race(iterable)` | Trả về settle đầu tiên (resolve hoặc reject) | Không "chỉ cần resolve đầu tiên" — cái settle đầu tiên có thể là reject! Cần `AbortSignal` hoặc bọc từng cái bằng `.catch(() => {})` nếu muốn "winner-take-all". |
| `Promise.any(iterable)` | Trả về resolved đầu tiên; reject nếu tất cả reject | Ngược `all`: reject early. Dùng khi "bất kỳ API nào đáp cũng được" (active-active replication). |
| `Promise.resolve(val)` | Wraps giá trị trong resolved promise | Hữu ích khi API cần Promise nhưng bạn có sẵn value — `Promise.resolve(1).then(x => x+1)`. |
| `Promise.reject(err)` | Tạo rejected promise | Thường dùng trong test hoặc khi muốn reject "sớm" trong builder pattern: `Promise.reject(new Error('early bail'))`. |

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

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.2-promises
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [12.3 Event Loop](../12.3-event-loop/README.md)
