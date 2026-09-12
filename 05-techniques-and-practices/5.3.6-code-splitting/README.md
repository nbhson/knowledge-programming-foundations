# 🔬 5.3.6 Code Splitting

> **Code Splitting** 是将大型JavaScript bundle拆分成多个小文件，按需加载的技术，显著减少首屏加载时间。

```
❌ VẤN ĐỀ: 单一大bundle
app.js → 500KB (所有代码一起加载)
→ 首屏慢，用户等待时间长

✅ GIẢI PHÁP: 拆分bundle
app.js     → 150KB (核心代码)
admin.js   → 200KB (管理后台)
charts.js  → 150KB (图表功能)
→ 按需加载，首屏更快
```

---

## 🎯 Vấn Đề

单一大bundle的问题：
- **首屏加载慢**：所有代码一起下载
- **浪费带宽**：用户不使用的功能也加载了
- **缓存效率低**：任何改动都需要重新下载全部
- **性能瓶颈**：解析和执行大量无用代码

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
| ⚡ **首屏更快** | 只加载必要代码 |
| 📦 **按需加载** | 用户访问时才下载 |
| 💾 **缓存优化** | 小文件更容易缓存 |
| 🔄 **增量更新** | 修改部分代码只需更新相关chunk |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **路由切换闪烁** | 使用Suspense + fallback |
| **预加载策略** | 合理设置prefetch/preload |
| **过度拆分** | 不要为小模块拆分 |
| **并行请求** | 注意控制并发加载数量 |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| 大型单页应用 | ✅ 非常有效 |
| 路由较多 | ✅ 路由级拆分 |
| 首屏性能要求高 | ✅ 核心代码拆分 |
| 小项目(< 50KB) | ❌ 无需拆分 |
| SEO重要页面 | ⚠️ SSR替代方案 |

---

## 🔗 Liên quan

- **5.3.5 Tree Shaking** — 配合使用效果更佳
- **5.3.2 Lazy Loading** — 配合React.lazy使用
- **5.3.3 Memoization** — 优化加载后的计算

---

## 📚 Tài liệu tham khảo

- 📖 [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- 📖 [React.lazy & Suspense](https://react.dev/reference/react/lazy)
- 📖 [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunk-splitting)

---

## ⏭️ Bài tiếp theo

→ [5.4 Security Techniques](../5.4-security-techniques/README.md)
