# 🔬 5.3.6 Code Splitting

> **Code Splitting** (chia nhỏ code) là kỹ thuật tách gói JavaScript bundle lớn thành nhiều file nhỏ, tải khi cần (theo nhu cầu), giúp giảm đáng kể thời gian tải lần đầu (first load).

```
❌ VẤN ĐỀ: Một bundle khổng lồ duy nhất
app.js → 500KB (mọi code tải cùng lúc)
→ Lần đầu chậm, người dùng phải chờ lâu

✅ GIẢI PHÁP: Chia nhỏ bundle
app.js     → 150KB (code cốt lõi)
admin.js   → 200KB (trang quản trị)
charts.js  → 150KB (chức năng biểu đồ)
→ Tải theo nhu cầu, lần đầu nhanh hơn
```

---

## 🎯 Vấn Đề

Vấn đề của một bundle khổng lồ duy nhất:

- **Tải lần đầu chậm**: mọi code đều tải xuống cùng lúc
- **Lãng phí băng thông**: tính năng người dùng không dùng cũng bị tải
- **Hiệu quả cache thấp**: bất kỳ thay đổi nào cũng phải tải lại toàn bộ
- **Nút thắt hiệu năng**: phân tích (parse) và thực thi nhiều code vô ích

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: 全部代码打包在一起
// ─────────────────────────────────────────────
// 单一大bundle = 500KB+
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────
// ✅ GOOD: 路由级代码分割
// ─────────────────────────────────────────────
import React, { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
}
// → 每个路由对应独立chunk，按需加载

// ─────────────────────────────────────────────
// ✅ GOOD: 动态导入
// ─────────────────────────────────────────────
async function loadModule(name: string) {
  const module = await import(`./modules/${name}`);
  return module.default;
}

// 按钮点击时加载
<Button onClick={() => loadModule('Analytics')}>
  加载分析模块
</Button>

// ─────────────────────────────────────────────
// ✅ GOOD: Webpack魔法注释预加载
// ─────────────────────────────────────────────
// 提示浏览器预加载（不影响当前渲染）
const AdminPage = lazy(() =>
  import(/* webpackPrefetch: true */ './pages/Admin')
);

// 预加载重要页面
const Dashboard = lazy(() =>
  import(/* webpackPreload: true */ './pages/Dashboard')
);
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| ⚡ **Lần đầu nhanh hơn** | Chỉ tải code cần thiết |
| 📦 **Tải theo nhu cầu** | Người dùng truy cập tới đâu mới tải tới đó |
| 💾 **Tối ưu cache** | File nhỏ dễ được cache hơn |
| 🔄 **Cập nhật tăng dần** | Sửa một phần code chỉ cần cập nhật chunk liên quan |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Chuyển route bị chớp nháy** | Dùng Suspense + fallback |
| **Chiến lược tải trước (preload)** | Đặt prefetch/preload hợp lý |
| **Chia nhỏ quá mức** | Đừng chia nhỏ các module bé |
| **Request song song** | Chú ý kiểm soát số lượng tải đồng thời |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Ứng dụng một trang (SPA) lớn | ✅ Rất hiệu quả |
| Nhiều route | ✅ Chia theo cấp route |
| Yêu cầu hiệu năng lần đầu cao | ✅ Tách code cốt lõi |
| Dự án nhỏ (< 50KB) | ❌ Không cần chia |
| Trang quan trọng SEO | ⚠️ Dùng giải pháp SSR thay thế |

---

## 🔗 Liên quan

- **5.3.5 Tree Shaking** — Dùng kết hợp hiệu quả càng cao
- **5.3.2 Lazy Loading** — Dùng cùng React.lazy
- **5.3.3 Memoization** — Tối ưu phép tính sau khi tải

---

## 📚 Tài liệu tham khảo

- 📖 [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- 📖 [React.lazy & Suspense](https://react.dev/reference/react/lazy)
- 📖 [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunk-splitting)

---

## ⏭️ Bài tiếp theo

→ [5.4 Security Techniques](../5.4-security-techniques/README.md)
