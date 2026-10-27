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
    if (prior !== undefined) return prior;
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

## ❌ BAD — thêm 1 case: impure đội lốt pure (đọc cache/clock ngầm)

```typescript
// ❌ BAD — cùng input khác output: kết quả phụ thuộc cache global + giờ hệ thống
const rateCache = new Map<string, number>();
function priceWithTaxBad(price: number): number {
  if (!rateCache.has("rate")) rateCache.set("rate", fetchTodayRate()); // IO ngầm + clock ngầm
  return price * (1 + (rateCache.get("rate") ?? 0));
}

// ✅ GOOD — mọi phụ thuộc đều là tham số: cùng input luôn cùng output
function priceWithTaxPure(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}
// IO (fetch rate, đọc clock) đẩy ra caller/biên — xem 5.12.3
```

> Dấu hiệu impure đội lốt: hàm **không tham số mà ra kết quả khác nhau**, hoặc **có tham số mà kết quả lúc đúng lúc sai**. Mọi thứ hàm "tự đi lấy" (global, clock, random, IO) đều phải thành tham số.

---

## ⚖️ Trade-off: pure vs impure có quản lý

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| Business rule, tính toán, validation | ✅ Pure | Test không mock, memoize an toàn, ghép pipeline |
| Bắt buộc IO (DB/network/log/clock) | ⚖️ Đẩy ra biên (5.12.3) | Core giữ pure, shell impure mỏng + inject fake khi test |
| Hiệu năng cần cache | ⚖️ Memoize pure / cache có key rõ | Chỉ memoize hàm pure thật; impure mà cache = trả kết quả thiu |
| Mọi thứ pure 100% | 🚫 Không thực tế | Chương trình phải chạm thế giới ở đâu đó — mục tiêu là cô lập, không phải triệt tiêu |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Đọc biến ngoài (config global, `Date.now()`) trong hàm "pure" | Test flaky theo giờ/môi trường | Inject clock/config thành tham số |
| Mutate input rồi return nó | Caller mất data gốc, bug lan xa | Không gán vào tham số; tạo bản mới (5.12.1) |
| Memoize hàm impure | Cache trả kết quả cũ dù thế giới đã đổi | Memoize chỉ khi đã chứng minh pure (2 tiêu chí ở trên) |
| `console.log` debug quên xóa trong hàm pure | Hàm hết pure, test snapshot log rác | Logger inject từ ngoài; lint cấm console trong core |

---

## ✅ Checklist khi review

- [ ] Gọi 2 lần cùng input có chắc cùng output (không global/clock/random ngầm)?
- [ ] Không đọc/ghi biến ngoài, không IO, không mutate input?
- [ ] Phụ thuộc môi trường (clock, config, random) đã thành tham số?
- [ ] Nếu có memoize: hàm đã pure thật?
- [ ] Không còn `console.log`/ghi file debug trong core?

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
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.12.3 Side Effects](../5.12.3-side-effects/README.md)
