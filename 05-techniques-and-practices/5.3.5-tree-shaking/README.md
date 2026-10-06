# 🔬 5.3.5 Tree Shaking

> **Tree Shaking** là kỹ thuật loại bỏ code chết (dead code) — phát hiện các export không được dùng và gỡ chúng khỏi gói build (bundle) ngay ở giai đoạn build.

```
❌ VẤN ĐỀ: Kích thước gói build (bundle) quá lớn
math.ts export: add, subtract, multiply, divide
app.ts     chỉ import: add
→ Kết quả build: cả 4 hàm đều nằm trong bundle (lãng phí dung lượng)

✅ GIẢI PHÁP: Tree Shaking
app.ts chỉ import { add }
→ Kết quả build: chỉ giữ lại hàm add
→ subtract, multiply, divide bị "rung cây" rụng xuống (loại bỏ)
```

---

## 🎯 Vấn Đề

Khi build mà chứa nhiều code không dùng đến:

- **Bundle phình to**: người dùng phải tải code vô ích
- **Tải chậm**: thời gian tải lần đầu tăng lên
- **Lãng phí băng thông**: truyền dữ liệu không cần thiết
- **Tốn bộ nhớ cao**: trình duyệt phải phân tích (parse) code dư thừa

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
| 📦 **Giảm dung lượng** | Gỡ bỏ code không được sử dụng |
| ⚡ **Tải nhanh hơn** | Bundle nhỏ hơn, tải xuống nhanh hơn |
| 💾 **Tiết kiệm băng thông** | Giảm lượng dữ liệu truyền tải |
| 🎯 **Đóng gói theo nhu cầu** | Chỉ bao gồm code thực sự được dùng |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Tác dụng phụ (side effects)** | Đánh dấu rõ file nào có side effect |
| **Named import với default import** | Dùng named import cho hiệu quả tốt hơn |
| **CommonJS không hỗ trợ** | Chuyển sang ES Modules |
| **Dynamic import không shake được** | Phân tích tĩnh (static analysis) cần import rõ ràng |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Thư viện công cụ (utility) lớn | ✅ Rất hiệu quả |
| Build bằng Vite/Webpack | ✅ Hỗ trợ tự động |
| Nhiều dependency không dùng đến | ✅ Giảm dung lượng đáng kể |
| Mọi dự án ES Module | ✅ Khuyến nghị bật |
| Dự án cũ dùng CommonJS | ⚠️ Cần chuyển đổi |

---

## 🔗 Liên quan

- **5.3.6 Code Splitting** — Giảm tải lần đầu (first load) hơn nữa
- **5.3.2 Lazy Loading** — Dùng kết hợp hiệu quả càng cao
- **5.3.4 Debounce/Throttle** — Giảm chi phí khi chạy (runtime)

---

## 📚 Tài liệu tham khảo

- 📖 [Webpack Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- 📖 [Rollup Tree Shaking](https://rollupjs.org/guide/en/#tree-shaking)
- 📖 [Understanding ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

---

## ⏭️ Bài tiếp theo

→ [5.3.6 Code Splitting](../5.3.6-code-splitting/README.md)
