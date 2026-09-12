# 🔬 5.3.3 Memoization

> **Memoization** là kỹ thuật **cache kết quả function** để tránh tính toán lại với cùng input — đặc biệt hữu ích cho pure functions tính toán nặng.

```
❌ VẤN ĐỀ: Tính toán lặp lại
fibonacci(50) → tính 2^50 lần (vài năm!)
fibonacci(49) → tính lại từ đầu
→ Wasted CPU, chậm, tốn resource

✅ GIẢI PHÁP: Memoization
fibonacci(50) → tính + lưu kết quả
fibonacci(49) → tra cache (O(1))
fibonacci(50) nữa → tra cache (O(1))
→ Nhanh từ vài năm → vài mili giây!
```

---

## 🎯 Vấn Đề

Không memoization:
- **Tính toán lặp**: Cùng input nhưng tính lại nhiều lần
- **Exponential time**: Fibonacci O(2^n) không memo = thảm họa
- **CPU lãng phí**: Pure function result không đổi nhưng tính lại
- **UI lag**: Tính toán nặng trên main thread

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: Fibonacci không memo — O(2^n)
// ─────────────────────────────────────────────
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(50)); // Chạy hàng phút!

// ─────────────────────────────────────────────
// ✅ GOOD: Memoization — O(n)
// ─────────────────────────────────────────────
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

const fibonacciFast = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacciFast(n - 1) + fibonacciFast(n - 2);
});

console.log(fibonacciFast(50)); // instant!

// ─────────────────────────────────────────────
// ✅ GOOD: React useMemo hook
// ─────────────────────────────────────────────
import React, { useMemo } from 'react';

function ExpensiveComponent({ data }: { data: number[] }) {
  const sortedData = useMemo(() => {
    console.log('Sorting...');
    return [...data].sort((a, b) => a - b);
  }, [data]); // Chỉ recompute khi data đổi

  return <ul>{sortedData.map((d, i) => <li key={i}>{d}</li>)}</ul>;
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| ⚡ **Nhanh hơn** | O(1) lookup thay vì tính lại |
| 💾 **Tiết kiệm CPU** | Giảm tính toán không cần thiết |
| 🎯 **Pure functions** | Phù hợp hoàn hảo với memoization |
| 📈 **Scale tốt** | Performance giữ ổn định khi input tăng |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Memory leak** | Cache vô hạn → dùng LRU/TTL |
| **Impure functions** | Memoize chỉ an toàn với pure functions |
| **Complex keys** | JSON.stringify có thể sai với object circular |
| **Over-memoize** | Không memoize function chạy 1 lần |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Pure function tính toán nặng | ✅ Memoize |
| Recursive algorithm (Fibonacci) | ✅ Rất phù hợp |
| React component expensive calculation | ✅ useMemo |
| Function chạy 1 lần duy nhất | ❌ Không cần |
| Impure function (có side effect) | ❌ Không memoize |

---

## 🔗 Liên quan

- **5.3.2 Lazy Loading** — Load + memoize kết hợp
- **5.3.1 Caching** — Memoization là cache ở function level
- **5.3.4 Debounce/Throttle** — Kết hợp memo + debounce

---

## 📚 Tài liệu tham khảo

- 📖 [Memoization - Wikipedia](https://en.wikipedia.org/wiki/Memoization)
- 📖 [React.memo & useMemo](https://react.dev/reference/react/useMemo)
- 📖 [Performance Optimization Patterns](https://react.dev/learn/performance)

---

## ⏭️ Bài tiếp theo

→ [5.3.4 Debounce & Throttle](../5.3.4-debounce-throttle/README.md)
