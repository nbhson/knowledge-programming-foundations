# ⚡ 12.1 Async/Await (Bất Đồng Bộ Hiện Đại)

> **Async/Await** là cú pháp hiện đại để xử lý bất đồng bộ — viết code async trông như synchronous.
> Nền tảng: [12.2 Promises](../12.2-promises/README.md)

---

## 🎯 Cú Pháp Cơ Bản

```typescript
// Async function trả về Promise
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();
  return user;
}

// Sử dụng
const user = await fetchUser('123');
console.log(user.name);
```

> 💡 `async` tự động wrap return value thành `Promise.resolve()`. `await` pause execution cho đến khi Promise settle.

**"Pause" nghĩa là gì — và KHÔNG phải là gì?** Đây là hiểu lầm lớn nhất: `await` **không block thread**. Nó chỉ tạm dừng *hàm hiện tại*. Về bản chất, engine "cắt" hàm async tại mỗi `await`: toàn bộ phần code phía sau được đăng ký làm continuation (một microtask) sẽ chạy khi Promise settle, còn call stack được giải phóng ngay để event loop xử lý việc khác.

```
fetchUser('123')
  ├─ gửi request HTTP (non-blocking) → thread TỰ DO chạy việc khác
  ├─ response về → microtask tiếp tục từ dòng `await response.json()`
  └─ parse xong → resolve Promise<User> trả cho caller
```

**Tương đương Promise thuần** — async/await về bản chất là cú pháp sugar trên `.then()`:

```typescript
// Hai cách sau tương đương:
async function fetchUserA(id: string) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function fetchUserB(id: string) {
  return fetch(`/api/users/${id}`).then(res => res.json());
}
```

**Ba quy tắc nền tảng:**

1. **Hàm async LUÔN trả về `Promise`** — kể cả `return 42` thì caller nhận `Promise<42>`; `return somePromise` được "flatten" (không bao giờ có `Promise<Promise<T>>`).
2. **`await` chỉ khả dụng trong `async function` hoặc top-level của ES module** (ES2022). Đây là lý do tồn tại Async IIFE (xem 12.1.4).
3. **Lỗi = rejection**: `throw` bên trong async function khiến Promise trả về bị reject; caller bắt lại bằng `try/catch` (nếu dùng `await`) hoặc `.catch()` (nếu dùng chain).

> ⚠️ **Hiểu lầm phổ biến:** "viết async/await là code tự chạy song song". Không — các `await` đặt liên tiếp chạy **tuần tự**. Muốn song song phải chủ động khởi phát nhiều Promise rồi mới await (xem 12.1.2).

---

## 12.1.1 Error Handling

```typescript
// ❌ WRONG — không xử lý error
async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`); // Network error = unhandled!
  return res.json();
}

// ✅ CORRECT — try/catch
async function getUser(id: string) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

// ✅ CORRECT — kết hợp với Promise.catch()
async function getUserSafe(id: string): Promise<User | null> {
  try {
    const res = await fetch(`/api/users/${id}`);
    return await res.json();
  } catch {
    return null;
  }
}
```

**Vì sao error handling với async khó hơn synchronous?** Trong code sync, stack trace chỉ thẳng nơi lỗi xảy ra. Trong async, lỗi nằm trong một Promise bị reject **ở một thời điểm khác, một call stack khác** — nếu không ai attach `catch`, nó trở thành *unhandled rejection*:

- **Node.js ≥ 15:** unhandled rejection **crash process** (mặc định trước đây chỉ in cảnh báo).
- **Browser:** kích hoạt `window.onunhandledrejection`, thường chỉ log — lỗi "im lặng" trôi đi.

```typescript
// Bắt lỗi lan truyền qua nhiều tầng async — chỉ cần catch ở nơi xử lý được
async function placeOrder(items: Item[]) {
  const stock = await checkStock(items);        // lỗi ở đây...
  const order = await createOrder(stock);       // ...tự động "nổi" lên đây
  await chargePayment(order);
}

