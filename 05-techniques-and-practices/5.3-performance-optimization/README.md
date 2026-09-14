# ⚙️ 5.3 Performance Optimization (Tối Ưu Hiệu Năng)

> **Performance Optimization** là tập hợp kỹ thuật cải thiện **tốc độ, bộ nhớ, tài nguyên** của ứng dụng — giảm latency, tăng throughput, giảm chi phí infrastructure. **Hiệu năng ảnh hưởng trực tiếp đến:**
> - **User Experience**: trễ 1 giây = ~7% conversion drop (Amazon study, 2006); trễ 3 giây = 53% user bỏ trang (Google study)
> - **Cloud Cost**: idle resources = phí lãng phí; tối ưu = giảm server count
> - **Scalability**: tối ưu trước khi scale — scale là giải pháp cuối cùng, không phải đầu tiên

---

## 📚 Mục Lục

| # | Kỹ thuật | Mục Đích | Impact |
|---|----------|----------|--------|
| 5.3.1 | [Caching](../5.3.1-caching/README.md) | Lưu dữ liệu đã xử lý để truy xuất nhanh hơn | Latency: ms → µs (100–1000x improvement) |
| 5.3.2 | [Lazy Loading](../5.3.2-lazy-loading/README.md) | Chỉ tải resource khi cần | Initial load time: -40–70% |
| 5.3.3 | [Memoization](../5.3.3-memoization/README.md) | Cache kết quả function tránh tính lại | CPU: O(2^n) → O(n) cho recursive functions |
| 5.3.4 | [Debounce & Throttle](../5.3.4-debounce-throttle/README.md) | Giảm tần suất xử lý event | Event handlers: 100 calls/sec → 1–10 calls/sec |
| 5.3.5 | [Tree Shaking](../5.3.5-tree-shaking/README.md) | Loại bỏ code không dùng khi build | Bundle size: -20–50% |
| 5.3.6 | [Code Splitting](../5.3.6-code-splitting/README.md) | Chia bundle lớn thành chunk nhỏ | Initial load: 500KB → 150KB + on-demand chunks |

---

## 🎯 Caching (Bộ Nhớ Tạm)

**Mô tả:** Lưu trữ dữ liệu đã xử lý để **truy xuất nhanh hơn** lần sau. Cache hit = microsecond response; cache miss = phải tính/toàn bộ pipeline.

```
Request Flow với Caching:
  Client → [Cache?] → (hit) → Trả kết quả ngay (~µs)
                   → (miss) → Tính toán → Lưu cache → Trả kết quả (~ms–s)
```

```typescript
// Cache-Aside Pattern — most common in production
interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

async function getUserWithCache(
  userId: string,
  cache: Cache,
  db: Database
): Promise<User> {
  // 1. Check cache trước — O(1) lookup
  const cached = await cache.get<User>(`user:${userId}`);
  if (cached) {
    console.log('Cache HIT');
    return cached;
  }

  // 2. Cache MISS — fetch from DB (~5–50ms)
  console.log('Cache MISS — fetching from DB');
  const user = await db.findById(userId);

  // 3. Store in cache for future requests (TTL: 1 giờ)
  await cache.set(`user:${userId}`, user, 3600);
  return user;
}

// Cache Strategies comparison:
const strategies = {
  'Cache-Aside':    'App tự kiểm cache, miss thì load từ DB. Simplest, most common.',
  'Write-Through':  'Viết đồng thời vào cache và DB. Strong consistency, higher write latency.',
  'Write-Behind':   'Viết vào cache trước, async sync xuống DB. Fast writes, risk of data loss.',
  'Refresh-Around':  'Load trước khi cache hết hạn. Avoids cache stampede on hot keys.'
};
```

**Benchmark thực tế (Redis vs PostgreSQL):**
- Redis `GET`: ~0.1ms (100K ops/sec)
- PostgreSQL `SELECT`: ~5ms (200 ops/sec)
- **Improvement: ~50x faster** cho read-heavy workloads

**Common cache pitfalls:**
- **Cache stampede**: nhiều request cùng lúc miss cache → DB overload → dùng refresh-ahead hoặc lucky hit
- **Stale data**: cache TTL quá dài → user sees outdated info → balance staleness vs consistency
- **Memory pressure**: cache không bounded → OOM → dùng LRU eviction policy

---

## ⏳ Lazy Loading (Trì Hoãn Tải)

**Mô tả:** Chỉ **load resource khi cần**, giảm initial load time và memory footprint. Áp dụng cho: modules, routes, images, components, data.

