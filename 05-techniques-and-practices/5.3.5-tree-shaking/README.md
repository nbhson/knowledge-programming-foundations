# 🔬 5.3.5 Tree Shaking

> **Tree Shaking** 是一种通过死代码检测来消除未使用导出的技术，在构建阶段移除打包中不会被使用的代码。

```
❌ VẤN ĐỀ: 打包体积过大
math.ts 导出: add, subtract, multiply, divide
app.ts     只导入: add
→ 打包结果: 4个函数全都在bundle里 (浪费空间)

✅ GIẢI PHÁP: Tree Shaking
app.ts 只 import { add }
→ 打包结果: 只保留 add 函数
→ subtract, multiply, divide 被"摇掉"(丢弃)
```

---

## 🎯 Vấn Đề

打包时包含大量未使用代码：
- **Bundle体积膨胀**：用户下载无用代码
- **加载缓慢**：初始加载时间增加
- **带宽浪费**：传输不必要的数据
- **内存占用高**：浏览器解析多余代码

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: 代码未优化
// ─────────────────────────────────────────────
// math.ts
export function add(a: number, b: number) { return a + b; }
export function subtract(a: number, b: number) { return a - b; }
export function multiply(a: number, b: number) { return a * b; }
export function divide(a: number, b: number) { return a / b; }

// app.ts
import * as math from './math'; // 导入所有
console.log(math.add(1, 2));
// → bundle包含所有4个函数

// ─────────────────────────────────────────────
// ✅ GOOD: 使用命名导入 + sideEffects
// ─────────────────────────────────────────────
// math.ts - 纯函数，无副作用
export function add(a: number, b: number): number {
  return a + b;
}
export function subtract(a: number, b: number): number {
  return a - b;
}

// package.json
{
  "sideEffects": false
}

// app.ts - 只导入需要的
import { add } from './math'; // 只导入add
console.log(add(1, 2));
// → bundle只包含add函数

// ─────────────────────────────────────────────
// ✅ GOOD: 有副作用的处理
// ─────────────────────────────────────────────
// utils.ts - 有副作用的函数
export function init() {
  console.log('Initializing...'); // 副作用：日志
}
export function helper() {
  return 42; // 纯函数
}

// 标记哪些文件有副作用
// package.json
{
  "sideEffects": ["./utils.ts"]
}

// app.ts
import { helper } from './utils'; // Tree shaking会移除init
console.log(helper()); // → 只有helper在bundle中
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| 📦 **减小体积** | 移除未使用的代码 |
| ⚡ **加快加载** | Bundle更小，下载更快 |
| 💾 **节省带宽** | 减少数据传输量 |
| 🎯 **按需打包** | 只包含实际用到的代码 |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Side effects** | 明确标记哪些文件有副作用 |
| **命名导入 vs 默认导入** | 使用命名导入效果更好 |
| **CommonJS不支持** | 迁移到ES Modules |
| **动态导入无法shake** | 静态分析需要明确的import |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| 大型工具库 | ✅ 非常有效 |
| 使用Vite/Webpack构建 | ✅ 自动支持 |
| 大量未使用的依赖 | ✅ 显著减小体积 |
| 所有ES Module项目 | ✅ 推荐启用 |
| CommonJS旧项目 | ⚠️ 需要转换 |

---

## 🔗 Liên quan

- **5.3.6 Code Splitting** — 进一步减小首屏加载
- **5.3.2 Lazy Loading** — 配合使用效果更佳
- **5.3.4 Debounce/Throttle** — 减少运行时开销

---

## 📚 Tài liệu tham khảo

- 📖 [Webpack Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- 📖 [Rollup Tree Shaking](https://rollupjs.org/guide/en/#tree-shaking)
- 📖 [Understanding ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

---

## ⏭️ Bài tiếp theo

→ [5.3.6 Code Splitting](../5.3.6-code-splitting/README.md)