try {
  await placeOrder(items);
} catch (err) {
  // Một chỗ duy nhất bắt được lỗi từ bất kỳ tầng nào
  console.error('Đặt hàng thất bại:', err);
}
```

**Kỹ thuật granular try/catch** — chỉ bọc phần dễ lỗi, để lỗi lập trình (`TypeError`, logic sai) không bị "nuốt" nhầm:

```typescript
async function getUserBestEffort(id: string): Promise<User | null> {
  let res: Response;
  try {
    res = await fetch(`/api/users/${id}`); // chỉ network có thể lỗi ở đây
  } catch {
    return null; // xử lý lỗi kỳ vọng (mất mạng)
  }
  if (!res.ok) return null;
  return await res.json(); // lỗi JSON.parse = bug → để nó ném ra, đừng nuốt
}
```

**Pattern Result (tránh exception cho lỗi dự đoán trước)** — hữu ích khi "không tìm thấy" là luồng bình thường:

```typescript
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

async function safeRun<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

const result = await safeRun(() => fetchUser('123'));
if (!result.ok) console.warn('Thất bại:', result.error.message);
```

---

## 12.1.2 Parallel Execution

```typescript
// ❌ Sequential — chờ từng request
async function getDashboard() {
  const users = await fetchUsers();    // 1s
  const posts = await fetchPosts();   // 1s
  const stats = await fetchStats();   // 1s
  return { users, posts, stats };     // Tổng: 3s
}

// ✅ Parallel — chạy đồng thời
async function getDashboard() {
  const [users, posts, stats] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchStats()
  ]);
  return { users, posts, stats };     // Tổng: ~1s
}
```

**Cơ chế:** ở bản sequential, `fetchPosts()` chỉ được *gọi* sau khi `fetchUsers()` đã trả kết quả — mỗi `await` là một hàng rào. Ở bản parallel, cả 3 hàm được gọi **trước** `Promise.all`, tức 3 request được gửi gần như cùng lúc; `await` chỉ chờ lâu nhất trong 3 cái. Với 3 request 200ms: sequential ≈ 600ms, parallel ≈ 200ms.

| Pattern | Thời gian | Khi nào dùng | Giải thích sâu |
|---------|-----------|-------------|----------------|
| **Sequential await** | Slow (N×t) | Phụ thuộc thứ tự | Kết quả bước sau cần dữ liệu của bước trước (`fetchPosts(userId)`). Nhược điểm thật: latency cộng dồn; với N=10, t=200ms → 2s chỉ để chờ I/O. |
| **Promise.all** | Fast (~t) | Độc lập, cần tất cả | **Fail-fast**: một cái reject là cả cụm reject ngay — nhưng các Promise còn lại **vẫn chạy nền** đến khi xong (không bị hủy). Chỉ dùng khi thiếu 1 kết quả là vô nghĩa. |
| **Promise.allSettled** | Fast (~t) | Cần kết quả dù có fail | Không bao giờ reject; mỗi phần tử là `{status, value/reason}`. Phù hợp dashboard nơi "thiếu 1 widget vẫn hơn trắng trang". |
| **Promise.race** | Fastest | Chỉ cần kết quả đầu tiên | Trả về cái **settle đầu tiên** (kể cả reject). Kinh điển cho timeout: `Promise.race([fetchData(), delay(3000)])`. Chú ý: kẻ thua vẫn chạy tiếp → nên kèm AbortController. |

```typescript
// Promise.allSettled — chờ tất cả, kể cả fail
const results = await Promise.allSettled([
  fetch('/api/users'),
  fetch('/api/posts'),
  fetch('/api/stats')
]);