```typescript
// React Lazy Loading — code splitting tại component level
import React, { Suspense, lazy } from 'react';

// Thay vì: import HeavyComponent from './HeavyComponent' (always loaded)
const HeavyComponent = lazy(
  () => import('./HeavyComponent')  // dynamic import → separate chunk
);

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  );
}

// Angular Lazy Loading — route-level code splitting
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module')
      .then(m => m.AdminModule)  // only loaded when /admin route accessed
  }
];

// Vue 3 Lazy Loading
const AdminPanel = () => import('./views/AdminPanel.vue');

// Image lazy loading (native HTML)
<img loading="lazy" src="large-image.jpg" alt="..." />
```

**Impact measurements:**
- Initial bundle: 500KB → with lazy loading: 150KB (70% reduction in first paint)
- Time to Interactive (TTI): improves by 30–50% on slow connections (3G)
- Memory: reduces initial memory footprint by deferring heavy module loads

---

## 🧠 Memoization

**Mô tả:** **Cache kết quả function** để tránh tính lại với cùng input. Đặc biệt hiệu quả cho: pure functions, recursive algorithms (Fibonacci), expensive computations, selector functions in state management.

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

// Classic example: Fibonacci — O(2^n) → O(n)
const fibonacci = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(50)); // ~0ms with memoization vs ~30 seconds without

// React selector memoization (Reselect pattern)
import { createSelector } from 'reselect';

const selectTodos = (state: State) => state.todos;
const selectFilter = (state: State) => state.filter;

const filteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => todos.filter(todo => todo.status === filter)
);
// Only recomputes when todos OR filter changes — not on every render
```

**When memoization helps most:**
- Functions called frequently with same args (render cycle selectors)
- Expensive computations (math, string processing, data transformation)
- Recursive algorithms with overlapping subproblems

**When NOT to memoize:**
- Pure functions with cheap computation (< 1µs) — overhead > benefit
- Functions with side effects — cache invalidation becomes complex
- Functions called once — no benefit from caching

---

## 🎚️ Debounce & Throttle

**Debounce**: Chờ đến khi user **DỪNG** thao tác mới execute. ideal cho: search input, window resize, scroll-heavy operations.

**Throttle**: Giới hạn execute **TỐI ĐA 1 lần / khoảng thời gian**. ideal for: scroll events, mousemove, button click spam prevention.

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
  // Without debounce: 10 keystrokes/sec × 5 sec = 50 API calls
  // With debounce: 1 API call after user stops typing
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
}, 100)); // Tối đa 10 times/giây (10Hz), not 60fps (60Hz)

// Comparison table:
// | Khái niệm | Debounce | Throttle |
// |-----------|----------|----------|
// | Mục đích | Chờ user DỪNG | Giới hạn TẦN SUẤT |
// | Ví dụ | Search input (chờ ngưng gõ) | Scroll, resize, mousemove |
// | Hành vi | Chỉ chạy LẦN CUỐI | Chạy ĐỊNH KỲ |
// | Timing | execution at end of pause | execution at regular intervals |
```

**Performance impact:**
- Search API calls: 50/sec → 1/sec (98% reduction)
- Scroll event handlers: 60fps → 10fps (83% CPU reduction)
- Resize handlers: prevents layout thrashing on every pixel change

---

## 🌳 Tree Shaking

**Mô tả:** Loại bỏ **code không sử dụng** trong build phase. Hoạt động với ES modules (`import`/`export`) — static analysis xác định dead code và loại bỏ khỏi bundle.

```typescript
// file: math.ts
export function add(a: number, b: number) { return a + b; }
export function subtract(a: number, b: number) { return a - b; }
export function multiply(a: number, b: number) { return a * b; }
export function divide(a: number, b: number) { return a / b; }
export const PI = 3.14159;
export class MathUtils { /* ... */ }

// file: app.ts
import { add } from './math';  // Chỉ import add

// ✅ Tree shaking giữ lại CHỈ add + PI (PI là side-effect-free export)
// ❌ subtract, multiply, divide, MathUtils bị LOẠI bỏ khỏi bundle
// Bundle size: 5KB → 0.8KB (84% reduction for this module)
```

```json
// package.json — ensure sideEffects: false for pure modules
{
  "sideEffects": false
}
```

**Điều kiện để tree shaking hoạt động:**
1. Sử dụng ES modules (`import`/`export`), không CommonJS (`require`)
2. Code phải pure (không có side effects khi imported)
3. Build tool cấu hình đúng: Vite/Rollup/Webpack với `mode: 'production'`
4. Không dùng `export * from '...'` (re-export ẩn) — breaks static analysis

**Thực tế ngành:** Library như lodash (436KB) → lodash-es + tree shaking = ~3KB nếu chỉ dùng `map`, `filter`.

---

## 📦 Code Splitting

