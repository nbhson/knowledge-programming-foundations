# 🔬 5.3.2 Lazy Loading

> **Lazy Loading** là kỹ thuật **trì hoãn tải tài nguyên** cho đến khi thực sự cần — giảm initial load time và tiết kiệm bandwidth.

```
❌ VẤN ĐỀ: Load tất cả ngay
<script src="app.js">     → 500KB
<script src="admin.js">   → 2MB
<script src="chart.js">   → 1MB
→ Total: 3.5MB — chậm,浪費 bandwidth

✅ GIẢI PHÁP: Lazy Loading
<script src="app.js">     → 500KB (trang chủ)
                        ↓ khi cần mới load
<script src="admin.js">   → 2MB (chỉ khi vào /admin)
<script src="chart.js">   → 1MB (chỉ khi mở biểu đồ)
→ Initial load: 500KB — nhanh gấp 7 lần!
```

---

## 🎯 Vấn Đề

Load tất cả resource cùng lúc:
- **Slow initial load**: Bundle lớn = chậm hiển thị
- **Wasted bandwidth**: User không dùng tính năng đó
- **Poor UX**: White screen lâu, bounce rate cao
- **Mobile data cost**: Tăng chi phí cho user

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: Import tất cả ngay
// ─────────────────────────────────────────────
import HeavyChart from './HeavyChart';
import AdminPanel from './AdminPanel';
import ReportGenerator from './ReportGenerator';

function App() {
  // Tất cả 3 component đều load ngay
  return (
    <div>
      <Dashboard />
      <HeavyChart data={data} />  {/* Có thể không cần */}
      <AdminPanel />              {/* Chỉ admin mới xem */}
    </div>
  );
}

// ─────────────────────────────────────────────
// ✅ GOOD: React.lazy + Suspense
// ─────────────────────────────────────────────
import React, { Suspense, lazy } from 'react';

const HeavyChart = lazy(() => import('./HeavyChart'));
const AdminPanel = lazy(() => import('./AdminPanel'));
const ReportGenerator = lazy(() => import('./ReportGenerator'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Dashboard />
      <HeavyChart data={data} />
      <AdminPanel />
    </Suspense>
  );
}

// ─────────────────────────────────────────────
// ✅ GOOD: Dynamic import trong function
// ─────────────────────────────────────────────
async function loadReport() {
  const module = await import('./ReportGenerator');
  return new module.ReportGenerator();
}

// ─────────────────────────────────────────────
// ✅ GOOD: Image lazy loading
// ─═══════════════════════════════════════════
// Trong HTML
// <img src="placeholder.jpg" data-src="real-image.jpg" loading="lazy" />

// Trong JavaScript
const images = document.querySelectorAll('img[data-src]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement;
      img.src = img.dataset.src!;
      observer.unobserve(img);
    }
  });
});
images.forEach(img => observer.observe(img));
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| ⚡ **Nhanh hơn** | Giảm initial load time đáng kể |
| 📱 **Mobile-friendly** | Tiết kiệm data cho user mobile |
| 🎯 **Contextual** | Chỉ load khi user cần |
| 💰 **Giảm bandwidth** | Không tải tài nguyên không dùng |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Flash of empty content** | Dùng `<Suspense fallback>` |
| **Waterfall loading** | Preload quan trọng resources |
| **SEO issues** | SSR/SSG cho content quan trọng |
| **Complexity** | Quản lý loading states cẩn thận |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Route-based chunks | ✅ Route lazy loading |
| Component nặng, không hiển thị ngay | ✅ React.lazy |
| Image gallery dài | ✅ Intersection Observer |
| Critical above-fold content | ❌ Không lazy load |
| Small component (< 50KB) | ❌ Inline luôn |

---

## 🔗 Liên quan

- **5.3.1 Caching** — Cache + lazy load kết hợp hiệu quả
- **5.3.3 Memoization** — memoize kết quả sau khi load
- **5.3.6 Code Splitting** — Chia bundle nhỏ hơn

---

## 📚 Tài liệu tham khảo

- 📖 [React.lazy & Suspense](https://react.dev/reference/react/lazy)
- 📖 [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- 📖 [Web.dev Lazy Loading](https://web.dev/learn/design/lazy-loading)

---

## ⏭️ Bài tiếp theo

→ [5.3.3 Memoization](../5.3.3-memoization/README.md)
