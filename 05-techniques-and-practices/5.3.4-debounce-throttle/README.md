# 🔬 5.3.4 Debounce & Throttle

> **Debounce (防抖)** 和 **Throttle (节流)** 是控制函数执行频率的两种技术手段，在事件处理中防止过度触发。

```
❌ VẤN ĐỀ: 事件过度触发
搜索框: 每按一个键都发起API请求 → 服务器压力巨大
滚动条: 每毫秒都触发计算 → 页面卡顿
鼠标移动: 每秒触发数百次 → 浪费资源

✅ GIẢI PHÁP: 控制执行频率
Debounce: 等待用户停止操作后执行一次
Throttle: 限制单位时间内最多执行一次
```

---

## 🎯 Vấn Đề

不加控制的频繁事件触发：
- **API请求泛滥**：搜索框每输入一个字就请求，服务器崩溃
- **性能卡顿**：滚动、resize等高频事件导致页面卡死
- **资源浪费**：大量无意义的计算和请求
- **用户体验差**：响应延迟，操作不流畅

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: 没有防抖和节流
// ─────────────────────────────────────────────
window.addEventListener('scroll', () => {
  // 每滚动一像素都执行 → 性能灾难
  updateScrollIndicator();
});

document.querySelector('.search-box').addEventListener('input', (e) => {
  // 每个字符都请求 → API预算耗尽
  fetchSearchResults((e.target as HTMLInputElement).value);
});

// ─────────────────────────────────────────────
// ✅ GOOD: Debounce 防抖
// ─────────────────────────────────────────────
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
  fetch(`/api/search?q=${query}`).then(console.log);
}, 300); // 停止输入300ms后才执行

document.querySelector('.search-box').addEventListener('input', (e) => {
  search((e.target as HTMLInputElement).value);
});

// ─────────────────────────────────────────────
// ✅ GOOD: Throttle 节流
// ─────────────────────────────────────────────
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
}, 100)); // 每100ms最多执行一次

// ─────────────────────────────────────────────
// ✅ GOOD: 两者对比
// ─────────────────────────────────────────────
// Debounce - 每次动作结束后执行
// 适用场景: 搜索框、窗口resize、表单验证

// Throttle - 动作期间定期执行
// 适用场景: 滚动监听、鼠标移动、游戏循环
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| ⚡ **提升性能** | 减少不必要的函数调用 |
| 💰 **节省资源** | 降低服务器压力和CPU消耗 |
| 🎯 **精准触发** | Debounce确保只在关键时刻执行 |
| 📊 **稳定输出** | Throttle提供均匀的执行频率 |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Debounce延迟感** | 设置合理的delay时间 |
| **Throttle漏掉关键帧** | 根据需求调整interval |
| **无法取消的执行** | 提供cancel方法 |
| **上下文丢失** | 使用箭头函数或bind |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| 搜索框输入 | ✅ Debounce |
| 表单实时验证 | ✅ Debounce |
| 滚动事件监听 | ✅ Throttle |
| 窗口resize | ✅ Debounce |
| 鼠标移动追踪 | ✅ Throttle |
| 按钮防重复点击 | ✅ Debounce |

---

## 🔗 Liên quan

- **5.3.3 Memoization** — 缓存计算结果
- **5.3.2 Lazy Loading** — 按需加载资源
- **5.3.5 Tree Shaking** — 优化打包体积

---

## 📚 Tài liệu tham khảo

- 📖 [Underscore.js - Debounce/Throttle](http://underscorejs.org/#throttle)
- 📖 [MDN - Throttle Pattern](https://developer.mozilla.org/en-US/docs/Glossary/Throttling)
- 📖 [Event Throttling in Action](https://css-tricks.com/debouncing-throttling-explained-examples/)

---

## ⏭️ Bài tiếp theo

→ [5.3.5 Tree Shaking](../5.3.5-tree-shaking/README.md)
