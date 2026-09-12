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

| Pattern | Thời gian | Khi nào dùng |
|---------|-----------|-------------|
| **Sequential await** | Slow (N×t) | Phụ thuộc thứ tự |
| **Promise.all** | Fast (~t) | Độc lập, cần tất cả |
| **Promise.allSettled** | Fast (~t) | Cần kết quả dù có fail |
| **Promise.race** | Fastest | Chỉ cần kết quả đầu tiên |

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

---

## 12.1.3 Race Condition Pattern

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

---

## 🎯 Best Practices

| ✅ Nên | ❌ Không nên |
|--------|-------------|
| Luôn handle error với try/catch | Bỏ qua error handler |
| Dùng `Promise.all` cho requests độc lập | Await tuần tự khi không cần |
| Giới hạn parallelism với `Promise.allSettled` | Chạy hàng nghìn parallel requests |
| Dùng AbortController cho cancellable requests | Để request chạy mãi không dừng |
| Return typed Promise, không `any` | `async function(): any` |

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

## ⏭️ Bài Tiếp Theo

→ [12.2 Promises](../12.2-promises/README.md)
