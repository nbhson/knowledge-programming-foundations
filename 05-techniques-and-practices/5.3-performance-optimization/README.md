# ⚙️ 5.3 Performance Optimization (Tối Ưu Hiệu Năng)

> **Performance Optimization** là tập hợp kỹ thuật cải thiện **tốc độ, bộ nhớ, tài nguyên** của ứng dụng — giảm latency, tăng throughput.

```
Hiệu năng ảnh hưởng trực tiếp đến:
  - User Experience (trễ 1s = 7% conversion drop)
  - Cloud Cost (idle resources = phí lãng phí)
  - Scalability (tối ưu trước khi scale)
```

---

## 🎯 Caching (Bộ Nhớ Tạm)

**Mô tả:** Lưu trữ dữ liệu đã xử lý để **truy xuất nhanh hơn** lần sau.

```
Request Flow với Caching:
  Client → [Cache?] → (hit) → Trả kết quả ngay
                  → (miss) → Tính toán → Lưu cache → Trả kết quả
```

```typescript
// Cache-Aside Pattern
interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

async function getUserWithCache(
  userId: string,
  cache: Cache,
  db: Database
): Promise<User> {
  // 1. Check cache trước
  const cached = await cache.get<User>(`user:${userId}`);
  if (cached) {
    console.log('Cache HIT');
    return cached;
  }

  // 2. Cache MISS — fetch từ DB
  console.log('Cache MISS — fetching from DB');
  const user = await db.findById(userId);

  // 3. Lưu vào cache cho lần sau
  await cache.set(`user:${userId}`, user, 3600); // 1 giờ
  return user;
}

// Cache Strategies
const strategies = {
  'Cache-Aside':    'App tự kiểm cache, miss thì load từ DB',
  'Write-Through':  'Viết đồng thời vào cache và DB',
  'Write-Behind':   'Viết vào cache trước, async sync xuống DB',
  'Refresh-Around':  'Load trước khi cache hết hạn'
};
```

---

## ⏳ Lazy Loading (Trì Hoãn Tải)

**Mô tả:** Chỉ **load resource khi cần**, giảm initial load time.

```typescript
// React Lazy Loading
import React, { Suspense } from 'react';

// Thay vì: import HeavyComponent from './HeavyComponent'
const HeavyComponent = React.lazy(
  () => import('./HeavyComponent')
);

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  );
}

// Angular Lazy Loading
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module')
      .then(m => m.AdminModule)
  }
];
```

---

## 🧠 Memoization

**Mô tả:** **Cache kết quả function** để tránh tính lại với cùng input.

```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Usage
const fibonacci = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(50)); // Tính nhanh nhờ cache các kết quả trung gian
```

---

## 🎚️ Debounce & Throttle

```typescript
// Debounce: Chờ đến khi user DỪNG thao tác mới execute
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const search = debounce((query: string) => {
  fetch(`/api/search?q=${query}`); // Chỉ gọi sau khi ngưng gõ 300ms
}, 300);

// Throttle: Giới hạn execute TỐI ĐA 1 lần / khoảng thời gian
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
}

window.addEventListener('scroll', throttle(() => {
  updateScrollIndicator();
}, 100)); // Tối đa 10 times/giây
```

| Khái niệm | Debounce | Throttle |
|-----------|----------|----------|
| Mục đích | Chờ user DỪNG | Giới hạn TẦN SUẤT |
| Ví dụ | Search input (chờ ngưng gõ) | Scroll, resize, mousemove |
| Hành vi | Chỉ chạy LẦN CUỐI | Chạy ĐỊNH KỲ |

---

## 🌳 Tree Shaking

**Mô tả:** Loại bỏ **code không sử dụng** trong build phase.

```typescript
// file: math.ts
export function add(a: number, b: number) { return a + b; }
export function subtract(a: number, b: number) { return a - b; }
export function multiply(a: number, b: number) { return a * b; }
export function divide(a: number, b: number) { return a / b; }

// file: app.ts
import { add } from './math';  // Chỉ import add

// ✅ Tree shaking sẽ GIỮ lại chỉ add
// ❌ subtract, multiply, divide bị LOẠI bỏ khỏi bundle
```

```json
// package.json — đảm bảo sideEffects: false
{
  "sideEffects": false
}
```

---

## 📦 Code Splitting

**Mô tả:** Chia bundle lớn thành **các chunk nhỏ**, load khi cần.

```typescript
// Route-based splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Suspense>
  );
}

// Bundle trước: 500KB (1 file)
// Bundle sau:  150KB + 100KB + 50KB (3 chunks, load theo nhu cầu)
```

---

## 🎯 So sánh các kỹ thuật

| Kỹ thuật | Vấn đề giải quyết | Mức impact | Độ phức tạp |
|----------|-------------------|------------|-------------|
| **Caching** | Giảm DB/API calls | 🟢 Cao | Thấp |
| **Lazy Loading** | Giảm initial load | 🟢 Cao | Thấp |
| **Memoization** | Tránh tính toán lặp | 🟡 Trung bình | Thấp |
| **Debounce/Throttle** | Giảm event frequency | 🟢 Cao | Thấp |
| **Tree Shaking** | Giảm bundle size | 🟡 Trung bình | Thấp |
| **Code Splitting** | Giảm bundle size | 🟢 Cao | Trung bình |
| **Virtual Scrolling** | Render nhiều items | 🟢 Cao | Trung bình |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| API/DB calls nhiều, dữ liệu ít đổi | ✅ Caching |
| Component nặng, không hiển thị ngay | ✅ Lazy Loading |
| Function pure tính toán nhiều lần | ✅ Memoization |
| Input search, scroll, resize | ✅ Debounce / Throttle |
| Bundle JS/CSS quá lớn | ✅ Tree Shaking + Code Splitting |
| List 1000+ items hiển thị | ✅ Virtual Scrolling |
| Image nặng trên trang chủ | ✅ Lazy Loading images |

---

## 🔗 Liên quan

- **5.4 Security Techniques** — Optimize với security trong mind
- **5.5 State Management** — Memoization trong Redux/Redux Toolkit
- **5.8 Data Handling** — Pagination, caching strategies

---

## 📚 Tài liệu tham khảo

- 📖 [Web.dev Performance](https://web.dev/performance/)
- 📖 [React.lazy & Suspense](https://react.dev/reference/react/lazy)
- 📖 [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)

---

## ⏭️ Bài tiếp theo

→ [5.4 Security Techniques](./5.4-security-techniques/README.md)