results.forEach((result, i) => {
  if (result.status === 'fulfilled') {
    console.log(`Request ${i}:`, result.value);
  } else {
    console.error(`Request ${i} failed:`, result.reason);
  }
});
```

**Vấn đề ngược lại: parallel quá mức.** `Promise.all(arrayOf10kUrls.map(fetch))` có thể làm nghẽn browser (limit ~6 connection/host ở HTTP/1.1), sập rate-limit API, hoặc hết socket. Giải pháp **bounded concurrency** — chạy tối đa K request cùng lúc:

```typescript
async function parallelWithLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

// 1000 request, max 10 concurrent:
// throughput ~10 lần, nhưng không phá connection limit
const data = await parallelWithLimit(
  ids.map(id => () => fetchUser(id)),
  10
);
```

---

## 12.1.3 Race Condition Pattern

Race condition trong async JS xảy ra vì mỗi `await` là một "điểm nhường quyền" — code khác có thể chạy xen giữa (chi tiết: [12.5 Race Conditions](../12.5-race-conditions/README.md)). Ví dụ điển hình: search-as-you-type, người dùng gõ "jav" rồi "java" — response của "jav" về **sau** response của "java" và ghi đè kết quả mới.

```typescript
async function debounceFetch(query: string) {
  // Hủy request cũ nếu có
  if (debounceFetch.controller) {
    debounceFetch.controller.abort();
  }

  debounceFetch.controller = new AbortController();

  try {
    const res = await fetch(
      `/api/search?q=${query}`,
      { signal: debounceFetch.controller.signal }
    );
    return await res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') return; // Bỏ qua nếu bị abort
    throw err;
  }
}
```

**Cách 2 — Sequence guard:** khi không hủy được request (hoặc muốn giữ response trong cache), chỉ accept response của **lần gọi mới nhất**:

```typescript
let latestRequestId = 0;

async function search(query: string) {
  const requestId = ++latestRequestId;      // đánh số theo thứ tự phát
  const results = await fetchResults(query); // có thể về chậm

  if (requestId !== latestRequestId) {
    return; // có request mới hơn → bỏ qua kết quả cũ (stale)
  }
  render(results); // chỉ render cho query cuối cùng
}
```

**So sánh 2 kỹ thuật:**

| Kỹ thuật | Mechanism | Ưu | Nhược |
|----------|-----------|-----|--------|
| AbortController | Hủy request thực sự (đóng socket) | Tiết kiệm băng thông, server ngừng tính | Cần API hỗ trợ `signal`; lỗi abort phải được ignore |
| Sequence guard | Chỉ lọc kết quả lúc render | Đơn giản, không đụng network | Request cũ vẫn tốn tài nguyên chạy xong |

> 💡 Production thường kết hợp cả hai: abort để tiết kiệm, guard để chắc chắn không render stale.

---

## 12.1.4 Async IIFE

```typescript
// Async function trong IIFE
(async () => {
  const data = await fetchData();
  console.log(data);
})();

// Hoặc với top-level await (ES2022+)
const data = await fetchData();
```

**Khi nào cần Async IIFE?** Khi muốn `await` ở vị trí không cho phép top-level await: trong script thường (không phải ES module), trong callback của `addEventListener`, trong body của function không muốn đánh dấu `async` (để giữ signature trả về không-đổi).

**Hai caveat quan trọng:**

1. **Top-level await block module graph.** Trong ES module, `await` cấp cao nhất khiến mọi module *import nó* phải chờ — nếu API treo, cả app không boot được. Dùng có chọn lọc (config fetch, feature flag), tránh cho các module lá.
2. **IIFE "nổi" không có ai bắt lỗi.** Vì không `await` IIFE ở đâu cả, lỗi bên trong trở thành unhandled rejection (crash Node.js). Luôn tự bọc:

```typescript
(async () => {
  try {
    const data = await fetchData();
    console.log(data);
  } catch (err) {
    console.error('Boot failed:', err); // hoặc gửi lên monitoring
  }
})();
```

---

## 12.1.5 Sequential vs Parallel — Khi nào dùng?

```
Phụ thuộc dữ liệu?
├─ CÓ → Sequential await
│        fetchUser() → fetchPosts(userId)
│
└─ KHÔNG → Promise.all (parallel)
            fetchUsers()
            fetchPosts()
            fetchComments()