**Mô tả:** Chia bundle lớn thành **các chunk nhỏ**, load khi cần (on-demand). Khác với tree shaking (loại unused code), code splitting chia **used code** thành nhiều file nhỏ.

**Types of code splitting:**

| Type | Method | Use case |
|------|--------|----------|
| **Route-based** | `React.lazy()` per route | Different pages have different code |
| **Component-based** | `React.lazy()` per heavy component | Heavy dialogs, modals, charts |
| **Vendor splitting** | Separate `node_modules` chunk | Shared libraries across routes |
| **Dynamic import()** | `import()` with condition | Feature flags, A/B tests |

```typescript
// Route-based splitting — most common pattern
import { lazy, Suspense } from 'react';

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

// Bundle before: 500KB (1 file — all code loaded at once)
// Bundle after:  150KB (initial) + 100KB (dashboard) + 50KB (settings) + 30KB (admin)
// User only downloads what they need
```

**Webpack/Vite configuration for optimal splitting:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],      // shared library chunk
          ui: ['@mui/material', '@emotion/react'], // UI library chunk
        }
      }
    }
  }
});
```

**Impact benchmarks:**
- Initial bundle: 500KB gzip → with splitting: 120KB gzip (+80% smaller first paint)
- On 3G connection (~50KB/s): first paint 10s → 2.4s
- Cache efficiency: unchanged chunks revalidate faster

---

## 🎯 So sánh các kỹ thuật

| Kỹ thuật | Vấn đề giải quyết | Mức impact | Độ phức tạp | Đo được |
|----------|-------------------|------------|-------------|---------|
| **Caching** | Giảm DB/API calls | 🟢 Cao (10–1000x latency improvement) | Thấp | Response time P99 giảm 50–90% |
| **Lazy Loading** | Giảm initial load | 🟢 Cao (40–70% bundle reduction) | Thấp | First Contentful Paint cải thiện |
| **Memoization** | Tránh tính toán lặp | 🟡 Trung bình (tùy use case) | Thấp | React re-renders giảm 30–80% |
| **Debounce/Throttle** | Giảm event frequency | 🟢 Cao (80–99% call reduction) | Thấp | CPU usage giảm, API calls giảm |
| **Tree Shaking** | Giảm bundle size | 🟡 Trung bình (20–50% với large libs) | Thấp | Bundle size before/after build |
| **Code Splitting** | Giảm bundle size | 🟢 Cao (50–80% initial load reduction) | Trung bình | First paint time, TTI |
| **Virtual Scrolling** | Render nhiều items | 🟢 Cao (DOM nodes: 10000 → 20 visible) | Trung bình | Scroll FPS, memory usage |
| **Image Optimization** | Giảm media weight | 🟢 Cao (image size: -50–90%) | Thấp | LCP (Largest Contentful Paint) |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| API/DB calls nhiều, dữ liệu ít đổi | ✅ Caching | Cache-aside pattern; 100–1000x faster reads |
| Component nặng, không hiển thị ngay | ✅ Lazy Loading | Defer download until user navigates to that route |
| Function pure tính toán nhiều lần | ✅ Memoization | Avoid redundant computation; especially in React render cycles |
| Input search, scroll, resize | ✅ Debounce / Throttle | Reduce event handler frequency; save CPU and API calls |
| Bundle JS/CSS quá lớn | ✅ Tree Shaking + Code Splitting | Eliminate dead code + split by route/component |
| List 1000+ items hiển thị | ✅ Virtual Scrolling | Only render visible items; constant DOM nodes regardless of list size |
| Image nặng trên trang chủ | ✅ Lazy Loading images | Native `loading="lazy"` + WebP format |
| React app re-render quá nhiều | ✅ Memoization (useMemo, useCallback) | Prevent unnecessary re-renders of child components |
| Multiple libraries shared across routes | ✅ Vendor code splitting | Cache vendor chunk independently from app code |

---

## 🔗 Liên quan

- **5.4 Security Techniques** — Optimize với security trong mind (cache headers, CSP)
- **5.5 State Management** — Memoization trong Redux/Redux Toolkit (reselect)
- **5.8 Data Handling** — Pagination, caching strategies cho large datasets
- **5.1 Testing** — Benchmark tests để measure optimization impact

---

## 📚 Tài liệu tham khảo

- 📖 [Web.dev Performance](https://web.dev/performance/)
- 📖 [React.lazy & Suspense](https://react.dev/reference/react/lazy)
- 📖 [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- 📖 [Vite Guide: Production Build](https://vitejs.dev/guide/build.html)
- 📖 [Core Web Vitals - Google](https://web.dev/vitals/)
- 📖 [Caching Strategies - HTTP Archive](https://httparchive.org/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.3-performance-optimization
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.4 Security Techniques](../5.4-security-techniques/README.md)
