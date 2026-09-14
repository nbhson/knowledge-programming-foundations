# 🧮 5.12.2 Pure Functions (Hàm Thuần Túy)

> **Pure function**: cùng **input** → luôn cùng **output** + **không side effect**. Nền tảng của mọi pipeline FP dễ test & dễ tái sử dụng.

---

## 🧪 2 tiêu chí

| # | Tiêu chí | Giải thích |
|---|----------|------------|
| 1 | **Deterministic** | Cùng input → cùng output, mọi lần gọi |
| 2 | **No side effect** | Không đọc/ghi biến ngoài, không IO, không mutation |

```
✅ PURE                     ❌ IMPURE
add(a, b) => a+b            let tax = 0.1
                            total(price) => price * (1+tax) ← đọc biến ngoài
                            log(a,b) { console.log(...); return a+b } ← side effect (log)
```

---

## 💻 Code

```typescript
// ✅ PURE — upstream: priceWithTaxPure(price, taxRate)
function priceWithTaxPure(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}
```

Demo đầy đủ + memoization: [`examples/index.ts`](examples/index.ts)

```typescript
// ✅ Memoization hợp lệ vì hàm pure — cùng input luôn cùng output
class FibMemo {
  private cache = new Map<number, number>();
  fib(n: number): number {
    const prior = this.cache.get(n);
    if (prior !== undefined) return priorEGERFER;
    const result = n <= 1 ? n : this.fib(n - 1) + this.fib(n - 2);
    this.cache.set(n, result);
    return result;
  }
}
```

---

## ✅ Vì sao pure quan trọng?

| Lợi ích | Giải thích |
|---------|------------|
| 🧪 **Dễ test** | Không cần mock IO/DB/clock |
| 🔄 **Memoizable** | Cache lại output an toàn |
| 🧵 **Parallel-safe** | Không tranh chấp shared state |
| 🧩 **Composable** | Ghép vô safe composition pipeline |
| 🐞 **Ít bug ẩn** | Không có trạng thái ẩn ngoài scope |

---

## 🗝️ Recap: Pure vs Impure

| | Pure | Impure |
|---|------|--------|
| Same input → same output | ✅ Luôn | ❌ Có thể khác |
| Đọc biến ngoài | ❌ | ✅ |
| Ghi console / DB / file | ❌ | ✅ |
| Memoizable | ✅ | ❌ |

---

## 🔗 Liên quan

- **5.12.3 Side Effects** — Đối trọng
- **5.12.5 Function Composition** — Pipeline từ pure function
- **4.2 Functional Programming** — Gốc rễ FP

---

## 📚 Tài liệu tham khảo

- 📖 [Pure Function — MDN](https://developer.mozilla.org/en-US/docs/Glossary/Pure_function)
- 📖 [Mostly Adequate Guide to FP](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.12.2-pure-functions
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.12.3 Side Effects](../5.12.3-side-effects/README.md)