```

| Scenario | Cách viết | Lập luận |
|----------|-----------|-----------|
| B cần kết quả của A (`fetchPosts(user.id)`) | Sequential | Phụ thuộc dữ liệu cứng — parallel không phải lựa chọn. |
| A, B, C độc lập, tất cả phải có (trang checkout) | `Promise.all` | Thiếu bất kỳ dữ liệu nào thì màn hình vô nghĩa → fail-fast là đúng semantics. |
| A, B, C độc lập, thiếu 1 vẫn hiển thị được (dashboard) | `Promise.allSettled` | Không để 1 API phụ làm sập cả trang; render phần có, placeholder phần mất. |
| Gọi nhiều replica, lấy kết quả sớm nhất (timeout, CDN race) | `Promise.race` | Chỉ cần 1 winner; kẻ thua vẫn chạy nền → kèm `AbortSignal.timeout()` để giải phóng. |
| Nhiều task độc lập lớn (1000 job), endpoint có rate limit | Bounded pool (limit K) | Parallel tối đa tài nguyên phía server cho phép — K=10 thường an toàn gấp ~5-10 lần sequential. |
| Gửi request không cần chờ (analytics fire-and-forget) | Không await (floating) | Chấp nhận mất kết quả; ⚠️ nhớ `.catch()` để tránh unhandled rejection. |

**Nguyên tắc vàng:** đếm số "chặng phụ thuộc" (critical path), không đếm số request. 10 request độc lập chạy parallel ≈ latency 1 request; 10 request phụ thuộc dây chuyền = 10 lần latency dù mỗi cái nhanh.

---

## 🎯 Best Practices

| ✅ Nên | ❌ Không nên | Giải thích sâu |
|--------|-------------|----------------|
| Luôn handle error với try/catch | Bỏ qua error handler | Một async function không catch = trách nhiệm của caller; nếu caller cũng quên → unhandled rejection. Thông lệ: catch ở **nơi duy nhất xử lý được lỗi** (UI, controller), còn lại để lỗi "nổi" tự nhiên. |
| Dùng `Promise.all` cho requests độc lập | Await tuần tự khi không cần | Mỗi `await` thừa = thêm nguyên một round-trip latency vào user-perceived time. API chậm 200ms × 3 lần await chờ = 600ms "tiền mất" không cần thiết. |
| Giới hạn parallelism khi gọi nhiều | Chạy hàng nghìn parallel requests | `Promise.all` với 10k fetch làm hết socket pool, dính rate limit 429, và một cái fail làm fail tất cả. Dùng bounded concurrency (limit 5–20). |
| Dùng AbortController cho cancellable requests | Để request chạy mãi không dừng | Người dùng đổi route, component unmount, timeout — không abort thì browser vẫn tải dữ liệu vô nghĩa; `AbortSignal.timeout(3000)` là cách rẻ nhất để có deadline. |
| Return typed Promise, không `any` | `async function(): any` | Mất khả năng bắt lỗi ở compile time với `await`. Khai báo `Promise<User>` để caller biết chính xác nhận gì. |
| Khởi phát Promise sớm, await muộn | `await` ngay tại chỗ gọi | Tách "start" và "finish": gọi `const p = fetchX()` (chạy ngay), làm việc sync khác, rồi mới `await p` — đây là cách tận dụng overlap mà vẫn giữ code đọc tuần tự. |

---

## 🔗 Liên Quan

- **12.2 Promises** — Nền tảng của async/await
- **12.3 Event Loop** — Cách async hoạt động trong JavaScript
- **12.5 Race Conditions** — Xử lý concurrent async operations

---

## 📚 Tài Liệu

- 📖 [MDN — Async/Await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- 📖 [JavaScript.info — Async/Await](https://javascript.info/async-await)

---

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.1-async-await
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [12.2 Promises](../12.2-promises/README.md)
